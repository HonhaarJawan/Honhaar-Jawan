"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  Suspense,
} from "react";
import { firestore } from "@/Backend/Firebase";
import { useToast } from "@/components/primary/Toast";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
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
  FaPhone,
  FaIdCard,
  FaCalendarAlt,
  FaLock,
  FaSchool,
  FaInfoCircle,
  FaUserCircle,
  FaShieldAlt,
  FaChartLine,
  FaBook,
} from "react-icons/fa";
import EditProfileModal from "@/adminComponents/EditProfileModal";
import EditCoursesModal from "@/adminComponents/EditCoursesModal";
import SidebarWrapper from "@/adminComponents/SidebarWrapper";
import AdminProtectedRoutes from "@/ProtectedRoutes/AdminProtectedRoutes";
import GeneratePSIDButton from "@/adminComponents/reversePayment/button";
import { courses as allCourses } from "@/Data/Data";

/* ────────────────────────────────────────────────────────────────────────── */
/* Small UI pieces                                                           */
/* ────────────────────────────────────────────────────────────────────────── */

const LoadingGlow = () => (
  <div className="flex items-center justify-center py-8">
    <div className="relative h-12 w-12">
      <div className="absolute inset-0 rounded-full border-4 border-white/20" />
      <div className="absolute inset-0 rounded-full border-4 border-yellow-500 border-t-transparent animate-spin" />
    </div>
  </div>
);

const IdleSearchHint = () => (
  <div className="flex items-center justify-center py-12">
    <div className="bg-white/5 border border-white/20 rounded-xl px-6 py-5 text-center backdrop-blur-sm">
      <div className="mx-auto mb-3 h-10 w-10 rounded-full border border-yellow-500 flex items-center justify-center">
        <FaSearch className="text-white" />
      </div>
      <p className="text-white/90 font-medium">Start by searching a user</p>
      <p className="text-white/70 text-sm mt-1">
        Try name, email, phone or CNIC
      </p>
    </div>
  </div>
);

const EmptyResults = () => (
  <div className="flex items-center justify-center py-12">
    <div className="bg-white/5 border border-yellow-500 rounded-xl px-6 py-5 text-center">
      <p className="text-white font-semibold">No users found</p>
      <p className="text-white/70 text-sm mt-1">
        Try refining your search query
      </p>
    </div>
  </div>
);

/* ────────────────────────────────────────────────────────────────────────── */
/* Course Detail Popup                                                       */
/* ────────────────────────────────────────────────────────────────────────── */

