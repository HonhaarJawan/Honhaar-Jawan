"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
  collection,
} from "firebase/firestore";
import { firestore } from "@/Backend/Firebase";
import { useToast } from "@/components/primary/Toast";
import Navbar from "@/components/primary/Navbar";
import Copyright from "@/components/primary/Copyright";
import {
  FiEye,
  FiEyeOff,
  FiLock,
  FiCheck,
  FiUser,
  FiArrowLeft,
} from "react-icons/fi";
import { ImSpinner } from "react-icons/im";
import Link from "next/link";

const ChangePassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isCodeLoading, setIsCodeLoading] = useState(true);
  const [isCodeValid, setIsCodeValid] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const router = useRouter();
  const params = useParams();
  const resetCode = params.code;
  const { showToast } = useToast();

  useEffect(() => {
    const verifyResetCode = async () => {
      if (!resetCode) {
        setError("Invalid or missing reset code.");
        showToast("Invalid or missing reset code.", "error");
        setIsCodeLoading(false);
        return;
      }

      try {
        const resetRequestRef = doc(
          firestore,
          "password-reset-requests",
          resetCode
        );
        const resetRequestSnap = await getDoc(resetRequestRef);

        if (resetRequestSnap.exists()) {
          const resetData = resetRequestSnap.data();
          const now = new Date();
          const expiresAt = resetData.expiresAt.toDate();

          if (now > expiresAt) {
            setError("Reset code has expired.");
            showToast(
              "Reset code has expired. Please request a new reset link.",
              "error"
            );
          } else if (resetData.used) {
            setError("Reset code has already been used.");
            showToast(
              "Reset code has already been used. Please request a new reset link.",
              "error"
            );
          } else {
            setIsCodeValid(true);
            setUserEmail(resetData.email);
            console.log(
              `Valid reset code for: ${resetData.email}, UID: ${resetData.uid}`
            );
          }
        } else {
          setError("Invalid reset code.");
          showToast(
            "Invalid reset code. Please check your email for the correct link.",
            "error"
          );
        }
      } catch (err) {
        console.error("Verification error:", err);
        setError("Error verifying reset code.");
        showToast("Error verifying reset code. Please try again.", "error");
      } finally {
        setIsCodeLoading(false);
      }
    };

    verifyResetCode();
  }, [resetCode, showToast]);

  const updateUserPasswordInFirestore = async (email, newPassword) => {
    try {
      const normalizedEmail = email.toLowerCase();
      const usersRef = collection(firestore, "users");
      const q = query(usersRef, where("email", "==", normalizedEmail));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        await updateDoc(userDoc.ref, {
          password: newPassword,
          lastPasswordChange: new Date(),
        });
        console.log("Password updated in Firestore successfully");
      } else {
        throw new Error("User not found in Firestore");
      }
    } catch (error) {
      console.error("Error updating password in Firestore:", error);
      throw error;
    }
  };

  const updateAuthPassword = async (code, newPassword) => {
    try {
      const response = await fetch("/api/password-change", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: code,
          newPassword: newPassword,
        }),
      });

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
    if (!isCodeValid) {
      setError(
        "Reset code is invalid or expired. Please request a new reset link."
      );
      showToast(
        "Reset code is invalid or expired. Please request a new reset link.",
        "error"
      );
      return;
    }

    setError("");
    setLoading(true);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      showToast("Passwords do not match.", "error");
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      showToast("Password must be at least 8 characters long.", "error");
      setLoading(false);
      return;
    }

    try {
      await updateAuthPassword(resetCode, newPassword);
      await updateUserPasswordInFirestore(userEmail, newPassword);

      setSuccess(true);
      showToast(
        "Password updated successfully! Redirecting to login...",
        "success"
      );

      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err) {
      let errorMessage = "Failed to update password. Please try again.";
      if (err.message.includes("quota-exceeded")) {
        errorMessage =
          "Too many requests. Please wait a few minutes and try again.";
      } else if (
        err.message.includes("authentication") ||
        err.message.includes("UNAUTHENTICATED")
      ) {
        errorMessage = "Authentication error. Please request a new reset link.";
      } else if (err.message.includes("User not found")) {
        errorMessage = "User account not found. Please contact support.";
      } else if (
        err.message.includes("expired") ||
        err.message.includes("used")
      ) {
        errorMessage = err.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  if (isCodeLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center px-4 py-8">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <ImSpinner className="animate-spin h-12 w-12 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">
                Verifying reset code...
              </h2>
              <p className="text-gray-600 text-center">
                Please wait while we verify your password reset link.
              </p>
            </div>
          </div>
        </main>
        <Copyright />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-blue-600 px-6 py-4">
            <h1 className="text-xl font-bold text-white">
              Reset Your Password
            </h1>
          </div>

          <div className="px-6 py-4">
            {!isCodeValid ? (
              <div className="text-center py-8">
                <div className="bg-red-100 text-red-700 p-4 rounded-lg">
                  <p className="font-medium">{error}</p>
                  <Link
                    href="/forgot-password"
                    className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <FiArrowLeft className="mr-2" /> Request a new reset link
                  </Link>
                </div>
              </div>
            ) : success ? (
              <div className="text-center py-8">
                <div className="bg-green-100 text-green-700 p-4 rounded-lg">
                  <FiCheck className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    Password Updated Successfully!
                  </h3>
                  <p>
                    Your password has been reset. Redirecting to login page...
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="text-sm text-gray-600 mb-4">
                  <p>
                    Reset password for:{" "}
                    <span className="font-medium">{userEmail}</span>
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                      placeholder="Enter new password"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <FiEyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <FiEye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                      placeholder="Confirm new password"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <FiEyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <FiEye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-100 text-red-700 p-3 rounded-md">
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <ImSpinner className="animate-spin" size={18} />
                      <span>Updating Password...</span>
                    </div>
                  ) : (
                    "Update Password"
                  )}
                </button>

                <div className="text-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                  >
                    <FiArrowLeft className="mr-1" /> Back to Login
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
      <Copyright />
    </div>
  );
};

export default ChangePassword;
