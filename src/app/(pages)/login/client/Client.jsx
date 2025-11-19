"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import useAuthStore from "@/store/useAuthStore";
import { doc, getDoc } from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";
import { firestore, auth } from "@/Backend/Firebase";
import { ImSpinner } from "react-icons/im";
import CustomToast from "@/components/primary/customToast";
import SiteDetails from "@/Data/SiteData";

const Client = () => {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState({
    message: "",
    type: "",
    visible: false,
    duration: 5000,
  });

  const showToast = (message, type = "info", duration = 5000) => {
    setToast({ message, type, visible: true, duration });
  };

  const handleCloseToast = () => {
    setToast({ ...toast, visible: false });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.email || !formData.password) {
      showToast("Please enter both email and password", "error", 2000);
      setLoading(false);
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      showToast("Please enter a valid email address", "error", 2000);
      setLoading(false);
      return;
    }

    try {
      const userCredentials = await signInWithEmailAndPassword(
        auth,
        formData.email.trim(),
        formData.password
      );

      const userDocRef = doc(firestore, "users", formData.email.trim());
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const setSpacificData = {
          fullName: userData.fullName,
          mobile: userData.mobile,
          uid: userCredentials.user.uid,
          email: userData.email,
          created_at: userData.created_at,
        };

        setUser(setSpacificData);
        showToast("Logged in successfully", "success", 1000);
        setTimeout(() => {
          router.push("/dashboard");
        }, 0);
      } else {
        showToast(
          "User data not found. Please contact support.",
          "error",
          2000
        );
      }
    } catch (error) {
      console.error("Login error:", error);
      let errorMessage = "Login failed. Please try again.";
      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email address.";
      } else if (
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        errorMessage =
          "Invalid email or password. Please check your credentials.";
      } else if (error.code === "auth/user-disabled") {
        errorMessage =
          "This account has been disabled. Please contact support.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please try again later.";
      }
      showToast(errorMessage, "error", 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value.trim(),
    }));
  };
  return (
    <main className="flex-1 bg-gradient-to-r from-lime-300 via-green-200 to-emerald-200   py-20 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      {toast.visible && (
        <CustomToast
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={handleCloseToast}
        />
      )}
      <div
        className="w-full max-w-lg "
      >
        <div className=" bg-white/85 rounded-xl border-2 shadow-md overflow-hidden pb-7 pt-3 px-6">
          <div className="text-center mb-8">
            <img
              src={SiteDetails.logo}
              alt="Logo"
              className="h-20 mx-auto mb-8"
            />
            <h1 className="text-2xl font-bold text-gray-900">
              Candidate Login
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email address
              </label>
              <div className="relative rounded-md shadow-sm">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="h-14 rounded-sm outline-blue-400 outline-1 border w-full pl-3"
                  placeholder="Enter Email"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <div className="relative rounded-md shadow-sm">
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="h-14 rounded-sm outline-blue-400 outline-1 border text-lg text-gray-800 w-full pl-3"
                  placeholder="Enter Password"
                />
              </div>
            </div>

            <div className="flex items-center justify-end">
              <div className="text-sm">
                <Link
                  href="/forgot-password"
                  className="font-medium text-primary hover:text-primary/80"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-primary py-3 gap-2 flex items-center justify-center text-white rounded-md ${
                  loading ? "opacity-75" : ""
                }`}
              >
                {loading ? (
                  <>
                    <ImSpinner className="animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>Login</>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="w-full justify-center flex items-center gap-1">
              <h1 className="text-[#5b5f69]">Don't have an account?</h1>
              <Link href="/new-registration" className="text-md text-primary">
                New Registration
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Client;
