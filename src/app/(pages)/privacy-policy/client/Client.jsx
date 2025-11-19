"use client";
import React, { useState } from "react";
import {
  FaInfoCircle,
  FaUserCircle,
  FaCog,
  FaCookieBite,
  FaShieldAlt,
  FaHandshake,
  FaUserLock,
  FaEdit,
  FaEnvelope,
} from "react-icons/fa";
import { useRouter } from "next/navigation";
import { ImSpinner } from "react-icons/im";
import SiteDetails from "@/Data/SiteData";

const Client = () => {
  const siteName = `${SiteDetails.supportEmail}`;
  const supportEmail = `${SiteDetails.supportEmail}`;
  const [loading, setLoading] = useState(null);
  const router = useRouter();

  const handleClickie = (path, buttonIndex) => {
    setLoading(buttonIndex);
    setTimeout(() => {
      router.push(path);
    }, 0);
  };
  return (
    <div className="min-h-screen py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <FaShieldAlt className="text-4xl text-gray-700 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Privacy Policy
          </h1>
          <p className="text-gray-600">
            How we collect, use, and safeguard your data at {siteName}. Last
            updated: June 15, 2024
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Introduction */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <FaInfoCircle className="text-gray-700" />
              <h2 className="text-2xl font-semibold text-gray-800">
                Introduction
              </h2>
            </div>
            <p className="text-gray-700">
              This Privacy Policy explains how {siteName} collects, uses, and
              protects your personal information when you use our website and
              services. By using our website, you agree to the practices
              outlined in this policy.
            </p>
          </div>

          {/* Information We Collect */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <FaUserCircle className="text-gray-700" />
              <h2 className="text-2xl font-semibold text-gray-800">
                Information We Collect
              </h2>
            </div>
            <p className="text-gray-700">
              We collect information you provide while using our services, such
              as your name, email address, and other relevant data required to
              deliver our offerings.
            </p>
          </div>

          {/* How We Use Your Information */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <FaCog className="text-gray-700" />
              <h2 className="text-2xl font-semibold text-gray-800">
                How We Use Your Information
              </h2>
            </div>
            <p className="text-gray-700">
              Your information helps us operate {siteName} efficiently. This
              includes communication, support, and improving user experiences
              across our platform.
            </p>
          </div>

          {/* Cookies */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <FaCookieBite className="text-gray-700" />
              <h2 className="text-2xl font-semibold text-gray-800">Cookies</h2>
            </div>
            <p className="text-gray-700">
              We use cookies and similar technologies to optimize your
              experience on our site. Cookies help personalize content and track
              website performance.
            </p>
          </div>

          {/* Data Security */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <FaShieldAlt className="text-gray-700" />
              <h2 className="text-2xl font-semibold text-gray-800">
                Data Security
              </h2>
            </div>
            <p className="text-gray-700">
              We take security seriously. Although no method is 100% secure, we
              follow best practices to prevent unauthorized access and safeguard
              your information.
            </p>
          </div>

          {/* Third-Party Services */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <FaHandshake className="text-gray-700" />
              <h2 className="text-2xl font-semibold text-gray-800">
                Third-Party Services
              </h2>
            </div>
            <p className="text-gray-700">
              We may partner with third-party services like analytics or payment
              processors. These providers only receive information necessary to
              carry out their tasks.
            </p>
          </div>

          {/* Your Rights */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <FaUserLock className="text-gray-700" />
              <h2 className="text-2xl font-semibold text-gray-800">
                Your Rights
              </h2>
            </div>
            <p className="text-gray-700">
              You have full rights to access, update, or delete the personal
              data we store. Contact us at the email below to exercise your
              rights.
            </p>
          </div>

          {/* Changes to This Policy */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <FaEdit className="text-gray-700" />
              <h2 className="text-2xl font-semibold text-gray-800">
                Changes to This Policy
              </h2>
            </div>
            <p className="text-gray-700">
              {SiteDetails.programName} reserves the right to modify this policy as needed. All
              updates will be posted on this page and are effective immediately.
            </p>
          </div>

          {/* Contact Us */}
          <div className="pt-8">
            <div className="flex items-center gap-3 mb-4">
              <FaEnvelope className="text-gray-700" />
              <h2 className="text-2xl font-semibold text-gray-800">
                Contact Us
              </h2>
            </div>
            <p className="text-gray-700 mb-6">
              If you have questions or concerns about this Privacy Policy, feel
              free to reach out to us:
            </p>
            <button
              onClick={() => handleClickie("/contact", 3)}
              className="group relative overflow-hidden inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors transform hover:-translate-y-0.5 transition-all duration-300"
            >
              {loading === 3 ? (
                <div className="flex items-center gap-2">
                  <ImSpinner className="animate-spin" size={16} />
                  <span>Redirecting...</span>
                </div>
              ) : (
                <>
                  <FaEnvelope />
                  Contact Support
                </>
              )}
            </button>
          </div>
        </div>

        {/* Important Notice */}
        <div className="mt-8 border border-gray-300 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <FaShieldAlt className="text-gray-700 mt-1 flex-shrink-0" />
            <div>
              <p className="text-gray-700">
                <span className="font-semibold">Important:</span> We are
                committed to protecting your privacy and ensuring the security
                of your personal information. Your trust is important to us, and
                we take our responsibility to protect your data seriously.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Client;
