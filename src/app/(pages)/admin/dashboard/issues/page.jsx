"use client";
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  Suspense,
  useMemo,
} from "react";
import { firestore } from "@/Backend/Firebase";
import { cn } from "@/lib/utils/utils";
import { useToast } from "@/components/primary/Toast";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  deleteDoc,
} from "firebase/firestore";
import {
  FaSearch,
  FaEdit,
  FaTrashAlt,
  FaCheckCircle,
  FaUsersCog,
  FaTimesCircle,
  FaExclamationTriangle,
  FaUserCheck,
  FaSpinner,
  FaUserPlus,
  FaPlus,
  FaCheck,
  FaFilter,
  FaUser,
  FaMoneyBill,
  FaGraduationCap,
  FaRedo,
  FaEnvelope,
  FaPhone,
  FaIdCard,
  FaCalendarAlt,
  FaLock,
  FaKey,
  FaSchool,
  FaChartLine,
  FaCreditCard,
  FaBook,
  FaTachometerAlt,
  FaCog,
  FaSignOutAlt,
  FaInfoCircle,
  FaExternalLinkAlt,
  FaUserCircle,
  FaShieldAlt,
  FaHistory,
  FaAward,
  FaBell,
  FaDatabase,
  FaRocket,
  FaTools,
  FaClipboardList,
  FaUserClock,
} from "react-icons/fa";
import EditProfileModal from "@/adminComponents/EditProfileModal";
import EditCoursesModal from "@/adminComponents/EditCoursesModal";
import SidebarWrapper from "@/adminComponents/SidebarWrapper";
import AdminProtectedRoutes from "@/ProtectedRoutes/AdminProtectedRoutes";
import GeneratePSIDButton from "@/adminComponents/reversePayment/button";
import { courses as allCourses } from "@/Data/Data";

