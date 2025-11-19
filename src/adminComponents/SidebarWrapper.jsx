"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FaUser,
  FaEnvelope,
  FaUsers,
  FaChevronDown,
  FaChevronUp,
  FaBars,
  FaTimes,
  FaExclamationTriangle,
  FaSignOutAlt,
  FaGlobe,
  FaUserCircle,
  FaMoon,
  FaSun,
  FaMailBulk,
  FaEnvelopeOpen,
  FaPrint,
  FaCheckCircle,
  FaList,
  FaFileAlt,
  FaPlus,
  FaTools,
  FaChevronLeft,
  FaChevronRight,
  FaHome,
  FaCog,
  FaFilter,
  FaRocket,
  FaChartLine,
  FaClipboardList,
  FaWrench,
  FaInbox,
  FaUserShield,
  FaBell,
  FaSearch,
  FaArrowLeft,
  FaTh,
  FaEllipsisV,
  FaUserEdit,
  FaPalette,
  FaLanguage,
  FaQuestionCircle,
} from "react-icons/fa";
import { MdOutlineDashboard, MdNotificationsActive } from "react-icons/md";
import { IoMdStats } from "react-icons/io";
import { HiMenuAlt2 } from "react-icons/hi";
import Cookies from "js-cookie";
import useAdmin from "../Hooks/adminHooks";
import { ROLES } from "@/ProtectedRoutes/AdminProtectedRoutes";
import SiteDetails from "@/Data/SiteData";
import { FaBoltLightning } from "react-icons/fa6";

