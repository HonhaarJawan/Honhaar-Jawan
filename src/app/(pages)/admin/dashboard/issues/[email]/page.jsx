"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
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
} from "react-icons/fa";
import EditProfileModal from "@/adminComponents/EditProfileModal";
import EditCoursesModal from "@/adminComponents/EditCoursesModal";
import SidebarWrapper from "@/adminComponents/SidebarWrapper";
import AdminProtectedRoutes from "@/ProtectedRoutes/AdminProtectedRoutes";
import GeneratePSIDButton from "@/adminComponents/reversePayment/button";

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
          <div className="absolute top-0 left-0 w-full h-full border-8 border-blue-200 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-8 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <svg
              className="w-8 h-8 text-blue-500"
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
            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          ></div>
          <div
            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          ></div>
          <div
            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
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
        <p className="typing-text text-blue-800 font-semibold">
          No User Found.
        </p>
      </div>
      <p className="text-blue-600 font-semibold text-sm mt-2">
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
          animation: typing 1.5s steps(13, end) forwards,
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

// UserCard Component
const UserCard = ({ user, selectedUser, setSelectedUser, showToast }) => {
  return (
    <div
      key={user.id}
      onClick={() => {
        if (!user) return;
        setSelectedUser(user);
        showToast(`${user.email || "Unnamed user"} selected`, "success");
      }}
      className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden transition-all duration-200 cursor-pointer hover:shadow-md ${
        selectedUser?.id === user.id
          ? "border-green-500 shadow-md ring-2 ring-green-100"
          : "border-gray-200 hover:border-green-300"
      }`}
    >
      <div
        className={`p-4 ${
          selectedUser?.id === user.id ? "bg-green-50" : "bg-gray-50"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-600 to-green-800 flex items-center justify-center text-white font-bold">
            {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
          </div>
          <div>
            <h3 className="font-medium text-gray-900 truncate">
              {user.fullName || "Unnamed User"}
            </h3>
            <p className="text-xs text-gray-500">{user.email || "No email"}</p>
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Phone:</span>
            <span className="text-gray-700 font-medium">
              {user.mobile || "—"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">CNIC:</span>
            <span className="text-gray-700 font-medium">
              {user.cnic || "—"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Status:</span>
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
        <div className="bg-green-500 text-white text-xs font-medium px-3 py-1 flex items-center justify-center gap-1">
          <FaCheck className="h-3 w-3" />
          Selected
        </div>
      )}
    </div>
  );
};

// UserDetailCard Component
const UserDetailCard = ({ title, children, className }) => {
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden ${className}`}
    >
      <h3 className="font-semibold text-gray-800 p-4 bg-gray-50 border-b border-gray-200">
        {title}
      </h3>
      <div className="p-4">{children}</div>
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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userToDeleteId, setUserToDeleteId] = useState(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [users, setUsers] = useState([]);
  const [verifyButtonStatus, setVerifyButtonStatus] = useState("idle");
  const [createButtonStatus, setCreateButtonStatus] = useState("idle");
  const [courses, setCourses] = useState([]);

  // NEW: run deep-link prefill only once
  const didPrefill = useRef(false);

  const initialCourses = selectedUser?.generatedPayProId?.paidAt
    ? selectedUser.generatedPayProId.selectedCourses?.map(
        (course) => course.name
      ) || []
    : [];

  const additionalCourses = selectedUser?.additionalCourses_paid_invoice
    ? selectedUser.additionalCourses_paid_invoice.flatMap(
        (invoice) =>
          invoice.selectedCourses?.map((course) => course.name) || []
      )
    : [];

  // Format date helper function
  const formatDate = (dateValue) => {
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
  };

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

  // Handle search functionality (UPDATED: accepts optional override term)
  const handleSearch = useCallback(
    async (overrideTerm) => {
      const useTermRaw = overrideTerm !== undefined ? overrideTerm : searchTerm;
      const term = (useTermRaw || "").trim().toLowerCase();

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
        const queriesArr = [
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

        const snapshots = await Promise.all(queriesArr.map((q) => getDocs(q)));
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
          showToast(
            `${fetchedUsers.length} users found. Select one.`,
            "success"
          );
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
    },
    [searchTerm, showToast]
  );

  // NEW: Deep-link & sessionStorage handoff -> prefill and auto-search
  useEffect(() => {
    if (didPrefill.current) return;
    didPrefill.current = true;

    try {
      if (typeof window === "undefined") return;

      const path = window.location.pathname || "";
      const qs = window.location.search || "";
      const params = new URLSearchParams(qs);
      const queryEmail = params.get("q");

      // Look for /admin/dashboard/issues/<email>
      let pathEmail = "";
      const marker = "/admin/dashboard/issues/";
      const idx = path.indexOf(marker);
      if (idx !== -1) {
        pathEmail = decodeURIComponent(path.slice(idx + marker.length)).trim();
      }

      // Session handoff fallback
      const sessionEmail =
        window.sessionStorage.getItem("issues_prefill_email") || "";

      const candidate = (queryEmail || pathEmail || sessionEmail || "").trim();
      if (candidate) {
        setSearchTerm(candidate);
        handleSearch(candidate);
        // clear the handoff token so repeated visits don't reuse it
        try {
          window.sessionStorage.removeItem("issues_prefill_email");
        } catch {}
      }
    } catch {
      // ignore
    }
  }, [handleSearch]);

  // Handle user updates
  const handleUpdateUser = (updateInfo) => {
    if (!updateInfo) {
      console.error("handleUpdateUser called with undefined updateInfo");
      showToast("Invalid update data", "error");
      return;
    }

    if (updateInfo.type === "courses") {
      setSearchTerm(updateInfo.email);
      handleSearch(updateInfo.email);
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
  };

  const refreshSelectedUser = async (email) => {
    try {
      const userRef = doc(firestore, "users", email);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        setSelectedUser({
          id: userDoc.id,
          ...userDoc.data(),
        });
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = (id) => {
    setUserToDeleteId(id);
    setShowConfirmModal(true);
  };

  const confirmDeleteUser = async () => {
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
  };

  // Verify user on Teachable
  const handleVerifyUserOnTeachable = async () => {
    if (!selectedUser) {
      showToast("Please select a user first", "error");
      return;
    }
    setVerifyButtonStatus("loading");
    try {
      const response = await fetch("/api/teachable/verifyUserOnPortal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: selectedUser.email,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || "Verification failed");
      }
      if (data.verified) {
        showToast(
          `User is registered on Teachable with email ${selectedUser.email}`,
          "success"
        );
        setVerifyButtonStatus("success");
      } else {
        showToast("This user is not registered on Teachable", "error");
        setVerifyButtonStatus("error");
      }
    } catch (error) {
      console.error("Verification error:", error);
      showToast(error.message, "error");
      setVerifyButtonStatus("error");
    } finally {
      setTimeout(() => {
        if (verifyButtonStatus !== "success") {
          setVerifyButtonStatus("idle");
        }
      }, 3000);
    }
  };

  // Create user on Teachable
  const handleCreateUserOnTeachable = async () => {
    if (!selectedUser) {
      showToast("Please select a user first", "error");
      return;
    }

    setCreateButtonStatus("loading");

    try {
      const response = await fetch("/api/teachable/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: {
            email: selectedUser.email,
            password: selectedUser.password,
            name: selectedUser.fullName || selectedUser.name || "User Account",
            status: selectedUser.status,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.includes("already exists")) {
          showToast("User already has a Teachable account", "success");
          setCreateButtonStatus("exists");
        } else {
          throw new Error(data.error || "Failed to create account");
        }
      } else {
        showToast("Teachable account created successfully", "success");

        setSelectedUser((prev) => ({
          ...prev,
          user_lms_id: data.teachableUserId,
          lms_password: selectedUser.password,
        }));

        setUsers((prevUsers) =>
          prevUsers.map((u) =>
            u.id === selectedUser.id
              ? {
                  ...u,
                  user_lms_id: data.teachableUserId,
                  lms_password: selectedUser.password,
                }
              : u
          )
        );

        setCreateButtonStatus("success");
      }
    } catch (error) {
      console.error("Creation error:", error);
      showToast(error.message || "Failed to create Teachable account", "error");
      setCreateButtonStatus("error");
    } finally {
      setTimeout(() => setCreateButtonStatus("idle"), 3000);
    }
  };

  // Button state helpers
  const getVerifyButtonProps = () => {
    const isButtonDisabled =
      !selectedUser?.email || verifyButtonStatus === "loading";
    const text = {
      idle: "Verify on Teachable",
      loading: "Verifying...",
      success: "Teachable Verified",
      error: "Verification Failed",
    }[verifyButtonStatus];
    const icon = {
      idle: <FaUserCheck />,
      success: <FaCheckCircle />,
      error: <FaExclamationTriangle />,
    }[verifyButtonStatus];
    const className = `
      px-4 py-2 rounded-lg transition text-xs font-medium shadow-sm flex items-center gap-1
      ${isButtonDisabled ? "bg-gray-400 text-gray-700 cursor-not-allowed" : ""}
      ${!selectedUser?.email ? "opacity-50 cursor-not-allowed" : ""}
      ${
        !isButtonDisabled && verifyButtonStatus === "idle"
          ? "bg-green-600 text-white hover:bg-green-700"
          : ""
      }
      ${
        verifyButtonStatus === "loading"
          ? "bg-green-600 text-white opacity-70 cursor-wait"
          : ""
      }
      ${
        verifyButtonStatus === "error"
          ? "bg-red-600 text-white hover:bg-red-700"
          : ""
      }
      ${
        verifyButtonStatus === "success"
          ? "bg-green-600 text-white cursor-default"
          : ""
      }
    `;
    return { text, icon, className, disabled: isButtonDisabled };
  };

  const getCreateButtonProps = () => {
    const isButtonDisabled =
      !selectedUser?.email || createButtonStatus === "loading";
    const text = {
      idle: "Create on Teachable",
      loading: "Creating...",
      success: "Created on Teachable",
      error: "Creation Failed",
    }[createButtonStatus];
    const icon = {
      idle: <FaUserPlus />,
      success: <FaCheckCircle />,
      error: <FaExclamationTriangle />,
    }[createButtonStatus];
    const className = `
      px-4 py-2 rounded-lg transition text-xs font-medium shadow-sm flex items-center gap-1
      ${isButtonDisabled ? "bg-gray-400 text-gray-700 cursor-not-allowed" : ""}
      ${!selectedUser?.email ? "opacity-50 cursor-not-allowed" : ""}
      ${
        !isButtonDisabled && createButtonStatus === "idle"
          ? "bg-indigo-600 text-white hover:bg-indigo-700"
          : ""
      }
      ${
        createButtonStatus === "loading"
          ? "bg-indigo-600 text-white opacity-70 cursor-wait"
          : ""
      }
      ${
        createButtonStatus === "error"
          ? "bg-red-600 text-white hover:bg-red-700"
          : ""
      }
      ${
        createButtonStatus === "success"
          ? "bg-indigo-600 text-white cursor-default"
          : ""
      }
    `;
    return { text, icon, className, disabled: isButtonDisabled };
  };

  const {
    text: verifyButtonText,
    icon: verifyButtonIcon,
    className: verifyButtonClassName,
    disabled: isVerifyButtonDisabled,
  } = getVerifyButtonProps();

  const {
    text: createButtonText,
    icon: createButtonIcon,
    className: createButtonClassName,
    disabled: isCreateButtonDisabled,
  } = getCreateButtonProps();

  // Render user cards
  const renderUserCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {filteredResults
        .filter((user) => user && user.id)
        .map((user) => (
          <UserCard
            key={user.id}
            user={user}
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
            showToast={showToast}
          />
        ))}
    </div>
  );

  return (
    <div className="min-h-screen  ">
      <div className=" rounded-xl   mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              User Management
            </h1>
            <p className="text-gray-500 text-sm">
              Search and manage user accounts
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-800 transition duration-200"
              placeholder="Search by CNIC, full name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <button
            onClick={() => handleSearch()}
            className="w-full sm:w-auto bg-green-600 text-white px-5 py-3 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 font-medium shadow-sm"
            disabled={loading}
          >
            <FaSearch />
            Search
          </button>
        </div>

        {results.length > 0 && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <FaFilter className="text-green-600" />
              Search Results ({filteredResults.length} of {results.length})
            </h2>
            <div className="relative max-w-md w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaFilter className="text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-800 transition duration-200"
                placeholder="Filter within results..."
                value={nestedSearchTerm}
                onChange={(e) => setNestedSearchTerm(e.target.value)}
              />
            </div>
          </div>
        )}

        {loading ? (
          <div className="relative flex items-center justify-center py-4">
            <SearchAnimation />
          </div>
        ) : searchTerm === "" ? (
          <IdleSearchAnimation />
        ) : results.length === 0 ? (
          <NoResultsAnimation />
        ) : filteredResults.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <NoResultsAnimation />
          </div>
        ) : (
          renderUserCards()
        )}
      </div>

      {selectedUser && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <UserDetailCard title="Student Details">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Name: {selectedUser.fullName || "Unnamed User"}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Email: {selectedUser.email || "No email"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Phone:</span>
                    <span className="text-sm font-medium text-gray-700">
                      {selectedUser.mobile || "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">CNIC:</span>
                    <span className="text-sm font-medium text-gray-700">
                      {selectedUser.cnic || "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Signup Date:</span>
                    <span className="text-sm font-medium text-gray-700">
                      {selectedUser.created_at
                        ? formatDate(selectedUser.created_at)
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Status:</span>
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

                <button
                  onClick={() => setIsEditProfileModalOpen(true)}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <FaEdit /> Edit Profile
                </button>
              </div>
            </UserDetailCard>

            <UserDetailCard title="Credentials">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Web Password:</span>
                  <span className="text-sm font-mono text-gray-700">
                    {selectedUser.password || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">LMS Password:</span>
                  <span className="text-sm font-mono text-gray-700">
                    {selectedUser.password || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">LMS ID:</span>
                  <span className="text-sm font-medium text-gray-700">
                    {selectedUser.user_lms_id || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">UID:</span>
                  <span className="text-sm font-medium text-gray-700">
                    {selectedUser.uid || "—"}
                  </span>
                </div>
              </div>
            </UserDetailCard>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <UserDetailCard title="User Overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div
                  className={`flex items-center p-4 rounded-lg ${
                    selectedUser?.OnlineTestPercentage >= 40
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-yellow-50 text-yellow-800 border border-yellow-200"
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
                  className={`flex items-center p-4 rounded-lg ${
                    selectedUser?.PaidAt
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-yellow-50 text-yellow-800 border border-yellow-200"
                  }`}
                >
                  {selectedUser?.PaidAt ? (
                    <FaCheckCircle className="mr-3 text-xl" />
                  ) : (
                    <FaTimesCircle className="mr-3 text-xl" />
                  )}
                  <div>
                    <p className="font-medium">Payment Status</p>
                    <p className="text-sm">
                      {selectedUser?.PaidAt ? "Paid" : "Unpaid"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3">
                  Administrative Actions
                </h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setIsEditCoursesModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs font-medium shadow-sm flex items-center gap-1"
                  >
                    <FaUsersCog /> Manage Courses
                  </button>
                  <button
                    onClick={handleVerifyUserOnTeachable}
                    disabled={isVerifyButtonDisabled}
                    className={verifyButtonClassName}
                  >
                    {verifyButtonIcon} {verifyButtonText}
                  </button>
                  <button
                    onClick={handleCreateUserOnTeachable}
                    disabled={isCreateButtonDisabled}
                    className={createButtonClassName}
                  >
                    {createButtonIcon} {createButtonText}
                  </button>
                  <GeneratePSIDButton
                    user={selectedUser}
                    onUpdateSuccess={(updatedUser) => {
                      setSelectedUser(updatedUser);
                    }}
                  />
                  <button
                    onClick={() => handleDeleteAccount(selectedUser.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-xs font-medium shadow-sm flex items-center gap-1"
                  >
                    <FaTrashAlt /> Delete Account
                  </button>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                  <FaMoneyBill className="text-yellow-600" />
                  Initial Payment via PayPro
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-yellow-700">
                      Consumer ID:
                    </span>
                    <span className="text-sm font-medium text-yellow-800">
                      {selectedUser.generatedPayProId?.payProId ||
                        "Not Generated"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-yellow-700">
                      Course Invoice ID:
                    </span>
                    <span className="text-sm font-medium text-yellow-800">
                      {selectedUser.generatedPayProId?.invoiceNumber ||
                        "Not Registered"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <FaGraduationCap className="text-green-600" />
                  Enrollment Details
                </h4>
                <div className="space-y-4">
                  {initialCourses.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        Initial Courses:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {initialCourses.map((courseName, index) => (
                          <span
                            key={`initial-${index}`}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                          >
                            {courseName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {additionalCourses.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        Additional Courses:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {additionalCourses.map((courseName, index) => (
                          <span
                            key={`additional-${index}`}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {courseName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {initialCourses.length === 0 &&
                    additionalCourses.length === 0 && (
                      <p className="text-sm text-gray-500">
                        No enrolled courses
                      </p>
                    )}
                </div>
              </div>
            </UserDetailCard>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-auto">
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
        onUpdateSuccess={(updatedData) => handleUpdateUser(updatedData)}
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
    </div>
  );
};

// Main IssuesView Component
export default function IssuesView({ defaultEmail = "" }) {
  return (
    <AdminProtectedRoutes>
      <SidebarWrapper>
        <Suspense
          fallback={
            <div className="min-h-screen  flex items-center justify-center">
              <div className="flex items-center gap-2 text-white">
                <FaSpinner className="animate-spin text-2xl" />
                <span>Loading User Management Dashboard...</span>
              </div>
            </div>
          }
        >
          <IssuesViewContent defaultEmail={defaultEmail} />
        </Suspense>
      </SidebarWrapper>
    </AdminProtectedRoutes>
  );
}