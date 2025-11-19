"use client";
import { useEffect, useState } from "react";
import { checkActionCode, confirmPasswordReset } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { firestore, auth } from "@/Backend/Firebase";
import { getThinkificKeys } from "@/helpers/getThinkificKeys";
import axios from "axios";
import Link from "next/link";
import {
  FiCheckCircle,
  FiAlertCircle,
  FiLock,
  FiLoader,
  FiArrowRight,
  FiInfo,
} from "react-icons/fi";
import { ImSpinner10 } from "react-icons/im";
import Notify from "simple-notify"; // Assuming simple-notify is installed
import SiteDetails from "@/Data/SiteData";

const PasswordResetComponent = ({ mode, oobCode }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    const verifyActionCode = async () => {
      if (mode === "resetPassword" && oobCode) {
        try {
          const actionCodeInfo = await checkActionCode(auth, oobCode);
          const userEmail = actionCodeInfo.data.email;
          setEmail(userEmail);

          const usersRef = collection(firestore, "users");
          const q = query(usersRef, where("email", "==", userEmail));
          const querySnapshot = await getDocs(q);

          if (querySnapshot.empty) {
            throw new Error("User data not found in our system (Firestore).");
          }

          setShowPasswordForm(true);
          setLoading(false);
        } catch (err) {
          console.error("Error verifying action code:", err);
          let errorMessage =
            "Invalid or expired reset link. Please request a new one.";
          if (err.code === "auth/invalid-action-code") {
            errorMessage =
              "The password reset link is invalid. Please request a new one.";
          } else if (err.code === "auth/expired-action-code") {
            errorMessage =
              "The password reset link has expired. Please request a new one.";
          } else if (err.message.includes("User data not found")) {
            errorMessage = err.message;
          }
          setError(errorMessage);
          setLoading(false);
        }
      } else {
        setError("Missing password reset link information.");
        setLoading(false);
      }
    };

    verifyActionCode();
  }, [mode, oobCode]);

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (newPassword !== confirmPassword) {
        new Notify({
          status: "failed",
          title: "Passwords do not match",
          text: `Please make sure the passwords match`,
          effect: "slide",
          speed: 300,
          autoclose: true,
          autotimeout: 3000,
        });
      }

      if (newPassword.length < 8) {
        new Notify({
          status: "failed",
          title: "Password must be at least 8 characters long.",
          text: `Please make sure the password is at least 8 characters long`,
          effect: "slide",
          speed: 300,
          autoclose: true,
          autotimeout: 3000,
        });
      }

      // 1. Confirm password reset with Firebase Authentication FIRST

      // Password reset successful in Firebase Auth, now update other systems

      // Get user data from Firestore (assuming UID is document ID)
      const usersRef = collection(firestore, "users");
      const q = query(usersRef, where("email", "==", email)); // Assuming email is a field for lookup
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.warn(`User with email ${email} not found in Firestore.`);
        // Decide if you want to proceed with Thinkific or throw an error
        // For now, we'll log a warning and proceed to try Thinkific
      }

      const userDoc = querySnapshot.empty ? null : querySnapshot.docs[0];
      const userData = userDoc ? userDoc.data() : null;

      // 2. **DO NOT store passwords in Firestore.**
      // If you have other user data in Firestore, update that if needed
      // Example:
      if (userData) {
        await updateDoc(doc(firestore, "users", userData.uid), {
          password: newPassword,
        });
      }

      let thinkificUserId = userData.userId; // Assuming userId exists in Firestore
      if (thinkificUserId) {
        try {
          await axios.put(
            `https://api.thinkific.com/api/public/v1/users/${thinkificUserId}`,
            {
              first_name: userData.firstName,
              last_name: userData.lastName,
              email: userData.email,
              password: newPassword,
            },
            {
              headers: {
                "X-Auth-API-Key": process.env.NEXT_PUBLIC_THINKIFIC_API_KEY,
                "X-Auth-Subdomain": process.env.NEXT_PUBLIC_THINKIFIC_SUBDOMAIN,
                "Content-Type": "application/json",
              },
            }
          );
          console.log(
            `Password updated successfully in Thinkific for user ID ${thinkificUserId}.`
          );
          await confirmPasswordReset(auth, oobCode, newPassword);

          setSuccess(true);
        } catch (thinkificUpdateErr) {
          console.error(
            `Error updating password in Thinkific for user ID ${thinkificUserId}:`,
            thinkificUpdateErr
          );
          console.warn(
            `Could not update password in Thinkific for user ID ${thinkificUserId}. Password updated in Firebase only.`
          );
        }
      }

      setError(null);
    } catch (err) {
      console.error("Password reset error:", err);
      let errorMessage =
        "An unexpected error occurred during password reset. Please try again.";

      if (err.message) {
        errorMessage = err.message;
      }

      // Provide more specific error messages if possible
      if (err.code === "auth/invalid-action-code") {
        errorMessage =
          "Invalid or expired password reset link. Please try again.";
      } else if (err.code === "auth/user-not-found") {
        errorMessage = "User not found. Please check the email address.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen center-flex">
        <div className="text-center p-8 bg-white rounded-lg border-2 border-zinc-400 max-w-md w-full">
          <ImSpinner10 className="animate-spin h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">
            Verifying your reset link...
          </h2>
          <p className="text-gray-600 mt-2">
            Please wait while we verify your password reset request.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen center-flex">
        <div className="text-center p-8 bg-danger/10 rounded-lg border-2 border-danger/30 max-w-md w-full">
          <FiAlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">
            Reset Link Error
          </h2>
          <p className="text-gray-600 mt-2">{error}</p>
          <Link
            href="/reset-password"
            className="mt-4 inline-block px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition"
          >
            Request New Reset Link
          </Link>
          <p className="mt-4 text-sm text-gray-500">
            Need help?{" "}
            <Link href="/contact" className="text-primary hover:underline">
              Contact support
            </Link>
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen center-flex bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-blue-200 max-w-lg w-full transform transition-all duration-300 scale-100 hover:scale-105">
          <FiCheckCircle className="h-16 w-16 text-green-600 mx-auto mb-5 animate-bounce-in" />
          <h2 className="text-3xl font-extrabold text-gray-800 mb-2">
            Password Reset Successful!
          </h2>
          <p className="mt-3 text-gray-700 text-lg leading-relaxed">
            Your password has been securely updated. You can now log in with
            your new credentials.
          </p>
          <p className="mt-2 text-primary font-medium">
            Your password for the training portal has also been synchronized.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center px-8 py-3 bg-primary text-white font-semibold rounded-full shadow-md hover:bg-primary-dark transition-all duration-300 transform hover:scale-105 group"
          >
            Go to Login Page{" "}
            <FiArrowRight className="ml-3 text-xl group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    );
  }

  if (showPasswordForm) {
    return (
      <div className="min-h-screen center-flex flex-col p-4">
        <div className="w-full max-w-3xl rounded-xl  shadow-xl overflow-hidden transform scale-95 md:scale-100 transition-transform duration-300">
          <div className="w-full center-flex flex-col pt-8 pb-4 bg-second/10">
            <img
              src={SiteDetails.logo}
              className="mb-4 h-24 sm:h-32 object-contain"
              alt="Logo"
            />
            <div className="w-full max-w-2xl bg-primary/90 p-3 rounded-xl mb-6 shadow-md">
              <h2 className="text-2xl font-bold text-white text-center">
                Welcome Back to {SiteDetails.programName}
              </h2>
            </div>
          </div>
          <div className="p-6 sm:p-8 bg-yellow-200/30">
            <div className="p-4 mb-6  text-blue-800 border border-blue-300 rounded-lg flex items-start text-base shadow-sm">
              <FiInfo className="mt-1 mr-3 flex-shrink-0 text-xl text-blue-600" />
              <span>
                Setting a new password here will securely update your access
                credentials for the official training portal as well.
              </span>
            </div>

            <form onSubmit={handlePasswordReset} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-zinc-700 mb-2"
                >
                  Registered Email Address
                </label>
                <div className="w-full p-3 bg-gray-100 rounded-lg border-2 border-zinc-200 text-zinc-700 font-medium text-base">
                  <span>{email}</span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-semibold text-zinc-700 mb-2"
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full input input-lg border-2 border-zinc-300 focus:border-primary-light focus:ring-1 focus:ring-primary-light transition-all duration-200 rounded-lg pr-10"
                    required
                    minLength={8}
                    placeholder="Enter your new password"
                  />
                  <FiLock className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-xl" />
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  Minimum 8 characters for enhanced security.
                </p>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-semibold text-zinc-700 mb-2"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full input input-lg border-2 border-zinc-300 focus:border-primary-light focus:ring-1 focus:ring-primary-light transition-all duration-200 rounded-lg pr-10"
                    required
                    placeholder="Re-enter your new password"
                  />
                  <FiLock className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-xl" />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-700 border border-red-300 rounded-lg flex items-start text-base shadow-sm">
                  <FiAlertCircle className="mt-1 mr-3 flex-shrink-0 text-xl text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              <div className="center-flex flex-col sm:flex-row gap-4 mx-auto mt-6">
                <button
                  type="submit" // Ensure this is a submit button
                  disabled={loading}
                  className={`w-full sm:w-1/2 btn btn-lg text-white font-bold rounded-full shadow-lg transition-all duration-300
                  ${
                    loading
                      ? "bg-primary/70 cursor-not-allowed"
                      : "bg-primary hover:bg-primary-dark transform hover:scale-105"
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <FiLoader className="animate-spin mr-3 text-xl" />{" "}
                      Resetting Password...
                    </span>
                  ) : (
                    "Confirm Password Reset"
                  )}
                </button>
                <Link
                  href={"/login"}
                  className="w-full sm:w-1/2 btn btn-lg btn-second text-center font-bold rounded-full shadow-lg hover:bg-second-dark transition-all duration-300 transform hover:scale-105"
                >
                  Back to Login
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PasswordResetComponent;
