"use client";
import React, { useState } from "react";
import {
  FaBook,
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms & Conditions</h1>
          <p className="text-gray-600">The terms governing your use of {siteName}'s website and services. Last updated: June 15, 2024</p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Introduction */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <FaBook className="text-gray-700" />
              <h2 className="text-2xl font-semibold text-gray-800">Introduction</h2>
            </div>
            <p className="text-gray-700">
              Welcome to {siteName}. These Terms and Conditions govern your access to and use of our website, products, and services. By accessing our platform, you agree to comply with these terms in full.
            </p>
          </div>

          {/* Use of Our Services */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <FaUserCircle className="text-gray-700" />
              <h2 className="text-2xl font-semibold text-gray-800">Use of Our Services</h2>
            </div>
            <p className="text-gray-700">
              You agree to use {siteName}'s services responsibly and for lawful purposes only. You must not misuse, disrupt, or attempt to gain unauthorized access to any part of the website or services.
            </p>
          </div>

          {/* User Accounts */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <FaCog className="text-gray-700" />
              <h2 className="text-2xl font-semibold text-gray-800">User Accounts</h2>
            </div>
            <p className="text-gray-700">
              To access certain features, you may be required to register and create an account. You agree to provide accurate and up-to-date information and are responsible for maintaining the security of your account credentials.
            </p>
          </div>

          {/* Limitation of Liability */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <FaCookieBite className="text-gray-700" />
              <h2 className="text-2xl font-semibold text-gray-800">Limitation of Liability</h2>
            </div>
            <p className="text-gray-700">
              {siteName} shall not be held liable for any direct, indirect, incidental, or consequential damages resulting from your use or inability to use our website or services.
            </p>
          </div>

          {/* Governing Law */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <FaShieldAlt className="text-gray-700" />
              <h2 className="text-2xl font-semibold text-gray-800">Governing Law</h2>
            </div>
            <p className="text-gray-700">
              These terms shall be governed by and construed in accordance with the laws of Pakistan. Any disputes will be subject to the exclusive jurisdiction of the courts of Pakistan.
            </p>
          </div>

          {/* Changes to Terms */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <FaHandshake className="text-gray-700" />
              <h2 className="text-2xl font-semibold text-gray-800">Changes to Terms</h2>
            </div>
            <p className="text-gray-700">
              {siteName} reserves the right to update or change these Terms and Conditions at any time. Changes will become effective immediately upon being posted on this page.
            </p>
          </div>

          {/* Contact Us */}
          <div className="pt-8">
            <div className="flex items-center gap-3 mb-4">
              <FaUserLock className="text-gray-700" />
              <h2 className="text-2xl font-semibold text-gray-800">Contact Us</h2>
            </div>
            <p className="text-gray-700 mb-6">
              If you have any questions about these Terms & Conditions, please contact us:
            </p>
            <button
              onClick={() => handleClickie("/contact", 1)}
              className="group relative overflow-hidden inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors transform hover:-translate-y-0.5 transition-all duration-300"
            >
              {loading === 1 ? (
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
                <span className="font-semibold">Important:</span> By using our services, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions. Please review them periodically for any updates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Client
