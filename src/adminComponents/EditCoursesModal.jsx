import React, { useState } from "react";
import { courses as globalCourses } from "@/Data/Data";
import { useToast } from "@/components/primary/Toast";

export default function EditCoursesModal({
  isOpen,
  onClose,
  user,
  onUpdateSuccess,
}) {
  const { showToast } = useToast();

  if (!isOpen) return null;

  const selectedCourses = user?.generatedPayProId?.selectedCourses || [];
  const [oldCourseId, setOldCourseId] = useState("");
  const [newCourseId, setNewCourseId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const userLmsId = user?.user_lms_id;
  const userEmail = user?.email;

  const handleReplaceCourse = async () => {
    if (!oldCourseId || !newCourseId) {
      setError("Please select both courses");
      showToast("Please select both courses", "error");
      return;
    }

    setIsLoading(true);
    setError(null);

    const newCourse = globalCourses.find(
      (c) => c.lmsCourseId === parseInt(newCourseId)
    );
    if (!newCourse) {
      setError("New course not found");
      showToast("New course not found", "error");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/replacecourses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newCourseId: parseInt(newCourseId),
          oldCourseId: parseInt(oldCourseId),
          user_lms_id: userLmsId,
          userEmail: userEmail,
          newCourseDetails: {
            courseId: newCourse.courseId,
            name: newCourse.name,
            lmsCourseId: newCourse.lmsCourseId,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (onUpdateSuccess) {
        onUpdateSuccess({
          type: "courses",
          email: user.email,
          id: user.id,
          updatedCourses: {
            oldCourseId: parseInt(oldCourseId),
            newCourse: {
              courseId: newCourse.courseId,
              name: newCourse.name,
              lmsCourseId: newCourse.lmsCourseId,
            },
          },
        });
      }

      showToast(data.message || "Course replaced successfully", "success");
      onClose();
    } catch (err) {
      setError(err.message || "An unexpected error occurred");
      showToast(err.message || "An unexpected error occurred", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <h2 className="text-xl font-semibold mb-4">Replace Course</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Select course to replace
          </label>
          <select
            value={oldCourseId}
            onChange={(e) => setOldCourseId(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            disabled={isLoading}
          >
            <option value="">-- Choose a course --</option>
            {selectedCourses.map((course) => (
              <option key={course.courseId} value={course.lmsCourseId}>
                {course.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">
            Select new course
          </label>
          <select
            value={newCourseId}
            onChange={(e) => setNewCourseId(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
            disabled={isLoading}
          >
            <option value="">-- Choose a new course --</option>
            {globalCourses.map((course) => (
              <option key={course.courseId} value={course.lmsCourseId}>
                {course.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4 text-xs text-gray-500">
          <p>User LMS ID: {userLmsId}</p>
          <p>User Email: {userEmail}</p>
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleReplaceCourse}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Processing..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
