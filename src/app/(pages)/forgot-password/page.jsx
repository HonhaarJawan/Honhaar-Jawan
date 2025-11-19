"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/primary/Navbar";
import Link from "next/link";
import { FiClock, FiMail, FiShield, FiArrowLeft, FiSend } from "react-icons/fi";
import {
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  getDoc,
} from "firebase/firestore";
import { firestore } from "@/Backend/Firebase";
import Copyright from "@/components/primary/Copyright";
import { useToast } from "@/components/primary/Toast";
import { ImSpinner } from "react-icons/im";

const ForgotPassword = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 0);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Generate 9-digit code
  const generateResetCode = () => {
    return Math.floor(100000000 + Math.random() * 900000000).toString();
  };

  const sendPasswordResetEmail = async (email, resetCode) => {
    console.log(email);
    console.log(resetCode);
    try {
      const templateRef = doc(firestore, "email_templates", "password_reset");
      const templateSnap = await getDoc(templateRef);
      if (templateSnap.exists()) {
        const template = templateSnap.data().template;
        await fetch("https://honhaarjawan.pk/api/sendMail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: email,
            subject: "Account Password Reset - Honhaar Jawan",
            htmlTemplate: template,
            placeholders: {
              resetCode,
            },
          }),
        });
      }
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      throw emailError;
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (resendCooldown > 0) return;

    setError("");
    setLoading(true);

    try {
      const normalizedEmail = email.toLowerCase().trim();

      const usersRef = collection(firestore, "users");
      const q = query(usersRef, where("email", "==", normalizedEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("No account found with this email address");
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      const uid = userData.uid;
      if (!uid) throw new Error("User account is missing authentication ID");

      const resetCode = generateResetCode();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const resetRequestRef = doc(
        firestore,
        "password-reset-requests",
        resetCode
      );
      await setDoc(resetRequestRef, {
        email: normalizedEmail,
        uid,
        code: resetCode,
        createdAt: new Date(),
        expiresAt,
        used: false,
      });

      await sendPasswordResetEmail(email, resetCode, userData.name || "User");

      setSuccess(true);
      setResendCooldown(60);
      showToast(`Password reset email sent to ${email}`, "success");
    } catch (err) {
      console.error("Password reset error:", err);
      const errorMessage =
        err.message || "Failed to send reset email. Please try again.";
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      setSuccess(false);
      setError("");
      await handleSubmit({ preventDefault: () => {} }); // Trigger resend
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-1 pt-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto justify-center items-center py-4">
          {!success ? (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <FiShield className="w-8 h-8 text-gray-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  Forgot Password?
                </h1>
                <p className="text-gray-600">
                  Enter your email address and we'll send you a reset link
                </p>
              </div>

              {/* Form Card */}
              <div className="bg-white shadow-sm border border-gray-200 rounded-md p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiMail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-700">
                      {error}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={loading || resendCooldown > 0}
                    className={`w-full py-3 px-4 font-medium rounded-md transition-colors ${
                      loading || resendCooldown > 0
                        ? "bg-gray-400 cursor-not-allowed text-white"
                        : "bg-sec2 hover:bg-primary transition-all text-white"
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <ImSpinner className="animate-spin" />
                        Sending Reset Link...
                      </span>
                    ) : resendCooldown > 0 ? (
                      <span className="flex items-center justify-center gap-2">
                        <FiClock className="w-5 h-5" />
                        Resend in {resendCooldown}s
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <FiSend className="w-5 h-5" />
                        Send Reset Link
                      </span>
                    )}
                  </button>
                  <div className="flex justify-between items-center">
                    <Link
                      href={"/login"}
                      className="text-sec2 underline-offset-4 underline hover:text-primary font-medium"
                    >
                      Login Here!
                    </Link>
                    <Link
                      href={"/new-registration"}
                      className="text-sec2 underline-offset-4 underline hover:text-primary font-medium"
                    >
                      Dont have an account?
                    </Link>
                  </div>{" "}
                </form>
              </div>
            </>
          ) : (
            /* Success State */
            <div className="text-center">
              <div className="bg-white border border-gray-200 rounded-md p-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Email Sent Successfully!
                </h2>
                <p className="text-gray-600 mb-6">
                  We've sent a secure password reset link to
                  <br />
                  <span className="font-medium text-gray-800">{email}</span>
                </p>

                {resendCooldown > 0 && (
                  <div className="bg-white border border-blue-100 rounded-md p-4 mb-6 flex items-center justify-center gap-2 text-gray-800">
                    <FiClock className="w-4 h-4" />
                    <span className="text-sm">
                      You can request another email in {resendCooldown}s
                    </span>
                  </div>
                )}

                <div className="space-y-3">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 bg-sec2 hover:bg-primary text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    <FiArrowLeft className="w-4 h-4" />
                    Return to Login
                  </Link>

                  {resendCooldown === 0 && (
                    <button
                      onClick={handleResend}
                      disabled={resending}
                      className="block w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md transition-colors"
                    >
                      {resending ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-gray-400/30 border-t-gray-600 rounded-full animate-spin"></div>
                          Sending...
                        </span>
                      ) : (
                        "Send Another Email"
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <div className="mt-[7.6rem]">
        <Copyright />
      </div>
    </div>
  );
};

export default ForgotPassword;
