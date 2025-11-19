"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  getDocs,
  collection,
} from "firebase/firestore";
import { firestore } from "@/Backend/Firebase";
import { FaFilter, FaTimes, FaSearch, FaTrash, FaEdit } from "react-icons/fa";
import { CiMenuKebab } from "react-icons/ci";
import AdminProtectedRoutes from "@/ProtectedRoutes/AdminProtectedRoutes";
import { IoMdPersonAdd } from "react-icons/io";
import { v4 as uuidv4 } from "uuid";
import SidebarWrapper from "@/adminComponents/SidebarWrapper";
import { ROLES } from "@/ProtectedRoutes/AdminProtectedRoutes";
import { ToastProvider, useToast } from "@/components/primary/Toast";

export default function ManageAdmins() {
  const [adminsData, setAdminsData] = useState([]);
  const [selectedAdmins, setSelectedAdmins] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const dropdownRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const [input, setInput] = useState({
    id: uuidv4(),
    admin_email: "",
    admin_name: "",
    admin_password: "",
    role: ROLES.SUPPORT,
  });

  const [error, setError] = useState({});

  // Role badge colors
  const roleColors = {
    [ROLES.OWNER]: "bg-purple-100 text-purple-800",
    [ROLES.ADMIN]: "bg-blue-100 text-blue-800",
    [ROLES.CHC_MANAGER]: "bg-orange-100 text-orange-800",
    [ROLES.SUPPORT]: "bg-gray-100 text-gray-800",
  };

  // Fetch admins
  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(firestore, "site_admins_details"));
      const admins = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setAdminsData(admins);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching admins:", error);
      showToast("Failed to load admins", "error");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();

    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !e.target.closest("[data-dropdown-toggle]")
      ) {
        setOpenDropdownId(null);
      }
    };

    if (typeof window !== "undefined") {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      if (typeof window !== "undefined") {
        document.removeEventListener("mousedown", handleClickOutside);
      }
    };
  }, []);

  // Selection handlers
  const handleSelectAdmin = (id) => {
    setSelectedAdmins((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const allIds = adminsData.map((admin) => admin.id);
    setSelectedAdmins(selectedAdmins.length === allIds.length ? [] : allIds);
  };

  // Delete handlers
  const handleSingleDelete = async (id) => {
    try {
      await deleteDoc(doc(firestore, "site_admins_details", id));
      setAdminsData((prev) => prev.filter((admin) => admin.id !== id));
      setSelectedAdmins(selectedAdmins.filter((adminId) => adminId !== id));
      showToast("Admin deleted successfully", "success");
    } catch (error) {
      showToast("Error deleting admin", "error");
    }
  };

  const handleDeleteSelected = async () => {
    try {
      await Promise.all(
        selectedAdmins.map((id) =>
          deleteDoc(doc(firestore, "site_admins_details", id))
        )
      );
      setAdminsData((prev) =>
        prev.filter((admin) => !selectedAdmins.includes(admin.id))
      );
      setSelectedAdmins([]);
      showToast("Selected admins deleted", "success");
    } catch (error) {
      showToast("Error deleting admins", "error");
    }
  };

  // Add admin form
  const validate = () => {
    const newErrors = {};
    if (!input.admin_name.trim()) newErrors.admin_name = "Name is required";
    if (!/^\S+@\S+\.\S+$/.test(input.admin_email))
      newErrors.admin_email = "Valid email required";
    if (input.admin_password.length < 8)
      newErrors.admin_password = "Password must be at least 8 characters";

    setError(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const newAdmin = {
      ...input,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    try {
      await setDoc(doc(firestore, "site_admins_details", input.id), newAdmin);
      setAdminsData((prev) => [...prev, { ...newAdmin, id: input.id }]);
      showToast("Admin added successfully", "success");
      setIsAddFormOpen(false);
      resetInputForm();
    } catch (error) {
      showToast("Error adding admin", "error");
    }
  };

  const resetInputForm = () => {
    setInput({
      id: uuidv4(),
      admin_email: "",
      admin_name: "",
      admin_password: "",
      role: ROLES.SUPPORT,
    });
    setError({});
  };

  // Edit admin functionality
  const openEditModal = (admin) => {
    setCurrentAdmin(admin);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!currentAdmin.admin_name.trim())
      newErrors.admin_name = "Name is required";
    if (!/^\S+@\S+\.\S+$/.test(currentAdmin.admin_email))
      newErrors.admin_email = "Valid email required";

    setError(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      const { id, ...updateData } = currentAdmin;
      await setDoc(
        doc(firestore, "site_admins_details", id),
        {
          ...updateData,
          updated_at: serverTimestamp(),
        },
        { merge: true }
      );

      setAdminsData((prev) =>
        prev.map((admin) =>
          admin.id === id ? { ...admin, ...updateData } : admin
        )
      );

      showToast("Admin updated successfully", "success");
      setIsEditModalOpen(false);
    } catch (error) {
      showToast("Error updating admin", "error");
    }
  };

  const filteredAdmins = adminsData.filter(
    (admin) =>
      admin.admin_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.admin_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allSelected =
    selectedAdmins.length === adminsData.length && adminsData.length > 0;

  return (
    <AdminProtectedRoutes>
      <ToastProvider>
        <SidebarWrapper>
          <div className="flex h-full">
            <main className="flex-1 overflow-hidden p-6 bg-gray-50">
              <div className="bg-white rounded-xl shadow-md p-6 space-y-6 flex flex-col h-full">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                      Admin Management
                    </h1>
                    <p className="text-gray-600">
                      Manage all admin accounts and permissions
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 max-w-md">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        <FaSearch />
                      </div>
                      <input
                        type="text"
                        placeholder="Search admins..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none bg-gray-50"
                      />
                    </div>
                    <button
                      onClick={() => setIsAddFormOpen(true)}
                      className="bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors shadow-md"
                    >
                      <IoMdPersonAdd className="text-lg" /> Add Admin
                    </button>
                  </div>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <div className="text-purple-800 font-medium">
                      Total Admins
                    </div>
                    <div className="text-2xl font-bold text-purple-700">
                      {adminsData.length}
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="text-blue-800 font-medium">
                      Administrators
                    </div>
                    <div className="text-2xl font-bold text-blue-700">
                      {adminsData.filter((a) => a.role === ROLES.ADMIN).length}
                    </div>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <div className="text-orange-800 font-medium">
                      CHC Managers
                    </div>
                    <div className="text-2xl font-bold text-orange-700">
                      {
                        adminsData.filter((a) => a.role === ROLES.CHC_MANAGER)
                          .length
                      }
                    </div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <div className="text-gray-800 font-medium">
                      Support Staff
                    </div>
                    <div className="text-2xl font-bold text-gray-700">
                      {
                        adminsData.filter((a) => a.role === ROLES.SUPPORT)
                          .length
                      }
                    </div>
                  </div>
                </div>

                {/* Selection Bar */}
                {selectedAdmins.length > 0 && (
                  <div className="flex justify-between items-center bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={handleSelectAll}
                        className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-blue-800 font-medium">
                        {selectedAdmins.length} admin(s) selected
                      </span>
                    </div>
                    <button
                      onClick={handleDeleteSelected}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <FaTrash /> Delete Selected
                    </button>
                  </div>
                )}

                {/* Admin Cards Grid */}
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : filteredAdmins.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <div className="text-5xl text-gray-300 mb-4">👤</div>
                    <h3 className="text-xl font-medium text-gray-700 mb-2">
                      No admins found
                    </h3>
                    <p className="text-gray-500 mb-6 text-center max-w-md">
                      {searchTerm
                        ? "No admins match your search criteria"
                        : "You haven't added any admins yet"}
                    </p>
                    <button
                      onClick={() => setIsAddFormOpen(true)}
                      className="bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors"
                    >
                      <IoMdPersonAdd /> Add First Admin
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredAdmins.map((admin) => (
                      <div
                        key={admin.id}
                        className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-all ${
                          selectedAdmins.includes(admin.id)
                            ? "border-blue-500 ring-2 ring-blue-200"
                            : "border-gray-200"
                        }`}
                      >
                        <div className="p-5">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={selectedAdmins.includes(admin.id)}
                                onChange={() => handleSelectAdmin(admin.id)}
                                className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <div>
                                <h3 className="font-bold text-gray-800 text-lg">
                                  {admin.admin_name}
                                </h3>
                                <p className="text-gray-600 text-sm">
                                  {admin.admin_email}
                                </p>
                              </div>
                            </div>

                            <div className="relative">
                              <button
                                data-dropdown-toggle={admin.id}
                                onClick={() =>
                                  setOpenDropdownId(
                                    openDropdownId === admin.id
                                      ? null
                                      : admin.id
                                  )
                                }
                                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                              >
                                <CiMenuKebab size={20} />
                              </button>

                              {openDropdownId === admin.id && (
                                <div
                                  ref={dropdownRef}
                                  className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-40"
                                >
                                  <button
                                    onClick={() => {
                                      openEditModal(admin);
                                      setOpenDropdownId(null);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 w-full text-left text-gray-700"
                                  >
                                    <FaEdit /> Edit
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleSingleDelete(admin.id);
                                      setOpenDropdownId(null);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 w-full text-left"
                                  >
                                    <FaTrash /> Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                roleColors[admin.role]
                              }`}
                            >
                              {admin.role}
                            </span>

                            {admin.role === ROLES.OWNER && (
                              <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                                Owner
                              </span>
                            )}
                          </div>

                          <div className="mt-4 flex justify-between text-sm text-gray-500">
                            <div>
                              Created:{" "}
                              {admin.created_at
                                ? new Date(
                                    admin.created_at.seconds * 1000
                                  ).toLocaleDateString()
                                : "N/A"}
                            </div>
                            <div>
                              Last Active:{" "}
                              {admin.updated_at
                                ? new Date(
                                    admin.updated_at.seconds * 1000
                                  ).toLocaleDateString()
                                : "N/A"}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </main>

            {/* Add Admin Modal */}
            {isAddFormOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-gray-300">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-5 pb-3 border-b">
                      <h2 className="text-xl font-bold text-gray-800">
                        Add New Admin
                      </h2>
                      <button
                        onClick={() => {
                          setIsAddFormOpen(false);
                          resetInputForm();
                        }}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <FaTimes size={20} />
                      </button>
                    </div>
                    <form onSubmit={handleAddSubmit} className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name *
                        </label>
                        <input
                          value={input.admin_name}
                          onChange={(e) =>
                            setInput({ ...input, admin_name: e.target.value })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none bg-gray-50"
                          placeholder="John Doe"
                        />
                        {error.admin_name && (
                          <p className="text-red-500 text-sm mt-1">
                            {error.admin_name}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <input
                          value={input.admin_email}
                          onChange={(e) =>
                            setInput({ ...input, admin_email: e.target.value })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none bg-gray-50"
                          placeholder="admin@example.com"
                        />
                        {error.admin_email && (
                          <p className="text-red-500 text-sm mt-1">
                            {error.admin_email}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Password *
                        </label>
                        <input
                          type="password"
                          value={input.admin_password}
                          onChange={(e) =>
                            setInput({
                              ...input,
                              admin_password: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none bg-gray-50"
                          placeholder="••••••••"
                        />
                        {error.admin_password && (
                          <p className="text-red-500 text-sm mt-1">
                            {error.admin_password}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Role *
                        </label>
                        <select
                          value={input.role}
                          onChange={(e) =>
                            setInput({ ...input, role: e.target.value })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none bg-gray-50"
                        >
                          <option value={ROLES.SUPPORT}>Support Staff</option>
                          <option value={ROLES.CHC_MANAGER}>CHC Manager</option>
                          <option value={ROLES.ADMIN}>Administrator</option>
                          <option value={ROLES.OWNER}>Owner</option>
                        </select>
                      </div>

                      <div className="flex justify-end gap-3 pt-3">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddFormOpen(false);
                            resetInputForm();
                          }}
                          className="px-5 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 text-gray-700"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors shadow-md"
                        >
                          Add Admin
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Admin Modal */}
            {isEditModalOpen && currentAdmin && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-gray-300">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-5 pb-3 border-b">
                      <h2 className="text-xl font-bold text-gray-800">
                        Edit Admin
                      </h2>
                      <button
                        onClick={() => setIsEditModalOpen(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <FaTimes size={20} />
                      </button>
                    </div>
                    <form onSubmit={handleEditSubmit} className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name *
                        </label>
                        <input
                          value={currentAdmin.admin_name}
                          onChange={(e) =>
                            setCurrentAdmin({
                              ...currentAdmin,
                              admin_name: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none bg-gray-50"
                        />
                        {error.admin_name && (
                          <p className="text-red-500 text-sm mt-1">
                            {error.admin_name}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <input
                          value={currentAdmin.admin_email}
                          onChange={(e) =>
                            setCurrentAdmin({
                              ...currentAdmin,
                              admin_email: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none bg-gray-50"
                        />
                        {error.admin_email && (
                          <p className="text-red-500 text-sm mt-1">
                            {error.admin_email}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Password
                        </label>
                        <input
                          type="password"
                          value={currentAdmin.admin_password}
                          onChange={(e) =>
                            setCurrentAdmin({
                              ...currentAdmin,
                              admin_password: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none bg-gray-50"
                          placeholder="Leave blank to keep current"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Role *
                        </label>
                        <select
                          value={currentAdmin.role}
                          onChange={(e) =>
                            setCurrentAdmin({
                              ...currentAdmin,
                              role: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none bg-gray-50"
                        >
                          <option value={ROLES.SUPPORT}>Support Staff</option>
                          <option value={ROLES.CHC_MANAGER}>CHC Manager</option>
                          <option value={ROLES.ADMIN}>Administrator</option>
                          <option value={ROLES.OWNER}>Owner</option>
                        </select>
                      </div>

                      <div className="flex justify-end gap-3 pt-3">
                        <button
                          type="button"
                          onClick={() => setIsEditModalOpen(false)}
                          className="px-5 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 text-gray-700"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors shadow-md"
                        >
                          Update Admin
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </SidebarWrapper>
      </ToastProvider>
    </AdminProtectedRoutes>
  );
}