const CourseDetailPopup = ({ isOpen, onClose, course }) => {
  if (!isOpen || !course) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-xl border-2 border-yellow-500 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 rounded-md border border-yellow-500 text-black px-2 py-1 hover:bg-yellow-500 hover:text-black transition"
        >
          Close
        </button>

        <div className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-black/5 border border-black/10">
              <img
                src={
                  course.image
                    ? course.image.startsWith("http")
                      ? course.image
                      : `/${course.image}`
                    : ""
                }
                alt={course.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const el = e.currentTarget;
                  el.style.display = "none";
                  const parent = el.parentElement;
                  if (parent) {
                    parent.classList.add("bg-black/5");
                    parent.innerHTML = `
                      <div class="w-full h-full flex items-center justify-center p-2">
                        <p class="text-xs text-black/70 font-medium text-center">${course.name}</p>
                      </div>
                    `;
                  }
                }}
              />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-black truncate">
                {course.name}
              </h3>
              <span className="text-[11px] inline-block mt-1 px-2 py-1 rounded-full border border-yellow-500 text-black">
                {course.type || "Course"}
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-black/70">Course ID</span>
              <span className="font-medium text-black">
                {course.courseId || "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-black/70">LMS ID</span>
              <span className="font-medium text-black">
                {course.lmsCourseId || "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-black/70">Status</span>
              <span className="font-medium text-black">Active</span>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-black/20 hover:border-yellow-500 transition text-black"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────────────── */
/* Manual Enrollment / Unenrollment                                          */
/* ────────────────────────────────────────────────────────────────────────── */

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

  const toggleCourse = (course) => {
    setSelectedCourses((prev) => {
      const isSelected = prev.some((c) => c.id === course.id);
      return isSelected
        ? prev.filter((c) => c.id !== course.id)
        : [...prev, course];
    });
  };

  const handleEnroll = async () => {
    if (selectedCourses.length === 0) {
      setError("Select at least one course");
      showToast("Select at least one course", "error");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        "/api/admin/enrollment-routes/manual-enrollment",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            userEmail: user.email,
            userLmsId: user.user_lms_id,
            courses: selectedCourses.map((c) => ({
              courseId: c.id,
              name: c.name,
              lmsCourseId: c.lmsCourseId,
            })),
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      onUpdateSuccess?.({
        type: "courses",
        email: user.email,
        id: user.id,
        updatedCourses: { enrolledCourses: selectedCourses },
      });

      showToast(`Enrolled in ${selectedCourses.length} course(s)`, "success");
      setSelectedCourses([]);
      onClose();
    } catch (e) {
      setError(e?.message || "Unexpected error");
      showToast(e?.message || "Unexpected error", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl rounded-xl border-2 border-yellow-500">
        <div className="p-5">
          <h2 className="text-xl font-semibold text-black">
            Manual Course Enrollment
          </h2>
          <p className="text-black/70 text-sm mt-1">
            Enroll {user.fullName} ({user.email}) in additional courses
          </p>

          <div className="mt-5 max-h-[52vh] overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {availableCourses.map((course) => {
                const active = selectedCourses.some((c) => c.id === course.id);
                return (
                  <button
                    key={course.id}
                    onClick={() => toggleCourse(course)}
                    className={`text-left rounded-lg p-3 border-2 transition ${
                      active
                        ? "border-yellow-500 bg-yellow-500/10"
                        : "border-black/10 hover:border-yellow-500"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`h-4 w-4 rounded border-2 flex items-center justify-center mt-1 ${
                          active ? "border-yellow-500" : "border-black/30"
                        }`}
                      >
                        {active && (
                          <FaCheck className="text-[10px] text-black" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-black truncate">
                          {course.name}
                        </p>
                        <p className="text-xs text-black/60 mt-1">
                          ID: {course.lmsCourseId || course.id}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="mt-4 p-2 rounded border border-yellow-500 text-black text-sm bg-yellow-500/10">
              {error}
            </div>
          )}

          <div className="mt-5 flex items-center justify-between">
            <span className="text-sm text-black/70">
              {selectedCourses.length} course(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 rounded border border-black/20 hover:border-yellow-500 transition text-black"
              >
                Cancel
              </button>
              <button
                onClick={handleEnroll}
                disabled={isLoading || selectedCourses.length === 0}
                className="px-4 py-2 rounded border-2 border-yellow-500 bg-yellow-500 text-black font-medium disabled:opacity-60"
              >
                {isLoading ? "Processing..." : "Enroll"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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

  const toggleCourse = (course) => {
    setSelectedCourses((prev) => {
      const isSelected = prev.some((c) => c.courseId === course.courseId);
      return isSelected
        ? prev.filter((c) => c.courseId !== course.courseId)
        : [...prev, course];
    });
  };

  const handleUnenroll = async () => {
    if (selectedCourses.length === 0) {
      setError("Select at least one course");
      showToast("Select at least one course", "error");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        "/api/admin/enrollment-routes/manual-unenrollment",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            userEmail: user.email,
            userLmsId: user.user_lms_id,
            courses: selectedCourses.map((c) => ({
              courseId: c.courseId,
              name: c.name,
              lmsCourseId: c.lmsCourseId,
            })),
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      onUpdateSuccess?.({
        type: "courses",
        email: user.email,
        id: user.id,
        updatedCourses: { unenrolledCourses: selectedCourses },
      });

      showToast(
        `Unenrolled from ${selectedCourses.length} course(s)`,
        "success"
      );
      setSelectedCourses([]);
      onClose();
    } catch (e) {
      setError(e?.message || "Unexpected error");
      showToast(e?.message || "Unexpected error", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl rounded-xl border-2 border-yellow-500">
        <div className="p-5">
          <h2 className="text-xl font-semibold text-black">
            Manual Course Unenrollment
          </h2>
          <p className="text-black/70 text-sm mt-1">
            Unenroll {user.fullName} ({user.email}) from selected courses
          </p>

          <div className="mt-5 max-h-[52vh] overflow-y-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {enrolledCourses.map((course) => {
                const active = selectedCourses.some(
                  (c) => c.courseId === course.courseId
                );
                return (
                  <button
                    key={course.courseId}
                    onClick={() => toggleCourse(course)}
                    className={`text-left rounded-lg p-3 border-2 transition ${
                      active
                        ? "border-yellow-500 bg-yellow-500/10"
                        : "border-black/10 hover:border-yellow-500"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`h-4 w-4 rounded border-2 flex items-center justify-center mt-1 ${
                          active ? "border-yellow-500" : "border-black/30"
                        }`}
                      >
                        {active && (
                          <FaCheck className="text-[10px] text-black" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-black truncate">
                          {course.name}
                        </p>
                        <p className="text-xs text-black/60 mt-1">
                          ID: {course.lmsCourseId || course.courseId}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="mt-4 p-2 rounded border border-yellow-500 text-black text-sm bg-yellow-500/10">
              {error}
            </div>
          )}

          <div className="mt-5 flex items-center justify-between">
            <span className="text-sm text-black/70">
              {selectedCourses.length} course(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 rounded border border-black/20 hover:border-yellow-500 transition text-black"
              >
                Cancel
              </button>
              <button
                onClick={handleUnenroll}
                disabled={isLoading || selectedCourses.length === 0}
                className="px-4 py-2 rounded border-2 border-yellow-500 bg-yellow-500 text-black font-medium disabled:opacity-60"
              >
                {isLoading ? "Processing..." : "Unenroll"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────────────── */
/* Main Content                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

const IssuesViewContent = () => {
  const { showToast } = useToast();

  // Data
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);

  // Search
  const [searchTerm, setSearchTerm] = useState("");
  const [nestedSearchTerm, setNestedSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Selection
  const [selectedUser, setSelectedUser] = useState(null);

  // UI
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("account");

  // Modals
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isEditCoursesModalOpen, setIsEditCoursesModalOpen] = useState(false);
  const [isManualEnrollmentModalOpen, setIsManualEnrollmentModalOpen] =
    useState(false);
  const [isManualUnenrollmentModalOpen, setIsManualUnenrollmentModalOpen] =
    useState(false);

  // Delete
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userToDeleteId, setUserToDeleteId] = useState(null);
  const [deletingUser, setDeletingUser] = useState(false);

  // Thinkific controls
  const [verifyButtonStatus, setVerifyButtonStatus] = useState("idle");
  const [createButtonStatus, setCreateButtonStatus] = useState("idle");
  const [resetTestStatus, setResetTestStatus] = useState("idle");

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isCoursePopupOpen, setIsCoursePopupOpen] = useState(false);

  // Helpers to reconcile course data with images/IDs from allCourses
  const findCourseById = useCallback(
    (courseId) => allCourses.find((c) => c.id === courseId),
    []
  );
  const findCourseByName = useCallback(
    (courseName) =>
      allCourses.find(
        (c) =>
          !!courseName &&
          c.name.toLowerCase().trim() === courseName.toLowerCase().trim()
      ),
    []
  );

  const initialCourses = useMemo(() => {
    if (!selectedUser?.generatedPayProId?.paid) return [];
    return (selectedUser.generatedPayProId.selectedCourses || []).map(
      (course) => {
        let match = findCourseById(course.courseId);
        if (!match && course.name) match = findCourseByName(course.name);
        return {
          name: course.name,
          image: match?.image || "",
          lmsCourseId: match?.lmsCourseId || "",
          courseId: course.courseId || match?.id || "",
          type: "Initial",
        };
      }
    );
  }, [selectedUser, findCourseById, findCourseByName]);

  const additionalCourses = useMemo(() => {
    if (!selectedUser?.additionalCourses_paid_invoice) return [];
    return selectedUser.additionalCourses_paid_invoice.flatMap((invoice) =>
      (invoice.selectedCourses || []).map((course) => {
        let match = findCourseById(course.courseId);
        if (!match && course.name) match = findCourseByName(course.name);
        return {
          name: course.name,
          image: match?.image || "",
          lmsCourseId: match?.lmsCourseId || "",
          courseId: course.courseId || match?.id || "",
          type: "Additional",
        };
      })
    );
  }, [selectedUser, findCourseById, findCourseByName]);

  const allEnrolledCourses = useMemo(
    () => [...initialCourses, ...additionalCourses],
    [initialCourses, additionalCourses]
  );

  const availableCoursesForEnrollment = useMemo(() => {
    const enrolledIds = allEnrolledCourses.map((c) => c.courseId);
    return allCourses.filter((c) => !enrolledIds.includes(c.id));
  }, [allEnrolledCourses]);

  const formatDate = useCallback((dateValue) => {
    if (!dateValue) return "—";
    try {
      let date;
      if (dateValue?.toDate) date = dateValue.toDate();
      else if (typeof dateValue === "string") date = new Date(dateValue);
      else if (typeof dateValue === "number") date = new Date(dateValue);
      else if (dateValue instanceof Date) date = dateValue;
      else return "—";
      if (isNaN(date.getTime())) return "—";
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
    } catch {
      return "—";
    }
  }, []);

  // Firestore listeners
  useEffect(() => {
    const usersRef = collection(firestore, "users");
    const unsub = onSnapshot(
      usersRef,
      (snapshot) => {
        const usersList = snapshot.docs
          .map((d) => ({ id: d.id, ...(d.data() || {}) }))
          .filter((u) => u && u.id);
        setUsers(usersList);
      },
      (err) => {
        console.error("Error fetching users:", err);
        setError("Failed to load users. See console.");
        showToast("Failed to load users. See console.", "error");
      }
    );
    return () => unsub();
  }, [showToast]);

  useEffect(() => {
    (async () => {
      try {
        const coursesRef = collection(firestore, "courses");
        const snapshot = await getDocs(coursesRef);
        setCourses(
          snapshot.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }))
        );
      } catch (err) {
        console.error("Failed to fetch courses:", err);
      }
    })();
  }, []);

  // Filtering pipeline
  useEffect(() => {
    if (!nestedSearchTerm) {
      setFilteredResults(results);
      return;
    }
    const t = nestedSearchTerm.toLowerCase();
    setFilteredResults(
      results.filter(
        (u) =>
          u?.fullName?.toLowerCase().includes(t) ||
          u?.email?.toLowerCase().includes(t) ||
          u?.mobile?.toLowerCase().includes(t) ||
          u?.cnic?.toLowerCase().includes(t)
      )
    );
  }, [nestedSearchTerm, results]);

  useEffect(() => {
    setNestedSearchTerm("");
    setFilteredResults(results);
  }, [results]);

  const handleSearch = useCallback(async () => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      setResults([]);
      setFilteredResults([]);
      setSelectedUser(null);
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
      const queriesToRun = [
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

      const snapshots = await Promise.all(queriesToRun.map((q) => getDocs(q)));
      const merged = {};
      snapshots.forEach((snap) =>
        snap.forEach((d) => {
          if (d.exists()) merged[d.id] = { id: d.id, ...(d.data() || {}) };
        })
      );
      const fetched = Object.values(merged).filter((u) => u && u.id);
      setResults(fetched);
      setFilteredResults(fetched);

      if (fetched.length === 1) {
        setSelectedUser(fetched[0]);
        showToast("User found & selected", "success");
      } else if (fetched.length > 1) {
        showToast(`${fetched.length} users found. Select one.`, "success");
      } else {
        showToast("No users match your search", "error");
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to search. Try again.");
      showToast("Failed to search users. Try again.", "error");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, showToast]);

  const handleUpdateUser = useCallback(
    (updateInfo) => {
      if (!updateInfo) {
        showToast("Invalid update data", "error");
        return;
      }
      if (updateInfo.type === "courses") {
        setSearchTerm(updateInfo.email);
        handleSearch();
        showToast("Courses updated. Refreshing…", "success");
      } else {
        setSelectedUser((prev) => (prev ? { ...prev, ...updateInfo } : null));
        setUsers((prev) =>
          prev.map((u) =>
            u.id === updateInfo.id ? { ...u, ...updateInfo } : u
          )
        );
        showToast("User profile updated", "success");
      }
    },
    [handleSearch, showToast]
  );

  // Delete flow
  const handleDeleteAccount = useCallback((id) => {
    setUserToDeleteId(id);
    setShowConfirmModal(true);
  }, []);

  const confirmDeleteUser = useCallback(async () => {
    if (!userToDeleteId) return;
    setDeletingUser(true);
    try {
      await deleteDoc(doc(firestore, "users", userToDeleteId));
      showToast(`User "${userToDeleteId}" removed.`, "success");
      setSelectedUser(null);
      setResults((prev) => prev.filter((u) => u.id !== userToDeleteId));
      setFilteredResults((prev) => prev.filter((u) => u.id !== userToDeleteId));
      setSearchTerm("");
    } catch (err) {
      console.error("Error deleting:", err);
      showToast("Failed to delete user.", "error");
    } finally {
      setDeletingUser(false);
      setShowConfirmModal(false);
      setUserToDeleteId(null);
    }
  }, [userToDeleteId, showToast]);

  // Thinkific
  const handleVerifyUserOnThinkific = useCallback(async () => {
    if (!selectedUser) {
      showToast("Select a user first", "error");
      return;
    }
    setVerifyButtonStatus("loading");
    try {
      const res = await fetch("/api/admin/verify-thinkific-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: selectedUser.email,
          userId: selectedUser.user_lms_id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "Server configuration error") {
          showToast("Thinkific API configuration error.", "error");
        } else {
          throw new Error(data.message || data.error || "Verification failed");
        }
      }
      if (data.verified) {
        showToast(
          `User registered on Thinkific (${selectedUser.email})`,
          "success"
        );
        setVerifyButtonStatus("success");
      } else {
        showToast("User not found on Thinkific", "error");
        setVerifyButtonStatus("error");
      }
    } catch (e) {
      showToast(e?.message || "Verification error", "error");
      setVerifyButtonStatus("error");
    } finally {
      setTimeout(() => {
        if (verifyButtonStatus !== "success") setVerifyButtonStatus("idle");
      }, 3000);
    }
  }, [selectedUser, showToast, verifyButtonStatus]);

  const handleCreateUserOnThinkific = useCallback(async () => {
    if (!selectedUser) {
      showToast("Select a user first", "error");
      return;
    }
    setCreateButtonStatus("loading");
    try {
      const res = await fetch("/api/admin/create-thinkific-user", {
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
      const data = await res.json();
      if (!res.ok) {
        if (data.error?.includes("already exists")) {
          showToast("User already has a Thinkific account", "success");
          setCreateButtonStatus("exists");
        } else {
          throw new Error(data.error || "Failed to create account");
        }
      } else {
        showToast("Thinkific account created", "success");
        setSelectedUser((prev) => ({
          ...prev,
          user_lms_id: data.thinkificUserId,
          lms_password: selectedUser.password,
        }));
        setUsers((prev) =>
          prev.map((u) =>
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
    } catch (e) {
      showToast(e?.message || "Creation error", "error");
      setCreateButtonStatus("error");
    } finally {
      setTimeout(() => setCreateButtonStatus("idle"), 3000);
    }
  }, [selectedUser, showToast]);

  const handleResetAdmissionsTest = useCallback(async () => {
    if (!selectedUser) {
      showToast("Select a user first", "error");
      return;
    }
    setResetTestStatus("loading");
    try {
      await updateDoc(doc(firestore, "users", selectedUser.id), {
        OnlineTestPercentage: 0,
        status: 2,
      });
      setSelectedUser((prev) => ({
        ...prev,
        OnlineTestPercentage: 0,
        status: 1,
      }));
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id
            ? { ...u, OnlineTestPercentage: 0, status: 1 }
            : u
        )
      );
      showToast("Admissions test reset", "success");
      setResetTestStatus("success");
    } catch (e) {
      showToast("Failed to reset test", "error");
      setResetTestStatus("error");
    } finally {
      setTimeout(() => setResetTestStatus("idle"), 3000);
    }
  }, [selectedUser, showToast]);

  // Utility
  const getImagePath = (p) => {
    if (!p) return "";
    if (p.startsWith("http")) return p;
    if (p.startsWith("/")) return p;
    return `/${p}`;
  };

  const openCourse = (course) => {
    setSelectedCourse(course);
    setIsCoursePopupOpen(true);
  };

  /* ── Renderers ───────────────────────────────────────────────────────── */

  // People Rail
  const renderPeopleRail = () => (
    <div className="h-[calc(100vh-160px)] overflow-y-auto pr-2 snap-y">
      {filteredResults
        .filter((u) => u && u.id)
        .map((u) => {
          const active = selectedUser?.id === u.id;
          return (
            <button
              key={u.id}
              onClick={() => {
                setSelectedUser(u);
                showToast(`${u.email || "User"} selected`, "success");
              }}
              className={`w-full text-left mb-3 snap-start rounded-xl p-3 bg-white/5 backdrop-blur-sm transition
                ${active ? "border-2 border-yellow-500" : "border border-white/20 hover:border-yellow-500"}`}
            >
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-white/10 flex items-center justify-center">
                  <FaUserCircle className="text-white text-xl" />
                </div>
                <div className="min-w-0">
                  <p className="text-white font-medium truncate">
                    {u.fullName || "Unnamed User"}
                  </p>
                  <p className="text-white/70 text-sm truncate">
                    {u.email || "—"}
                  </p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded border border-white/20 px-2 py-1 text-white/80 truncate flex items-center gap-1">
                  <FaPhone className="opacity-70" />
                  <span className="truncate">{u.mobile || "—"}</span>
                </div>
                <div className="rounded border border-white/20 px-2 py-1 text-white/80 truncate flex items-center gap-1">
                  <FaIdCard className="opacity-70" />
                  <span className="truncate">{u.cnic || "—"}</span>
                </div>
                <div
                  className={`rounded px-2 py-1 truncate flex items-center gap-2 ${
                    u.PaidAt
                      ? "border-2 border-yellow-500 text-white"
                      : "border border-white/20 text-white/80"
                  }`}
                >
                  <FaMoneyBill className="opacity-80" />
                  <span className="truncate">
                    {u.PaidAt ? "Paid" : "Unpaid"}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
    </div>
  );

  const renderInspectorHeader = () => {
    if (!selectedUser) return null;
    return (
      <div className="rounded-xl bg-white/5 border border-white/20 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-white/10 flex items-center justify-center">
              <FaUserCircle className="text-white text-3xl" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">
                {selectedUser.fullName || "Unnamed User"}
              </h3>
              <p className="text-white/80 text-sm">
                {selectedUser.email || "—"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsEditProfileModalOpen(true)}
            className="rounded-md px-3 py-2 border-2 border-yellow-500 text-black bg-yellow-500 font-medium"
          >
            <span className="inline-flex items-center gap-2">
              <FaEdit /> Edit Profile
            </span>
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <div className="rounded border border-white/20 px-3 py-2 text-white/80 flex items-center gap-2">
            <FaPhone className="opacity-80" />
            <span className="truncate">{selectedUser.mobile || "—"}</span>
          </div>
          <div className="rounded border border-white/20 px-3 py-2 text-white/80 flex items-center gap-2">
            <FaIdCard className="opacity-80" />
            <span className="truncate">{selectedUser.cnic || "—"}</span>
          </div>
          <div className="rounded border border-white/20 px-3 py-2 text-white/80 flex items-center gap-2">
            <FaCalendarAlt className="opacity-80" />
            <span className="truncate">
              {selectedUser.created_at
                ? formatDate(selectedUser.created_at)
                : "—"}
            </span>
          </div>
          <div
            className={`rounded px-3 py-2 flex items-center gap-2 ${
              selectedUser.PaidAt
                ? "border-2 border-yellow-500 text-white"
                : "border border-white/20 text-white/80"
            }`}
          >
            <FaMoneyBill className="opacity-80" />
            <span className="truncate">
              {selectedUser.PaidAt ? "Paid" : "Unpaid"}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderStatusStrip = () => {
    if (!selectedUser) return null;
    const passed = selectedUser?.OnlineTestPercentage >= 40;
    const paid = !!selectedUser?.generatedPayProId?.paid;

    const Pill = ({ ok, title, sub }) => (
      <div
        className={`rounded-lg p-3 border ${
          ok ? "border-2 border-yellow-500" : "border border-white/20"
        } text-white`}
      >
        <div className="flex items-center gap-2">
          {ok ? <FaCheckCircle /> : <FaTimesCircle />}
          <div>
            <p className="font-medium leading-tight">{title}</p>
            <p className="text-xs text-white/80">{sub}</p>
          </div>
        </div>
      </div>
    );

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Pill
          ok={passed}
          title="Admission Test"
          sub={passed ? "Passed" : "Not Passed"}
        />
        <Pill ok={paid} title="Payment Status" sub={paid ? "Paid" : "Unpaid"} />
      </div>
    );
  };

  const renderCourses = () => {
    const Card = ({ tag, tagTitle, items }) =>
      items.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-white/90 font-medium inline-flex items-center gap-2">
              <span
                className={`inline-block h-2.5 w-2.5 rounded-full border ${
                  tag === "initial" ? "border-yellow-500" : "border-white"
                }`}
              />
              {tagTitle} ({items.length})
            </h4>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
            {items.map((course, idx) => (
              <button
                key={`${tag}-${idx}`}
                onClick={() => openCourse(course)}
                className="group relative h-20 rounded-lg overflow-hidden border border-white/20 hover:border-yellow-500 bg-white/5"
                title={course.name}
              >
                <img
                  src={getImagePath(course.image)}
                  alt={course.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const el = e.currentTarget;
                    el.style.display = "none";
                    const parent = el.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                      <div class="w-full h-full flex items-center justify-center p-1">
                        <p class="text-[11px] text-white/80 text-center">${course.name.substring(0, 16)}${
                          course.name.length > 16 ? "..." : ""
                        }</p>
                      </div>`;
                    }
                  }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition" />
                <div className="absolute top-1 left-1 text-[10px] px-1.5 py-0.5 rounded border border-yellow-500 bg-yellow-500 text-black">
                  {tag === "initial" ? "Initial" : "Additional"}
                </div>
                <div className="absolute bottom-1 right-1 text-xs text-white/90">
                  <FaInfoCircle />
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : null;

    if (!selectedUser) return null;

    return (
      <div className="rounded-xl bg-white/5 border border-white/20 p-4">
        <div className="flex items-center gap-2 text-white font-semibold mb-3">
          <FaGraduationCap />
          <span>Enrollment Details</span>
        </div>

        {initialCourses.length === 0 && additionalCourses.length === 0 ? (
          <div className="text-center py-10">
            <FaBook className="mx-auto text-white/40 text-4xl mb-3" />
            <p className="text-white/80">No enrolled courses</p>
          </div>
        ) : (
          <div className="space-y-6">
            <Card
              tag="initial"
              tagTitle="Initial Courses"
              items={initialCourses}
            />
            <Card
              tag="additional"
              tagTitle="Additional Courses"
              items={additionalCourses}
            />
          </div>
        )}
      </div>
    );
  };

  const renderPaymentInfo = () => {
    if (!selectedUser) return null;
    return (
      <div className="rounded-xl bg-white/5 border border-yellow-500 p-4">
        <div className="flex items-center gap-2 text-white font-semibold mb-3">
          <FaMoneyBill />
          <span>Initial Payment via PayPro</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded border border-white/20 bg-white/0 p-3">
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">Consumer Number</span>
              <span className="text-white font-medium text-sm">
                {selectedUser.generatedPayProId?.consumerNumber ||
                  "Not Generated"}
              </span>
            </div>
          </div>
          <div className="rounded border border-white/20 bg-white/0 p-3">
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">Invoice ID</span>
              <span className="text-white font-medium text-sm">
                {selectedUser.generatedPayProId?.invoiceNumber ||
                  "Not Registered"}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ── UI ───────────────────────────────────────────────────────────────── */

  const tabs = ["account", "courses", "system"];

  return (
    <div className="min-h-screen bg-sec2 text-white px-4 py-6">
      {/* Sticky header / action bar */}
      <div className="sticky top-0 z-30 bg-sec2/95 backdrop-blur px-2 pb-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">
              User Issues Management
            </h1>
          </div>

          {/* Search Row */}
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <FaSearch className="text-white/70" />
              </div>
              <input
                type="text"
                className="w-full rounded-xl bg-white/5 border border-white/20 focus:border-yellow-500 focus:outline-none text-white placeholder:text-white/60 pl-10 pr-3 py-3"
                placeholder="Search by CNIC, full name, email, or phone…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSearch}
                className="px-4 py-3 rounded-xl border-2 border-yellow-500 bg-yellow-500 text-black font-medium"
                disabled={loading}
              >
                <span className="inline-flex items-center gap-2">
                  <FaSearch />
                  Search
                </span>
              </button>

              {!!results.length && (
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <FaFilter className="text-white/70" />
                  </div>
                  <input
                    type="text"
                    className="w-64 rounded-xl bg-white/5 border border-white/20 focus:border-yellow-500 focus:outline-none text-white placeholder:text-white/60 pl-10 pr-3 py-3"
                    placeholder="Filter within results…"
                    value={nestedSearchTerm}
                    onChange={(e) => setNestedSearchTerm(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body: 3-column free layout */}
      <div className="mt-6 grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left: People Rail */}
        <div className="xl:col-span-3">
          <div className="rounded-xl bg-white/5 border border-white/20 p-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-white/90 font-semibold">
                Results{" "}
                {results.length
                  ? `(${filteredResults.length}/${results.length})`
                  : ""}
              </h2>
            </div>

            {loading ? (
              <LoadingGlow />
            ) : searchTerm === "" ? (
              <IdleSearchHint />
            ) : results.length === 0 ? (
              <EmptyResults />
            ) : filteredResults.length === 0 ? (
              <EmptyResults />
            ) : (
              renderPeopleRail()
            )}
          </div>
        </div>

        {/* Middle: Inspector */}
        <div className="xl:col-span-6 space-y-6">
          {selectedUser ? (
            <>
              {renderInspectorHeader()}
              {renderStatusStrip()}
              {renderPaymentInfo()}
              {renderCourses()}
            </>
          ) : (
            <div className="rounded-xl bg-white/5 border border-white/20 p-6 min-h-[320px] flex items-center justify-center">
              <IdleSearchHint />
            </div>
          )}
        </div>

        {/* Right: Actions Column */}
        <div className="xl:col-span-3 space-y-6">
          {/* Tabs (Account / Courses / System) */}
          <div className="rounded-xl bg-white/5 border border-white/20 p-3">
            <div className="flex items-center gap-2 text-white/90 font-semibold mb-2">
              <FaChartLine />
              <span>Actions</span>
            </div>

            <div className="flex gap-2">
              {tabs.map((k) => (
                <button
                  key={k}
                  onClick={() => setActiveTab(k)}
                  className={`px-3 py-2 rounded-lg border text-sm ${
                    activeTab === k
                      ? "border-2 border-yellow-500 bg-yellow-500 text-black font-semibold"
                      : "border border-white/20 text-white hover:border-yellow-500"
                  }`}
                >
                  {k === "account" && "Account"}
                  {k === "courses" && "Courses"}
                  {k === "system" && "System"}
                </button>
              ))}
            </div>

            {/* Panels */}
            <div className="mt-4">
              {/* Account */}
              {activeTab === "account" && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-white/90 font-medium mb-2">
                      Thinkific Account
                    </h4>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={handleVerifyUserOnThinkific}
                        disabled={
                          !selectedUser?.email ||
                          verifyButtonStatus === "loading"
                        }
                        className={`px-3 py-2 rounded-lg text-sm border ${
                          !selectedUser?.email ||
                          verifyButtonStatus === "loading"
                            ? "border-white/20 text-white/50 cursor-not-allowed"
                            : verifyButtonStatus === "success"
                              ? "border-2 border-yellow-500 bg-yellow-500 text-black"
                              : verifyButtonStatus === "error"
                                ? "border-2 border-yellow-500 text-white"
                                : "border-white/20 text-white hover:border-yellow-500"
                        }`}
                      >
                        <span className="inline-flex items-center gap-2">
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
                            ? "Verifying…"
                            : verifyButtonStatus === "success"
                              ? "Verified"
                              : verifyButtonStatus === "error"
                                ? "Verification Failed"
                                : "Verify on Thinkific"}
                        </span>
                      </button>

                      <button
                        onClick={handleCreateUserOnThinkific}
                        disabled={
                          !selectedUser?.email ||
                          createButtonStatus === "loading"
                        }
                        className={`px-3 py-2 rounded-lg text-sm border ${
                          !selectedUser?.email ||
                          createButtonStatus === "loading"
                            ? "border-white/20 text-white/50 cursor-not-allowed"
                            : createButtonStatus === "success"
                              ? "border-2 border-yellow-500 bg-yellow-500 text-black"
                              : createButtonStatus === "error"
                                ? "border-2 border-yellow-500 text-white"
                                : createButtonStatus === "exists"
                                  ? "border-2 border-yellow-500 text-white"
                                  : "border-white/20 text-white hover:border-yellow-500"
                        }`}
                      >
                        <span className="inline-flex items-center gap-2">
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
                            ? "Creating…"
                            : createButtonStatus === "success"
                              ? "Created"
                              : createButtonStatus === "exists"
                                ? "Already Exists"
                                : createButtonStatus === "error"
                                  ? "Creation Failed"
                                  : "Create on Thinkific"}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/10">
                    <h4 className="text-white/90 font-medium mb-2">
                      Secure Credentials
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="rounded border border-white/20 px-3 py-2 text-white/90 flex items-center gap-2">
                        <FaLock className="opacity-90" />
                        <div className="min-w-0">
                          <p className="text-white/60 text-xs">Web Password</p>
                          <p className="font-mono truncate">
                            {selectedUser?.password || "—"}
                          </p>
                        </div>
                      </div>
                      <div className="rounded border border-white/20 px-3 py-2 text-white/90 flex items-center gap-2">
                        <FaLock className="opacity-90" />
                        <div className="min-w-0">
                          <p className="text-white/60 text-xs">LMS Password</p>
                          <p className="font-mono truncate">
                            {selectedUser?.password || "—"}
                          </p>
                        </div>
                      </div>
                      <div className="rounded border border-white/20 px-3 py-2 text-white/90 flex items-center gap-2">
                        <FaSchool className="opacity-90" />
                        <div className="min-w-0">
                          <p className="text-white/60 text-xs">LMS ID</p>
                          <p className="font-mono truncate">
                            {selectedUser?.user_lms_id || "—"}
                          </p>
                        </div>
                      </div>
                      <div className="rounded border border-white/20 px-3 py-2 text-white/90 flex items-center gap-2">
                        <FaUser className="opacity-90" />
                        <div className="min-w-0">
                          <p className="text-white/60 text-xs">UID</p>
                          <p className="font-mono truncate">
                            {selectedUser?.uid || "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Courses */}
              {activeTab === "courses" && (
                <div className="space-y-3">
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setIsEditCoursesModalOpen(true)}
                      className="px-3 py-2 rounded-lg text-sm border border-white/20 text-white hover:border-yellow-500"
                    >
                      <span className="inline-flex items-center gap-2">
                        <FaUsersCog /> Manage Courses
                      </span>
                    </button>
                    <button
                      onClick={() => setIsManualEnrollmentModalOpen(true)}
                      className="px-3 py-2 rounded-lg text-sm border-2 border-yellow-500 bg-yellow-500 text-black"
                    >
                      <span className="inline-flex items-center gap-2">
                        <FaPlus /> Manual Enrollment
                      </span>
                    </button>
                    <button
                      onClick={() => setIsManualUnenrollmentModalOpen(true)}
                      className="px-3 py-2 rounded-lg text-sm border border-white/20 text-white hover:border-yellow-500"
                    >
                      <span className="inline-flex items-center gap-2">
                        <FaTimesCircle /> Manual Unenrollment
                      </span>
                    </button>
                  </div>

                  <div className="pt-3 border-t border-white/10">
                    {selectedUser && (
                      <GeneratePSIDButton
                        user={selectedUser}
                        onUpdateSuccess={(updatedUser) =>
                          setSelectedUser(updatedUser)
                        }
                      />
                    )}
                  </div>
                </div>
              )}

              {/* System */}
              {activeTab === "system" && (
                <div className="space-y-3">
                  <button
                    onClick={handleResetAdmissionsTest}
                    disabled={!selectedUser || resetTestStatus === "loading"}
                    className={`px-3 py-2 rounded-lg text-sm border ${
                      !selectedUser || resetTestStatus === "loading"
                        ? "border-white/20 text-white/50 cursor-not-allowed"
                        : resetTestStatus === "success"
                          ? "border-2 border-yellow-500 bg-yellow-500 text-black"
                          : resetTestStatus === "error"
                            ? "border-2 border-yellow-500 text-white"
                            : "border-white/20 text-white hover:border-yellow-500"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
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
                        ? "Resetting…"
                        : resetTestStatus === "success"
                          ? "Reset"
                          : resetTestStatus === "error"
                            ? "Reset Failed"
                            : "Reset Admissions Test"}
                    </span>
                  </button>

                  <div className="pt-2 border-t border-white/10">
                    <button
                      onClick={() =>
                        selectedUser && handleDeleteAccount(selectedUser.id)
                      }
                      className="px-3 py-2 rounded-lg text-sm border border-white/20 text-white hover:border-yellow-500"
                    >
                      <span className="inline-flex items-center gap-2">
                        <FaTrashAlt /> Delete Account
                      </span>
                    </button>
                    <p className="text-xs text-white/60 mt-2">
                      Warning: This action cannot be undone and will permanently
                      remove the user.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* About panel */}
          <div className="rounded-xl bg-white/5 border border-white/20 p-3">
            <div className="flex items-center gap-2 text-white/90 font-semibold mb-1">
              <FaShieldAlt />
              <span>Admin Console</span>
            </div>
            <p className="text-white/70 text-sm">
              Curate accounts, verify LMS access, manage enrollments, and handle
              system actions.
            </p>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-xl border-2 border-yellow-500 p-5">
            <h3 className="text-lg font-semibold text-black mb-2">
              Confirm Deletion
            </h3>
            <p className="text-sm text-black/80">
              Are you sure you want to delete user{" "}
              <span className="font-semibold">{userToDeleteId}</span>? This
              cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setUserToDeleteId(null);
                  showToast("User deletion cancelled.", "success");
                }}
                className="px-4 py-2 rounded border border-black/20 hover:border-yellow-500 transition text-black"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteUser}
                disabled={deletingUser}
                className="px-4 py-2 rounded border-2 border-yellow-500 bg-yellow-500 text-black font-medium disabled:opacity-60"
              >
                {deletingUser ? (
                  <span className="inline-flex items-center gap-2">
                    <FaSpinner className="animate-spin" /> Deleting…
                  </span>
                ) : (
                  "Delete Permanently"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit & Course Modals */}
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

/* ────────────────────────────────────────────────────────────────────────── */
/* Page Shell                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

export default function IssuesView() {
  return (
    <AdminProtectedRoutes>
      <SidebarWrapper>
        <Suspense
          fallback={
            <div className="min-h-screen bg-sec2 text-white px-4 py-6 flex items-center justify-center">
              <div className="flex items-center gap-2">
                <FaSpinner className="animate-spin text-xl" />
                <span>Loading User Management…</span>
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
  