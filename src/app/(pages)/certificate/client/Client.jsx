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
    <div>
      {/* Important Notice - honhaar Style */}
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
                Certificate Eligibility Requirements
              </h3>
              <div className="text-gray-700 space-y-2">
                <p>
                  To be eligible for an official {SiteDetails.programName}{" "}
                  certificate, you must have successfully completed the required
                  course.
                </p>
                <p className="font-medium">
                  Certificates are issued only upon successful course completion
                  and verification of all required documentation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="min-h-screen w-full py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Certificate Request Form - 2/3 width */}
            <div className="lg:col-span-2">
              {/* Note: parent has overflow-hidden, but our menu uses a portal so it won't be clipped */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                {/* form header */}
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
                    Certificate Request Form
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">
                    Complete all required fields to request your official
                    certificate
                  </p>
                </div>

                <div className="p-6">
                  {message && (
                    <div
                      className={`p-4 mb-6 rounded-md border-l-4 ${
                        message.includes("success")
                          ? "bg-green-50 border-green-400 text-green-700"
                          : "bg-red-50 border-red-400 text-red-700"
                      }`}
                    >
                      {message}
                    </div>
                  )}

                  <form onSubmit={handleFormSubmit} className="space-y-6">
                    {/* Personal Information */}
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
                        Student Information
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-second focus:border-second"
                            placeholder="Enter your registered email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-second focus:border-second"
                            placeholder="Enter your 13-digit CNIC number"
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

                    {/* Course Information */}
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
                            Select Completed Course *
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
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-second hover:bg-second/90 text-white font-semibold py-3 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-second focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <FiLoader className="animate-spin" />
                            Processing Certificate Request...
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
                            Request Official Certificate
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Certificate Tracking - 1/3 width */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden sticky top-8">
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
                    Track Certificate Status
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">
                    Check your certificate issuance status
                  </p>
                </div>

                <div className="p-6">
                  <form onSubmit={handleTrackCertificate} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-second focus:border-second"
                        placeholder="Enter your registered email"
                        value={trackEmail}
                        onChange={(e) => setTrackEmail(e.target.value)}
                        required
                        disabled={isTracking}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isTracking}
                      className="w-full bg-primary hover:bg-second text-white font-semibold py-3 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isTracking ? (
                        <>
                          <FiLoader className="animate-spin" />
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
                          Track Certificate Status
                        </>
                      )}
                    </button>
                  </form>

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
                      Certificate Support
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      For certificate-related queries, contact:
                    </p>
                    <p className="text-sm text-second font-medium">
                      {SiteDetails.supportEmail}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Honhaar Certification Department
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {/* /Right column */}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Client;
