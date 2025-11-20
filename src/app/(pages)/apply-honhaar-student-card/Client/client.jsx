"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/primary/Navbar";
import PageInfo from "@/components/PageInfo";

import { courses } from "@/Data/Data";
import axios from "axios";
import Copyright from "@/components/primary/Copyright";
import { ImSpinner } from "react-icons/im";
import { FaSearch, FaUser } from "react-icons/fa";
import { useToast } from "@/components/primary/Toast";
import FileUpload from "@/components/primary/FakeUpload";
import SiteDetails from "@/Data/SiteData";
import { createPortal } from "react-dom";

// Configurable percentage - set to 0% for testing, easily changeable
const REQUIRED_COMPLETION_PERCENTAGE = 0;

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
        className={`w-full text-left px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-second focus:border-second ${
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

const ApplyScholarContent = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    fullName: "",
    cnic: "",
    rollNo: "",
    email: "",
    mobile: "",
    course: "",
    challanNo: "",
    agreeTerms: false,
  });
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [trackEmail, setTrackEmail] = useState("");
  const [trackCourse, setTrackCourse] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCourseChange = (courseData) => {
    setSelectedCourse(courseData);
    setFormData((prev) => ({ ...prev, course: courseData.id }));
  };

  const handleTrackCourseChange = (courseData) => {
    setTrackCourse(courseData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.email ||
      !formData.cnic ||
      !formData.course ||
      !formData.agreeTerms
    ) {
      showToast(
        "Please fill in all required fields and agree to terms",
        "warning"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Call the student card API to create the application
      const response = await axios.post("/api/student-card", {
        operation: "create",
        email: formData.email,
        cnic: formData.cnic,
        courseId: formData.course,
        fullName: formData.fullName,
        mobile: formData.mobile,
        rollNo: formData.rollNo,
        challanNo: formData.challanNo,
        minCompletionPercentage: REQUIRED_COMPLETION_PERCENTAGE,
      });

      if (response.data.application) {
        const { verificationCode } = response.data.application;
        router.push(`/honhaar-card/${verificationCode}`);
        showToast(
          response.data.message || "Application submitted successfully!",
          "success"
        );
      }
    } catch (error) {
      console.error("Student card application error:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Application failed. Please try again.";
      showToast(`Application Failed: ${errorMessage}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTrackApplication = async (e) => {
    e.preventDefault();

    if (!trackEmail || !trackCourse) {
      showToast("Please provide both email and course name", "warning");
      return;
    }

    setIsTracking(true);

    try {
      // Call the student card API to track the application
      const response = await axios.post("/api/student-card", {
        operation: "track",
        email: trackEmail.trim(),
        courseId: trackCourse.id.toString(),
      });

      if (response.data.applications && response.data.applications.length > 0) {
        const application = response.data.applications[0];
        router.push(`/honhaar-card/${application.verificationCode}`);
        showToast("Application found! Redirecting...", "success");
      } else {
        showToast(
          response.data.message ||
            "No student card application found matching your criteria",
          "warning"
        );
      }
    } catch (error) {
      console.error("Tracking error:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to track application. Please try again.";
      showToast(`Tracking error: ${errorMessage}`, "error");
    } finally {
      setIsTracking(false);
    }
  };

  return (
    <>
      {/* Important Notice - Government Style */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-blue-50 border-l-4 border-second p-6 rounded-r-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-second"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {SiteDetails.studentCard} Eligibility Requirements
              </h3>
              <div className="text-gray-700 space-y-2">
                <p>
                  To be eligible for the {SiteDetails.studentCard}
                  (including laptop scheme, solar scheme, educational finance,
                  internship), you must be enrolled in one or more programs
                  under {SiteDetails.programName}.
                </p>
                <p className="font-medium">
                  This is a merit-based {SiteDetails.studentCard} program
                  requiring successful course completion with minimum 99% marks
                  for eligibility.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form Section */}
      <main className="min-h-screen w-full py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Application Form - 2/3 width */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                {/* Government-style form header */}
                <div className="bg-primary px-6 py-4 border-b border-primary/20">
                  <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    {SiteDetails.studentCard} Application Form
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">
                    Complete all required fields to submit your{" "}
                    {SiteDetails.studentCard}
                    application
                  </p>
                </div>

                <div className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Information Section */}
                    <div className="border-b border-gray-200 pb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-second"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        Personal Information
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            name="fullName"
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-second focus:border-second transition-colors"
                            placeholder="Enter your full name as per CNIC"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                            disabled={isSubmitting}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            CNIC/B-Form No *
                          </label>
                          <input
                            type="text"
                            name="cnic"
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-second focus:border-second transition-colors"
                            placeholder="e.g. 3550112345671"
                            value={formData.cnic}
                            onChange={handleChange}
                            maxLength={13}
                            required
                            disabled={isSubmitting}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            name="email"
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-second focus:border-second transition-colors"
                            placeholder="Enter your email address"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            disabled={isSubmitting}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mobile No *
                          </label>
                          <input
                            type="tel"
                            name="mobile"
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-second focus:border-second transition-colors"
                            placeholder="e.g. 03001234567"
                            value={formData.mobile}
                            onChange={handleChange}
                            required
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Course Information Section */}
                    <div className="border-b border-gray-200 pb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-second"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                          />
                        </svg>
                        Course Information
                      </h3>

                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Course *
                          </label>
                          <CourseDropdown
                            options={courses}
                            selected={selectedCourse}
                            onChange={handleCourseChange}
                            placeholder="Choose your enrolled course"
                            disabled={isSubmitting}
                            name="course"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Payment Information Section */}
                    <div className="border-b border-gray-200 pb-6">
                      <h3 className="text-lg flex gap-2  items-center font-semibold text-gray-900 mb-4">
                        <FaUser /> Identity Verification
                      </h3>

                      <div className="flex flex-col gap-4">
                        <div>
                          <label className="flex flex-col w-full text-sm font-medium text-gray-700 mb-2">
                            Upload Scanned Copy of CNIC (Front & Back) *
                          </label>
                          <p className="text-xs text-gray-500 mt-2">
                            Supported formats: JPG, PNG, PDF (Maximum 20MB)
                          </p>
                        </div>
                        <div className="border-2 border-dashed border-gray-300 rounded-md p-4">
                          <FileUpload />
                        </div>
                      </div>
                    </div>

                    {/* Verification Section */}
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          name="agreeTerms"
                          checked={formData.agreeTerms}
                          onChange={handleChange}
                          className="w-4 h-4 text-second border-gray-300 rounded focus:ring-second mt-1"
                          required
                          disabled={isSubmitting}
                        />
                        <label className="text-sm text-gray-700">
                          I hereby declare that the information provided is true
                          and correct to the best of my knowledge. I have read
                          and agree to the Terms & Conditions of the{" "}
                          {SiteDetails.studentCard} program.
                        </label>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-second hover:bg-second/90 text-white font-semibold py-3 px-6 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-second focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <ImSpinner className="animate-spin" />
                            Processing Application...
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Submit {SiteDetails.studentCard} Application
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Tracking Section - 1/3 width */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden sticky top-8">
                {/* Government-style tracking header */}
                <div className="bg-primary px-6 py-4 border-b border-primary/20">
                  <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                      />
                    </svg>
                    Track Application
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">
                    Check your application status
                  </p>
                </div>

                <div className="p-6">
                  <form onSubmit={handleTrackApplication} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-second focus:border-second transition-colors"
                        placeholder="Enter your registered email"
                        value={trackEmail}
                        onChange={(e) => setTrackEmail(e.target.value)}
                        required
                        disabled={isTracking}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Course Name *
                      </label>
                      <CourseDropdown
                        options={courses}
                        selected={trackCourse}
                        onChange={handleTrackCourseChange}
                        placeholder="Choose your enrolled course"
                        disabled={isTracking}
                        name="trackCourse"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isTracking}
                      className="w-full bg-primary hover:bg-second text-white font-semibold py-3 px-6 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isTracking ? (
                        <>
                          <ImSpinner className="animate-spin" />
                          Searching Records...
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                          Track Application Status
                        </>
                      )}
                    </button>
                  </form>

                  {/* Additional Information */}
                  <div className="mt-6 p-4 bg-blue-50 rounded-md border border-blue-200">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-second"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Need Help?
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      For application queries, contact:
                    </p>
                    <p className="text-sm text-second font-medium">
                      {SiteDetails.supportEmail}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Honhaar Jawan Help Desk
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

// Main component with Suspense boundary
const Client = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex items-center gap-3 text-gray-700">
            <ImSpinner className="animate-spin text-2xl text-second" />
            <span className="text-lg">
              Loading {SiteDetails.studentCard} Application Portal...
            </span>
          </div>
        </div>
      }
    >
      <ApplyScholarContent />
    </Suspense>
  );
};

export default Client;
