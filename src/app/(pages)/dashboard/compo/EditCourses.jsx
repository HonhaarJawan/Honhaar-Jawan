"use client";
import { courses } from "@/Data/Data";
import React, { useState, useRef, useEffect, memo } from "react";
import { doc, updateDoc, deleteField, getDoc } from "firebase/firestore";
import { firestore } from "@/Backend/Firebase"; // Adjust path to your Firebase config
import { useToast } from "@/components/primary/Toast";
import { createPortal } from "react-dom";
import { FaSearch } from "react-icons/fa";

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
        className={`w-full text-left px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
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

const EditCourses = ({
  initialFormData,
  onSave,
  onCancel,
  isUpdating,
  userEmail,
}) => {
  // Local state to manage temporary selections
  const [tempFormData, setTempFormData] = useState(initialFormData);
  const { showToast } = useToast();

  // Handle local changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setTempFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle course selection from dropdown
  const handleCourseChange = (courseIndex, courseData) => {
    setTempFormData((prev) => ({
      ...prev,
      [`course${courseIndex + 1}`]: courseData.name,
      [`course${courseIndex + 1}Data`]: courseData,
    }));
  };

  const handleSave = async () => {
    try {
      onSave(tempFormData);

      // Skip Firestore update if userEmail is missing
      if (!userEmail) {
        console.warn(
          "handleSave: userEmail is missing, skipping generatedPayProId deletion"
        );
        showToast(
          "User email is missing. Course selection updated, but please generate a new PSID.",
          "error"
        );
        return;
      }

      const userRef = doc(firestore, "users", userEmail);
      // Check if document exists
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        throw new Error("User document does not exist");
      }

      // Delete generatedPayProId
      await updateDoc(userRef, {
        generatedPayProId: deleteField(),
      });

      console.log(
        "Successfully deleted generatedPayProId for user:",
        userEmail
      );
    } catch (error) {
      console.error("Error in handleSave:", error.message);
      let errorMessage =
        "Unable to reset payment data. Please try again or contact support.";
      if (error.message === "User email is missing") {
        errorMessage =
          "User email is missing. Course selection updated, but please generate a new PSID.";
      } else if (error.message === "User document does not exist") {
        errorMessage = "User profile not found. Please contact support.";
      } else if (error.message.includes("permission-denied")) {
        errorMessage =
          "Permission denied. Please ensure you are logged in and try again.";
      }

      showToast(errorMessage, "error");
    }
  };

  // Get selected course data for each dropdown
  const getSelectedCourse = (index) => {
    const courseName = tempFormData[`course${index + 1}`];
    if (!courseName) return null;
    return courses.find((c) => c.name === courseName) || null;
  };

  // Get filtered options for each dropdown (excluding already selected courses)
  const getFilteredOptions = (currentIndex) => {
    // Get all selected course names
    const selectedCourseNames = [];
    for (let i = 0; i < 3; i++) {
      if (i !== currentIndex) { // Skip the current dropdown
        const courseName = tempFormData[`course${i + 1}`];
        if (courseName) {
          selectedCourseNames.push(courseName);
        }
      }
    }

    // Filter out courses that are already selected in other dropdowns
    return courses.filter(course => !selectedCourseNames.includes(course.name));
  };

  return (
    <div>
      <div className="w-full flex justify-center">
        <h2 className="text-xl bg-primary text-white w-full text-center font-semibold py-4 rounded-t-lg">
          Select Courses
        </h2>
      </div>
      <div className="mb-4 py-6 border p-5">
        <div className="flex flex-col gap-y-6">
          {[0, 1, 2].map((index) => (
            <div key={index}>
              <label className="block mb-1 font-medium">
                Select Course {index === 0 ? index + 1 : "(Optional)"} *
              </label>
              <CourseDropdown
                options={getFilteredOptions(index)}
                selected={getSelectedCourse(index)}
                onChange={(courseData) => handleCourseChange(index, courseData)}
                placeholder="Select Course"
                disabled={isUpdating}
                name={`course${index + 1}`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onCancel}
          disabled={isUpdating}
          className="px-4 py-2 border rounded-md"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isUpdating || !tempFormData.course1}
          className={`px-4 py-2 text-white rounded-md ${
            isUpdating || !tempFormData.course1
              ? "bg-gray-400"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isUpdating ? "Updating..." : "Confirm"}
        </button>
      </div>
    </div>
  );
};

export default memo(EditCourses);