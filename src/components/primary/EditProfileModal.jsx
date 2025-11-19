"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaCalendarAlt,
  FaCity,
  FaEnvelope,
  FaHeart,
  FaHome,
  FaIdCard,
  FaKey,
  FaMale,
  FaMapMarkerAlt,
  FaPhone,
  FaSave,
  FaUser,
  FaUserEdit,
  FaVenusMars,
  FaTimes,
} from "react-icons/fa";
import useAuthStore from "@/store/useAuthStore";
import Cookies from "js-cookie";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { firestore } from "@/Backend/Firebase";
import CustomToast from "@/components/primary/customToast";
import { ImSpinner } from "react-icons/im";

const EditProfileModal = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuthStore((state) => state);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    fatherName: "",
    password: "",
    cnic: "",
    mobile: "",
    dob: "",
    maritalStatus: "Single",
    gender: "Female",
    permanentAddress: "",
    currentAddress: "",
    city: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [toast, setToast] = useState({
    message: "",
    type: "",
    visible: false,
  });
  const modalRef = useRef(null);
  const hasUpdated = useRef(false);

  // Memoize the toast onClose function
  const handleToastClose = useCallback(() => {
    setToast({ message: "", type: "", visible: false });
  }, []);

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

  // Pre-fill the form with user data from store and cookies
  useEffect(() => {
    if (user && isOpen) {
      // Reset the update flag when modal opens
      hasUpdated.current = false;

      try {
        const userLoggedCookie = Cookies.get("userLogged");
        const cookieData = userLoggedCookie
          ? JSON.parse(decodeURIComponent(userLoggedCookie))
          : {};

        setFormData({
          fullName:
            user.fullName ||
            `${user.firstName || ""} ${user.lastName || ""}`.trim(),
          fatherName: cookieData.fatherName || user.fatherName || "",
          password: "", // Don't pre-fill password for security
          cnic: cookieData.cnic || user.cnic || "",
          mobile: cookieData.mobile || user.mobile || "",
          dob: cookieData.dob || user.dob || "",
          maritalStatus:
            cookieData.maritalStatus || user.maritalStatus || "Single",
          gender: cookieData.gender || user.gender || "Female",
          permanentAddress:
            cookieData.permanentAddress || user.permanentAddress || "",
          currentAddress:
            cookieData.currentAddress || user.currentAddress || "",
          city: cookieData.city || user.city || "",
        });
      } catch (e) {
        console.error("Error parsing userLogged cookie:", e);
        setFormData({
          fullName:
            user.fullName ||
            `${user.firstName || ""} ${user.lastName || ""}`.trim(),
          fatherName: user.fatherName || "",
          password: "",
          cnic: user.cnic || "",
          mobile: user.mobile || "",
          dob: user.dob || "",
          maritalStatus: user.maritalStatus || "Single",
          gender: user.gender || "Female",
          permanentAddress: user.permanentAddress || "",
          currentAddress: user.currentAddress || "",
          city: user.city || "",
        });
      }

      setError("");
      setSuccess("");
      setToast({ message: "", type: "", visible: false });
    }
  }, [user, isOpen]);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      if (!user?.email) {
        setError("User email not found");
        setToast({
          message: "User email not found",
          type: "error",
          visible: true,
        });
        setIsSubmitting(false);
        return;
      }

      const updateData = {
        fullName: formData.fullName,
        fatherName: formData.fatherName,
        cnic: formData.cnic,
        mobile: formData.mobile,
        dob: formData.dob,
        maritalStatus: formData.maritalStatus,
        gender: formData.gender,
        permanentAddress: formData.permanentAddress,
        currentAddress: formData.currentAddress,
        city: formData.city,
      };

      // Check if password needs to be updated
      const shouldUpdatePassword =
        formData.password && formData.password.trim() !== "";

      // Update password in Firebase Auth first if provided
      if (shouldUpdatePassword) {
        console.log("Updating password in Firebase Auth...");
        await updateAuthPassword(user.email, formData.password);
        updateData.password = formData.password;
        updateData.lastPasswordChange = new Date();
      }

      // Update Firestore
      const usersRef = collection(firestore, "users");
      const q = query(usersRef, where("email", "==", user.email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDocRef = querySnapshot.docs[0].ref;
        await updateDoc(userDocRef, updateData);

        updateUser({
          ...user,
          ...updateData,
        });

        try {
          const userLoggedCookie = Cookies.get("userLogged");
          if (userLoggedCookie) {
            const cookieData = JSON.parse(decodeURIComponent(userLoggedCookie));
            const updatedCookieData = {
              ...cookieData,
              ...updateData,
            };
            Cookies.set("userLogged", JSON.stringify(updatedCookieData), {
              expires: 30,
              secure: process.env.NODE_ENV === "production",
              sameSite: "strict",
            });
          }
        } catch (e) {
          console.error("Error updating userLogged cookie:", e);
        }

        const successMessage = shouldUpdatePassword
          ? "Profile and password updated successfully!"
          : "Profile updated successfully!";

        setSuccess(successMessage);
        setToast({
          message: successMessage,
          type: "success",
          visible: true,
        });
        // Set flag to prevent toast from being cleared on re-render
        hasUpdated.current = true;

        // Clear password field after successful update
        if (shouldUpdatePassword) {
          setFormData((prev) => ({ ...prev, password: "" }));
        }

        // Close modal after successful submission
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError("User not found in database");
        setToast({
          message: "User not found in database",
          type: "error",
          visible: true,
        });
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
      setToast({
        message: errorMessage,
        type: "error",
        visible: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 z-[51]  flex p-4 items-center justify-center"
      >
        <div
          ref={modalRef}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] my-auto flex flex-col"
        >
          {/* Header */}
          <div className="sticky top-0 bg-primary text-white p-4 rounded-t-xl flex justify-between items-center z-10">
            <div className="flex items-center gap-2">
              <FaUserEdit className="text-white text-lg" />
              <h2 className="text-lg font-bold">Edit Profile</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-green-200 transition-colors p-1 rounded-full hover:bg-white/10"
            >
              <FaTimes className="text-lg" />
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 p-4 overflow-hidden">
            <form onSubmit={handleSubmit} className="h-full flex flex-col">
              {/* Status Messages */}
              <div className="mb-3">
                {error && (
                  <div className="p-2 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center text-sm">
                    <FaTimes className="text-red-600 mr-2 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                {success && (
                  <div className="p-2 bg-green-50 text-green-700 rounded-lg border border-green-200 flex items-center text-sm">
                    <FaSave className="text-green-600 mr-2 flex-shrink-0" />
                    <span>{success}</span>
                  </div>
                )}
              </div>

              {/* Toast Notification */}
              {toast.visible && (
                <CustomToast
                  message={toast.message}
                  type={toast.type}
                  duration={5000}
                  onClose={handleToastClose}
                />
              )}

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 flex-1 overflow-hidden">
                {/* Column 1: Personal Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-sm font-semibold text-gray-700 mb-1">
                    <FaUser className="text-primary text-xs" />
                    <span>Personal Info</span>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      Father's Name
                    </label>
                    <input
                      type="text"
                      name="fatherName"
                      value={formData.fatherName}
                      onChange={handleChange}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      New Password (optional)
                    </label>
                    <input
                      name="password"
                      type="text"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter new password"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                      minLength={6}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave blank to keep current password
                    </p>
                  </div>
                </div>

                {/* Column 2: Contact Details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-sm font-semibold text-gray-700 mb-1">
                    <FaPhone className="text-primary text-xs" />
                    <span>Contact Details</span>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      CNIC/B-Form
                    </label>
                    <input
                      type="text"
                      name="cnic"
                      value={formData.cnic}
                      onChange={handleChange}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={user?.email || "Email not available"}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-gray-100 cursor-not-allowed"
                      readOnly
                      disabled
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      Mobile
                    </label>
                    <input
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>
                </div>

                {/* Column 3: Personal Details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-sm font-semibold text-gray-700 mb-1">
                    <FaUserEdit className="text-primary text-xs" />
                    <span>Personal Details</span>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleChange}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      Marital Status
                    </label>
                    <select
                      name="maritalStatus"
                      value={formData.maritalStatus}
                      onChange={handleChange}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Column 4: Address Information */}
                <div className="md:col-span-3 space-y-2 mt-2">
                  <div className="flex items-center gap-1 text-sm font-semibold text-gray-700 mb-1">
                    <FaHome className="text-primary text-xs" />
                    <span>Address Information</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">
                        Permanent Address
                      </label>
                      <input
                        type="text"
                        name="permanentAddress"
                        value={formData.permanentAddress}
                        onChange={handleChange}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">
                        Current Address
                      </label>
                      <input
                        type="text"
                        name="currentAddress"
                        value={formData.currentAddress}
                        onChange={handleChange}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                        required
                      />
                    </div>
                  </div>

                  <div className="md:w-1/2">
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>

                {/* ✅ unified spinner button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative overflow-hidden rounded-lg bg-primary text-white px-3 py-1.5 shadow-md hover:bg-second transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <ImSpinner className="animate-spin" size={16} />
                      <span>Updating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <FaSave className="text-xs" />
                      <span>Update</span>
                    </div>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default EditProfileModal;
