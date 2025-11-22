"use client";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

import { firestore } from "@/Backend/Firebase";
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
} from "firebase/firestore";
import { courses } from "@/Data/Data";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { FaSearch } from "react-icons/fa";
import { FiLoader } from "react-icons/fi";
import { useToast } from "@/components/primary/Toast";
import SiteDetails from "@/Data/SiteData";

/** Dropdown rendered via a portal so it can overflow card borders (no clipping). */
function CourseDropdown({
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

const Client = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [trackEmail, setTrackEmail] = useState("");
  const [cnic, setCnic] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [course, setCourse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(null);

  // Just a simple const for completion percentage - set to 0 to bypass all checks
  const MIN_COMPLETION_PERCENTAGE = 0;

  const generateVerificationId = () => {
    const randomId = uuidv4().replace(/-/g, "").substring(0, 10).toUpperCase();
    return `HONHAAR-${randomId}`;
  };

  const handleCourseChange = (courseData) => {
    setSelectedCourse(courseData);
    setCourse(courseData.id);
  };

  const handleClickie = (path, buttonIndex) => {
    setLoading(buttonIndex);
    setTimeout(() => {
      router.push(path);
    }, 0);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!email || !cnic || !course) {
      showToast("Please fill in all fields", "warning");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      // Call our unified API route
      const response = await fetch("/api/certificate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operation: "create",
          email,
          cnic,
          courseId: course,
          minCompletionPercentage: MIN_COMPLETION_PERCENTAGE,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Certificate generation failed");
      }

      if (data.message === "Certificate already exists") {
        router.push(
          `/get-certificate/?${new URLSearchParams({
            verificationId: data.certificate.verificationId,
            fullName: data.certificate.fullName,
            courseName: data.certificate.courseName,
            completedAt: data.certificate.issuedAt,
            email,
            cnic,
          }).toString()}`
        );
        showToast(
          "You have already applied for this certificate. Redirecting...",
          "info"
        );
        setIsSubmitting(false);
        return;
      }

      router.push(
        `/get-certificate/?${new URLSearchParams({
          verificationId: data.certificate.verificationId,
          fullName: data.certificate.fullName,
          courseName: data.certificate.courseName,
          completedAt: data.certificate.issuedAt,
          email,
          cnic,
        }).toString()}`
      );

      showToast(
        "Certificate generated successfully! Redirecting...",
        "success"
      );
    } catch (error) {
      console.error("Certificate generation error:", error);
      const errorMessage =
        (error && error.message) ||
        "Certificate generation failed. Please try again.";

      showToast(`Generation Failed: ${errorMessage}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTrackCertificate = async (e) => {
    e.preventDefault();
    setIsTracking(true);

    if (!trackEmail) {
      showToast("Please provide your email address", "warning");
      setIsTracking(false);
      return;
    }

    try {
      // Call the unified API route
      const response = await fetch("/api/certificate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operation: "track",
          email: trackEmail.trim().toLowerCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to track certificate");
      }

      if (data.certificates.length === 0) {
        showToast("No certificates found for this email address", "warning");
        setIsTracking(false);
        return;
      }

      // Get the first certificate from the list
      const firstCertificate = data.certificates[0];

      // Redirect to get-certificate page with all necessary parameters
      router.push(
        `/get-certificate/?${new URLSearchParams({
          verificationId: firstCertificate.verificationId,
          fullName: firstCertificate.fullName,
          courseName: firstCertificate.courseName,
          completedAt: firstCertificate.issuedAt,
          email: trackEmail.trim().toLowerCase(),
          cnic: firstCertificate.cnic,
        }).toString()}`
      );

      showToast("Redirecting...", "success");
    } catch (err) {
      console.error("Certificate tracking error:", err);
      showToast(`An error occurred: ${err.message}`, "error");
    } finally {
      setIsTracking(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 min-h-screen">
      {/* Important Notice - Enhanced Design */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <div className="relative bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-second p-6 rounded-lg shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-second/5 rounded-full -mr-16 -mt-16"></div>
          <div className="relative flex items-start">
            <div className="flex-shrink-0">
              <div className="bg-second/10 p-3 rounded-full">
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
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Certificate Eligibility Requirements
              </h3>
              <div className="text-gray-700 space-y-1 text-sm">
                <p>
                  To be eligible for an official {SiteDetails.programName}{" "}
                  certificate, you must have successfully completed the required
                  course.
                </p>
                <p className="font-medium text-second">
                  ✓ Certificates are issued only upon successful course
                  completion and verification of all required documentation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="w-full pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Certificate Request Form - 2/3 width - Enhanced Card */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden transform transition-all hover:shadow-xl">
                {/* Gradient Header */}
                <div className="bg-gradient-to-r from-primary to-primary/90 px-6 py-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20"></div>
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16"></div>
                  <div className="relative">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      <div className="bg-white/20 p-2 rounded-lg">
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
                      </div>
                      Certificate Request Form
                    </h2>
                    <p className="text-blue-100 text-sm mt-2 ml-14">
                      Complete all required fields to request your official
                      certificate
                    </p>
                  </div>
                </div>

                <div className="p-8">
                  {message && (
                    <div
                      className={`p-4 mb-6 rounded-lg border-l-4 ${
                        message.includes("success")
                          ? "bg-green-50 border-green-500 text-green-800"
                          : "bg-red-50 border-red-500 text-red-800"
                      }`}
                    >
                      {message}
                    </div>
                  )}

                  <form onSubmit={handleFormSubmit} className="space-y-8">
                    {/* Personal Information - Enhanced Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 pb-3 border-b-2 border-gray-100">
                        <div className="bg-second/10 p-2 rounded-lg">
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
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">
                          Student Information
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">
                            Email Address{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="email"
                              className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-second/20 focus:border-second transition-all"
                              placeholder="your.email@example.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                              disabled={isSubmitting}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">
                            CNIC/B-Form No{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-second/20 focus:border-second transition-all"
                              placeholder="3XXXX-XXXXXXX-X"
                              value={cnic}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, "");
                                if (value.length <= 13) setCnic(value);
                              }}
                              maxLength={13}
                              minLength={13}
                              required
                              disabled={isSubmitting}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Course Information - Enhanced Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 pb-3 border-b-2 border-gray-100">
                        <div className="bg-second/10 p-2 rounded-lg">
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
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">
                          Course Information
                        </h3>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          Select Completed Course{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <CourseDropdown
                          options={courses.map((c) => ({ ...c }))}
                          selected={selectedCourse}
                          onChange={handleCourseChange}
                          placeholder="Choose your completed course"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    {/* Submit Button - Enhanced Design */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-second to-second/90 hover:from-second/90 hover:to-second text-white font-bold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
                      >
                        {isSubmitting ? (
                          <>
                            <FiLoader className="animate-spin text-xl" />
                            <span>Processing Certificate Request...</span>
                          </>
                        ) : (
                          <>
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
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span>Request Official Certificate</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Certificate Tracking - 1/3 width - Enhanced Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden sticky top-8 transform transition-all hover:shadow-xl">
                {/* Gradient Header */}
                <div className="bg-gradient-to-r from-primary to-primary/90 px-6 py-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                  <div className="relative">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                      <div className="bg-white/20 p-2 rounded-lg">
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
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                          />
                        </svg>
                      </div>
                      Track Certificate Status
                    </h2>
                    <p className="text-blue-100 text-sm mt-2 ml-11">
                      Check your certificate issuance status
                    </p>
                  </div>
                </div>

                <div className="p-6">
                  <form onSubmit={handleTrackCertificate} className="space-y-5">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-second/20 focus:border-second transition-all"
                        placeholder="your.email@example.com"
                        value={trackEmail}
                        onChange={(e) => setTrackEmail(e.target.value)}
                        required
                        disabled={isTracking}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isTracking}
                      className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-second hover:to-second/90 text-white font-bold py-3.5 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
                    >
                      {isTracking ? (
                        <>
                          <FiLoader className="animate-spin text-lg" />
                          <span>Searching Records...</span>
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
                          <span>Track Certificate</span>
                        </>
                      )}
                    </button>
                  </form>

                  {/* Support Info Card - Enhanced */}
                  <div className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-100">
                    <div className="flex items-start gap-3">
                      <div className="bg-second/10 p-2 rounded-lg flex-shrink-0">
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
                            d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 mb-2 text-sm">
                          Need Help?
                        </h4>
                        <p className="text-xs text-gray-600 mb-2">
                          For certificate-related queries:
                        </p>
                        <p className="text-sm text-second font-bold break-all">
                          {SiteDetails.supportEmail}
                        </p>
                        <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-blue-200">
                          📞 Honhaar Certification Department
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Client;
