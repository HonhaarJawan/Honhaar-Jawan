"use client";
import React from "react";
import {
  FaArrowRight,
  FaCheckCircle,
  FaFileAlt,
  FaEnvelope,
  FaSignInAlt,
  FaGraduationCap,
  FaCreditCard,
  FaClipboardCheck,
  FaChalkboardTeacher,
  FaMarker,
} from "react-icons/fa";
import { ImSpinner } from "react-icons/im";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";

const Client = () => {
  const [loading, setLoading] = useState(null);
  const router = useRouter();

  const handleClickie = (path, buttonIndex) => {
    setLoading(buttonIndex);
    setTimeout(() => {
      router.push(path);
    }, 0);
  };

  // Animation variants for steps
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const stepVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  // Steps data
  const steps = [
    {
      number: "01",
      title: "Eligibility Check",
      description:
        "Verify your eligibility by confirming your domicile, CNIC, age, and educational qualifications before proceeding with the application.",
      icon: <FaClipboardCheck className="text-white text-xl" />,
    },
    {
      number: "02",
      title: "Review Documents & Online Application",
      description:
        "Fill out the online registration form carefully and submit all required documents for verification.",
      icon: <FaFileAlt className="text-white text-xl" />,
    },
    {
      number: "03",
      title: "Entry Test",
      description:
        "Take the online entry test through your dashboard and achieve a minimum score of 40% to qualify for the next stage.",
      icon: <FaMarker className="text-white text-xl" />,
    },
    {
      number: "04",
      title: "Confirm Your Seat",
      description:
        "Once qualified, confirm your seat by completing the final application steps and paying the processing fee if applicable.",
      icon: <FaCheckCircle className="text-white text-xl" />,
    },
    {
      number: "05",
      title: "Orientation & Start Learning",
      description:
        "Attend your orientation session and log in to the LMS portal using your provided credentials to begin your learning journey.",
      icon: <FaChalkboardTeacher className="text-white text-xl" />,
    },
  ];

  return (
    <div className="flex flex-col justify-center overflow-x-hidden items-center w-full px-4 mt-4">
      {/* Video Section
      <div className="relative w-full max-w-3xl rounded-xl overflow-hidden shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 p-2">
        <div className="w-full h-0 pb-[56.25%] relative transition-transform duration-500 ease-in-out ">
          <iframe
            src="https://player.vimeo.com/video/1052332652?badge=0&autopause=0&player_id=0&app_id=58479"
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            title="Honhaar Jawan How To Apply Final 3.mp4"
            className="absolute top-0 left-0 w-full h-full rounded-lg"
          />
        </div>
      </div>

      <h1 className="text-gray-800 text-2xl mt-6 font-bold text-center">
        How To Apply - Honhaar Jawan Video Tutorial
      </h1>
      <p className="text-gray-500 mt-2 text-lg text-center max-w-2xl">
        Learn how to easily apply using our step-by-step video guide.
      </p> */}

      {/* Steps Section */}
      <div className="w-full max-w-7xl mt-16 mb-5">
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
        >
          {steps.map((step, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 border border-gray-100"
              variants={stepVariants}
              whileHover={{ y: -5 }}
            >
              <div className="flex items-start mb-4">
                <div className="bg-primary w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 mr-4">
                  {step.icon}
                </div>
                <div>
                  <div className="text-xs font-semibold text-second uppercase tracking-wider">
                    Step {step.number}
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mt-1">
                    {step.title}
                  </h3>
                </div>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full max-w-7xl p-4 my-4 bg-yellow-100 border-l-4 border-yellow-500 rounded-md">
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
              participants who have successfully completed the full admission
              process and achieved
              <strong> 100% completion</strong> in their enrolled course.
              Applicants who have not fulfilled these requirements will not be
              considered eligible for issuance.
            </p>
          </div>
        </div>
      </div>
      {/* Proceed Button */}
      <div className="mb-16">
        <button
          onClick={() => handleClickie("/apply-now", 2)}
          className="group relative overflow-hidden bg-primary hover:bg-second text-white font-medium py-3 px-8 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        >
          {loading === 2 ? (
            <div className="flex items-center gap-2">
              <ImSpinner className="animate-spin" size={20} />
              <span>Proceeding to Apply...</span>
            </div>
          ) : (
            <>
              <FaArrowRight />
              <span>Proceed to Apply</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Client;
