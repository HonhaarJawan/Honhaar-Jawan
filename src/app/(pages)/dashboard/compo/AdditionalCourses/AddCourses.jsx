"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  FaInfoCircle,
  FaSearch,
  FaPlus,
  FaTimes,
  FaGraduationCap,
} from "react-icons/fa";
import { courses } from "@/Data/Data";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/Backend/Firebase";
import PayproPaymentVideos from "../PayproPaymentVideos/PaymentVideos";
import { useToast } from "@/components/primary/Toast";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

// Searchable Dropdown Component
function CourseSearchDropdown({
  options,
  selected,
  onChange,
  placeholder,
  disabled,
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

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current && inputRef.current.focus(), 0);
    } else {
      setQ("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      const btn = btnRef.current;
      if (btn && (btn === e.target || btn.contains(e.target))) return;
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
        className={`w-full text-left px-4 py-3 border-2 border-dashed rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all ${
          disabled
            ? "bg-gray-100 cursor-not-allowed"
            : "bg-white border-gray-300 hover:border-primary hover:bg-primary/5"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-gray-700">
            {placeholder || "Search and select a course..."}
          </span>
          <FaSearch className="text-gray-400" />
        </div>
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
            className="bg-white border border-gray-200 rounded-lg shadow-lg"
          >
            <div className="px-3 pt-3">
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2">
                <FaSearch className="w-4 h-4 text-gray-500" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type to search courses..."
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
              <div className="text-xs text-gray-500 mt-2 mb-1 px-1">
                {filtered.length} course{filtered.length === 1 ? "" : "s"} found
              </div>
            </div>

            <div role="listbox" className="max-h-60 overflow-y-auto mt-2 pb-2">
              {filtered.length === 0 ? (
                <div className="px-4 py-6 text-sm text-gray-500 text-center">
                  No courses found
                </div>
              ) : (
                filtered.map((opt) => (
                  <div
                    key={opt.id}
                    role="option"
                    onClick={() => {
                      onChange(opt);
                      closeMenu();
                    }}
                    className="px-4 py-3 cursor-pointer hover:bg-primary/10 transition-colors border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-gray-800">{opt.name}</span>
                      <FaPlus className="text-primary text-sm" />
                    </div>
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

// Selected Course Tag Component
function SelectedCourseTag({ course, onRemove, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      className="inline-flex items-center gap-2 bg-second2 text-white px-4 py-2 rounded-full shadow-md"
    >
      <FaGraduationCap className="text-sm" />
      <span className="font-medium">{course.name}</span>
      <button
        onClick={() => onRemove(index)}
        className="ml-1 hover:bg-white/20 rounded-full p-1 transition-colors"
      >
        <FaTimes className="text-xs" />
      </button>
    </motion.div>
  );
}

const AddCourses = ({ user, onSuccess }) => {
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [payProId, setPayProId] = useState(null);
  const [invoiceNumber, setInvoiceNumber] = useState(null);
  const [excludedCourseIds, setExcludedCourseIds] = useState([]);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchUserCourses = async () => {
      if (!user?.email) {
        showToast("User email not available, showing all courses.", "error");
        return;
      }

      try {
        const userRef = doc(firestore, "users", user.email);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) return;

        const userData = userDoc.data();
        const excludedIds = new Set();

        // Check for courses in generatedPayProId
        const generatedPayProId = userData.generatedPayProId;
        if (generatedPayProId && generatedPayProId.selectedCourses) {
          generatedPayProId.selectedCourses.forEach((course) => {
            if (course.courseId) {
              excludedIds.add(course.courseId);
            }
          });
        }

        // Check for courses in additionalCourses_pending_invoice
        const pendingInvoices =
          userData.additionalCourses_pending_invoice || [];
        pendingInvoices.forEach((invoice) =>
          invoice.selectedCourses?.forEach(
            (c) => c.courseId && excludedIds.add(c.courseId)
          )
        );

        // Check for courses in additionalCourses_paid_invoice
        const paidInvoices = userData.additionalCourses_paid_invoice || [];
        paidInvoices.forEach((invoice) =>
          invoice.selectedCourses?.forEach(
            (c) => c.courseId && excludedIds.add(c.courseId)
          )
        );

        setExcludedCourseIds([...excludedIds]);
      } catch (error) {
        console.error("Error fetching user courses:", error);
        showToast(`Failed to load enrolled courses: ${error.message}`, "error");
      }
    };

    fetchUserCourses();
  }, [user, showToast]);

  const handleCourseAdd = (course) => {
    if (selectedCourses.some((c) => c.id === course.id)) {
      showToast("Course already selected", "warning");
      return;
    }
    setSelectedCourses([...selectedCourses, course]);
    showToast(`${course.name} added`, "success", 2500);
  };

  const handleCourseRemove = (index) => {
    const newCourses = [...selectedCourses];
    const removed = newCourses.splice(index, 1)[0];
    setSelectedCourses(newCourses);
    showToast(`${removed.name} removed`, "error");
  };

  const generateAdditionalPSID = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      if (selectedCourses.length === 0)
        throw new Error("Please select at least one course");
      if (!user) throw new Error("User information not available");

      const safeUser = {
        userId: user.userId || user.uid || "",
        email: user.email || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        formNo: user.formNo || "",
        mobile: user.mobile || user.phone || "",
      };

      if (!safeUser.email || !safeUser.userId)
        throw new Error("Essential user information is missing");

      const selectedCourseDetails = selectedCourses.map((c) => ({
        id: c.id || "",
        name: c.name || "Unnamed Course",
        lmsCourseId: c.lmsCourseId || "",
      }));

      // Use the same structure as the working API call
      const payload = {
        uid: safeUser.userId,
        email: safeUser.email,
        firstName: safeUser.firstName,
        lastName: safeUser.lastName,
        courses: selectedCourseDetails,
        ...(safeUser.formNo && { formNo: safeUser.formNo }),
        ...(safeUser.mobile && { mobile: safeUser.mobile }),
      };

      const response = await fetch("/api/swich/additional-psid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Payment request failed");

      setPayProId(data.consumerNumber); // Use consumerNumber instead of payProId
      setInvoiceNumber(data.invoiceNumber);

      showToast("PSID Generated successfully!", "success");

      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (error) {
      setApiError(error.message);
      showToast(`Failed to Generate PSID: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  }, [selectedCourses, user, onSuccess, showToast]);

  // Modified to also exclude currently selected courses
  const availableCourses = courses.filter(
    (c) =>
      !excludedCourseIds.includes(c.id) &&
      !selectedCourses.some((sc) => sc.id === c.id)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full mx-auto p-6 space-y-8">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Add More Courses!
          </h1>
          <p className="text-gray-600 mt-2">
            Select and enroll in additional courses with ease.
          </p>
        </div>

        {/* Note */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md shadow-sm">
          <div className="flex items-start gap-3">
            <FaInfoCircle className="text-yellow-600 text-lg mt-1" />
            <p className="text-gray-700 text-sm leading-relaxed">
              <span className="font-semibold">Note:</span> During the first
              registration, participants can enroll in up to 3 free courses with
              a minor application fee. For additional courses beyond the first
              registration, a fee of{" "}
              <span className="font-semibold">3000 PKR per course</span>{" "}
              applies.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Step 1 */}
          <div>
            <h3 className="font-bold text-sm text-gray-900 mb-2">
              Select Courses You Want To Enroll In:
            </h3>
            <p className="text-gray-700 mb-4">
              Choose the courses you wish to enroll in from the list below, then
              click on the "Generate PSID" button.
            </p>
          </div>
          {/* Step 2 */}
          <div>
            <h3 className="font-bold text-sm text-gray-900">
              Generate Your PSID/Consumer Number:
            </h3>
            <p className="text-gray-700">
              Once you generate your PSID/Consumer Number, it will appear below.
            </p>
          </div>
          {/* Step 3 */}
          <div>
            <h3 className="font-bold text-sm text-gray-900">
              Copy Your Consumer Number:
            </h3>
            <p className="text-gray-700">
              Locate the PSID/Consumer Number displayed below and copy it for
              further use.
            </p>
          </div>
          {/* Step 4 */}
          <div>
            <h3 className="font-bold text-sm text-gray-900">
              Select Your Bank:
            </h3>
            <p className="text-gray-700">
              Choose your bank from the list provided. A screenshot tutorial
              will guide you step-by-step on how to pay through your selected
              bank.
            </p>
          </div>
          {/* Step 5 */}
          <div>
            <h3 className="font-bold text-sm text-gray-900">
              Watch The Video And Follow Instructions:
            </h3>
            <p className="text-gray-700">
              Carefully watch the tutorial for your bank and follow the payment
              guidelines provided.
            </p>
          </div>
          {/* Step 6 */}
          <div>
            <h3 className="font-[900] text-[21px] text-gray-900">
              Confirmation Of Admission
            </h3>
            <p className="text-gray-700">
              Once your payment is successfully processed, the selected courses
              will be added to your learning portal within the next 24 hours.
            </p>
          </div>
        </div>

        {/* Course Selection Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Select Your Courses
          </h2>

          {/* Search Dropdown */}
          <div className="mb-6">
            <CourseSearchDropdown
              options={availableCourses}
              selected={null}
              onChange={handleCourseAdd}
              placeholder="Click to search and add courses..."
              disabled={loading}
            />
          </div>

          {/* Selected Courses */}
          {selectedCourses.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Selected Courses ({selectedCourses.length})
              </h3>
              <div className="flex flex-wrap gap-3">
                <AnimatePresence>
                  {selectedCourses.map((course, index) => (
                    <SelectedCourseTag
                      key={course.id}
                      course={course}
                      onRemove={handleCourseRemove}
                      index={index}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {selectedCourses.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <FaGraduationCap className="text-6xl mx-auto mb-4 opacity-50" />
              <p>No courses selected yet</p>
              <p className="text-sm mt-2">
                Search and add courses above to get started
              </p>
            </div>
          )}
        </motion.div>

        {/* Generate PSID Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <button
            onClick={generateAdditionalPSID}
            disabled={selectedCourses.length === 0 || loading}
            className={`px-8 py-4 rounded-xl font-bold text-white text-lg shadow-xl transition-all transform hover:scale-105 ${
              selectedCourses.length > 0 && !loading
                ? "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </span>
            ) : (
              "Generate PSID for Payment"
            )}
          </button>
        </motion.div>

        {/* Payment Instructions */}
        {payProId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Payment Instructions
            </h2>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-6">
              <p className="text-sm text-gray-600 mb-2">
                Your PSID/Consumer Number:
              </p>
              <p className="text-2xl font-mono font-bold text-green-700">
                {payProId}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Invoice Number: {invoiceNumber}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Total Amount: {selectedCourses.length * 3000} PKR
              </p>
            </div>
            <PayproPaymentVideos />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AddCourses;