// Course Detail Popup Component
const CourseDetailPopup = ({ isOpen, onClose, course }) => {
  if (!isOpen || !course) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative border-2 border-yellow-500">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <FaTimesCircle className="text-xl" />
        </button>

        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            <img
              src={
                course.image
                  ? course.image.startsWith("http")
                    ? course.image
                    : `/${course.image}`
                  : ""
              }
              alt={course.name}
              className="w-full h-full"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.parentElement.classList.add("bg-gray-200");
                e.target.parentElement.innerHTML = `
                  <div class="w-full h-full flex items-center justify-center">
                    <p class="text-gray-600 text-sm font-medium text-center px-2">
                      ${course.name}
                    </p>
                  </div>
                `;
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {course.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                {course.type || "Course"}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Course ID:</span>
            <span className="text-sm font-medium text-gray-900">
              {course.courseId || "—"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">LMS ID:</span>
            <span className="text-sm font-medium text-gray-900">
              {course.lmsCourseId || "—"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Status:</span>
            <span className="text-sm font-medium text-green-600">Active</span>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// SearchAnimation Component
const SearchAnimation = () => {
  return (
    <div className="relative w-full h-[200px]">
      <div className="stage">
        <div className="train">
          <div className="wagon"></div>
          <div className="wagon"></div>
          <div className="wagon back-wagon">
            <div className="text-inside">Query</div>
            <div className="text-typing">Searching</div>
          </div>
          <div className="locomotive">
            <div className="cabin"></div>
            <div className="motor"></div>
            <div className="chimney">
              <div className="smoke"></div>
            </div>
            <div className="light"></div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .stage {
          position: relative;
          width: 100%;
          height: 100%;
        }
        .stage::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          border-top: 3px solid #205c6b;
          border-bottom: 3px dashed #205c6b;
        }
        .train {
          position: absolute;
          bottom: 10px;
          left: -310px;
          width: 310px;
          z-index: 1;
          animation: voyage 3.5s linear infinite;
        }
        .wagon,
        .cabin,
        .chimney {
          border-radius: 4px 4px 0 0;
          border-top: 4px solid #ffc928;
        }
        .wagon,
        .motor {
          border-bottom: 2px solid #ffc928;
        }
        .wagon,
        .locomotive {
          display: inline-block;
          width: 70px;
          height: 55px;
          background-color: #e04f60;
          position: relative;
        }
        .wagon::before,
        .wagon::after,
        .motor::before,
        .motor::after,
        .cabin::after {
          content: "";
          position: absolute;
          border-radius: 46%;
          border: 6px solid #333;
          bottom: -10px;
          background-color: #666;
          animation: spin 4s linear infinite;
        }
        .wagon::before {
          left: 6px;
          padding: 6px;
        }
        .wagon::after {
          right: 6px;
          padding: 6px;
        }
        .motor::before {
          left: 32px;
          padding: 6px;
        }
        .motor::after {
          right: 4px;
          padding: 6px;
        }
        .cabin::after {
          bottom: -50px;
          padding: 8px;
          left: 3px;
        }
        .locomotive {
          background-color: transparent;
        }
        .locomotive .cabin {
          width: 58px;
          height: 35px;
          background-color: #e04f60;
          position: relative;
          z-index: 1;
          border-radius: 8px 8px 0 0;
        }
        .locomotive .cabin::before {
          content: "";
          width: 25px;
          height: 18px;
          position: absolute;
          top: 10px;
          left: 15px;
          border-radius: 3px;
          border: 3px solid #ffc928;
          background-color: #f1f1f1;
        }
        .locomotive .motor {
          display: inline-block;
          width: 85px;
          height: 40px;
          background-color: #e04f60;
          position: relative;
          border-radius: 0 8px 0 0;
        }
        .locomotive .chimney {
          position: absolute;
          width: 15px;
          height: 15px;
          background-color: #e04f60;
          right: -6px;
          bottom: 10px;
          animation: puf 4s infinite;
        }
        .locomotive .light {
          position: absolute;
          right: -10px;
          bottom: 0;
          border-radius: 50%;
          border: 3px solid #ffc928;
          width: 10px;
          height: 10px;
        }
        .back-wagon {
          position: relative;
        }
        .back-wagon .text-typing {
          position: absolute;
          top: -20px;
          left: 0%;
          transform: translateX(-50%);
          white-space: nowrap;
          overflow: hidden;
          font-size: 1rem;
          font-weight: bold;
          color: #5375d1;
          width: 0;
          animation: typing 1s steps(9, end) infinite;
        }
        .back-wagon .text-inside {
          position: absolute;
          top: 50%;
          left: 0%;
          transform: translate(-50%, -50%);
          font-size: 1rem;
          font-weight: bold;
          color: #fff;
        }
        @keyframes voyage {
          0% {
            left: -310px;
          }
          100% {
            left: 100%;
          }
        }
        @keyframes spin {
          100% {
            transform: rotate(360deg);
          }
        }
        @keyframes puf {
          0% {
            bottom: 10px;
          }
          25% {
            bottom: 9px;
          }
          100% {
            bottom: 15px;
          }
        }
        @keyframes typing {
          from {
            width: 0;
          }
          to {
            width: 90px;
          }
        }
      `}</style>
    </div>
  );
};

// IdleSearchAnimation Component
const IdleSearchAnimation = () => {
  return (
    <div className="flex justify-center mt-12">
      <div className="text-center">
        <div className="relative w-24 h-24 mx-auto mb-4">
          <div className="absolute top-0 left-0 w-full h-full border-8 border-yellow-500/20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-8 border-yellow-500 rounded-full border-t-transparent animate-spin"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <svg
              className="w-8 h-8 text-yellow-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <div className="absolute -top-1 -left-1 w-[calc(100%+8px)] h-[calc(100%+8px)] border-4 border-transparent rounded-full animate-pulse"></div>
        </div>
        <p className="text-gray-500 animate-pulse">
          Enter a search term to find users
        </p>
        <div className="mt-4 flex justify-center gap-1">
          <div
            className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          ></div>
          <div
            className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          ></div>
          <div
            className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          ></div>
        </div>
      </div>
    </div>
  );
};

// NoResultsAnimation Component
const NoResultsAnimation = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="loader mb-4"></div>
      <div className="typing-container">
        <p className="typing-text text-yellow-500 font-semibold">
          No User Found.
        </p>
      </div>
      <p className="text-yellow-500/80 font-semibold text-sm mt-2">
        Try a different CNIC, name, email, or phone
      </p>
      <style jsx>{`
        .loader {
          width: 50px;
          aspect-ratio: 1;
          border-radius: 50%;
          background: repeating-conic-gradient(
            #00f3,
            #00f3 1deg 18deg,
            #0000 20deg 36deg
          );
          animation: l9 4s infinite linear;
          position: relative;
        }
        .loader::before {
          content: "";
          position: absolute;
          border-radius: 50%;
          inset: 0;
          background: inherit;
          animation: inherit;
        }
        .typing-container {
          display: inline-block;
        }
        .typing-text {
          overflow: hidden;
          white-space: nowrap;
          border-right: 2px solid #4b5563;
          width: 0;
          animation:
            typing 1.5s steps(13, end) forwards,
            blink-caret 0.75s step-end infinite;
        }
        @keyframes l9 {
          100% {
            transform: rotate(0.5turn);
          }
        }
        @keyframes typing {
          from {
            width: 0;
          }
          to {
            width: 100%;
          }
        }
        @keyframes blink-caret {
          from,
          to {
            border-color: transparent;
          }
          50% {
            border-color: #4b5563;
          }
        }
      `}</style>
    </div>
  );
};

// Manual Enrollment Modal Component
const ManualEnrollmentModal = ({
  isOpen,
  onClose,
  user,
  availableCourses,
  onUpdateSuccess,
}) => {
  const { showToast } = useToast();
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleCourseToggle = (course) => {
    setSelectedCourses((prev) => {
      const isSelected = prev.some((c) => c.id === course.id);
      if (isSelected) {
        return prev.filter((c) => c.id !== course.id);
      } else {
        return [...prev, course];
      }
    });
  };

  const handleEnrollCourses = async () => {
    if (selectedCourses.length === 0) {
      setError("Please select at least one course to enroll");
      showToast("Please select at least one course to enroll", "error");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "/api/admin/enrollment-routes/manual-enrollment",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            userEmail: user.email,
            userLmsId: user.user_lms_id,
            courses: selectedCourses.map((course) => ({
              courseId: course.id,
              name: course.name,
              lmsCourseId: course.lmsCourseId,
            })),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed: ${response.statusText}`);
      }

      if (onUpdateSuccess) {
        onUpdateSuccess({
          type: "courses",
          email: user.email,
          id: user.id,
          updatedCourses: {
            enrolledCourses: selectedCourses,
          },
        });
      }

      showToast(
        `Successfully enrolled in ${selectedCourses.length} course(s)`,
        "success"
      );
      onClose();
      setSelectedCourses([]);
    } catch (err) {
      setError(err.message || "An unexpected error occurred");
      showToast(err.message || "An unexpected error occurred", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl max-h-[80vh] overflow-y-auto p-6 border-2 border-yellow-500">
        <h2 className="text-xl font-semibold mb-4">Manual Course Enrollment</h2>
        <p className="text-sm text-gray-600 mb-4">
          Enroll {user.fullName} ({user.email}) in additional courses
        </p>

        <div className="mb-6 max-h-96 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {availableCourses.map((course) => (
              <div
                key={course.id}
                onClick={() => handleCourseToggle(course)}
                className={`border rounded-lg p-3 cursor-pointer transition-all ${
                  selectedCourses.some((c) => c.id === course.id)
                    ? "border-yellow-500 bg-yellow-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-1">
                    <div
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        selectedCourses.some((c) => c.id === course.id)
                          ? "border-yellow-500 bg-yellow-500"
                          : "border-gray-300"
                      }`}
                    >
                      {selectedCourses.some((c) => c.id === course.id) && (
                        <FaCheck className="text-white text-xs" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-gray-900">
                      {course.name}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      ID: {course.lmsCourseId || course.id}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {selectedCourses.length} course(s) selected
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleEnrollCourses}
              disabled={isLoading || selectedCourses.length === 0}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
            >
              {isLoading ? "Processing..." : "Enroll Courses"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Manual Unenrollment Modal Component
const ManualUnenrollmentModal = ({
  isOpen,
  onClose,
  user,
  enrolledCourses,
  onUpdateSuccess,
}) => {
  const { showToast } = useToast();
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleCourseToggle = (course) => {
    setSelectedCourses((prev) => {
      const isSelected = prev.some((c) => c.courseId === course.courseId);
      if (isSelected) {
        return prev.filter((c) => c.courseId !== course.courseId);
      } else {
        return [...prev, course];
      }
    });
  };

  const handleUnenrollCourses = async () => {
    if (selectedCourses.length === 0) {
      setError("Please select at least one course to unenroll");
      showToast("Please select at least one course to unenroll", "error");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "/api/admin/enrollment-routes/manual-unenrollment",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            userEmail: user.email,
            userLmsId: user.user_lms_id,
            courses: selectedCourses.map((course) => ({
              courseId: course.courseId,
              name: course.name,
              lmsCourseId: course.lmsCourseId,
            })),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed: ${response.statusText}`);
      }

      if (onUpdateSuccess) {
        onUpdateSuccess({
          type: "courses",
          email: user.email,
          id: user.id,
          updatedCourses: {
            unenrolledCourses: selectedCourses,
          },
        });
      }

      showToast(
        `Successfully unenrolled from ${selectedCourses.length} course(s)`,
        "success"
      );
      onClose();
      setSelectedCourses([]);
    } catch (err) {
      setError(err.message || "An unexpected error occurred");
      showToast(err.message || "An unexpected error occurred", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl max-h-[80vh] overflow-y-auto p-6 border-2 border-yellow-500">
        <h2 className="text-xl font-semibold mb-4">
          Manual Course Unenrollment
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Unenroll {user.fullName} ({user.email}) from selected courses
        </p>

        <div className="mb-6 max-h-96 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {enrolledCourses.map((course) => (
              <div
                key={course.courseId}
                onClick={() => handleCourseToggle(course)}
                className={`border rounded-lg p-3 cursor-pointer transition-all ${
                  selectedCourses.some((c) => c.courseId === course.courseId)
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-1">
                    <div
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        selectedCourses.some(
                          (c) => c.courseId === course.courseId
                        )
                          ? "border-red-500 bg-red-500"
                          : "border-gray-300"
                      }`}
                    >
                      {selectedCourses.some(
                        (c) => c.courseId === course.courseId
                      ) && <FaCheck className="text-white text-xs" />}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-gray-900">
                      {course.name}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      ID: {course.lmsCourseId || course.courseId}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {selectedCourses.length} course(s) selected
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleUnenrollCourses}
              disabled={isLoading || selectedCourses.length === 0}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? "Processing..." : "Unenroll Courses"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// IssuesViewContent Component
const IssuesViewContent = () => {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [nestedSearchTerm, setNestedSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState("");
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isEditCoursesModalOpen, setIsEditCoursesModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("account");
  const [isManualEnrollmentModalOpen, setIsManualEnrollmentModalOpen] =
    useState(false);
  const [isManualUnenrollmentModalOpen, setIsManualUnenrollmentModalOpen] =
    useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userToDeleteId, setUserToDeleteId] = useState(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [users, setUsers] = useState([]);
  const [verifyButtonStatus, setVerifyButtonStatus] = useState("idle");
  const [createButtonStatus, setCreateButtonStatus] = useState("idle");
  const [resetTestStatus, setResetTestStatus] = useState("idle");
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isCoursePopupOpen, setIsCoursePopupOpen] = useState(false);

  // Function to find course by ID from allCourses
  const findCourseById = useCallback((courseId) => {
    if (!courseId) return null;
    return allCourses.find((course) => course.id === courseId);
  }, []);

  // Function to find course by name from allCourses
  const findCourseByName = useCallback((courseName) => {
    if (!courseName) return null;
    return allCourses.find(
      (course) =>
        course.name.toLowerCase().trim() === courseName.toLowerCase().trim()
    );
  }, []);

  // Memoized initial courses with proper image matching using courseId
  const initialCourses = useMemo(() => {
    // Changed from checking paidAt to checking paid (boolean)
    if (!selectedUser?.generatedPayProId?.paid) return [];

    return (selectedUser.generatedPayProId.selectedCourses || []).map(
      (course) => {
        // First try to match by courseId if available
        let matchingCourse = findCourseById(course.courseId);

        // If no courseId match, try to match by name
        if (!matchingCourse && course.name) {
          matchingCourse = findCourseByName(course.name);
        }

        // Debug logging for WordPress course
        if (
          course.name?.toLowerCase().includes("wordpress") ||
          course.courseId === "wordpress_website_development"
        ) {
          console.log("WordPress course found in initial courses:", {
            name: course.name,
            courseId: course.courseId,
            matchingCourse: matchingCourse,
            imagePath: matchingCourse?.image,
          });
        }

        return {
          name: course.name,
          image: matchingCourse?.image || "",
          lmsCourseId: matchingCourse?.lmsCourseId || "",
          courseId: course.courseId || matchingCourse?.id || "",
          type: "Initial",
        };
      }
    );
  }, [selectedUser, findCourseById, findCourseByName]);

  // Memoized additional courses with proper image matching using courseId
  const additionalCourses = useMemo(() => {
    if (!selectedUser?.additionalCourses_paid_invoice) return [];

    return selectedUser.additionalCourses_paid_invoice.flatMap((invoice) =>
      (invoice.selectedCourses || []).map((course) => {
        // First try to match by courseId if available
        let matchingCourse = findCourseById(course.courseId);

        // If no courseId match, try to match by name
        if (!matchingCourse && course.name) {
          matchingCourse = findCourseByName(course.name);
        }

        // Debug logging for WordPress course
        if (
          course.name?.toLowerCase().includes("wordpress") ||
          course.courseId === "wordpress_website_development"
        ) {
          console.log("WordPress course found in additional courses:", {
            name: course.name,
            courseId: course.courseId,
            matchingCourse: matchingCourse,
            imagePath: matchingCourse?.image,
          });
        }

        return {
          name: course.name,
          image: matchingCourse?.image || "",
          lmsCourseId: matchingCourse?.lmsCourseId || "",
          courseId: course.courseId || matchingCourse?.id || "",
          type: "Additional",
        };
      })
    );
  }, [selectedUser, findCourseById, findCourseByName]);

  // All enrolled courses (initial + additional)
  const allEnrolledCourses = useMemo(() => {
    return [...initialCourses, ...additionalCourses];
  }, [initialCourses, additionalCourses]);

  // Available courses for enrollment (courses not already enrolled)
  const availableCoursesForEnrollment = useMemo(() => {
    const enrolledCourseIds = allEnrolledCourses.map(
      (course) => course.courseId
    );
    return allCourses.filter(
      (course) => !enrolledCourseIds.includes(course.id)
    );
  }, [allEnrolledCourses]);

  // Format date helper function
  const formatDate = useCallback((dateValue) => {
    if (!dateValue) return "—";
    try {
      let date;
      if (dateValue.toDate) {
        date = dateValue.toDate();
      } else if (typeof dateValue === "string") {
        date = new Date(dateValue);
      } else if (typeof dateValue === "number") {
        date = new Date(dateValue);
      } else if (dateValue instanceof Date) {
        date = dateValue;
      } else {
        return "—";
      }
      if (isNaN(date.getTime())) {
        return "—";
      }
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      return isToday
        ? `Today at ${date.toLocaleTimeString()}`
        : date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "—";
    }
  }, []);

  // Fetch users from Firestore
  useEffect(() => {
    const usersRef = collection(firestore, "users");
    const unsubscribe = onSnapshot(
      usersRef,
      (snapshot) => {
        const usersList = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((user) => user && user.id);
        setUsers(usersList);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching users:", err);
        setError("Failed to load users. Please check console.");
        setLoading(false);
        showToast("Failed to load users. Check console for details.", "error");
      }
    );
    return () => unsubscribe();
  }, [showToast]);

  // Fetch courses from Firestore
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const coursesRef = collection(firestore, "courses");
        const snapshot = await getDocs(coursesRef);
        const coursesList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCourses(coursesList);
      } catch (err) {
        console.error("Failed to fetch courses:", err);
      }
    };
    fetchCourses();
  }, []);

  // Filter results based on nested search term
  useEffect(() => {
    if (!nestedSearchTerm) {
      setFilteredResults(results);
      return;
    }
    const term = nestedSearchTerm.toLowerCase();
    const filtered = results.filter((user) => {
      return (
        user?.fullName?.toLowerCase().includes(term) ||
        user?.email?.toLowerCase().includes(term) ||
        user?.mobile?.toLowerCase().includes(term) ||
        user?.cnic?.toLowerCase().includes(term)
      );
    });
    setFilteredResults(filtered);
  }, [nestedSearchTerm, results]);

  // Reset nested search term and filtered results when results change
  useEffect(() => {
    setNestedSearchTerm("");
    setFilteredResults(results);
  }, [results]);

  // Handle search functionality
  const handleSearch = useCallback(async () => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      setResults([]);
      setFilteredResults([]);
      setSelectedUser(null);
      setIsEditProfileModalOpen(false);
      setIsEditCoursesModalOpen(false);
      setError("");
      return;
    }

    setError("");
    setLoading(true);
    setResults([]);
    setFilteredResults([]);
    setSelectedUser(null);

    try {
      const usersRef = collection(firestore, "users");
      const queries = [
        query(
          usersRef,
          where("email", ">=", term),
          where("email", "<=", term + "\uf8ff")
        ),
        query(
          usersRef,
          where("mobile", ">=", term),
          where("mobile", "<=", term + "\uf8ff")
        ),
        query(
          usersRef,
          where("fullName", ">=", term),
          where("fullName", "<=", term + "\uf8ff")
        ),
        query(
          usersRef,
          where("cnic", ">=", term),
          where("cnic", "<=", term + "\uf8ff")
        ),
      ];

      const snapshots = await Promise.all(queries.map((q) => getDocs(q)));
      const merged = {};

      snapshots.forEach((snapshot) => {
        snapshot.forEach((doc) => {
          if (doc.exists()) {
            merged[doc.id] = {
              id: doc.id,
              ...(doc.data() || {}),
            };
          }
        });
      });

      const fetchedUsers = Object.values(merged).filter((u) => u && u.id);
      setResults(fetchedUsers);
      setFilteredResults(fetchedUsers);

      if (fetchedUsers.length === 1) {
        setSelectedUser(fetchedUsers[0]);
        showToast("User found and selected", "success");
      } else if (fetchedUsers.length > 1) {
        showToast(`${fetchedUsers.length} users found. Select one.`, "success");
      } else {
        showToast("No users match your search", "error");
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to search. Please try again.");
      showToast("Failed to search users. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, showToast]);

  // Handle user updates
  const handleUpdateUser = useCallback(
    (updateInfo) => {
      if (!updateInfo) {
        console.error("handleUpdateUser called with undefined updateInfo");
        showToast("Invalid update data", "error");
        return;
      }

      if (updateInfo.type === "courses") {
        setSearchTerm(updateInfo.email);
        handleSearch();
        showToast(
          "User courses updated successfully. Refreshing data...",
          "success"
        );
      } else {
        setSelectedUser((prev) => (prev ? { ...prev, ...updateInfo } : null));
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === updateInfo.id ? { ...user, ...updateInfo } : user
          )
        );
        showToast("User profile updated successfully", "success");
      }
    },
    [showToast, handleSearch]
  );

  // Handle account deletion
  const handleDeleteAccount = useCallback((id) => {
    setUserToDeleteId(id);
    setShowConfirmModal(true);
  }, []);

  const confirmDeleteUser = useCallback(async () => {
    if (!userToDeleteId) return;
    setDeletingUser(true);
    try {
      await deleteDoc(doc(firestore, "users", userToDeleteId));
      showToast(
        `User "${userToDeleteId}" has been permanently removed.`,
        "success"
      );
      setSelectedUser(null);
      setResults((prev) => prev.filter((user) => user.id !== userToDeleteId));
      setFilteredResults((prev) =>
        prev.filter((user) => user.id !== userToDeleteId)
      );
      setSearchTerm("");
    } catch (error) {
      console.error("Error deleting user:", error);
      showToast("Failed to delete user. Please try again.", "error");
    } finally {
      setDeletingUser(false);
      setShowConfirmModal(false);
      setUserToDeleteId(null);
    }
  }, [userToDeleteId, showToast]);

  // Verify user on Thinkific
  const handleVerifyUserOnThinkific = useCallback(async () => {
    if (!selectedUser) {
      showToast("Please select a user first", "error");
      return;
    }
    setVerifyButtonStatus("loading");
    try {
      const response = await fetch("/api/admin/verify-thinkific-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: selectedUser.email,
          userId: selectedUser.user_lms_id,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        // Handle specific error messages
        if (data.error === "Server configuration error") {
          showToast(
            "Thinkific API configuration error. Please contact support.",
            "error"
          );
        } else {
          throw new Error(data.message || data.error || "Verification failed");
        }
      }

      if (data.verified) {
        showToast(
          `User is registered on Thinkific with email ${selectedUser.email}`,
          "success"
        );
        setVerifyButtonStatus("success");
      } else {
        showToast("This user is not registered on Thinkific", "error");
        setVerifyButtonStatus("error");
      }
    } catch (error) {
      console.error("Verification error:", error);
      showToast(error.message || "Failed to verify user on Thinkific", "error");
      setVerifyButtonStatus("error");
    } finally {
      setTimeout(() => {
        if (verifyButtonStatus !== "success") {
          setVerifyButtonStatus("idle");
        }
      }, 3000);
    }
  }, [selectedUser, showToast, verifyButtonStatus]);

  // Create user on Thinkific
  const handleCreateUserOnThinkific = useCallback(async () => {
    if (!selectedUser) {
      showToast("Please select a user first", "error");
      return;
    }

    setCreateButtonStatus("loading");

    try {
      const response = await fetch("/api/admin/create-thinkific-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: {
            email: selectedUser.email,
            password: selectedUser.password,
            fullName:
              selectedUser.fullName || selectedUser.name || "User Account",
            status: selectedUser.status,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.includes("already exists")) {
          showToast("User already has a Thinkific account", "success");
          setCreateButtonStatus("exists");
        } else {
          throw new Error(data.error || "Failed to create account");
        }
      } else {
        showToast("Thinkific account created successfully", "success");

        setSelectedUser((prev) => ({
          ...prev,
          user_lms_id: data.thinkificUserId,
          lms_password: selectedUser.password,
        }));

        setUsers((prevUsers) =>
          prevUsers.map((u) =>
            u.id === selectedUser.id
              ? {
                  ...u,
                  user_lms_id: data.thinkificUserId,
                  lms_password: selectedUser.password,
                }
              : u
          )
        );

        setCreateButtonStatus("success");
      }
    } catch (error) {
      console.error("Creation error:", error);
      showToast(error.message || "Failed to create Thinkific account", "error");
      setCreateButtonStatus("error");
    } finally {
      setTimeout(() => setCreateButtonStatus("idle"), 3000);
    }
  }, [selectedUser, showToast]);

  // Reset Admissions Test
  const handleResetAdmissionsTest = useCallback(async () => {
    if (!selectedUser) {
      showToast("Please select a user first", "error");
      return;
    }

    setResetTestStatus("loading");
    try {
      const userRef = doc(firestore, "users", selectedUser.id);
      await updateDoc(userRef, {
        OnlineTestPercentage: 0,
        status: 2,
      });

      // Update local state
      setSelectedUser((prev) => ({
        ...prev,
        OnlineTestPercentage: 0,
        status: 1,
      }));

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === selectedUser.id
            ? { ...user, OnlineTestPercentage: 0, status: 1 }
            : user
        )
      );

      showToast("Admissions test reset successfully", "success");
      setResetTestStatus("success");
    } catch (error) {
      console.error("Error resetting admissions test:", error);
      showToast("Failed to reset admissions test", "error");
      setResetTestStatus("error");
    } finally {
      setTimeout(() => setResetTestStatus("idle"), 3000);
    }
  }, [selectedUser, showToast]);

  // Render user cards
  const renderUserCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filteredResults
        .filter((user) => user && user.id)
        .map((user) => (
          <div
            key={user.id}
            onClick={() => {
              if (!user) return;
              setSelectedUser(user);
              showToast(`${user.email || "Unnamed user"} selected`, "success");
            }}
            className={`bg-white rounded-xl shadow-md border-2 overflow-hidden transition-all duration-200 cursor-pointer hover:shadow-lg ${
              selectedUser?.id === user.id
                ? "border-yellow-500 shadow-lg ring-2 ring-yellow-500/20"
                : "border-gray-200 hover:border-yellow-500/50"
            }`}
          >
            <div
              className={`p-4 ${
                selectedUser?.id === user.id ? "bg-yellow-500" : "bg-sec2"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center text-white font-bold text-lg">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white truncate">
                    {user.fullName || "Unnamed User"}
                  </h3>
                  <p className="text-xs text-white truncate">
                    {user.email || "No email"}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <FaPhone className="text-gray-400" />
                  <span className="text-gray-700 font-medium truncate">
                    {user.mobile || "—"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FaIdCard className="text-gray-400" />
                  <span className="text-gray-700 font-medium truncate">
                    {user.cnic || "—"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FaCreditCard className="text-gray-400" />
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.PaidAt
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {user.PaidAt ? "Paid" : "Unpaid"}
                  </span>
                </div>
              </div>
            </div>
            {selectedUser?.id === user.id && (
              <div className="bg-yellow-500 text-white text-xs font-medium px-3 py-1 flex items-center justify-center gap-1">
                <FaCheck className="h-3 w-3" />
                Selected
              </div>
            )}
          </div>
        ))}
    </div>
  );

  // Function to get the correct image path without adding extra slashes
  const getImagePath = (imagePath) => {
    if (!imagePath) return "";

    // If the path already starts with http, it's an absolute URL
    if (imagePath.startsWith("http")) {
      return imagePath;
    }

    // If the path already starts with /, use it as is
    if (imagePath.startsWith("/")) {
      return imagePath;
    }

    // Otherwise, add a leading slash
    return `/${imagePath}`;
  };

  // Handle course card click
  const handleCourseClick = (course) => {
    setSelectedCourse(course);
    setIsCoursePopupOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-sec2 px-6 py-8 border-b-2 border-yellow-500">
        <div className="text-center">
          <h1 className="text-3xl text-white font-bold mb-2">
            User Issues Management Panel
          </h1>
          <p className="text-yellow-500">
            Search, manage, and resolve user issues efficiently
          </p>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white px-6 py-6 border-b-2 border-yellow-500">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-gray-800 transition duration-200"
              placeholder="Search by CNIC, full name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <button
            onClick={handleSearch}
            className="w-full sm:w-auto bg-sec2 text-white px-5 py-3 rounded-lg hover:bg-opacity-90 transition flex items-center justify-center gap-2 font-medium shadow-sm border-2 border-yellow-500"
            disabled={loading}
          >
            <FaSearch />
            Search
          </button>
        </div>

        {results.length > 0 && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6">
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <FaFilter className="text-yellow-500" />
              Search Results ({filteredResults.length} of {results.length})
            </h2>
            <div className="relative max-w-md w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaFilter className="text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-gray-800 transition duration-200"
                placeholder="Filter within results..."
                value={nestedSearchTerm}
                onChange={(e) => setNestedSearchTerm(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Search Results Section */}
      <div className="px-6 py-6">
        {loading ? (
          <div className="relative flex items-center justify-center py-4">
            <SearchAnimation />
          </div>
        ) : searchTerm === "" ? (
          <IdleSearchAnimation />
        ) : results.length === 0 ? (
          <NoResultsAnimation />
        ) : filteredResults.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border-2 border-yellow-500 p-8">
            <NoResultsAnimation />
          </div>
        ) : (
          renderUserCards()
        )}
      </div>

      {/* Selected User Details Section */}
      {selectedUser && (
        <div className="bg-sec2 px-6 py-6 border-t-2 border-yellow-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - User Profile & Credentials */}
            <div className="lg:col-span-1 space-y-6">
              {/* User Profile Card */}
              <div className="bg-white rounded-xl shadow-sm border-2 border-yellow-500 overflow-hidden">
                <div className="bg-sec2 p-4 relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center">
                        <FaUserCircle className="text-3xl text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xl text-white">
                          {selectedUser.fullName || "Unnamed User"}
                        </h3>
                        <p className="text-sm text-white">
                          {selectedUser.email || "No email"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border-2 border-white/30">
                        <div className="flex items-center gap-2 text-white">
                          <FaPhone className="text-sm" />
                          <span className="text-sm font-medium">
                            {selectedUser.mobile || "—"}
                          </span>
                        </div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border-2 border-white/30">
                        <div className="flex items-center gap-2 text-white">
                          <FaIdCard className="text-sm" />
                          <span className="text-sm font-medium">
                            {selectedUser.cnic || "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="bg-gray-100 rounded-lg p-3 border-2 border-gray-200">
                      <div className="flex items-center gap-2 text-gray-700">
                        <FaCalendarAlt className="text-sm" />
                        <span className="text-sm font-medium">
                          {selectedUser.created_at
                            ? formatDate(selectedUser.created_at)
                            : "—"}
                        </span>
                      </div>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-3 border-2 border-gray-200">
                      <div className="flex items-center gap-2 text-gray-700">
                        <FaCreditCard className="text-sm" />
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            selectedUser.PaidAt
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {selectedUser.PaidAt ? "Paid" : "Unpaid"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsEditProfileModalOpen(true)}
                    className="w-full bg-sec2 text-white px-4 py-3 rounded-lg hover:bg-opacity-90 transition flex items-center justify-center gap-2 text-sm font-medium shadow-lg border-2 border-yellow-500"
                  >
                    <FaEdit /> Edit Profile
                  </button>
                </div>
              </div>

              {/* Credentials Card */}
              <div className="bg-white rounded-xl shadow-sm border-2 border-yellow-500 overflow-hidden">
                <div className="bg-sec2 p-4 relative overflow-hidden">
                  <div className="relative z-10">
                    <h3 className="font-bold text-xl text-white mb-4 flex items-center gap-2">
                      <FaShieldAlt className="text-yellow-500" />
                      Secure Credentials
                    </h3>

                    <div className="space-y-4">
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border-2 border-white/30">
                        <div className="flex items-center gap-3 text-white">
                          <FaLock className="text-green-400" />
                          <div>
                            <p className="text-xs text-white/70">
                              Web Password
                            </p>
                            <p className="text-sm font-mono text-white">
                              {selectedUser.password || "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border-2 border-white/30">
                        <div className="flex items-center gap-3 text-white">
                          <FaLock className="text-green-400" />
                          <div>
                            <p className="text-xs text-white/70">
                              LMS Password
                            </p>
                            <p className="text-sm font-mono text-white">
                              {selectedUser.password || "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border-2 border-white/30">
                        <div className="flex items-center gap-3 text-white">
                          <FaSchool className="text-blue-400" />
                          <div>
                            <p className="text-xs text-white/70">LMS ID</p>
                            <p className="text-sm font-mono text-white">
                              {selectedUser.user_lms_id || "—"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border-2 border-white/30">
                        <div className="flex items-center gap-3 text-white">
                          <FaUser className="text-purple-400" />
                          <div>
                            <p className="text-xs text-white/70">UID</p>
                            <p className="text-sm font-mono text-white">
                              {selectedUser.uid || "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - User Overview & Actions */}
            <div className="lg:col-span-2 space-y-6">
              {/* User Overview Card with Tabs */}
              <div className="bg-white rounded-xl shadow-sm border-2 border-yellow-500 overflow-hidden">
                <div className="bg-sec2 p-4">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <FaTachometerAlt /> User Overview
                  </h3>
                </div>
                <div className="p-4">
                  {/* Status Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div
                      className={`flex items-center p-4 rounded-lg border-2 ${
                        selectedUser?.OnlineTestPercentage >= 40
                          ? "bg-green-50 text-green-800 border-green-200"
                          : "bg-yellow-50 text-yellow-800 border-yellow-200"
                      }`}
                    >
                      {selectedUser?.OnlineTestPercentage >= 40 ? (
                        <FaCheckCircle className="mr-3 text-xl" />
                      ) : (
                        <FaTimesCircle className="mr-3 text-xl" />
                      )}
                      <div>
                        <p className="font-medium">Admission Test</p>
                        <p className="text-sm">
                          {selectedUser?.OnlineTestPercentage >= 40
                            ? "Passed"
                            : "Not Passed"}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`flex items-center p-4 rounded-lg border-2 ${
                        selectedUser?.generatedPayProId?.paid
                          ? "bg-green-50 text-green-800 border-green-200"
                          : "bg-yellow-50 text-yellow-800 border-yellow-200"
                      }`}
                    >
                      {selectedUser?.generatedPayProId?.paid ? (
                        <FaCheckCircle className="mr-3 text-xl" />
                      ) : (
                        <FaTimesCircle className="mr-3 text-xl" />
                      )}
                      <div>
                        <p className="font-medium">Payment Status</p>
                        <p className="text-sm">
                          {selectedUser?.generatedPayProId?.paid
                            ? "Paid"
                            : "Unpaid"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Tabs */}
                  <div className="mb-6">
                    <div className="border-b-2 border-gray-200">
                      <nav className="-mb-px flex space-x-8">
                        <button
                          onClick={() => setActiveTab("account")}
                          className={`py-2 px-1 border-b-2 text-sm font-medium transition-colors ${
                            activeTab === "account"
                              ? "border-yellow-500 text-yellow-600"
                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <FaCog />
                            <span>Account Actions</span>
                          </div>
                        </button>
                        <button
                          onClick={() => setActiveTab("courses")}
                          className={`py-2 px-1 border-b-2 text-sm font-medium transition-colors ${
                            activeTab === "courses"
                              ? "border-yellow-500 text-yellow-600"
                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <FaGraduationCap />
                            <span>Course Management</span>
                          </div>
                        </button>
                        <button
                          onClick={() => setActiveTab("system")}
                          className={`py-2 px-1 border-b-2 text-sm font-medium transition-colors ${
                            activeTab === "system"
                              ? "border-yellow-500 text-yellow-600"
                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <FaChartLine />
                            <span>System Actions</span>
                          </div>
                        </button>
                      </nav>
                    </div>

                    {/* Tab Content - Account Actions */}
                    {activeTab === "account" && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <h4 className="font-medium text-gray-700 mb-2">
                              Thinkific Account
                            </h4>
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={handleVerifyUserOnThinkific}
                                disabled={
                                  !selectedUser?.email ||
                                  verifyButtonStatus === "loading"
                                }
                                className={`px-4 py-2 rounded-lg transition text-sm font-medium shadow-sm flex items-center gap-2 border-2 ${
                                  !selectedUser?.email ||
                                  verifyButtonStatus === "loading"
                                    ? "bg-gray-400 text-gray-700 cursor-not-allowed border-gray-400"
                                    : verifyButtonStatus === "success"
                                      ? "bg-green-600 text-white cursor-default border-green-600"
                                      : verifyButtonStatus === "error"
                                        ? "bg-red-600 text-white hover:bg-red-700 border-red-600"
                                        : "bg-green-600 text-white hover:bg-green-700 border-green-600"
                                }`}
                              >
                                {verifyButtonStatus === "loading" ? (
                                  <FaSpinner className="animate-spin" />
                                ) : verifyButtonStatus === "success" ? (
                                  <FaCheckCircle />
                                ) : verifyButtonStatus === "error" ? (
                                  <FaExclamationTriangle />
                                ) : (
                                  <FaUserCheck />
                                )}
                                {verifyButtonStatus === "loading"
                                  ? "Verifying..."
                                  : verifyButtonStatus === "success"
                                    ? "Verified"
                                    : verifyButtonStatus === "error"
                                      ? "Verification Failed"
                                      : "Verify on Thinkific"}
                              </button>
                              <button
                                onClick={handleCreateUserOnThinkific}
                                disabled={
                                  !selectedUser?.email ||
                                  createButtonStatus === "loading"
                                }
                                className={`px-4 py-2 rounded-lg transition text-sm font-medium shadow-sm flex items-center gap-2 border-2 ${
                                  !selectedUser?.email ||
                                  createButtonStatus === "loading"
                                    ? "bg-gray-400 text-gray-700 cursor-not-allowed border-gray-400"
                                    : createButtonStatus === "success"
                                      ? "bg-indigo-600 text-white cursor-default border-indigo-600"
                                      : createButtonStatus === "error"
                                        ? "bg-red-600 text-white hover:bg-red-700 border-red-600"
                                        : "bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-600"
                                }`}
                              >
                                {createButtonStatus === "loading" ? (
                                  <FaSpinner className="animate-spin" />
                                ) : createButtonStatus === "success" ? (
                                  <FaCheckCircle />
                                ) : createButtonStatus === "error" ? (
                                  <FaExclamationTriangle />
                                ) : (
                                  <FaUserPlus />
                                )}
                                {createButtonStatus === "loading"
                                  ? "Creating..."
                                  : createButtonStatus === "success"
                                    ? "Created"
                                    : createButtonStatus === "error"
                                      ? "Creation Failed"
                                      : "Create on Thinkific"}
                              </button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h4 className="font-medium text-gray-700 mb-2">
                              Account Management
                            </h4>
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => setIsEditProfileModalOpen(true)}
                                className="px-4 py-2 bg-sec2 text-white rounded-lg hover:bg-opacity-90 transition text-sm font-medium shadow-sm flex items-center gap-2 border-2 border-yellow-500"
                              >
                                <FaEdit /> Edit Profile
                              </button>
                              <button
                                onClick={handleResetAdmissionsTest}
                                disabled={
                                  !selectedUser || resetTestStatus === "loading"
                                }
                                className={`px-4 py-2 rounded-lg transition text-sm font-medium shadow-sm flex items-center gap-2 border-2 ${
                                  !selectedUser || resetTestStatus === "loading"
                                    ? "bg-gray-400 text-gray-700 cursor-not-allowed border-gray-400"
                                    : resetTestStatus === "success"
                                      ? "bg-green-600 text-white cursor-default border-green-600"
                                      : resetTestStatus === "error"
                                        ? "bg-red-600 text-white hover:bg-red-700 border-red-600"
                                        : "bg-orange-600 text-white hover:bg-orange-700 border-orange-600"
                                }`}
                              >
                                {resetTestStatus === "loading" ? (
                                  <FaSpinner className="animate-spin" />
                                ) : resetTestStatus === "success" ? (
                                  <FaCheckCircle />
                                ) : resetTestStatus === "error" ? (
                                  <FaExclamationTriangle />
                                ) : (
                                  <FaRedo />
                                )}
                                {resetTestStatus === "loading"
                                  ? "Resetting..."
                                  : resetTestStatus === "success"
                                    ? "Reset"
                                    : resetTestStatus === "error"
                                      ? "Reset Failed"
                                      : "Reset Admissions Test"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tab Content - Course Management */}
                    {activeTab === "courses" && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <h4 className="font-medium text-gray-700 mb-2">
                              Course Enrollment
                            </h4>
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => setIsEditCoursesModalOpen(true)}
                                className="px-4 py-2 bg-sec2 text-white rounded-lg hover:bg-opacity-90 transition text-sm font-medium shadow-sm flex items-center gap-2 border-2 border-yellow-500"
                              >
                                <FaUsersCog /> Manage Courses
                              </button>
                              <button
                                onClick={() =>
                                  setIsManualEnrollmentModalOpen(true)
                                }
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium shadow-sm flex items-center gap-2 border-2 border-green-600"
                              >
                                <FaPlus /> Manual Enrollment
                              </button>
                              <button
                                onClick={() =>
                                  setIsManualUnenrollmentModalOpen(true)
                                }
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium shadow-sm flex items-center gap-2 border-2 border-red-600"
                              >
                                <FaTimesCircle /> Manual Unenrollment
                              </button>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h4 className="font-medium text-gray-700 mb-2">
                              Payment Actions
                            </h4>
                            <div className="flex flex-col gap-2">
                              <GeneratePSIDButton
                                user={selectedUser}
                                onUpdateSuccess={(updatedUser) => {
                                  setSelectedUser(updatedUser);
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tab Content - System Actions */}
                    {activeTab === "system" && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-700 mb-2">
                            System Administration
                          </h4>
                          <div className="flex flex-col gap-2 max-w-xs">
                            <button
                              onClick={() =>
                                handleDeleteAccount(selectedUser.id)
                              }
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium shadow-sm flex items-center gap-2 border-2 border-red-600"
                            >
                              <FaTrashAlt /> Delete Account
                            </button>
                            <p className="text-xs text-gray-500">
                              Warning: This action cannot be undone and will
                              permanently remove user from system.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Payment Information Card */}
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
                    <h4 className="font-medium text-yellow-800 mb-3 flex items-center gap-2">
                      <FaMoneyBill className="text-yellow-600" />
                      Initial Payment via PayPro
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white rounded-md p-3 shadow-sm border-2 border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            Consumer Number:
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {selectedUser.generatedPayProId?.consumerNumber ||
                              "Not Generated"}
                          </span>
                        </div>
                      </div>
                      <div className="bg-white rounded-md p-3 shadow-sm border-2 border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            Invoice ID:
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {selectedUser.generatedPayProId?.invoiceNumber ||
                              "Not Registered"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enrollment Details Card with Compact Course Cards */}
              <div className="bg-white rounded-xl shadow-sm border-2 border-yellow-500 overflow-hidden">
                <div className="bg-sec2 p-4">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <FaGraduationCap /> Enrollment Details
                  </h3>
                </div>
                <div className="p-4">
                  {initialCourses.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-700 flex items-center gap-2">
                          <span className="w-3 h-3 bg-green-600 rounded-full"></span>
                          Initial Courses ({initialCourses.length})
                        </h4>
                      </div>
                      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                        {initialCourses.map((course, index) => (
                          <div
                            key={`initial-${index}`}
                            onClick={() => handleCourseClick(course)}
                            className="relative group cursor-pointer"
                          >
                            <div className="h-20 rounded-lg overflow-hidden shadow-sm border-2 border-gray-200 transition-all duration-300 group-hover:shadow-lg bg-gray-100">
                              <img
                                src={getImagePath(course.image)}
                                alt={course.name}
                                className="w-full h-full"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  e.target.parentElement.classList.add(
                                    "bg-gray-200"
                                  );
                                  e.target.parentElement.innerHTML = `
                                    <div class="w-full h-full flex items-center justify-center p-1">
                                      <p class="text-gray-600 text-xs font-medium text-center">
                                        ${course.name.substring(0, 15)}${course.name.length > 15 ? "..." : ""}
                                      </p>
                                    </div>
                                  `;
                                }}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all"></div>
                              <div className="absolute top-1 left-1 text-xs px-1 py-0.5 rounded text-white bg-green-600">
                                Initial
                              </div>
                              <div className="absolute bottom-1 right-1 text-xs px-1 py-0.5 rounded text-white bg-black bg-opacity-70">
                                <FaInfoCircle />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {additionalCourses.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-700 flex items-center gap-2">
                          <span className="w-3 h-3 bg-blue-600 rounded-full"></span>
                          Additional Courses ({additionalCourses.length})
                        </h4>
                      </div>
                      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                        {additionalCourses.map((course, index) => (
                          <div
                            key={`additional-${index}`}
                            onClick={() => handleCourseClick(course)}
                            className="relative group cursor-pointer"
                          >
                            <div className="h-20 rounded-lg overflow-hidden shadow-sm border-2 border-gray-200 transition-all duration-300 group-hover:shadow-lg bg-gray-100">
                              <img
                                src={getImagePath(course.image)}
                                alt={course.name}
                                className="w-full h-full"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  e.target.parentElement.classList.add(
                                    "bg-gray-200"
                                  );
                                  e.target.parentElement.innerHTML = `
                                    <div class="w-full h-full flex items-center justify-center p-1">
                                      <p class="text-gray-600 text-xs font-medium text-center">
                                        ${course.name.substring(0, 15)}${course.name.length > 15 ? "..." : ""}
                                      </p>
                                    </div>
                                  `;
                                }}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all"></div>
                              <div className="absolute top-1 left-1 text-xs px-1 py-0.5 rounded text-white bg-blue-600">
                                Additional
                              </div>
                              <div className="absolute bottom-1 right-1 text-xs px-1 py-0.5 rounded text-white bg-black bg-opacity-70">
                                <FaInfoCircle />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {initialCourses.length === 0 &&
                    additionalCourses.length === 0 && (
                      <div className="text-center py-8">
                        <FaBook className="mx-auto text-gray-300 text-4xl mb-3" />
                        <p className="text-gray-500">No enrolled courses</p>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-auto border-2 border-yellow-500">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              Confirm Deletion
            </h3>
            <p className="text-gray-700 text-sm mb-6">
              Are you sure you want to delete user "
              <span className="font-semibold">{userToDeleteId}</span>"? This
              action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setUserToDeleteId(null);
                  showToast("User deletion cancelled.", "success");
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteUser}
                disabled={deletingUser}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center text-sm"
              >
                {deletingUser ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  "Delete Permanently"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        user={selectedUser}
        onUpdateSuccess={handleUpdateUser}
      />
      {selectedUser && (
        <EditCoursesModal
          isOpen={isEditCoursesModalOpen}
          onClose={() => setIsEditCoursesModalOpen(false)}
          user={selectedUser}
          allCourses={courses}
          onUpdateSuccess={handleUpdateUser}
        />
      )}
      {selectedUser && (
        <ManualEnrollmentModal
          isOpen={isManualEnrollmentModalOpen}
          onClose={() => setIsManualEnrollmentModalOpen(false)}
          user={selectedUser}
          availableCourses={availableCoursesForEnrollment}
          onUpdateSuccess={handleUpdateUser}
        />
      )}
      {selectedUser && (
        <ManualUnenrollmentModal
          isOpen={isManualUnenrollmentModalOpen}
          onClose={() => setIsManualUnenrollmentModalOpen(false)}
          user={selectedUser}
          enrolledCourses={allEnrolledCourses}
          onUpdateSuccess={handleUpdateUser}
        />
      )}
      <CourseDetailPopup
        isOpen={isCoursePopupOpen}
        onClose={() => setIsCoursePopupOpen(false)}
        course={selectedCourse}
      />
    </div>
  );
};

// Main IssuesView Component
export default function IssuesView() {
  return (
    <AdminProtectedRoutes>
      <SidebarWrapper>
        <Suspense
          fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="flex items-center gap-2 text-yellow-500">
                <FaSpinner className="animate-spin text-2xl" />
                <span>Loading User Management Dashboard...</span>
              </div>
            </div>
          }
        >
          <IssuesViewContent />
        </Suspense>
      </SidebarWrapper>
    </AdminProtectedRoutes>
  );
}
