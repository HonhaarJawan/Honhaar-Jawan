"use client";
import React from "react";
import Link from "next/link";
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaYoutube,
  FaLinkedinIn,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaArrowRight,
  FaHome,
  FaGraduationCap,
  FaCertificate,
  FaUser,
  FaMoneyBillWave,
  FaMailchimp,
  FaWhatsapp,
  FaPhone,
} from "react-icons/fa";
import SiteDetails from "@/Data/SiteData";
import { useAuthStore } from "@/store/useAuthStore";
import Copyright from "./Copyright";
import { FiMail } from "react-icons/fi";
import { FaX } from "react-icons/fa6";

const Footer = () => {
  const { user } = useAuthStore();

  // Mirror the navbar’s content so the footer stays consistent
  const navLinks = [
    { label: "Home", href: "/", icon: <FaHome /> },
    { label: "Courses", href: "/courses", icon: <FaGraduationCap /> },
    {
      label: "Certificate Verification",
      href: "/certificate",
      icon: <FaCertificate />,
    },
    {
      label: "Admission Guidance",
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
    { label: "Contact", href: "/contact" },
    { label: "FAQ", href: "/faq" },
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms & Conditions", href: "/terms-conditions" },
    { label: "Refund Policy", href: "/refund-policy" },
    { label: "News & Events", href: "/blogs" },
  ];

  return (
    <>
      <footer className="bg-second text-white relative overflow-hidden">
        {/* Main Footer: 5-column layout */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {/* Col 1 — Brand & Contact summary */}
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-3 mb-4">
                <img
                  src={SiteDetails.whitelogo}
                  alt={SiteDetails.programName}
                  className="h-16 object-contain"
                />
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                {SiteDetails.programName} empowers students across Pakistan with
                practical IT skills and guided pathways into tech careers.
              </p>

              <ul className="space-y-2 mt-5">
                <li className="flex items-start gap-3">
                  <FaMapMarkerAlt className="mt-0.5" />
                  <span className="text-white/80 text-sm">
                    Punjab, Pakistan
                  </span>
                </li>
                <li className="flex items-center justify-center md:justify-start group">
                  <span className="text-white group-hover:text-yellow-500 transition-all mr-2 text-xs">
                    <FaWhatsapp />
                  </span>
                  <span className="text-white/80 group-hover:text-yellow-500 transition-all mr-1 text-xs">
                    WhatsApp:
                  </span>{" "}
                  <a className="text-white/80 group-hover:text-yellow-500 transition-all text-xs">
                    {SiteDetails.whatsAppNumber}
                  </a>
                </li>
                <li className="flex items-center justify-center md:justify-start group">
                  <span className="text-white group-hover:text-yellow-500 transition-all mr-2">
                    <FaPhone />
                  </span>
                  <span className="text-white/80 group-hover:text-yellow-500 transition-all mr-1 text-xs">
                    UAN Helpline:
                  </span>{" "}
                  <a
                    href={`tel:${SiteDetails.phoneNumber}`}
                    className="text-white/80 group-hover:text-yellow-500 transition-all text-xs"
                  >
                    {SiteDetails.phoneNumber}
                  </a>
                </li>

                <li className="flex items-start">
                  <FaEnvelope className="mr-3 text-lg mt-0.5 flex-shrink-0" />
                  <a
                    href={`mailto:${SiteDetails.supportEmail}`}
                    className="text-white/80 text-sm hover:text-yellow-500"
                  >
                    {SiteDetails.supportEmail}
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 2 — Navigation (matches navbar) */}
            <div>
              <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-white/15">
                Navigation
              </h3>
              <ul className="space-y-2">
                {navLinks.map((item) => (
                  <li key={item.href} className="group flex items-center">
                    <FaArrowRight className="text-white mr-2 text-xs group-hover:text-yellow-500 transition-colors" />
                    <Link
                      href={item.href}
                      className="text-white/90 hover:text-yellow-500 transition-colors flex items-center gap-2 text-sm"
                    >
                      <span className="text-white/80">{item.icon}</span>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3 — Quick Links (matches navbar) */}
            <div>
              <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-white/15">
                Quick Links
              </h3>
              <ul className="space-y-2">
                {quickLinks.map((item) => (
                  <li key={item.href} className="group flex items-center">
                    <FaArrowRight className="text-white mr-2 text-xs group-hover:text-yellow-500 transition-colors" />
                    <Link
                      href={item.href}
                      className="text-white/90 hover:text-yellow-500 transition-colors text-sm"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 4 — Support (matches navbar) */}
            <div>
              <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-white/15">
                Support
              </h3>
              <ul className="space-y-2">
                {supportMenuItems.map((item, i) => (
                  <li key={i} className="group flex items-center">
                    <FaArrowRight className="text-white mr-2 text-xs group-hover:text-yellow-500 transition-colors" />
                    <Link
                      href={item.href}
                      className="text-white/90 hover:text-yellow-500 transition-colors text-sm"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 5 — Follow & Account */}
            <div>
              <h3 className="text-lg font-semibold mb-4 pb-2 border-b border-white/15">
                Follow &amp; Account
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
              {!user ? (
                <div className="flex flex-col space-y-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center text-sm font-medium text-second bg-sec2 text-center px-3 py-2 rounded-lg  hover:bg- text-white hover:text-yellow-500 transition"
                  >
                    <span>Login</span>
                  </Link>
                  <Link
                    href="/apply-now"
                    className="inline-flex items-center justify-center text-sm font-medium text-second bg-sec2 text-center px-3 py-2 rounded-lg  hover:bg- text-white hover:text-yellow-500 transition"
                  >
                    Apply Now
                  </Link>
                </div>
              ) : (
                <div className="space-y-2"></div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom bar from your original setup */}
        <Copyright />
      </footer>
    </>
  );
};

export default Footer;
