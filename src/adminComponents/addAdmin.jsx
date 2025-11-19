"use client";

import React, { useEffect, useState } from "react";
import { firestore } from "../../../../Backend/Firebase";
import {
  collection,
  getDocs,
  setDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import SidebarWrapper from "../../../../adminComponents/SidebarWrapper";
import Notify from "simple-notify";
import AdminProtectedRoutes from "@/ProtectedRoutes/AdminProtectedRoutes";

const AddAdmin = () => {
  const [adminsData, setAdminsData] = useState([]);
  const [input, setInput] = useState({
    admin_name: "",
    admin_email: "",
    admin_password: "",
    role: "support",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // fetch existing admins
  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(firestore, "site_admins_details"));
      setAdminsData(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    })();
  }, []);

  const validate = () => {
    const e = {};
    if (!input.admin_name.trim()) e.admin_name = "Name is required";
    if (!input.admin_email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
      e.admin_email = "Valid email required";
    if (input.admin_password.length < 8)
      e.admin_password = "Password must be at least 8 characters";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleChange = (e) =>
    setInput((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("submit fired", input);
    if (!validate()) return;

    setLoading(true);
    const id = uuidv4();
    const payload = {
      id,
      ...input,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    try {
      await setDoc(doc(firestore, "site_admins_details", id), payload);
      new Notify({
        status: "success",
        title: "Admin Added",
        text: `${input.admin_name} has been added.`,
        effect: "fade",
        speed: 300,
        autoclose: true,
        autotimeout: 2000,
        gap: 20,
      });
      setAdminsData((prev) => [...prev, payload]);
      setInput({
        admin_name: "",
        admin_email: "",
        admin_password: "",
        role: "support",
      });
      setErrors({});
    } catch (err) {
      console.error("🔥 Firestore error:", err);
      new Notify({
        status: "error",
        title: "Error",
        text: "Failed to add admin.",
        effect: "fade",
        speed: 300,
        autoclose: true,
        autotimeout: 3000,
        gap: 20,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminProtectedRoutes>
      <div className="flex flex-col w-full relative">
        <SidebarWrapper
          permissions={{}}
          className="relative flex justify-center"
        />

        {/* remove absolute so form is clickable */}
        <div className="w-full mt-20 absolute">
          <div className="px-10 py-12">
            <div className="flex flex-col items-center justify-center">
              <form
                onSubmit={handleSubmit}
                className="border border-primary/50 p-8 rounded-lg shadow-lg relative max-w-lg bg-white mx-auto"
              >
                <h2 className="text-xl font-semibold mb-4 text-primary">
                  Add New Admin
                </h2>

                {/* Name */}
                <div className="mb-4">
                  <input
                    type="text"
                    name="admin_name"
                    value={input.admin_name}
                    onChange={handleChange}
                    placeholder="Name"
                    className={`border p-2 w-full rounded ${
                      errors.admin_name ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.admin_name && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.admin_name}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="mb-4">
                  <input
                    type="email"
                    name="admin_email"
                    value={input.admin_email}
                    onChange={handleChange}
                    placeholder="Email"
                    className={`border p-2 w-full rounded ${
                      errors.admin_email ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.admin_email && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.admin_email}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="mb-4">
                  <input
                    type="password"
                    name="admin_password"
                    value={input.admin_password}
                    onChange={handleChange}
                    placeholder="Password"
                    className={`border p-2 w-full rounded ${
                      errors.admin_password
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {errors.admin_password && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.admin_password}
                    </p>
                  )}
                </div>

                {/* Role */}
                <div className="mb-6">
                  <select
                    name="role"
                    value={input.role}
                    onChange={handleChange}
                    className="border p-2 w-full rounded border-gray-300"
                  >
                    <option value="support">Support</option>
                    <option value="admin">Admin</option>
                    <option value="owner">Owner</option>
                  </select>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full bg-primary text-white py-2 rounded ${
                    loading
                      ? "opacity-75 cursor-not-allowed"
                      : "hover:bg-primary/90"
                  }`}
                >
                  {loading ? "Adding…" : "Add Admin"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AdminProtectedRoutes>
  );
};

export default AddAdmin;
