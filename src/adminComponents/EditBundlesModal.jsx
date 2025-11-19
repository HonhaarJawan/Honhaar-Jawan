"use client";

import React, { useState, useEffect } from "react";
import Notify from "simple-notify";

const EditBundlesModal = ({
  isOpen,
  onClose,
  user,
  allBundles,
  onUpdateSuccess,
}) => {
  const [selectedBundleIds, setSelectedBundleIds] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && user && allBundles) {
      const initialBundleIds = user.enrolledBundles?.map(Number) || [];
      setSelectedBundleIds(initialBundleIds);
    }
  }, [isOpen, user, allBundles]);

  const toggleBundle = (bundleId) => {
    setSelectedBundleIds((prev) =>
      prev.includes(bundleId)
        ? prev.filter((id) => id !== bundleId)
        : [...prev, bundleId]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const currentEnrolledBundles = user.enrolledBundles?.map(Number) || [];
      const currentBundleSet = new Set(currentEnrolledBundles);
      const newBundleSet = new Set(selectedBundleIds);

      // Calculate bundles to add/remove
      const bundlesToEnroll = selectedBundleIds.filter(
        (id) => !currentBundleSet.has(id)
      );

      const bundlesToUnenroll = Array.from(currentBundleSet).filter(
        (id) => !newBundleSet.has(id)
      );

      // Calculate courses to unenroll
      const coursesToUnenroll = [];
      const coursesInRemainingBundles = new Set();

      // Get courses from remaining bundles
      selectedBundleIds.forEach((bundleId) => {
        const bundle = allBundles.find((b) => Number(b.id) === bundleId);
        if (bundle?.bundleCourses) {
          bundle.bundleCourses.map(Number).forEach((courseId) => {
            coursesInRemainingBundles.add(courseId);
          });
        }
      });

      // Get courses from bundles being removed
      bundlesToUnenroll.forEach((bundleId) => {
        const bundle = allBundles.find((b) => Number(b.id) === bundleId);
        if (bundle?.bundleCourses) {
          bundle.bundleCourses.map(Number).forEach((courseId) => {
            if (!coursesInRemainingBundles.has(courseId)) {
              coursesToUnenroll.push(courseId);
            }
          });
        }
      });

      const payload = {
        userId: user.userId,
        email: user.email,
        bundlesToEnroll,
        bundlesToUnenroll,
        coursesToUnenroll,
      };

      const response = await fetch("/api/admin/updateUserBundles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update bundles");
      }

      const responseData = await response.json();
      onUpdateSuccess(responseData.user);

      new Notify({
        status: "success",
        title: "Success",
        text: "User bundles and courses updated successfully!",
        position: "right bottom",
      });

      onClose();
    } catch (error) {
      new Notify({
        status: "error",
        title: "Error",
        text: error.message || "Failed to update bundles",
        position: "right bottom",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-green-500 to-teal-600 text-white flex justify-between items-center">
          <h3 className="text-xl font-bold">
            Manage Bundles for{" "}
            <span className="font-extrabold">
              {user?.fullName || user?.email || "Unknown User"}
            </span>
          </h3>
          <button
            onClick={onClose}
            className="text-white hover:text-green-100 text-3xl transition-colors"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Bundles List */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {allBundles.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No bundles available.
            </p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {allBundles.map((bundle) => {
                const bundleId = Number(bundle.id);
                const isSelected = selectedBundleIds.includes(bundleId);

                return (
                  <li
                    key={bundle.id}
                    className={`flex items-center justify-between p-3 cursor-pointer transition-colors duration-200 ease-in-out ${
                      isSelected
                        ? "bg-green-100 hover:bg-green-200"
                        : "hover:bg-gray-100"
                    }`}
                    onClick={() => toggleBundle(bundleId)}
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 text-base">
                        {bundle.name}
                      </h4>
                      {bundle.bundleCourses &&
                        bundle.bundleCourses.length > 0 && (
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Courses:</span>{" "}
                            {bundle.bundleCourses.join(", ")}
                          </p>
                        )}
                    </div>
                    <div className="w-6 h-6 flex items-center justify-center border-2 rounded-full ml-4 flex-shrink-0">
                      {isSelected ? (
                        <svg
                          className="w-4 h-4 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="3"
                            d="M5 13l4 4L19 7"
                          ></path>
                        </svg>
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-gray-400"></div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-gray-200 bg-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-red-600 font-medium text-center sm:text-left">
            Note: Unenrolling will permanently delete all associated course
            progress for the user.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-200 transition-colors duration-200 text-sm font-medium"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              className="px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 disabled:bg-green-400 disabled:cursor-not-allowed flex items-center justify-center text-sm font-medium"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 mr-2 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditBundlesModal;
