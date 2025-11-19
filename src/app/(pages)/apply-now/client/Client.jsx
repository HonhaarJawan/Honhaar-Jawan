"use client";
import SiteDetails from "@/Data/SiteData";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { ImSpinner } from "react-icons/im";
import {
  FaUserPlus,
  FaSignInAlt,
  FaGraduationCap,
  FaArrowRight,
} from "react-icons/fa";

const Client = () => {
  const [loading, setLoading] = useState(null);
  const router = useRouter();

  const handleClickie = (e, index, path) => {
    e.preventDefault();
    setLoading(index);
    setTimeout(() => {
      router.push(path);
    }, 0);
  };

  const cards = [
    {
      title: "New Registration",
      description: "Create your account to start your admission journey",
      path: "/new-registration",
      index: 0,
      icon: FaUserPlus,
    },
    {
      title: "Candidate Login",
      description: "Access your existing account to continue application",
      path: "/login",
      index: 1,
      icon: FaSignInAlt,
    },
    {
      title: "Admission Guidance",
      description: "Learn about our enrollment process and requirements",
      path: "/enrollment-process",
      index: 2,
      icon: FaGraduationCap,
    },
  ];

  return (
    <main className="  h-full bg-gradient-to-r  from-lime-300 via-green-200 to-emerald-200 py-16 px-4">
      <div className=" mx-auto justify-center items-center felx max-w-7xl">
        <div className="">
          {/* Header Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-2 text-center">
            <div className="flex justify-center mb-6">
              <img
                src={SiteDetails.logo}
                className="h-20"
                alt="honhaar Jawan Logo"
              />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-6">
              Welcome To {SiteDetails.programName} Admissions Portal
            </h1>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto leading-relaxed">
              Register yourself as a new applicant. After successful
              registration, check your email for the login credentials we sent
              you. Enter your email and password to log in to the Candidate
              Portal.
            </p>
          </div>
         

          {/* Action Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {cards.map(({ title, description, path, index, icon: Icon }) => (
              <button
                key={index}
                onClick={(e) => handleClickie(e, index, path)}
                disabled={loading === index}
                className="group bg-white rounded-xl shadow-lg p-6 text-left hover:shadow-xl  border border-gray-100"
              >
                <div className="flex flex-col h-full">
                  {/* Icon */}
                  <div className="flex items-center justify-center w-12 h-12 bg-green-500 rounded-lg mb-4 group-hover:bg-green-600 transition-colors">
                    <Icon className="text-white text-xl" />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">
                      {title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                      {description}
                    </p>
                  </div>

                  {/* Button State */}
                  <div className="flex items-center justify-between">
                    {loading === index ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <ImSpinner className="animate-spin" size={18} />
                        <span className="font-medium">Processing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-green-600 font-medium">
                        <span>Get Started</span>
                        <FaArrowRight className="text-sm group-hover:translate-x-1 transition-transform" />
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
         <div className="w-full p-4 my-4 bg-yellow-100 border-l-4 border-yellow-500 rounded-md">
            <div className="flex items-start gap-3">
              <svg
                className="w-6 h-6 text-yellow-600 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l6.518 11.592A1.75 1.75 0 0116.518 17H3.482a1.75 1.75 0 01-1.742-2.309L8.257 3.1zM11 14a1 1 0 10-2 0 1 1 0 002 0zm-.25-2.75a.75.75 0 01-1.5 0V8a.75.75 0 011.5 0v3.25z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h2 className="text-lg font-semibold text-yellow-800">
                  Important Eligibility Notice
                </h2>
                <p className="text-sm text-yellow-700 mt-1 leading-relaxed">
                  The <strong>Honhaar Student Card</strong> is issued only to
                  participants who have successfully completed the full
                  admission process and achieved
                  <strong> 100% completion</strong> in their enrolled course.
                  Applicants who have not fulfilled these requirements will not
                  be considered eligible for issuance.
                </p>
              </div>
            </div>
          </div>
      </div>
    </main>
  );
};

export default Client;
