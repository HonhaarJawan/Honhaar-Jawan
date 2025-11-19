"use client";
import React, { useState } from "react";
import {
  FaExclamationTriangle,
  FaMoneyBillWave,
  FaInfoCircle,
  FaEnvelope,
  FaClock,
  FaCheckCircle,
  FaBan,
} from "react-icons/fa";
import { useRouter } from "next/navigation";
import { ImSpinner } from "react-icons/im";
import SiteDetails from "@/Data/SiteData";

const Client = () => {
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
          <FaMoneyBillWave className="text-4xl text-gray-700 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Refund Policy
          </h1>
          <p className="text-gray-600">Last updated: November 2, 2025</p>
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
              Thank you for choosing {SiteDetails.programName}! Please take a moment to review our
              Refund Policy. By enrolling in the program, you agree to the terms
              outlined below.
            </p>
          </div>

          {/* Fee Structure */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <FaMoneyBillWave className="text-gray-700" />
              <h2 className="text-2xl font-semibold text-gray-800">
                Fee Structure
              </h2>
            </div>
            <p className="text-gray-700 mb-4">
              The fee for the {SiteDetails.programName} is 5000 Pakistani Rupees (PKR) 
            </p>
            <div className="border-l-4 border-gray-300 pl-4 py-2">
              <div className="flex items-center gap-2 text-lg font-medium text-gray-800">
                <FaMoneyBillWave className="text-gray-600" />
                Annual Fee: 450 PKR × 12 months = 5,400 PKR
              </div>
            </div>
          </div>

          {/* Non-Refundable Policy */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <FaBan className="text-gray-700" />
              <h2 className="text-2xl font-semibold text-gray-800">
                Non-Refundable Policy
              </h2>
            </div>
            <p className="text-gray-700">
              Once the annual fee is paid, it is generally non-refundable. This
              policy helps us maintain program quality and ensure resources are
              allocated effectively.
            </p>
          </div>

          {/* Eligible Refund Conditions */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <FaCheckCircle className="text-gray-700" />
              <h2 className="text-2xl font-semibold text-gray-800">
                Eligible Refund Conditions
              </h2>
            </div>
            <p className="text-gray-700 mb-4">
              A refund will be provided under the following specific conditions:
            </p>

            <div className="space-y-4 mb-6">
              <div className="flex gap-4 p-4 border border-gray-200 rounded-lg">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-800">
                    Qualification Issues
                  </p>
                  <p className="text-gray-700 text-sm">
                    If you do not meet the necessary qualifications to join the
                    program
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 border border-gray-200 rounded-lg">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-800">Access Issues</p>
                  <p className="text-gray-700 text-sm">
                    If you do not receive access to courses due to errors caused
                    by NITSEP
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-gray-300 p-4 rounded-lg">
              <div className="flex items-center gap-2 font-medium text-gray-800 mb-1">
                <FaClock />
                Time Limit: 30 Days
              </div>
              <p className="text-sm text-gray-700">
                To qualify for a refund, you must notify us within 30 days of
                registration.
              </p>
            </div>
          </div>

          {/* Program Changes */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <FaExclamationTriangle className="text-gray-700" />
              <h2 className="text-2xl font-semibold text-gray-800">
                Program Changes
              </h2>
            </div>
            <p className="text-gray-700">
              In the event that the program is canceled or significantly altered
              by NITSEP, you will be notified in advance. However, the
              non-refundable policy will still apply to any payments made prior
              to such changes unless access to courses is not provided as
              promised.
            </p>
          </div>

          {/* Contact */}
          <div className="pt-8">
            <div className="flex items-center gap-3 mb-4">
              <FaEnvelope className="text-gray-700" />
              <h2 className="text-2xl font-semibold text-gray-800">
                Contact Us
              </h2>
            </div>
            <p className="text-gray-700 mb-6">
              For any further queries regarding this Refund Policy or
              payment-related concerns
            </p>
            <button
              onClick={() => handleClickie("/contact", 2)}
              className="group relative overflow-hidden inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors transform hover:-translate-y-0.5 transition-all duration-300"
            >
              {loading === 2 ? (
                <div className="flex items-center gap-2">
                  <ImSpinner className="animate-spin" size={16} />
                  <span>Redirecting...</span>
                </div>
              ) : (
                <>
                  <FaEnvelope />
                  {supportEmail}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Client;
