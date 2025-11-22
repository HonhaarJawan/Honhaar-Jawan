"use client";

import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useState } from "react";
import { IoIosLock } from "react-icons/io";
import { MdEmail } from "react-icons/md";
import Cookies from "js-cookie";
import { firestore } from "@/Backend/Firebase";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import AdminProtectedRoutes from "@/ProtectedRoutes/AdminProtectedRoutes";
import { ROLES } from "@/ProtectedRoutes/AdminProtectedRoutes";
import { useToast } from "@/components/primary/Toast";

const AdminLogin = () => {
  const { showToast } = useToast();
  const router = useRouter();
  const [input, setInput] = useState({
    admin_email: "",
    admin_password: "",
  });
  const [error, setError] = useState({
    admin_email: "",
    admin_password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleInput = (e) => {
    setInput({ ...input, [e.target.name]: e.target.value });
  };

  const validateInput = () => {
    let isValid = true;
    const newError = { admin_email: "", admin_password: "" };

    if (!input.admin_email) {
      newError.admin_email = "Email is required.";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(input.admin_email)) {
      newError.admin_email = "Email is invalid.";
      isValid = false;
    }

    if (!input.admin_password) {
      newError.admin_password = "Password is required.";
      isValid = false;
    } else if (input.admin_password.length < 8) {
      newError.admin_password = "Password must be at least 8 characters.";
      isValid = false;
    }

    setError(newError);
    return isValid;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!validateInput()) return;

    setLoading(true);

    try {
      console.log("Starting login process...");

      const adminQuery = query(
        collection(firestore, "site_admins_details"),
        where("admin_email", "==", input.admin_email)
      );

      console.log("Admin query executed with email:", input.admin_email);

      const querySnapshot = await getDocs(adminQuery);

      if (querySnapshot.empty) {
        throw new Error("Admin not found");
      }

      const adminDoc = querySnapshot.docs[0];
      const adminData = adminDoc.data();

      console.log("Admin found:", adminData);

      if (adminData.admin_password !== input.admin_password) {
        throw new Error("Invalid credentials");
      }

      const sessionData = {
        id: adminDoc.id,
        admin_email: adminData.admin_email,
        admin_name: adminData.admin_name,
        role: adminData.role || ROLES.SUPPORT,
        loggedIn: true,
        timestamp: Date.now(),
      };

      console.log("Session data:", sessionData);

      // Store session data
      Cookies.set("admin_data", JSON.stringify(sessionData), {
        expires: 100,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      });

      localStorage.setItem("admin_authenticated", "true");

      showToast("Login successful", "success");

      // Redirect based on role
      switch (adminData.role) {
        case ROLES.SUPPORT:
          window.location.href = "/admin/dashboard/issues";
          break;
        case ROLES.CHC_MANAGER:
          window.location.href = "/admin/dashboard/chc-requests";
          break;
        case ROLES.ADMIN:
        case ROLES.OWNER:
          window.location.href = "/admin/dashboard";
          break;
        default:
          window.location.href = "/admin/dashboard";
      }
    } catch (error) {
      console.error("Login error:", error);
      showToast(error.message || "Login failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminProtectedRoutes isLoginPage={true}>
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white w-full mx-4 md:mx-10 lg:mx-0 lg:w-1/3 p-8 rounded-lg shadow-lg">
          <h1 className="text-center text-3xl font-bold text-gray-800 mb-2">
            Admin Login
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Access your admin dashboard
          </p>

          <form
            onSubmit={handleFormSubmit}
            className="flex flex-col gap-4 mt-6"
          >
            <div>
              <div className="rounded-md py-3 px-4 border border-gray-300 gap-2 flex items-center focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                <MdEmail size={20} className="text-gray-500" />
                <input
                  type="email"
                  name="admin_email"
                  value={input.admin_email}
                  onChange={handleInput}
                  className="bg-transparent w-full outline-none text-gray-700"
                  placeholder="Enter Email"
                />
              </div>
              {error.admin_email && (
                <span className="text-red-500 text-sm mt-1 block">
                  {error.admin_email}
                </span>
              )}
            </div>

            <div>
              <div className="rounded-md py-3 px-4 border border-gray-300 gap-2 flex items-center focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                <IoIosLock size={20} className="text-gray-500" />
                <input
                  type="password"
                  name="admin_password"
                  value={input.admin_password}
                  onChange={handleInput}
                  className="bg-transparent w-full outline-none text-gray-700"
                  placeholder="Enter Password"
                />
              </div>
              {error.admin_password && (
                <span className="text-red-500 text-sm mt-1 block">
                  {error.admin_password}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-white text-lg font-semibold rounded-lg hover:bg-primary-dark transition duration-300 flex justify-center items-center"
            >
              {loading ? (
                <div className="flex justify-center">
                  <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full"></div>
                  </div>
              ) : (
                "Login"
              )}
            </button>
          </form>
        </div>
      </div>
    </AdminProtectedRoutes>
  );
};

export default AdminLogin;
    