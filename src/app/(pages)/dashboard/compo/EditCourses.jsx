"use client";
import { courses } from "@/Data/Data";
import React, { useState, useRef, useEffect, memo } from "react";
import { doc, updateDoc, deleteField, getDoc } from "firebase/firestore";
import { firestore } from "@/Backend/Firebase";
import { useToast } from "@/components/primary/Toast";
import { createPortal } from "react-dom";
import { FaSearch } from "react-icons/fa";

// -----------------------------------------------------
// Course Dropdown
// -----------------------------------------------------
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
      setTimeout(() => inputRef.current?.focus(), 0);
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
        if (n.dataset?.dd === "courses") return;
        n = n.parentElement;
      }
      closeMenu();
    };
    const onKey = (e) => e.key === "Escape" && closeMenu();

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
          disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white border-gray-300"
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
            <div className="px-3 pt-3">
              <div className="flex items-center gap-2 border border-gray-200 rounded px-2 py-2">
                <FaSearch className="w-4 h-4 text-gray-500" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="search..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full outline-none bg-transparent text-sm"
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
                {filtered.length} results
              </div>
            </div>

            <div role="listbox" className="max-h-[20vh] overflow-y-auto mt-2 pb-2">
              {filtered.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500">No matches</div>
              ) : (
                filtered.map((opt) => (
                  <div
                    key={opt.id}
                    role="option"
                    aria-selected={selected?.id === opt.id}
                    onClick={() => {
                      onChange(opt);
                      closeMenu();
                    }}
                    className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                      selected?.id === opt.id ? "bg-gray-50" : ""
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

// -----------------------------------------------------
// EditCourses Component
// -----------------------------------------------------
const EditCourses = ({
  initialFormData,
  onSave,
  onCancel,
  isUpdating,
  userEmail,
}) => {
  const [tempFormData, setTempFormData] = useState(initialFormData);
  const { showToast } = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTempFormData((prev) => ({ ...prev, [name]: value }));
  };

  // -----------------------------------------------------
  // AUTO-CLEAR duplicates + update selections
  // -----------------------------------------------------
  const handleCourseChange = (courseIndex, courseData) => {
    setTempFormData((prev) => {
      const next = {
        ...prev,
        [`course${courseIndex + 1}`]: courseData.name,
        [`course${courseIndex + 1}Data`]: courseData,
      };

      // Clear duplicates in other dropdowns
      for (let i = 0; i < 3; i++) {
        if (i === courseIndex) continue;
        const other = next[`course${i + 1}Data`];
        if (other?.id === courseData.id) {
          next[`course${i + 1}`] = "";
          next[`course${i + 1}Data`] = null;
        }
      }
      return next;
    });
  };

  // -----------------------------------------------------
  // Hide already selected courses from other dropdowns
  // -----------------------------------------------------
  const getFilteredOptions = (currentIndex) => {
    const selectedFromOtherDropdowns = [0, 1, 2]
      .filter((i) => i !== currentIndex)
      .map((i) => ({
        id: tempFormData[`course${i + 1}Data`]?.id ?? null,
        name: tempFormData[`course${i + 1}`] ?? null,
      }));

    const selectedIds = new Set(
      selectedFromOtherDropdowns.map((s) => s.id).filter(Boolean)
    );
    const selectedNames = new Set(
      selectedFromOtherDropdowns.map((s) => s.name).filter(Boolean)
    );

    return courses.filter(
      (course) =>
        !selectedIds.has(course.id) && !selectedNames.has(course.name)
    );
  };

  const getSelectedCourse = (i) => {
    const name = tempFormData[`course${i + 1}`];
    if (!name) return null;
    return courses.find((c) => c.name === name) || null;
  };

  const handleSave = async () => {
    try {
      onSave(tempFormData);

      if (!userEmail) {
        showToast("User email missing. Please generate new PSID.", "error");
        return;
      }

      const userRef = doc(firestore, "users", userEmail);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) throw new Error("User document does not exist");

      await updateDoc(userRef, { generatedPayProId: deleteField() });
    } catch (err) {
      console.error("Error:", err);
      showToast("Unable to update. Try again.", "error");
    }
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
