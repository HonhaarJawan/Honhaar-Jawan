import React from "react";
import Modal from "./Modal";
import { motion } from "framer-motion";
import { FaSpinner } from "react-icons/fa";

const InitialCourseModal = ({
  isOpen,
  onClose,
  courses = [],
  selectedCourses = [],
  onToggleSelection,
  onConfirmSelection,
  isSubmitting,
}) => {
  const maxSelection = 3;

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedCourses.length === 0) return;
    onConfirmSelection(); // Open PaymentMethodModal
  };

  return (
    <Modal onClose={onClose}>
      <div
        className="w-full max-w-3xl bg-white rounded-2xl p-6 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="text-center pb-3 border-b border-primary"
        >
          <h1 className="text-xl font-semibold text-gray-800">
            Select Your Preferred Courses (Up to {maxSelection})
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Choose up to {maxSelection} courses for the initial bundle.
          </p>
          <p className="text-sm text-gray-500 mt-1">
            These courses will help you develop valuable digital skills and
            advance your career.
          </p>
          <p className="text-sm text-gray-600 mt-2 font-semibold">
            براہ کرم اپنے پسندیدہ {maxSelection} کورسز منتخب کریں۔ یہ کورسز آپ
            کو ڈیجیٹل مہارتوں میں بہتری لانے میں مدد کریں گے۔
          </p>
        </div>

        {/* Course List */}
        <div className="max-h-80 overflow-y-auto p-2">
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-2"
          >
            {courses.map((course) => {
              const isSelected = selectedCourses.includes(course.id);
              const isDisabled =
                !isSelected && selectedCourses.length >= maxSelection;

              return (
                <div
                  key={course.id}
                  onClick={() => !isDisabled && onToggleSelection(course.id)}
                  className={`w-full flex items-center text-start gap-3 border p-3 rounded-lg transition-all
                    ${
                      isDisabled
                        ? "opacity-50 cursor-not-allowed bg-zinc-100"
                        : "cursor-pointer hover:border-primary hover:bg-zinc-100"
                    }
                    ${
                      isSelected
                        ? "border-primary ring-1 ring-primary bg-zinc-100"
                        : "border-gray-300"
                    }
                  `}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                      ${
                        isSelected
                          ? "border-primary bg-primary"
                          : "border-gray-400"
                      }
                      ${isDisabled && !isSelected ? "border-gray-300" : ""}
                    `}
                  >
                    {isSelected && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <h2
                    className={`text-base font-medium line-clamp-1 ${
                      isSelected ? "text-primary" : "text-gray-700"
                    } ${isDisabled ? "text-gray-500" : ""}`}
                  >
                    {course.name}
                  </h2>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="text-sm text-center text-gray-600 mt-2">
          Selected: {selectedCourses.length} / {maxSelection}
        </div>
        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-primary">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="btn btn-md btn-second"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedCourses.length === 0 || isSubmitting}
            className="btn btn-md btn-primary min-w-[200px] flex justify-center items-center"
          >
            {isSubmitting ? (
              <>
                <FaSpinner className="animate-spin mr-2" /> Processing...
              </>
            ) : (
              "Confirm Selection"
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default InitialCourseModal;
