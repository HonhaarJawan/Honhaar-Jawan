// ProfileSettingModal.js
"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaEnvelope, FaLock, FaSave, FaUserEdit } from "react-icons/fa";
import useAuthStore from "@/store/useAuthStore";
import { ImSpinner } from "react-icons/im";

import Cookies from "js-cookie";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { firestore } from "@/Backend/Firebase";

const ProfileSettingModal = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuthStore((state) => state);
  const [formData, setFormData] = useState({
    password: "",
    firstName: "",
    lastName: "",
    mobile: "",
    cnic: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef(null);

  // Get email from multiple possible sources
  const getCurrentEmail = () => {
    // 1. First try from auth store
    if (user?.email) return user.email;

    // 2. Then try from userEmail cookie
    const userEmailCookie = Cookies.get("userEmail");
    if (userEmailCookie) return userEmailCookie;

    // 3. Finally try from userLogged cookie
    try {
      const userLoggedCookie = Cookies.get("userLogged");
      if (userLoggedCookie) {
        const cookieData = JSON.parse(decodeURIComponent(userLoggedCookie));
        if (cookieData.email) return cookieData.email;
      }
    } catch (e) {
      console.error("Error parsing userLogged cookie:", e);
    }

    return null;
  };

  const currentEmail = getCurrentEmail();

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Populate the form with the current user data
  useEffect(() => {
    if (currentEmail && isOpen) {
      try {
        // Get data from userLogged cookie if available
        const userLoggedCookie = Cookies.get("userLogged");
        const cookieData = userLoggedCookie
          ? JSON.parse(decodeURIComponent(userLoggedCookie))
          : {};

        setFormData({
          password: "", // Don't pre-fill password for security
          firstName: cookieData.firstName || user?.firstName || "",
          lastName: cookieData.lastName || user?.lastName || "",
          mobile: cookieData.mobile || user?.mobile || "",
          cnic: cookieData.cnic || user?.cnic || "",
        });
      } catch (e) {
        console.error("Error parsing userLogged cookie:", e);
        setFormData({
          password: "",
          firstName: user?.firstName || "",
          lastName: user?.lastName || "",
          mobile: user?.mobile || "",
          cnic: user?.cnic || "",
        });
      }

      // Clear previous messages when modal opens
      setError("");
      setSuccess("");
    }
  }, [user, currentEmail, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Function to update password in Firebase Auth
  const updateAuthPassword = async (email, newPassword) => {
    try {
      const response = await fetch("/api/update-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          newPassword: newPassword,
        }),
      });

      // Handle non-JSON responses
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response received:", text.substring(0, 200));
        throw new Error(
          "Server returned an invalid response. Please try again later."
        );
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to update authentication password"
        );
      }

      return result;
    } catch (error) {
      console.error("Error updating auth password:", error);
      throw error;
    }
  };

  // Function to handle the update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    if (!currentEmail) {
      setError("Unable to identify user email");
      setIsSubmitting(false);
      return;
    }

    try {
      // Prepare update data
      const updateData = {};
      if (formData.firstName) updateData.firstName = formData.firstName;
      if (formData.lastName) updateData.lastName = formData.lastName;
      if (formData.mobile) updateData.mobile = formData.mobile;
      if (formData.cnic) updateData.cnic = formData.cnic;

      // Check if password needs to be updated
      const shouldUpdatePassword =
        formData.password && formData.password.trim() !== "";

      if (shouldUpdatePassword) {
        // Validate password length
        if (formData.password.length < 6) {
          setError("Password must be at least 6 characters long.");
          setIsSubmitting(false);
          return;
        }

        console.log("Updating password in Firebase Auth...");
        await updateAuthPassword(currentEmail, formData.password);
        updateData.password = formData.password;
        updateData.lastPasswordChange = new Date();
      }

      if (Object.keys(updateData).length === 0) {
        setError("No changes detected");
        setIsSubmitting(false);
        return;
      }

      // Update Firestore
      const usersRef = collection(firestore, "users");
      const q = query(usersRef, where("email", "==", currentEmail));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDocRef = querySnapshot.docs[0].ref;
        await updateDoc(userDocRef, updateData);

        // Update auth store
        if (user) {
          updateUser({
            ...user,
            ...updateData,
          });
        }

        // Update userLogged cookie if it exists
        const userLoggedCookie = Cookies.get("userLogged");
        if (userLoggedCookie) {
          try {
            const cookieData = JSON.parse(decodeURIComponent(userLoggedCookie));
            const updatedCookieData = {
              ...cookieData,
              ...updateData,
            };
            Cookies.set("userLogged", JSON.stringify(updatedCookieData), {
              expires: 30, // 30 days
              secure: process.env.NODE_ENV === "production",
              sameSite: "strict",
            });
          } catch (e) {
            console.error("Error updating userLogged cookie:", e);
          }
        }

        const successMessage = shouldUpdatePassword
          ? "Profile and password updated successfully!"
          : "Profile updated successfully!";

        setSuccess(successMessage);

        // Clear password field after successful update
        if (shouldUpdatePassword) {
          setFormData((prev) => ({ ...prev, password: "" }));
        }

        setTimeout(() => {
          onClose();
          setSuccess("");
        }, 2000);
      } else {
        setError("User not found in database");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      let errorMessage = "Failed to update profile. Please try again.";

      if (err.message.includes("quota-exceeded")) {
        errorMessage =
          "Too many requests. Please wait a few minutes and try again.";
      } else if (
        err.message.includes("authentication") ||
        err.message.includes("UNAUTHENTICATED")
      ) {
        errorMessage = "Authentication error. Please log in again.";
      } else if (err.message.includes("weak-password")) {
        errorMessage = "Password must be at least 6 characters long.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div onClick={onClose} className="fixed inset-0 z-[100]" />

      <div className="fixed inset-0 flex justify-center z-[100] p-4">
        <div
          ref={modalRef}
          className="bg-white rounded-lg shadow-xl w-full max-w-[720px] max-h-full md:max-h-[40vh] overflow-y-hidden"
        >
          <div className="flex justify-between items-center mb-1 border-b border-gray-300 py-2.5">
            <h2 className="text-sm px-2.5 font-bold text-gray-800 flex items-center gap-1">
              <FaUserEdit size={20} /> Profile Settings
            </h2>
            <button
              onClick={onClose}
              className="text-gray-300 pr-2 pb-2 hover:text-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <p className="text-gray-400 top-0 left-0 px-4">
            Update your profile information
          </p>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="">
              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
                  {success}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-1 text-sm font-medium text-gray-600">
                    <FaEnvelope /> Email
                  </label>
                  <input
                    type="email"
                    value={currentEmail || "Email not available"}
                    className="w-full py-2 px-4 lg:py-3 border border-gray-200 rounded-xs bg-gray-100 cursor-not-allowed"
                    readOnly
                    disabled
                  />
                </div>

                <div>
                  <label className="flex items-center gap-1 text-sm font-medium text-gray-600">
                    <FaLock /> New Password (optional)
                  </label>
                  <input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter new password"
                    className="w-full py-2 px-4 lg:py-3 border border-gray-200 rounded-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    minLength={6}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave blank to keep current password
                  </p>
                </div>
              </div>
              <div className="flex justify-center lg:justify-start pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative overflow-hidden rounded-sm px-8 lg:px-12 py-3 flex items-center gap-2 text-white bg-primary hover:bg-second transform hover:-translate-y-0.5 transition-all duration-300 font-semibold disabled:opacity-70 shadow-md hover:shadow-lg"
                >
                  <div className="flex items-center justify-center">
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <ImSpinner className="animate-spin" size={18} />
                        <span className="font-medium text-white">
                          Updating...
                        </span>
                      </div>
                    ) : (
                      <span className="flex items-center gap-2 font-medium text-white">
                        <FaSave /> Update Profile
                      </span>
                    )}
                  </div>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default ProfileSettingModal;
