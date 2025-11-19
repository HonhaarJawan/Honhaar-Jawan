// components/AdditionalCourseModal.jsx
import React from "react";
import Modal from "./Modal";
import { motion } from "framer-motion";
import { FaSpinner } from "react-icons/fa";

/**
 * Modal for selecting/editing additional courses (up to 10 new).
 *
 * @param {object} props - Component props.
 * @param {boolean} props.isOpen - Controls if the modal is visible.
 * @param {function} props.onClose - Function to call to close the modal.
 * @param {Array<object>} props.availableCourses - Courses available for selection THIS TIME {id, name}.
 * @param {Array<string>} props.selectedCourses - Array of NEWLY selected additional course IDs for this action.
 * @param {function} props.onToggleSelection - Function called with courseId when a course is clicked.
 * @param {function} props.onConfirmSelection - Function called when the confirm button is clicked. // Changed prop name
 * @param {boolean} props.isSubmitting - Loading state for the submit button.
 * @param {boolean} props.isEditing - True if editing a pending invoice (status 7), false otherwise.
 */
const AdditionalCourseModal = ({
  isOpen,
  onClose,
  availableCourses = [],
  selectedCourses = [],
  onToggleSelection,
  onConfirmSelection, // Changed prop name
  isSubmitting,
  isEditing,
}) => {
  const maxSelection = 10; // Max NEW selections per transaction

  // Don't render the modal if not open
  if (!isOpen) {
    return null;
  }

  const handleConfirm = () => {
    if (!isEditing && selectedCourses.length === 0) return;
    onConfirmSelection(); // Open PaymentMethodModal
  };

  return (
    <Modal onClose={onClose}>
      <div
        className="w-full max-w-3xl bg-white rounded-2xl p-6 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside
      >
        {/* Header */}
        <div
          className="text-center pb-3 border-b border-second" // Theme: second
        >
          <h1 className="text-xl font-semibold text-gray-800">
            {isEditing
              ? "Edit Your Additional Courses"
              : `Select Additional Courses (Up to ${maxSelection} New)`}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Each newly selected course costs 3000 PKR. Already paid courses are
            included automatically.
          </p>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {/* Course List */}
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-2" // Added max height and scroll
          >
            {availableCourses.length > 0 ? (
              availableCourses.map((course) => {
                const isSelected = selectedCourses.includes(course.id);
                // Limit based on *newly* selected courses for this invoice
                const isDisabled =
                  !isSelected && selectedCourses.length >= maxSelection;

                return (
                  <div
                    key={course.id}
                    onClick={() => !isDisabled && onToggleSelection(course.id)}
                    className={`
                      w-full flex items-center gap-3 border p-3 rounded-lg transition-all
                      ${
                        isDisabled
                          ? "opacity-50 cursor-not-allowed bg-zinc-100"
                          : "cursor-pointer hover:border-second hover:bg-zinc-100" // Theme: second
                      }
                      ${
                        isSelected
                          ? "border-second ring-1 ring-second bg-zinc-100" // Theme: second
                          : "border-gray-300"
                      }
                    `}
                  >
                    {/* Custom Checkbox Visual */}
                    <div
                      className={`
                        w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                        ${
                          isSelected
                            ? "border-second bg-second" // Theme: second
                            : "border-gray-400"
                        }
                        ${isDisabled && !isSelected ? "border-gray-300" : ""}
                      `}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    {/* Course Name */}
                    <h2
                      className={`text-base font-medium ${
                        isSelected ? "text-second" : "text-gray-700" // Theme: second
                      } ${isDisabled ? "text-gray-500" : ""}`}
                    >
                      {course.name}
                    </h2>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-600 italic text-center md:col-span-2">
                No more courses available to add.
              </p>
            )}
          </div>
        </div>

        {/* Footer - Only show if there are courses available to potentially select */}
        {availableCourses.length > 0 && (
          <>
            <div className="text-sm text-center text-gray-600 mt-2">
              Newly Selected: {selectedCourses.length} / {maxSelection} max
            </div>
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-second">
              <button
                onClick={onClose}
                disabled={isSubmitting} // Disable cancel while submitting
                className="btn btn-md btn-danger" // Changed to danger for cancel
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm} // Call handleConfirm here
                disabled={isSubmitting || (!isEditing && selectedCourses.length === 0)}
                className="btn btn-md btn-primary min-w-[210px] flex justify-center items-center" // Use primary button color, adjust min-width
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />{" "}
                    {isEditing ? "Updating PSID..." : "Generating PSID..."}
                  </>
                ) : (
                  "Confirm Selection" // Updated button text
                )}
              </button>
            </div>
          </>
        )}
        {/* Footer - Show only Cancel if no courses were available */}
        {availableCourses.length === 0 && (
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-second">
            <button
              onClick={onClose}
              className="btn btn-md btn-second" // Use secondary color for close/ok action here
            >
              Close
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AdditionalCourseModal;