const SidebarWrapper = ({ children, onSettingsChange }) => {
  const [openDropdowns, setOpenDropdowns] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [filteredMenuItems, setFilteredMenuItems] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [rawEmailView, setRawEmailView] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState(0);
  const [notificationCount, setNotificationCount] = useState(3);
  const sidebarRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const settingsModalRef = useRef(null);
  const router = useRouter();

  const { adminData, loading } = useAdmin();

  const allMenuItems = [
    {
      label: "Dashboard",
      icon: <MdOutlineDashboard size={20} />,
      href: "/admin/dashboard",
      badge: null,
    },
    {
      label: "Issues Panel",
      icon: <FaExclamationTriangle size={18} />,
      href: "/admin/dashboard/issues",
    },
    {
      label: "CHC Requests",
      icon: <FaInbox size={18} />,
      items: [
        {
          label: "Printing",
          href: "/admin/dashboard/chc-requests?status=printing",
          icon: <FaPrint size={14} />,
        },
        {
          label: "Processing",
          href: "/admin/dashboard/chc-requests?status=processing",
          icon: <FaCog size={14} />,
        },
        {
          label: "Delivered",
          href: "/admin/dashboard/chc-requests?status=delivered",
          icon: <FaCheckCircle size={14} />,
        },
        {
          label: "All Requests",
          href: "/admin/dashboard/chc-requests?status=all",
          icon: <FaList size={14} />,
        },
      ],
    },
    {
      label: "Developer Tools",
      icon: <FaWrench size={18} />,
      items: [
        {
          label: "Manage Admins",
          href: "/admin/dashboard/manage-admins",
          icon: <FaUserShield size={14} />,
        },
        {
          label: "Emails",
          href: "/admin/dashboard/emails-management",
          icon: <FaEnvelope size={14} />,
        },
      ],
    },
  ];

  // Set default raw email view based on admin role
  useEffect(() => {
    if (adminData?.role === ROLES.ADMIN || adminData?.role === ROLES.OWNER) {
      setRawEmailView(true);
      if (onSettingsChange) {
        onSettingsChange(true);
      }
    }
  }, [adminData]);

  // Filter menu items based on admin role
  useEffect(() => {
    if (adminData?.role) {
      if (adminData.role === ROLES.OWNER || adminData.role === ROLES.ADMIN) {
        setFilteredMenuItems(allMenuItems);
      } else if (adminData.role === ROLES.SUPPORT) {
        setFilteredMenuItems(
          allMenuItems.filter(
            (item) =>
              item.href === "/admin/dashboard/issues" ||
              item.label === "Contact Queries"
          )
        );
      }
    } else {
      setFilteredMenuItems(
        allMenuItems.filter(
          (item) =>
            item.href === "/admin/dashboard/issues" ||
            item.label === "Contact Queries"
        )
      );
    }
  }, [adminData?.role]);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add("dark-theme");
      document.body.classList.remove("light-theme");
    } else {
      document.body.classList.add("light-theme");
      document.body.classList.remove("dark-theme");
    }
  }, [isDarkMode]);

  useEffect(() => {
    const handleClickOutsideSidebar = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setIsSidebarOpen(false);
      }
    };

    const handleClickOutsideProfileDropdown = (e) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(e.target)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };

    const handleClickOutsideSettingsModal = (e) => {
      if (
        settingsModalRef.current &&
        !settingsModalRef.current.contains(e.target)
      ) {
        setIsSettingsModalOpen(false);
      }
    };

    if (isSidebarOpen) {
      document.addEventListener("mousedown", handleClickOutsideSidebar);
    }

    if (isProfileDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutsideProfileDropdown);
    }

    if (isSettingsModalOpen) {
      document.addEventListener("mousedown", handleClickOutsideSettingsModal);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutsideSidebar);
      document.removeEventListener(
        "mousedown",
        handleClickOutsideProfileDropdown
      );
      document.removeEventListener(
        "mousedown",
        handleClickOutsideSettingsModal
      );
    };
  }, [isSidebarOpen, isProfileDropdownOpen, isSettingsModalOpen]);

  const handleDropdownClick = (idx) => {
    if (!isSidebarExpanded && window.innerWidth >= 1024) {
      // If collapsed, expand first then open dropdown
      setIsSidebarExpanded(true);
      setTimeout(() => {
        setOpenDropdowns((prev) =>
          prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
        );
      }, 150);
      return;
    }

    setOpenDropdowns((prevOpenDropdowns) =>
      prevOpenDropdowns.includes(idx)
        ? prevOpenDropdowns.filter((i) => i !== idx)
        : [...prevOpenDropdowns, idx]
    );
  };

  const handleMenuItemClick = (href, idx) => {
    setActiveMenuItem(idx);
    router.push(href);
    setIsSidebarOpen(false);
  };

  const handleLogout = () => {
    Cookies.remove("admin_data");
    localStorage.removeItem("admin_email");
    router.push("/");
  };

  const toggleSidebar = () => {
    if (window.innerWidth >= 1024) {
      setIsSidebarExpanded(!isSidebarExpanded);
      if (isSidebarExpanded) {
        setOpenDropdowns([]);
      }
    } else {
      setIsSidebarOpen(!isSidebarOpen);
    }
  };

  const handleRawEmailViewChange = (enabled) => {
    setRawEmailView(enabled);
    if (onSettingsChange) {
      onSettingsChange(enabled);
    }
  };

  const isExpanded = isSidebarExpanded || isSidebarOpen;

  // Tooltip component for collapsed state
  const Tooltip = ({ children, content, show }) => {
    if (!show || isExpanded) return children;

    return (
      <div className="relative group">
        {children}
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-sm px-2 py-1 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
          {content}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-stone-50 to-emerald-50">
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div className="fixed  bg-black/50 backdrop-blur-sm z-30 lg:hidden" />
      )}
      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 bg-gradient-to-b from-stone-700 to-emerald-900 text-white shadow-2xl flex flex-col z-40 transition-all duration-300 ease-in-out
              ${
                isSidebarOpen ? "translate-x-0 w-72" : "-translate-x-full w-72"
              } 
              lg:relative lg:translate-x-0 lg:block
              ${isSidebarExpanded ? "lg:w-72" : "lg:w-20"}
              `}
        style={{
          backgroundImage: `linear-gradient(to bottom, #57534e, #064e3b), url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          backgroundBlend: "multiply",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/20 h-20 px-6 bg-gradient-to-r from-stone-800/90 to-emerald-900/90 backdrop-blur-sm">
          <div className="flex items-center gap-4 min-w-0 overflow-hidden">
            <div className="relative">
              <img
                src={SiteDetails.whitelogo}
                className="w-12 h-12 rounded-lg shadow-lg"
                alt=""
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-stone-800"></div>
            </div>
            <div
              className={`transition-all duration-300 overflow-hidden ${
                isExpanded ? "opacity-100 max-w-none" : "opacity-0 max-w-0"
              }`}
            >
              <h1 className="text-xl font-bold text-white whitespace-nowrap">
                Admin Portal
              </h1>
            </div>
          </div>

          {/* Toggle button - only visible on desktop */}
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all flex-shrink-0"
            title={isSidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isSidebarExpanded ? (
              <FaChevronLeft size={16} className="text-white" />
            ) : (
              <FaChevronRight size={16} className="text-white" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4 overflow-y-auto overflow-x-hidden">
          <nav className="space-y-2">
            {/* Menu Items */}
            {filteredMenuItems.map((item, idx) => (
              <div key={idx} className="group/item">
                {!item.items ? (
                  <Tooltip content={item.label} show={!isExpanded}>
                    <button
                      onClick={() => handleMenuItemClick(item.href, idx)}
                      className={`flex items-center gap-3 w-full text-left p-3 rounded-xl transition-all duration-200 group relative ${
                        activeMenuItem === idx
                          ? "bg-gradient-to-r from-emerald-600 to-stone-600 shadow-lg"
                          : "bg-white/10 hover:bg-white/20"
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 ${
                          activeMenuItem === idx
                            ? "text-white"
                            : "text-stone-200 group-hover:text-white"
                        }`}
                      >
                        {item.icon}
                      </div>
                      <span
                        className={`font-medium whitespace-nowrap transition-all duration-300 ${
                          isExpanded
                            ? "opacity-100 translate-x-0"
                            : "opacity-0 -translate-x-4"
                        } ${
                          activeMenuItem === idx
                            ? "text-white"
                            : "text-stone-100 group-hover:text-white"
                        }`}
                      >
                        {item.label}
                      </span>
                      {item.badge && (
                        <span
                          className={`absolute right-3 px-2 py-0.5 text-xs rounded-full ${
                            activeMenuItem === idx
                              ? "bg-white/20 text-white"
                              : "bg-red-500 text-white"
                          } ${isExpanded ? "opacity-100" : "opacity-0"}`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  </Tooltip>
                ) : (
                  <>
                    <Tooltip content={item.label} show={!isExpanded}>
                      <button
                        onClick={() => handleDropdownClick(idx)}
                        className={`flex items-center justify-between w-full p-3 rounded-xl transition-all duration-200 group ${
                          openDropdowns.includes(idx)
                            ? "bg-gradient-to-r from-emerald-600 to-stone-600 shadow-lg"
                            : "bg-white/10 hover:bg-white/20"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`flex-shrink-0 ${
                              openDropdowns.includes(idx)
                                ? "text-white"
                                : "text-stone-200 group-hover:text-white"
                            }`}
                          >
                            {item.icon}
                          </div>
                          <span
                            className={`font-medium whitespace-nowrap transition-all duration-300 ${
                              openDropdowns.includes(idx)
                                ? "text-white"
                                : "text-stone-100 group-hover:text-white"
                            } ${
                              isExpanded
                                ? "opacity-100 translate-x-0"
                                : "opacity-0 -translate-x-4"
                            }`}
                          >
                            {item.label}
                          </span>
                        </div>
                        <div
                          className={`flex-shrink-0 transition-all duration-300 ${
                            isExpanded
                              ? "opacity-100 translate-x-0"
                              : "opacity-0 translate-x-4"
                          }`}
                        >
                          {openDropdowns.includes(idx) ? (
                            <FaChevronUp size={12} className="text-white" />
                          ) : (
                            <FaChevronDown
                              size={12}
                              className="text-stone-200 group-hover:text-white"
                            />
                          )}
                        </div>
                      </button>
                    </Tooltip>

                    {/* Dropdown Items */}
                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        openDropdowns.includes(idx) && isExpanded
                          ? "max-h-96 opacity-100 mt-2"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="ml-4 space-y-1 border-l-2 border-stone-400/50 pl-4">
                        {item.items.map((sub, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => handleMenuItemClick(sub.href)}
                            className="flex items-center gap-3 w-full text-left p-2.5 rounded-lg text-sm text-stone-100 hover:bg-white/10 hover:text-white transition-all duration-200 group"
                          >
                            <div className="w-2 h-2 rounded-full bg-stone-400 flex-shrink-0 group-hover:bg-white transition-colors"></div>
                            <span className="whitespace-nowrap">
                              {sub.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-20 px-6 bg-white shadow-md border-b border-primary flex items-center justify-end">
          <div className="flex items-center gap-3">
            {/* Profile Dropdown */}
            {!loading && adminData ? (
              <div className="relative" ref={profileDropdownRef}>
                <button
                  onClick={() =>
                    setIsProfileDropdownOpen(!isProfileDropdownOpen)
                  }
                  className="flex items-center gap-3 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-stone-600 text-white font-medium focus:outline-none shadow-md hover:shadow-lg transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {adminData.admin_name?.charAt(0) || "A"}
                    </span>
                  </div>
                  <span className="hidden md:block font-semibold">
                    {adminData.role
                      ? adminData.role.charAt(0).toUpperCase() +
                        adminData.role.slice(1)
                      : "Admin"}
                  </span>
                  {isProfileDropdownOpen ? (
                    <FaChevronUp size={12} className="hidden md:block" />
                  ) : (
                    <FaChevronDown size={12} className="hidden md:block" />
                  )}
                </button>

                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl z-50 overflow-hidden border border-gray-100">
                    <div className="py-4 px-4 bg-gradient-to-r from-emerald-500 to-stone-600 text-white">
                      <p className="font-bold truncate">
                        {adminData.admin_name || "Admin"}
                      </p>
                      <p className="text-emerald-100 text-xs truncate mt-1">
                        {adminData.admin_email || "admin@example.com"}
                      </p>
                    </div>

                    <div className="py-2">
                      <button
                        onClick={() => {
                          router.push("/admin/profile");
                          setIsProfileDropdownOpen(false);
                        }}
                        className="flex items-center gap-3 w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <FaUserEdit size={16} className="text-emerald-500" />
                        <span className="font-medium">Edit Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          router.push("/admin/settings");
                          setIsProfileDropdownOpen(false);
                        }}
                        className="flex items-center gap-3 w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <FaCog size={16} className="text-emerald-500" />
                        <span className="font-medium">Settings</span>
                      </button>

                      <button
                        onClick={() => {
                          router.push("/");
                          setIsProfileDropdownOpen(false);
                        }}
                        className="flex items-center gap-3 w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <FaGlobe size={16} className="text-emerald-500" />
                        <span className="font-medium">Back To Site</span>
                      </button>

                      <button
                        onClick={() => {
                          handleLogout();
                          setIsProfileDropdownOpen(false);
                        }}
                        className="flex items-center gap-3 w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 border-t border-gray-100 transition-colors"
                      >
                        <FaSignOutAlt size={16} />
                        <span className="font-medium">Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
                <span className="font-medium text-gray-500 hidden md:block">
                  Loading...
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-gray-50 p-6">{children}</div>

        {/* Bottom nav for mobile */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg flex justify-around p-2 lg:hidden z-20">
          {filteredMenuItems.slice(0, 4).map((item, idx) =>
            !item.items ? (
              <button
                key={idx}
                onClick={() => handleMenuItemClick(item.href, idx)}
                className={`flex flex-col items-center justify-center text-xs p-2 rounded-xl transition-colors flex-1 ${
                  activeMenuItem === idx
                    ? "text-emerald-600 bg-emerald-50"
                    : "text-gray-500"
                }`}
              >
                <div
                  className={`mb-1 ${activeMenuItem === idx ? "text-emerald-600" : "text-gray-400"}`}
                >
                  {item.icon}
                </div>
                <span className="truncate font-medium">{item.label}</span>
              </button>
            ) : null
          )}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="flex flex-col items-center justify-center text-xs p-2 rounded-xl text-gray-500 flex-1"
          >
            <FaTh size={20} className="mb-1 text-gray-400" />
            <span className="truncate font-medium">More</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SidebarWrapper;
