"use client";
import React from "react";
import Link from "next/link";
import Navbar from "@/components/primary/Navbar";
import Copyright from "@/components/primary/Copyright";
import SiteDetails from "@/Data/SiteData";

const Cliente = ({ applyHref = "/apply-honhaar-student-card" }) => {
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
              Internship Program
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A government initiative to help students turn their skills into
              practical, career-ready experience.
            </p>
          </div>

          {/* Combined Scheme Cards */}
          <div className="">
            {/* Internship Program Card */}
            <div className="bg-white flex flex-col  w-full rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300">
              <div className="bg-sec2 px-6 py-3  text-white">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <h3 className="text-2xl font-bold">Internship Program</h3>
                    <p className="mt-2 text-blue-100">
                      Real-World Career Experience
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
                  The Internship Program connects talented learners from{" "}
                  {SiteDetails.programName} Punjab with real-world work
                  environments, helping students apply their training to
                  hands-on projects and preparing them for successful careers.
                </p>
                <ul className="space-y-2 mb-6">
                  {[
                    "Guaranteed internship placements for top-performing students",
                    "Work with real clients, government agencies, or local startups",
                    "Mentorship from industry experts and certified trainers",
                    "Earn experience certificates endorsed by Government of Punjab",
                    "Access career counselling and job placement assistance",
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
                    <strong>Eligibility:</strong> Students who have successfully
                    completed at least one certified course under{" "}
                    {SiteDetails.programName} are eligible to apply. Selection
                    is merit-based and subject to seat availability.
                  </p>
                </div>
                <Link
                  href={`${applyHref}?benefit=internship`}
                  className="block w-full bg-sec2 hover:bg-primary text-white font-semibold py-3 px-6 rounded-lg text-center transition-colors"
                >
                  Apply for Internship Program
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Cliente;
