"use client";
import React, { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { courses } from "@/Data/Data";
import { FiMail, FiUser, FiPhone } from "react-icons/fi";
import CustomToast from "@/components/primary/customToast";
import { FaSearch } from "react-icons/fa";
import {
  FaIdCard,
  FaRegCalendarAlt,
  FaUser,
  FaClock,
  FaBook,
  FaFileAlt,
  FaInfoCircle,
} from "react-icons/fa";
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  increment,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { firestore, auth } from "@/Backend/Firebase";
import FileUpload from "@/components/primary/FakeUpload";
import Cookies from "js-cookie";
import SiteDetails from "@/Data/SiteData";
import { createPortal } from "react-dom";

// CourseDropdown component with search functionality
function CourseDropdown({
  options,
  selected,
  onChange,
  placeholder,
  disabled,
  name,
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const btnRef = useRef(null);
  const inputRef = useRef(null);
  const [menuRect, setMenuRect] = useState({ top: 0, left: 0, width: 0 });

  const filtered =
    q.trim() === ""
      ? options
      : options.filter((o) =>
          (o.name || "").toLowerCase().includes(q.trim().toLowerCase())
        );

  const computePosition = () => {
    const btn = btnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    setMenuRect({
      top: r.bottom + window.scrollY + 8,
      left: r.left + window.scrollX,
      width: r.width,
    });
  };

  const openMenu = () => {
    if (disabled) return;
    setOpen(true);
  };

  const closeMenu = () => setOpen(false);

  // Recompute position on open/resize/scroll
  useEffect(() => {
    if (!open) return;
    computePosition();
    const onScroll = () => computePosition();
    const onResize = () => computePosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  // Focus search when menu opens; clear query on close
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current && inputRef.current.focus(), 0);
    } else {
      setQ("");
    }
  }, [open]);

  // Close on outside click or ESC
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      const btn = btnRef.current;
      if (btn && (btn === e.target || btn.contains(e.target))) return;
      // If click inside the portal menu, ignore (we mark it with data-dd)
      let n = e.target;
      while (n) {
        if (n.dataset && n.dataset.dd === "courses") return;
        n = n.parentElement;
      }
      closeMenu();
    };
    const onKey = (e) => {
      if (e.key === "Escape") closeMenu();
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={openMenu}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`w-full text-left px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
          disabled
            ? "bg-gray-100 cursor-not-allowed"
            : "bg-white border-gray-300"
        }`}
      >
        {selected ? (
          selected.name
        ) : (
          <span className="text-gray-500">{placeholder || "Select..."}</span>
        )}
      </button>

      {open &&
        createPortal(
          <div
            data-dd="courses"
            style={{
              position: "absolute",
              top: menuRect.top,
              left: menuRect.left,
              width: menuRect.width,
              zIndex: 9999,
            }}
            className="bg-white border border-gray-200 rounded-md shadow"
          >
            {/* Search (at the very top of the SAME dropdown) */}
            <div className="px-3 pt-3">
              <div className="flex items-center gap-2 border border-gray-200 rounded px-2 py-2 transition-transform duration-200 translate-y-0">
                <FaSearch className="w-4 h-4 text-gray-500" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="search..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full outline-none bg-transparent text-sm"
                  aria-label="Search courses by name"
                />
                {q && (
                  <button
                    type="button"
                    onClick={() => setQ("")}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-2 mb-1">
                {filtered.length} result{filtered.length === 1 ? "" : "s"}
              </div>
            </div>

            {/* Options list (TALL + scrollable; shows MANY at once) */}
            <div
              role="listbox"
              className="max-h-[20vh] overflow-y-auto mt-2 pb-2"
            >
              {filtered.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500">
                  No matches
                </div>
              ) : (
                filtered.map((opt) => (
                  <div
                    key={opt.id}
                    role="option"
                    aria-selected={selected && selected.id === opt.id}
                    onClick={() => {
                      onChange(opt);
                      closeMenu();
                    }}
                    className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                      selected && selected.id === opt.id ? "bg-gray-50" : ""
                    }`}
                  >
                    {opt.name}
                  </div>
                ))
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

const Client = () => {
  const router = useRouter();

  // Prefetch target page early
  useEffect(() => {
    router.prefetch("/application-submitted");
  }, [router]);

  // ---------- NEW: keep course selections in separate states (minimal fields only)
  const [selectedCourse1, setSelectedCourse1] = useState(null); // {id, name, lmsCourseId} | null
  const [selectedCourse2, setSelectedCourse2] = useState(null);
  const [selectedCourse3, setSelectedCourse3] = useState(null);

  // Helper: keep only minimal fields (NO full course object in state)
  const pickCourseFields = (c) =>
    c ? { id: c.id, name: c.name, lmsCourseId: c.lmsCourseId } : null;

  // Compute option lists so selected courses are hidden in the OTHER dropdowns
  const takenIds = useMemo(
    () =>
      [selectedCourse1?.id, selectedCourse2?.id, selectedCourse3?.id].filter(
        Boolean
      ),
    [selectedCourse1, selectedCourse2, selectedCourse3]
  );

  const availableOptions = (currentSelected) =>
    courses.filter((o) => {
      // Always allow the option if it's the one currently selected in THIS dropdown
      if (currentSelected && currentSelected.id === o.id) return true;
      // Otherwise hide it if already selected in another dropdown
      return !takenIds.includes(o.id);
    });

  // Form state (kept as-is; we won't use formData.selectedCourses for selection anymore)
  const [formData, setFormData] = useState({
    fullName: "",
    fatherName: "",
    cnic: "",
    email: "",
    mobile: "",
    dob: "",
    maritalStatus: "",
    gender: "",
    highestQualification: "",
    institute: "",
    fieldOfStudy: "",
    yearOfCompletion: "",
    selectedCourses: [], // kept for compatibility, not used for storing full course data
    internetAvailability: "",
    permanentAddress: "",
    currentAddress: "",
    city: "",
    employed: "No",
    declaration: false,
    applicationApproved: null,
    applicationSubmittedAt: null,
    applicationApprovedAt: null,
    approvalTime: "",
    created_at: null,
    address: "",
    applicant: "localPakistani",
    contactNo: "",
    country: "",
    education: "",
    gettoknow: "",
    province: "",
    qualification: "",
    rollno: "",
  });

  // File upload state
  const [degreeDocument, setDegreeDocument] = useState(null);
  const [residencyDocument, setResidencyDocument] = useState(null);

  const [toast, setToast] = useState({
    message: "",
    type: "",
    visible: false,
    duration: 5000,
  });

  const showToast = (message, type = "info", duration = 5000) => {
    setToast({ message, type, visible: true, duration });
  };

  const handleCloseToast = () => {
    setToast({ ...toast, visible: false });
  };

  const updateTotalUsersCount = async () => {
    try {
      const statsRef = doc(firestore, "overallstats", "overallstats");
      await setDoc(
        statsRef,
        {
          totalUsers: increment(1),
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Error updating total users count:", error);
    }
  };

  // Function to send user data to Pabbly Connect for archiving
  const sendUserDataToPabbly = async (userData, password) => {
    try {
      // Generate archive date (60 days from now)
      const archiveDate = new Date();
      archiveDate.setDate(archiveDate.getDate() + 60);

      // Format as "Month, Day Year" (e.g., "November, 7 2025")
      const formattedArchiveDate = archiveDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      console.log("Sending to Pabbly with archive date:", formattedArchiveDate);

      // Send request to Pabbly Connect
      fetch("/api/pabbly-connect/archive-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: {
            ...userData,
            password, // Include password in user data for Pabbly
          },
          archiveDate: formattedArchiveDate,
        }),
      }).catch((error) => {
        console.error("Error sending data to Pabbly:", error);
      });
    } catch (error) {
      console.error("Error in sendUserDataToPabbly:", error);
    }
  };

  // UI state
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Updated validation rules
  const validationRules = {
    fullName: {
      required: true,
      pattern: /^[a-zA-Z\s.'-]+$/,
      minLength: 3,
      maxLength: 50,
      message:
        "Full name must be 3-50 characters (letters, spaces, hyphens, apostrophes only)",
    },
    fatherName: {
      required: true,
      pattern: /^[a-zA-Z\s.'-]+$/,
      minLength: 3,
      maxLength: 50,
      message:
        "Father's name must be 3-50 characters (letters, spaces, hyphens, apostrophes only)",
    },
    cnic: {
      required: true,
      pattern: /^[0-9]{13}$/,
      message: "CNIC must be exactly 13 digits without hyphenation",
    },
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "Please enter a valid email address",
    },
    mobile: {
      required: true,
      pattern: /^03[0-9]{9}$/,
      message:
        "Mobile number must be 11 digits starting with 03 (e.g., 03001234567)",
    },
    dob: {
      required: true,
      message: "Date of birth is required",
    },
    maritalStatus: {
      required: true,
      message: "Marital status is required",
    },
    gender: {
      required: true,
      message: "Gender is required",
    },
    highestQualification: {
      required: true,
      message: "Highest qualification is required",
    },
    institute: {
      required: true,
      message: "Institute/University name is required",
    },
    fieldOfStudy: {
      required: true,
      message: "Field of study is required",
    },
    yearOfCompletion: {
      required: true,
      pattern: /^(19|20)\d{2}$/,
      message: "Please enter a valid year (e.g., 2023)",
    },
    internetAvailability: {
      required: true,
      message: "Internet availability is required",
    },
    currentAddress: {
      required: true,
      message: "Current address is required",
    },
    city: {
      required: true,
      message: "City is required",
    },
    declaration: {
      required: true,
      message: "You must agree to the declaration",
    },
    selectedCourses: {
      required: true,
      message: "At least one course is required",
    },
    degreeDocument: {
      required: true,
      message: "Please upload your degree/certificate document",
    },
    residencyDocument: {
      required: true,
      message: "Please upload your residency document",
    },
  };

  // Pure validator for a single field (no state writes)
  const getFieldError = (fieldName, value, formCurrentData = formData) => {
    const rule = validationRules[fieldName];
    if (!rule) return null;

    // Special handling for selectedCourses (now driven by separate states)
    if (fieldName === "selectedCourses") {
      const anySelected =
        !!selectedCourse1 || !!selectedCourse2 || !!selectedCourse3;
      if (rule.required && !anySelected) {
        return rule.message || "This field is required";
      }
      return null;
    }

    // Special handling for declaration checkbox
    if (fieldName === "declaration") {
      if (rule.required && !value) {
        return rule.message || "This field is required";
      }
      return null;
    }

    // Special handling for file uploads
    if (fieldName === "degreeDocument") {
      if (rule.required && !degreeDocument) {
        return rule.message || "This field is required";
      }
      return null;
    }

    if (fieldName === "residencyDocument") {
      if (rule.required && !residencyDocument) {
        return rule.message || "This field is required";
      }
      return null;
    }

    // Regular validation
    if (rule.required && (!value || String(value).trim() === "")) {
      return rule.message || "This field is required";
    }
    if (value && rule.pattern && !rule.pattern.test(String(value))) {
      return rule.message;
    }
    if (value && rule.minLength && String(value).length < rule.minLength) {
      return rule.message;
    }
    if (value && rule.maxLength && String(value).length > rule.maxLength) {
      return rule.message;
    }
    return null;
  };

  // Field validator that updates state
  const validateField = (fieldName, value, formCurrentData = formData) => {
    const err = getFieldError(fieldName, value, formCurrentData);
    setErrors((prev) => ({
      ...prev,
      [fieldName]: err ? err : null,
    }));
    return err ? err : null;
  };

  // Debounced onBlur validation
  const blurTimersRef = useRef({});
  const handleBlur = (e) => {
    const { name, value, type, checked } = e.target;
    if (!name) return; // ignore fields without name
    const fieldValue = type === "checkbox" ? checked : value;

    // clear existing timer for this field
    if (blurTimersRef.current[name]) {
      clearTimeout(blurTimersRef.current[name]);
    }
    blurTimersRef.current[name] = setTimeout(() => {
      validateField(name, fieldValue, formData);
    }, 250);
  };

  useEffect(() => {
    return () => {
      // cleanup timers on unmount
      Object.values(blurTimersRef.current || {}).forEach((t) =>
        clearTimeout(t)
      );
    };
  }, []);

  // Form-level validation
  const validateForm = () => {
    let formIsValid = true;
    const newErrors = {};

    Object.keys(validationRules).forEach((fieldName) => {
      let fieldValue = formData[fieldName];
      const err = getFieldError(fieldName, fieldValue, formData);
      if (err) {
        newErrors[fieldName] = err;
        formIsValid = false;
      }
    });

    setErrors(newErrors);
    return formIsValid;
  };

  // Handlers
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === "checkbox" ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: fieldValue,
    }));
  };

  // Password generator
  const generatePassword = () => {
    const digits = "0123456789";
    let result = "honhaar";
    for (let i = 0; i < 6; i++) {
      result += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    return result;
  };

  // ---------- NEW: individual course change handlers + duplicate protection
  const onSelectCourse1 = (opt) => {
    const picked = pickCourseFields(opt);
    setSelectedCourse1(picked);
    // If the same course was in other dropdowns, clear them
    if (selectedCourse2?.id === picked.id) setSelectedCourse2(null);
    if (selectedCourse3?.id === picked.id) setSelectedCourse3(null);
    // Clear "at least one" error if present
    if (errors.selectedCourses) validateField("selectedCourses", null);
  };

  const onSelectCourse2 = (opt) => {
    const picked = pickCourseFields(opt);
    setSelectedCourse2(picked);
    if (selectedCourse1?.id === picked.id) setSelectedCourse1(null);
    if (selectedCourse3?.id === picked.id) setSelectedCourse3(null);
    if (errors.selectedCourses) validateField("selectedCourses", null);
  };

  const onSelectCourse3 = (opt) => {
    const picked = pickCourseFields(opt);
    setSelectedCourse3(picked);
    if (selectedCourse1?.id === picked.id) setSelectedCourse1(null);
    if (selectedCourse2?.id === picked.id) setSelectedCourse2(null);
    if (errors.selectedCourses) validateField("selectedCourses", null);
  };

  // (Kept for reference; not used to avoid storing full course data)
  const getCourseDetails = (courseName) => {
    const course = courses.find((c) => c.name === courseName);
    if (course) {
      return {
        id: course.id,
        name: course.name,
        lmsCourseId: course.lmsCourseId,
        price: 5000,
      };
    }
    return null;
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast(
        "Please fill in all required fields and correct errors.",
        "error",
        3000
      );
      return;
    }

    // Build selected course objects from individual states (minimal fields)
    const selectedFromStates = [
      selectedCourse1,
      selectedCourse2,
      selectedCourse3,
    ].filter(Boolean);

    const selectedCourseObjects = selectedFromStates.map((course) => ({
      id: course.id,
      lmsCourseId: course.lmsCourseId,
      name: course.name,
    }));

    if (selectedCourseObjects.length === 0) {
      setErrors((prev) => ({
        ...prev,
        selectedCourses: "At least one course is required",
      }));
      return;
    }

    setLoading(true);

    try {
      // Check if email/cnic already exist
      const usersRef = collection(firestore, "users");
      const [emailSnapshot, cnicSnapshot] = await Promise.all([
        getDocs(query(usersRef, where("email", "==", formData.email))),
        getDocs(query(usersRef, where("cnic", "==", formData.cnic))),
      ]);

      if (!emailSnapshot.empty) {
        showToast(
          "This account already in use. Please log in to your account.",
          "error",
          2500
        );
        throw new Error("Email is already in use.");
      }
      if (!cnicSnapshot.empty) {
        showToast("CNIC already registered.", "error", 2500);
        throw new Error("CNIC is already in use.");
      }

      // Split fullName safely
      const nameParts = formData.fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

      // Generate random password and form number
      const generatedPassword = generatePassword();
      const formNo = Math.floor(100000 + Math.random() * 900000);

      // Format registration date
      const now = new Date();
      const options = {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      };
      const registrationDate = now.toLocaleDateString("en-US", options);

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        generatedPassword
      );

      // Create user data for Firestore
      const userData = {
        uid: userCredential.user.uid,
        ...formData,
        firstName,
        lastName,
        password: generatedPassword,
        status: 1,
        created_at: serverTimestamp(),
        applicationSubmittedAt: serverTimestamp(),
        applicationApprovedAt: null,
        applicationApproved: false,
        // Store only minimal course info (same shape as before in submission)
        selectedCourses: selectedCourseObjects,
        lastLogin: serverTimestamp(),
        role: "student",
        formNo,
        registrationDate,
      };

      // Clean undefined values
      Object.keys(userData).forEach((key) => {
        if (userData[key] === undefined) {
          userData[key] = null;
        }
      });

      // Save to Firestore
      const userRef = doc(firestore, "users", formData.email);
      await setDoc(userRef, userData);

      // IMPORTANT: Set the cookie IMMEDIATELY after successful Firestore save
      // Build a compact payload (no big course objects)
      const cookieData = {
        fullName: formData.fullName,
        email: formData.email,
        formNo,
        // only the fields you actually need
        courses: selectedCourseObjects.map(({ name }) => ({
          name,
        })),
      };

      const value = JSON.stringify(cookieData);

      // Optional sanity check (stay well under ~4KB)
      console.log(
        "registration bytes:",
        new TextEncoder().encode(value).length
      );

      // Only set Secure when the page is actually on HTTPS
      const isHttps =
        typeof window !== "undefined" && window.location.protocol === "https:";

      Cookies.set("registration", value, {
        expires: 60,
        sameSite: "lax",
        path: "/", // be explicit
        secure: isHttps, // don't force Secure on HTTP
      });

      console.log("cookie set?", !!Cookies.get("registration"));

      console.log("Registration cookie set:", cookieData);

      // Fire-and-forget: total count update & Pabbly Connect
      updateTotalUsersCount().catch(() => {});
      sendUserDataToPabbly(userData, generatedPassword).catch(() => {});

      // Immediate redirect (do not wait on email/network)
      router.push("/application-submitted");
      return;
    } catch (err) {
      console.error("Registration error:", err);
      showToast(
        err?.message || "Something went wrong. Please try again.",
        "error",
        3000
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full ">
      {toast.visible && (
        <CustomToast
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={handleCloseToast}
        />
      )}

      <div className="bg-gradient-to-r   from-lime-300 via-green-200 to-emerald-200">
        {/* Header */}
        <div className="w-full bg-primary py-12">
          <div className="max-w-6xl mx-auto px-8 text-center">
            <div>
              <div className="flex max-w-[200px] mx-auto gap-3">
                <img
                  src={SiteDetails.whitelogo}
                  alt="Honhaar Jawan Logo"
                  className="h-20 mx-auto mb-6"
                />
              </div>

              <h1 className="text-4xl font-bold text-white mb-4">
                {SiteDetails.programName} Admission Form
              </h1>
              <p className="text-slate-300 text-lg max-w-2xl mx-auto">
                Complete your registration to begin your journey with Pakistan's
                leading digital skills initiative
              </p>
            </div>
          </div>
        </div>

        <div className="w-full bg-gradient-to-r from-lime-300 via-green-200 to-emerald-200 border-b border-yellow-700">
          <div className="max-w-full px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
              <div className="bg-emerald-50 border-l-4 border-emerald-500 p-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-emerald-500 p-3 rounded-full">
                    <FaUser className="text-white text-xl" />
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-700">
                      Step 1: Active
                    </h3>
                    <p className="text-emerald-600 text-sm">Student Signup</p>
                  </div>
                </div>
                <FaClock className="text-emerald-500 text-2xl" />
              </div>

              <div className="bg-gray-50 border-l-4 border-gray-300 p-6 flex items-center justify-between opacity-60">
                <div className="flex items-center space-x-4">
                  <div className="bg-gray-400 p-3 rounded-full">
                    <FaBook className="text-white text-xl" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-600">Step 2: Pending</h3>
                    <p className="text-gray-500 text-sm">Admissions Test</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border-l-4 border-gray-300 p-6 flex items-center justify-between opacity-60">
                <div className="flex items-center space-x-4">
                  <div className="bg-gray-400 p-3 rounded-full">
                    <FaFileAlt className="text-white text-xl" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-600">Step 3: Pending</h3>
                    <p className="text-gray-500 text-sm">
                      Enrollment Confirmation
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="py-16">
          {/* Form Content - Wide Layout */}
          <div className="max-w-7xl mx-auto bg-white px-8 py-12">
            <form onSubmit={handleSubmit} className="space-y-16">
              {/* Personal Information Section */}
              <section className="space-y-8">
                <div className="flex items-center space-x-4 pb-4 border-b-2 border-primary/50">
                  <div className="bg-primary p-3 rounded-lg">
                    <FiUser className="text-white text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-800">
                      Personal Information
                    </h2>
                    <p className="text-slate-600">
                      Basic details about yourself
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-semibold text-slate-700">
                      <span>Full Name</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Enter your full name as per CNIC"
                        className="w-full p-4 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
                        required
                      />
                      <FiUser className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    {errors.fullName && (
                      <p className="text-red-500 text-sm font-medium">
                        {errors.fullName}
                      </p>
                    )}
                  </div>

                  {/* Father's Name */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-semibold text-slate-700">
                      <span>Father's Name</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="fatherName"
                        value={formData.fatherName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Father's name as per CNIC"
                        className="w-full p-4 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
                        required
                      />
                      <FaUser className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    {errors.fatherName && (
                      <p className="text-red-500 text-sm font-medium">
                        {errors.fatherName}
                      </p>
                    )}
                  </div>

                  {/* CNIC */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-semibold text-slate-700">
                      <span>CNIC/B-Form Number</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="cnic"
                        value={formData.cnic}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="13 digits without hyphens"
                        maxLength={13}
                        className="w-full p-4 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
                        required
                      />
                      <FaIdCard className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    {errors.cnic && (
                      <p className="text-red-500 text-sm font-medium">
                        {errors.cnic}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-semibold text-slate-700">
                      <span>Email Address</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="your.email@example.com"
                        className="w-full p-4 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
                        required
                      />
                      <FiMail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    {errors.email && (
                      <p className="text-red-500 text-sm font-medium">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Mobile */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-semibold text-slate-700">
                      <span>Mobile Number</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="03001234567"
                        maxLength={11}
                        className="w-full p-4 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white"
                        required
                      />
                      <FiPhone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    {errors.mobile && (
                      <p className="text-red-500 text-sm font-medium">
                        {errors.mobile}
                      </p>
                    )}
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-semibold text-slate-700">
                      <span>Date of Birth</span>
                      <span className="text-red-500">*</span>
                    </label>

                    <div
                      className="relative"
                      onClick={() =>
                        document.getElementById("dob-input").showPicker()
                      }
                    >
                      <input
                        id="dob-input"
                        type="date"
                        name="dob"
                        value={formData.dob}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="w-full p-4 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white cursor-pointer"
                        required
                      />
                      <FaRegCalendarAlt className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>

                    {errors.dob && (
                      <p className="text-red-500 text-sm font-medium">
                        {errors.dob}
                      </p>
                    )}
                  </div>

                  {/* Marital Status */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-semibold text-slate-700">
                      <span>Marital Status</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="maritalStatus"
                      value={formData.maritalStatus}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="w-full p-4 border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-white"
                      required
                    >
                      <option value="">Select marital status</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                    </select>
                    {errors.maritalStatus && (
                      <p className="text-red-500 text-sm font-medium">
                        {errors.maritalStatus}
                      </p>
                    )}
                  </div>

                  {/* Gender */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-semibold text-slate-700">
                      <span>Gender</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="w-full p-4 border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-white"
                      required
                    >
                      <option value="">Select your gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.gender && (
                      <p className="text-red-500 text-sm font-medium">
                        {errors.gender}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* Educational Background Section */}
              <section className="space-y-8">
                <div className="flex items-center space-x-4 pb-4 border-b-2 border-primary/50">
                  <div className="bg-primary p-3 rounded-lg">
                    <FaBook className="text-white text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-800">
                      Educational Background
                    </h2>
                    <p className="text-slate-600">
                      Your academic qualifications
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {/* Highest Qualification */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-semibold text-slate-700">
                      <span>Highest Qualification</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="highestQualification"
                      value={formData.highestQualification}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="w-full p-4 border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-white"
                      required
                    >
                      <option value="">Select qualification</option>
                      <option value="Matric">Matric</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Bachelor">Bachelor's Degree</option>
                      <option value="Master">Master's Degree</option>
                      <option value="PhD">PhD</option>
                    </select>
                    {errors.highestQualification && (
                      <p className="text-red-500 text-sm font-medium">
                        {errors.highestQualification}
                      </p>
                    )}
                  </div>

                  {/* Institute */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-semibold text-slate-700">
                      <span>Institute/University</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="institute"
                      value={formData.institute}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Name of your institute"
                      className="w-full p-4 border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-white"
                      required
                    />
                    {errors.institute && (
                      <p className="text-red-500 text-sm font-medium">
                        {errors.institute}
                      </p>
                    )}
                  </div>

                  {/* Field of Study */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-semibold text-slate-700">
                      <span>Field of Study</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="fieldOfStudy"
                      value={formData.fieldOfStudy}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Your field of study"
                      className="w-full p-4 border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-white"
                      required
                    />
                    {errors.fieldOfStudy && (
                      <p className="text-red-500 text-sm font-medium">
                        {errors.fieldOfStudy}
                      </p>
                    )}
                  </div>

                  {/* Year of Completion */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-semibold text-slate-700">
                      <span>Year of Completion</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="yearOfCompletion"
                      value={formData.yearOfCompletion}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      max={new Date().getFullYear()}
                      placeholder="e.g., 2023"
                      className="w-full p-4 border border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-white"
                      required
                    />
                    {errors.yearOfCompletion && (
                      <p className="text-red-500 text-sm font-medium">
                        {errors.yearOfCompletion}
                      </p>
                    )}
                  </div>
                </div>

                {/* Document Upload */}
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <FileUpload
                    label="Upload Last Degree Document / Last Certificate Document"
                    description="Please upload a clear copy of your most recent degree or educational certificate to verify your academic qualifications."
                    required={true}
                    onFileChange={(file) => {
                      setDegreeDocument(file);
                      // Clear error when file is selected
                      if (errors.degreeDocument) {
                        setErrors((prev) => ({
                          ...prev,
                          degreeDocument: null,
                        }));
                      }
                    }}
                  />
                  {errors.degreeDocument && (
                    <p className="text-red-500 text-sm font-medium mt-2">
                      {errors.degreeDocument}
                    </p>
                  )}
                </div>
              </section>

              {/* Course Enrollment Section */}
              <section className="space-y-8">
                <div className="flex items-center space-x-4 pb-4 border-b-2 border-primary/50">
                  <div className="bg-primary p-3 rounded-lg">
                    <FaBook className="text-white text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-800">
                      Course Enrollment
                    </h2>
                    <p className="text-slate-600">
                      Select your learning programs
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* First Course */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center space-x-2 text-sm font-semibold text-slate-700">
                        <span>First Course</span>
                        <span className="text-red-500">*</span>
                      </label>
                      <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
                        Required
                      </span>
                    </div>
                    <p className="text-yellow-800 text-sm font-medium">
                      Choose what fits your interests and aligns with your
                      career goals. We offer diverse programs
                    </p>
                    <CourseDropdown
                      options={availableOptions(selectedCourse1)}
                      selected={selectedCourse1}
                      onChange={onSelectCourse1}
                      placeholder="Select your primary course"
                      disabled={loading}
                      name="course1"
                    />
                    {errors.selectedCourses && (
                      <p className="text-red-500 text-sm font-medium">
                        {errors.selectedCourses}
                      </p>
                    )}
                  </div>
                  {/* Second Course */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-slate-700">
                        Second Course
                      </label>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium flex items-center space-x-1">
                        <FaInfoCircle />
                        <span>Optional</span>
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Students can enroll in up to three programs simultaneously
                    </p>
                    <CourseDropdown
                      options={availableOptions(selectedCourse2)}
                      selected={selectedCourse2}
                      onChange={onSelectCourse2}
                      placeholder="Select additional course"
                      disabled={loading}
                      name="course2"
                    />
                  </div>

                  {/* Third Course */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-slate-700">
                        Third Course
                      </label>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium flex items-center space-x-1">
                        <FaInfoCircle />
                        <span>Optional</span>
                      </span>
                    </div>
                    <CourseDropdown
                      options={availableOptions(selectedCourse3)}
                      selected={selectedCourse3}
                      onChange={onSelectCourse3}
                      placeholder="Select additional course"
                      disabled={loading}
                      name="course3"
                    />
                  </div>
                </div>
              </section>

              {/* Internet Availability Section */}
              <section className="space-y-8">
                <div className="flex items-center space-x-4 pb-4 border-b-2 border-primary/50">
                  <div className="bg-primary p-3 rounded-lg">
                    <FaClock className="text-white text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-800">
                      Internet Availability
                    </h2>
                    <p className="text-slate-600">Technical requirements</p>
                  </div>
                </div>

                <div className="max-w-md">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-slate-700 mb-3">
                    <span>Do you have reliable internet access?</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="internetAvailability"
                    value={formData.internetAvailability}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full p-4 border border-gray-300 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 bg-white"
                    required
                  >
                    <option value="">Select option</option>
                    <option value="Yes">Yes, I have reliable internet</option>
                    <option value="No">No, limited internet access</option>
                  </select>
                  {errors.internetAvailability && (
                    <p className="text-red-500 text-sm font-medium mt-2">
                      {errors.internetAvailability}
                    </p>
                  )}
                </div>
              </section>

              {/* Address Details Section */}
              <section className="space-y-8">
                <div className="flex items-center space-x-4 pb-4 border-b-2 border-primary/50">
                  <div className="bg-primary p-3 rounded-lg">
                    <FaUser className="text-white text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-800">
                      Address Details
                    </h2>
                    <p className="text-slate-600">Your location information</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Permanent/Current Address */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 text-sm font-semibold text-slate-700">
                      <span>Permanent Address</span>
                      <span className="text-red-500">*</span>
                    </label>

                    <textarea
                      name="currentAddress"
                      value={formData.currentAddress}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Enter your current address"
                      rows={4}
                      className="w-full p-4 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 bg-white resize-none"
                      required
                    />
                    {errors.currentAddress && (
                      <p className="text-red-500 text-sm font-medium">
                        {errors.currentAddress}
                      </p>
                    )}
                  </div>
                </div>

                {/* City */}
                <div className="max-w-md">
                  <label className="flex items-center space-x-2 text-sm font-semibold text-slate-700 mb-3">
                    <span>City</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Your city"
                    className="w-full p-4 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 bg-white"
                    required
                  />
                  {errors.city && (
                    <p className="text-red-500 text-sm font-medium mt-2">
                      {errors.city}
                    </p>
                  )}
                </div>
              </section>

              {/* Additional Information Section */}
              <section className="space-y-8">
                <div className="flex items-center space-x-4 pb-4 border-b-2 border-primary/50">
                  <div className="bg-primary p-3 rounded-lg">
                    <FaInfoCircle className="text-white text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-800">
                      Additional Information
                    </h2>
                    <p className="text-slate-600">
                      Employment and other details
                    </p>
                  </div>
                </div>

                <div className="max-w-md">
                  <label className="text-sm font-semibold text-slate-700 mb-3 block">
                    Employment Status
                  </label>
                  <select
                    name="employed"
                    value={formData.employed}
                    onChange={handleChange}
                    className="w-full p-4 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white"
                  >
                    <option value="Yes">Currently Employed</option>
                    <option value="No">Not Employed</option>
                  </select>
                </div>
              </section>

              {/* Residency Information Section */}
              <section className="space-y-8">
                <div className="flex items-center space-x-4 pb-4 border-b-2 border-green-500">
                  <div className="bg-primary p-3 rounded-lg">
                    <FaIdCard className="text-white text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-800">
                      Residency Information
                    </h2>
                    <p className="text-slate-600">Pakistan residents only</p>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-orange-200 rounded-lg p-8">
                  <div className="flex items-start space-x-4">
                    <div className="bg-second p-2 rounded-lg flex-shrink-0">
                      <FaInfoCircle className="text-white text-xl" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-yellow-900 text-xl mb-4">
                        Document Verification Required
                      </h3>
                      <p className="text-yellow-900 mb-6">
                        To verify your Pakistani residency, please upload any
                        one of following documents:
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        <div className="flex items-center space-x-3 text-yellow-700">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span className="text-sm">
                            Utility Bill (within 3 months)
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 text-yellow-700">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span className="text-sm">Domicile Certificate</span>
                        </div>
                        <div className="flex items-center space-x-3 text-yellow-700">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span className="text-sm">
                            Educational Certificate
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 text-yellow-700">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span className="text-sm">CNIC or Form B</span>
                        </div>
                        <div className="flex items-center space-x-3 text-yellow-700">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span className="text-sm">Pakistani Passport</span>
                        </div>
                        <div className="flex items-center space-x-3 text-yellow-700">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span className="text-sm">Property Documents</span>
                        </div>
                      </div>

                      <p className="text-orange-600 text-sm italic">
                        This nationwide initiative ensures accessibility for all
                        Pakistani residents to enhance their digital skills.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <FileUpload
                    label="Upload Residency Document"
                    description="Please upload a document that verifies your Pakistani residency"
                    required={true}
                    onFileChange={(file) => {
                      setResidencyDocument(file);
                      // Clear error when file is selected
                      if (errors.residencyDocument) {
                        setErrors((prev) => ({
                          ...prev,
                          residencyDocument: null,
                        }));
                      }
                    }}
                  />
                  {errors.residencyDocument && (
                    <p className="text-red-500 text-sm font-medium mt-2">
                      {errors.residencyDocument}
                    </p>
                  )}
                </div>
              </section>

              {/* Declaration Section */}
              <section className="space-y-8">
                <div className="flex items-center space-x-4 pb-4 border-b-2 border-primary">
                  <div className="bg-second p-3 rounded-lg">
                    <FaFileAlt className="text-white text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-800">
                      Declaration & Agreement
                    </h2>
                    <p className="text-slate-600">
                      Final confirmation before submission
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 border border-primary/5 rounded-lg p-8">
                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      id="declaration"
                      name="declaration"
                      checked={formData.declaration}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          declaration: e.target.checked,
                        })
                      }
                      className="w-5 h-5 text-blue-600 bg-white outline-none cursor-pointer mt-1"
                      onBlur={handleBlur}
                      required
                    />
                    <div className="flex-1">
                      <label
                        htmlFor="declaration"
                        className="cursor-pointer text-slate-700 leading-relaxed"
                      >
                        <span className="font-bold text-black text-lg block mb-2">
                          Declaration of Truth
                        </span>
                        I hereby declare that all information provided in this
                        application is accurate and complete to best of my
                        knowledge. I understand that providing false information
                        may result in disqualification from{" "}
                        {SiteDetails.programName}
                        program. I agree to abide by all terms and conditions of
                        program and commit to active participation in my
                        selected courses.
                      </label>
                    </div>
                  </div>
                  {errors.declaration && (
                    <p className="text-red-500 text-sm font-medium mt-4">
                      {errors.declaration}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex justify-center pt-8">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`bg-sec2 hover:bg-primary text-white font-bold py-4 px-12 rounded-lg transition-all duration-300 flex items-center space-x-3 ${
                      loading ? "opacity-75 cursor-not-allowed" : ""
                    }`}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Processing Application...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Application</span>
                        <span className="text-xl">→</span>
                      </>
                    )}
                  </button>
                </div>

                {loading && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                    <div className="flex items-center justify-center space-x-2 text-blue-800 mb-3">
                      <div className="animate-pulse w-2 h-2 bg-blue-600 rounded-full"></div>
                      <div
                        className="animate-pulse w-2 h-2 bg-blue-600 rounded-full"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="animate-pulse w-2 h-2 bg-blue-600 rounded-full"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <p className="text-blue-800 font-bold text-lg mb-2">
                      Creating your account...
                    </p>
                    <p className="text-blue-600">
                      Please wait and do not refresh or navigate away from this
                      page.
                    </p>
                  </div>
                )}
              </section>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Client;
