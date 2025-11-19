"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import useAuthStore from "@/store/useAuthStore";
import {
  FaSignInAlt,
  FaUser,
  FaCog,
  FaEdit,
  FaSignOutAlt,
  FaEnvelope,
  FaQuestionCircle,
  FaShieldAlt,
  FaBalanceScale,
  FaMoneyBillWave,
  FaMapMarkerAlt,
  FaPhone,
  FaArrowRight,
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaYoutube,
  FaLinkedinIn,
  FaBlog,
  FaGraduationCap,
  FaCertificate,
  FaHome,
  FaWhatsapp,
} from "react-icons/fa";
import { FiChevronDown, FiX, FiMenu } from "react-icons/fi";
import Link from "next/link";
import EditProfileModal from "./EditProfileModal";
import ProfileSettingModal from "./ProfileEditModal";
import SiteDetails from "@/Data/SiteData";
import { FaX } from "react-icons/fa6";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [supportDropdownOpen, setSupportDropdownOpen] = useState(false);
  const [coursesDropdownOpen, setCoursesDropdownOpen] = useState(false);
  const [resourcesDropdownOpen, setResourcesDropdownOpen] = useState(false);
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [profileSettingModalOpen, setProfileSettingModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isHoveringNav, setIsHoveringNav] = useState(false);
  const [expandedContentOpen, setExpandedContentOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const { user, resetUser } = useAuthStore();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const check = () =>
      setIsMobile(window.matchMedia("(max-width: 1023px)").matches);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handleLogout = () => {
    // perform logout, then redirect to home
    resetUser();
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    router.push("/");
  };

  const navLinks = [
    { label: "Home", href: "/", icon: <FaHome /> },
    { label: "Courses", href: "/courses", icon: <FaGraduationCap /> },
    {
      label: "Certificate Verification",
      href: "/certificate",
      icon: <FaCertificate />,
    },
    {
      label: "Admission Guideline",
      href: "/enrollment-process",
      icon: <FaUser />,
    },
    {
      label: "Honhaar Card",
      href: "/honhaar-student-card",
      icon: <FaMoneyBillWave />,
    },
    { label: "Contact Us", href: "/contact", icon: <FaEnvelope /> },
  ];

  // ✅ Updated Quick Links
  const quickLinks = [
    {
      label: "Study Abroad & Education Finance",
      href: "/education-finance",
    }, // adjust slug if you use a different page
    { label: "Solar & Laptop Scheme", href: "/solar-laptop-scheme" }, // or your combined page slug if you have one
    { label: "Internships", href: "/internships" }, // update if your internships slug differs
    { label: `${SiteDetails.studentCard}`, href: "/honhaar-student-card" },
  ];

  const supportMenuItems = [
    { label: "Contact", href: "/contact", icon: <FaEnvelope /> },
    { label: "FAQ", href: "/faq", icon: <FaQuestionCircle /> },
    { label: "Privacy Policy", href: "/privacy-policy", icon: <FaShieldAlt /> },
    {
      label: "Terms & Conditions",
      href: "/terms-conditions",
      icon: <FaBalanceScale />,
    },
    { label: "News & Events", href: "/blogs", icon: <FaBlog /> },
  ];

  const userMenuItems = [
    {
      label: "Admission Status",
      href: "/dashboard",
      icon: <FaUser className="text-sm" />,
    },
    {
      label: "Edit Profile",
      action: () => setEditProfileModalOpen(true),
      icon: <FaEdit className="text-sm" />,
    },
    {
      label: "Profile Settings",
      action: () => setProfileSettingModalOpen(true),
      icon: <FaCog className="text-sm" />,
    },
    {
      label: "Logout",
      action: handleLogout,
      icon: <FaSignOutAlt className="text-sm" />,
    },
  ];

  return (
    <>
      {/* Modals */}
      <EditProfileModal
        isOpen={editProfileModalOpen}
        onClose={() => setEditProfileModalOpen(false)}
        email={user?.email}
      />
      <ProfileSettingModal
        isOpen={profileSettingModalOpen}
        onClose={() => setProfileSettingModalOpen(false)}
        email={user?.email}
      />

      {/* Navbar */}
      <header
        className={`fixed top-0 w-full border-b z-50 transition-all duration-300 ${
          scrolled
            ? "bg-second2 backdrop-blur-md shadow-lg "
            : "bg-second2 border-b"
        }`}
        onMouseEnter={() => {
          setIsHoveringNav(true);
          if (!isMobile) setExpandedContentOpen(true);
        }}
        onMouseLeave={() => {
          setIsHoveringNav(false);
          if (!isMobile) setExpandedContentOpen(false);
        }}
      >
        {/* Top Navigation Bar */}
        <div
          className={`transition-all duration-300 ${
            scrolled ? "py-2" : "py-4"
          }`}
        >
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center">
              {/* Logo */}
              <Link href="/" className="flex items-center space-x-2 group">
                <img
                  src={SiteDetails.whitelogo}
                  alt="Logo"
                  className="h-12 md:h-16 transition-all duration-300 group-hover:scale-105"
                />
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center space-x-1">
                {navLinks.map((link) => (
                  <div key={link.href} className="relative py-2">
                    <Link
                      href={link.href}
                      className={`relative px-4 py-2 text-sm font-medium flex items-center gap-2 transition-all duration-300 rounded-lg ${
                        pathname === link.href
                          ? "text-white"
                          : "text-white hover:text-yellow-500"
                      }`}
                    >
                      <span>{link.label}</span>
                    </Link>
                  </div>
                ))}

                {/* Support Dropdown */}
                <div className="relative">
                  <button
                    onMouseEnter={() => setSupportDropdownOpen(true)}
                    onMouseLeave={() => setSupportDropdownOpen(false)}
                    className="relative px-4 py-2 text-sm font-medium flex items-center gap-2 transition-all duration-300 rounded-lg text-white hover:text-yellow-500"
                  >
                    <span>Support</span>
                    <FiChevronDown
                      className={`text-xs transition-transform ${
                        supportDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {supportDropdownOpen && (
                      <div
                        onMouseEnter={() => setSupportDropdownOpen(true)}
                        onMouseLeave={() => setSupportDropdownOpen(false)}
                        className="absolute left-0 top-full mt-1 z-50"
                      >
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.2 }}
                          className="w-52 bg-primary rounded-xl shadow-xl border p-2"
                        >
                          {supportMenuItems.map((item, i) => (
                            <Link
                              key={i}
                              href={item.href}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-white hover:text-yellow-500 rounded-md transition-colors"
                            >
                              {item.icon} {item.label}
                            </Link>
                          ))}
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </nav>

              {/* Right side actions */}
              <div className="flex items-center space-x-4">
                {!user ? (
                  <>
                    <Link
                      href="/login"
                      className="hidden md:inline-flex items-center gap-2 text-md text-white hover:text-yellow-500 font-medium transition-all duration-300 bg-sec2 hover:shadow-lg px-4 py-2 rounded-lg"
                    >
                      <FaSignInAlt />
                      <span>Login</span>
                    </Link>
                    <Link
                      href="/apply-now"
                      className="px-5 py-2.5 text-sm font-medium text-white hover:text-yellow-500 bg-sec2 rounded-lg transition-all shadow-md hover:shadow-lg"
                    >
                      <span>Apply Now</span>
                    </Link>
                  </>
                ) : (
                  <div className="relative">
                    <button
                      onMouseEnter={() => setUserDropdownOpen(true)}
                      onMouseLeave={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-lg transition-all duration-300"
                    >
                      <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-sm">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FaUser className="text-primary" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-white hidden md:block">
                        {user.fullName}
                      </span>
                      <FiChevronDown
                        className={`transition-transform ${
                          userDropdownOpen ? "rotate-180" : "text-white"
                        }`}
                      />
                    </button>

                    {/* User dropdown */}
                    <AnimatePresence>
                      {userDropdownOpen && (
                        <div
                          onMouseEnter={() => setUserDropdownOpen(true)}
                          onMouseLeave={() => setUserDropdownOpen(false)}
                          className="absolute right-0 top-full mt-1 z-50"
                        >
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.2 }}
                            className="w-64 bg-primary rounded-xl shadow-xl border p-2"
                          >
                            <div className="p-4 border-b">
                              <Link
                                href="/dashboard"
                                className="flex items-center gap-3 group"
                              >
                                <div className="w-12 h-12 rounded-full bg-sec2 flex items-center justify-center transition-all group-hover:from-blue-200 group-hover:to-blue-300">
                                  <FaUser className="text-white hover:text-yellow-500 transition-all text-xl" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-white group-hover:text-yellow-500 transition-colors">
                                    Admission Status
                                  </h4>
                                  <p className="text-sm text-white">
                                    View your application
                                  </p>
                                </div>
                              </Link>
                            </div>

                            <div className="">
                              {userMenuItems.map((item, i) => (
                                <React.Fragment key={i}>
                                  {item.href ? (
                                    <Link
                                      href={item.href}
                                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-white rounded-lg transition-all group"
                                    >
                                      <span className="text-white group-hover:text-yellow-500 transition-colors">
                                        {item.icon}
                                      </span>
                                      <span className="group-hover:text-yellow-500 transition-colors">
                                        {item.label}
                                      </span>
                                    </Link>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        item.action();
                                      }}
                                      className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-white rounded-lg transition-all group"
                                    >
                                      <span className="text-white group-hover:text-yellow-500 transition-colors">
                                        {item.icon}
                                      </span>
                                      <span className="group-hover:text-yellow-500 text-white transition-colors">
                                        {item.label}
                                      </span>
                                    </button>
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                          </motion.div>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Mobile menu button */}
                <button
                  onClick={() => {
                    setMobileMenuOpen(!mobileMenuOpen);
                    setExpandedContentOpen(false);
                  }}
                  className="lg:hidden p-2 rounded-md text-white transition-colors"
                >
                  {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Expanded Navbar Content - 5 Column Layout */}
        <AnimatePresence>
          {expandedContentOpen && !isMobile && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-second2 border-t border-gray-200"
            >
              <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {/* Column 1: Navigation Links */}
                  <div className="text-center md:text-left">
                    <h3 className="font-bold text-md mb-3 text-white">
                      Navigation
                    </h3>
                    <ul className="space-y-2">
                      {navLinks.map((item) => (
                        <li
                          key={item.href}
                          className="flex items-center justify-center md:justify-start group"
                        >
                          <FaArrowRight className="text-white group-hover:text-yellow-500 mr-2 text-xs transition-colors" />
                          <Link
                            href={item.href}
                            className="text-white group-hover:text-yellow-500 transition-colors flex items-center gap-2 text-sm"
                          >
                            {item.icon}
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Column 2: Quick Links */}
                  <div className="text-center md:text-left">
                    <h3 className="font-bold text-md mb-3 text-white">
                      Quick Links
                    </h3>
                    <ul className="space-y-2">
                      {quickLinks.map((item) => (
                        <li
                          key={item.href}
                          className="flex items-center justify-center md:justify-start group"
                        >
                          <FaArrowRight className="text-white group-hover:text-yellow-500 mr-2 text-xs transition-colors" />
                          <Link
                            href={item.href}
                            className="text-white group-hover:text-yellow-500 transition-colors text-sm"
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Column 3: Support Links */}
                  <div className="text-center md:text-left">
                    <h3 className="font-bold text-md mb-3 text-white">
                      Support
                    </h3>
                    <ul className="space-y-2">
                      {supportMenuItems.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-center justify-center md:justify-start group"
                        >
                          <FaArrowRight className="text-white group-hover:text-yellow-500 mr-2 text-xs transition-colors" />
                          <Link
                            href={item.href}
                            className="text-white group-hover:text-yellow-500 transition-colors flex items-center gap-2 text-sm"
                          >
                            {item.icon}
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Column 4: Contact Info */}
                  <div className="text-center md:text-left">
                    <h3 className="font-bold text-md mb-3 text-white">
                      Contact Info
                    </h3>
                    <ul className="space-y-2">
                      <li className="flex items-center justify-center md:justify-start group">
                        <span className="text-white group-hover:text-yellow-500 transition-all mr-2">
                          <FaMapMarkerAlt />
                        </span>
                        <span className="text-white group-hover:text-yellow-500 transition-all text-sm">
                          Punjab, Pakistan
                        </span>
                      </li>

                      <li className="flex items-center justify-center md:justify-start group">
                        <span className="text-white group-hover:text-yellow-500 transition-all mr-2">
                          <FaWhatsapp />
                        </span>
                        <span className="text-white group-hover:text-yellow-500 transition-all mr-1 text-sm">
                          WhatsApp:
                        </span>{" "}
                        <a className="text-white group-hover:text-yellow-500 transition-all text-sm">
                          {SiteDetails.whatsAppNumber}
                        </a>
                      </li>
                      <li className="flex items-center justify-center md:justify-start group">
                        <span className="text-white group-hover:text-yellow-500 transition-all mr-2">
                          <FaPhone />
                        </span>
                        <span className="text-white group-hover:text-yellow-500 transition-all mr-1 text-sm">
                          UAN Helpline:
                        </span>{" "}
                        <a
                          href={`tel:${SiteDetails.phoneNumber}`}
                          className="text-white group-hover:text-yellow-500 transition-all text-sm"
                        >
                          {SiteDetails.phoneNumber}
                        </a>
                      </li>
                      <li className="flex items-center justify-center md:justify-start group">
                        <span className="text-white group-hover:text-yellow-500 transition-all mr-2">
                          <FaEnvelope />
                        </span>
                        <a
                          href={`mailto:${SiteDetails.supportEmail}`}
                          className="text-white group-hover:text-yellow-500 transition-all text-sm"
                        >
                          {SiteDetails.supportEmail}
                        </a>
                      </li>
                    </ul>
                  </div>

                  {/* Column 5: Social Links & Login Buttons */}
                  <div className="text-center md:text-left">
                    <h3 className="font-bold text-md mb-3 text-white">
                      Follow Us
                    </h3>
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                      <a
                        href="https://www.facebook.com/share/1DWTSyxfEA/?mibextid=wwXIfr"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Facebook"
                        className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-yellow-500 bg-primary text-white transition-colors text-sm"
                      >
                        <FaFacebookF />
                      </a>
                      <a
                        href="https://x.com/honhaarjawan"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Twitter / X"
                        className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-yellow-500 bg-primary text-white transition-colors text-sm"
                      >
                        <FaX />
                      </a>
                      <a
                        href="https://www.instagram.com/honhaarjawan/"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Instagram"
                        className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-yellow-500 bg-primary text-white transition-colors text-sm"
                      >
                        <FaInstagram />
                      </a>
                      <a
                        href="https://www.youtube.com/channel/UCeqwiejxxw5K9i1i-Ebmiyw"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="YouTube"
                        className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-yellow-500 bg-primary text-white transition-colors text-sm"
                      >
                        <FaYoutube />
                      </a>
                    </div>

                    {/* Login Buttons - Only show when user is not logged in */}
                    {!user && (
                      <>
                        <h3 className="font-bold text-md mb-3 text-white">
                          Account
                        </h3>
                        <div className="flex flex-col space-y-2">
                          <Link
                            href="/login"
                            className="inline-flex items-center justify-center gap-2 text-sm text-white hover:text-yellow-500 font-medium transition-all duration-300 bg-sec2 hover:shadow-lg px-3 py-1.5 rounded-lg"
                          >
                            <FaSignInAlt />
                            <span>Login</span>
                          </Link>
                          <Link
                            href="/apply-now"
                            className="px-3 py-1.5 text-sm font-medium text-white hover:text-yellow-500 bg-sec2 rounded-lg transition-all shadow-md hover:shadow-lg text-center"
                          >
                            <span>Apply Now</span>
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="lg:hidden fixed inset-x-0 bg-white border-y border-yellow-500 z-40 flex flex-col"
              style={{
                top: scrolled ? "4rem" : "5rem",
                height: "calc(100vh - 4rem)",
              }}
            >
              {/* Scrollable container */}
              <div className="flex-1 overflow-y-auto">
                <nav className="px-4 py-3">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        pathname === link.href
                          ? "text-blue-600 bg-blue-50"
                          : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="text-gray-500 text-sm">{link.icon}</span>
                      <span>{link.label}</span>
                    </Link>
                  ))}
                  {/* Account/Login pinned at bottom */}
                  <div className="border-t border-gray-200 bg-gray-50 p-4">
                    {!user ? (
                      <div className="flex flex-col space-y-3">
                        <Link
                          href="/login"
                          className="flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-base font-medium text-white bg-sec2 hover:bg-sec2/90 transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <FaSignInAlt className="text-base" />
                          <span>Login to Account</span>
                        </Link>
                        <Link
                          href="/apply-now"
                          className="px-4 py-3 text-base font-medium text-center text-white bg-primary rounded-lg transition-all shadow-md hover:shadow-lg"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <span>Apply Now</span>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Account
                        </div>
                        <div className="space-y-1">
                          {userMenuItems.map((item, i) => (
                            <React.Fragment key={i}>
                              {item.href ? (
                                <Link
                                  href={item.href}
                                  className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-white transition-colors"
                                  onClick={() => setMobileMenuOpen(false)}
                                >
                                  <span className="text-gray-500 text-sm">
                                    {item.icon}
                                  </span>
                                  <span>{item.label}</span>
                                </Link>
                              ) : (
                                <button
                                  onClick={() => {
                                    item.action();
                                    setMobileMenuOpen(false);
                                  }}
                                  className="flex items-center space-x-3 w-full text-left px-3 py-2.5 rounded-lg text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-white transition-colors"
                                >
                                  <span className="text-gray-500 text-sm">
                                    {item.icon}
                                  </span>
                                  <span>{item.label}</span>
                                </button>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Quick links and Support side by side */}
                  <div className="pt-2 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-2">
                      {/* Quick Links Column */}
                      <div>
                        <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Quick Links
                        </div>
                        <div className="">
                          {quickLinks.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                pathname === item.href
                                  ? "text-blue-600 bg-blue-50"
                                  : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                              }`}
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <FaArrowRight className="text-gray-400 text-xs" />
                              <span className="truncate">{item.label}</span>
                            </Link>
                          ))}
                        </div>
                      </div>

                      {/* Support Column */}
                      <div>
                        <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Support
                        </div>
                        <div className="">
                          {supportMenuItems.map((item, i) => (
                            <Link
                              key={i}
                              href={item.href}
                              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <span className="text-gray-500 text-xs">
                                {item.icon}
                              </span>
                              <span className="truncate">{item.label}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Social (mobile) */}
                  <div className="pt-2 border-t border-gray-200">
                    <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Follow Us
                    </div>
                    <div className="flex items-center gap-3 px-3 py-3">
                      <a
                        href="#"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Facebook"
                        className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"
                      >
                        <FaFacebookF className="text-base" />
                      </a>
                      <a
                        href="#"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Twitter"
                        className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"
                      >
                        <FaTwitter className="text-base" />
                      </a>
                      <a
                        href="#"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Instagram"
                        className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"
                      >
                        <FaInstagram className="text-base" />
                      </a>
                      <a
                        href="#"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="YouTube"
                        className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"
                      >
                        <FaYoutube className="text-base" />
                      </a>
                      <a
                        href="#/linkedin"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="LinkedIn"
                        className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"
                      >
                        <FaLinkedinIn className="text-base" />
                      </a>
                    </div>
                  </div>
                </nav>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Simple spacer that accounts for navbar height */}
      <div
        className={` md:py-2 ${
          expandedContentOpen && !isMobile ? "" : ""
        } transition-all duration-300`}
      />
    </>
  );
};

export default Navbar;
