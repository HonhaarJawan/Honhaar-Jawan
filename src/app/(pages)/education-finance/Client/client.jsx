"use client";
import React from "react";
import Link from "next/link";
import Navbar from "@/components/primary/Navbar";
import Copyright from "@/components/primary/Copyright";
import SiteDetails from "@/Data/SiteData";

const Client = ({ applyHref = "/apply-honhaar-student-card" }) => {
  return (
    <div className="min-h-screen py-20 flex flex-col">
      {/* Header with Logo */}
      <header className="text-white py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="w-24 h-24 flex items-center justify-center mr-4">
                <img src={SiteDetails.logo} alt="" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-6">
        <div className="max-w-7xl w-full">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              Study Abroad & Education Finance
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Government-backed initiative empowering students with financial
              and guidance support for overseas education and higher learning.
            </p>
          </div>

          {/* Combined Scheme Cards */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Study Abroad Guidance Card */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300">
              <div className="bg-sec2 px-6 py-3  text-white">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <h3 className="text-2xl font-bold">
                      Study Abroad Guidance
                    </h3>

                    <p className="mt-2 text-blue-100">
                      Global Education Opportunities
                    </p>
                  </div>
                  <div className="w-16 h-20">
                    <img
                      src={SiteDetails.whitelogo}
                      className="w-full h-full"
                      alt=""
                    />
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-700 mb-4">
                  Comprehensive support for students seeking international
                  education opportunities, including admission guidance, visa
                  assistance, and mentorship for global academic success.
                </p>
                <ul className="space-y-2 mb-6">
                  {[
                    "Admission guidance for international universities",
                    "Student visa and document processing assistance",
                    "Mentorship for Honhaar Card applications abroad",
                    "Pre-departure orientation and cultural training",
                    "Connection with alumni networks overseas",
                  ].map((item, index) => (
                    <li key={index} className="flex items-start">
                      <svg
                        className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="bg-yellow-50 p-4 rounded-lg mb-6">
                  <p className="text-sm text-gray-700">
                    <strong>Eligibility:</strong> Available to students enrolled
                    in {SiteDetails.programName} Punjab who demonstrate academic
                    merit and desire to pursue higher education internationally.
                  </p>
                </div>
                <Link
                  href={`${applyHref}?benefit=study-abroad`}
                  className="block w-full bg-sec2 hover:bg-primary text-white font-semibold py-3 px-6 rounded-lg text-center transition-colors"
                >
                  Apply for Study Abroad Guidance
                </Link>
              </div>
            </div>

            {/* Education Finance Card */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300">
              <div className="bg-sec2 px-6 py-3  text-white">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <h3 className="text-2xl font-bold">Education Finance</h3>

                    <p className="mt-2 text-blue-100">
                      Financial Support for Higher Education
                    </p>
                  </div>
                  <div className="w-16 h-20">
                    <img
                      src={SiteDetails.whitelogo}
                      className="w-full h-full"
                      alt=""
                    />
                  </div>
                </div>
              </div>

              <div className="p-6">
                <p className="text-gray-700 mb-4">
                  Comprehensive financial assistance programs supporting tuition
                  fees, educational expenses, and living costs for students
                  pursuing higher education both locally and internationally.
                </p>
                <ul className="space-y-2 mb-6">
                  {[
                    "Education fee support for local and international programs",
                    "Partial or full financing for tuition and expenses",
                    "Financial literacy workshops and counseling",
                    "Scholarship and grant application assistance",
                    "Low-interest education loans for qualified students",
                  ].map((item, index) => (
                    <li key={index} className="flex items-start">
                      <svg
                        className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="bg-yellow-50 p-4 rounded-lg mb-6">
                  <p className="text-sm text-gray-700">
                    <strong>Eligibility:</strong> Available to students enrolled
                    in {SiteDetails.programName} Punjab who meet academic
                    performance criteria and demonstrate financial need.
                  </p>
                </div>
                <Link
                  href={`${applyHref}?benefit=education-finance`}
                  className="block w-full bg-sec2 hover:bg-primary text-white font-semibold py-3 px-6 rounded-lg text-center transition-colors"
                >
                  Apply for Education Finance
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Client;
