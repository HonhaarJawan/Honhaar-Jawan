"use client";
import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/primary/Navbar";
import Copyright from "@/components/primary/Copyright";
import SiteDetails from "@/Data/SiteData";

const Client = ({ applyHref = "/apply-honhaar-student-card" }) => {
  return (
    <div className="min-h-screen py-20 flex flex-col">
      {/* Header with Logo */}
      <header className=" text-white py-8 px-6">
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
              Empowering Education Through Technology
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Official Government Digital Empowerment Programs — ensuring
              reliable power and devices so eligible students can fully
              participate in digital education.
            </p>
          </div>

          {/* Combined Scheme Cards */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Laptop Scheme Card */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 ">
              <div className="bg-sec2 px-6 py-3  text-white">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <h3 className="text-2xl font-bold">Laptop Scheme</h3>

                    <p className="mt-2 text-blue-100">
                      Digital Access for Education
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
                  The Laptop Scheme provides new laptops to eligible students at
                  no cost, enabling full participation in digital learning and
                  career development opportunities.
                </p>
                <ul className="space-y-2 mb-6">
                  {[
                    "New laptops for eligible students — no cost",
                    "Enables online classes, portfolio work & freelancing",
                    "Supports technology startups and career advancement",
                    "Equal educational opportunities for all qualified learners",
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
                <div className="bg-yellow-50  p-4 rounded-lg mb-6">
                  <p className="text-sm text-gray-700">
                    <strong>Eligibility:</strong> Available to students enrolled
                    in {SiteDetails.programName} Punjab who meet academic
                    performance criteria.
                  </p>
                </div>
                <Link
                  href={`${applyHref}?benefit=laptop`}
                  className="block w-full bg-sec2 hover:bg-primary text-white font-semibold py-3 px-6 rounded-lg text-center transition-colors"
                >
                  Apply for Laptop Scheme
                </Link>
              </div>
            </div>

            {/* Solar Scheme Card */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 ">
              <div className="bg-sec2 px-6 py-3  text-white">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <h3 className="text-2xl font-bold">Solar Scheme</h3>

                    <p className="mt-2 text-blue-100">
                      Sustainable Power for Education
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
                  The Honhaar Jawan Solar Scheme provides solar energy systems
                  to eligible students, ensuring continuous learning regardless
                  of power grid limitations.
                </p>
                <ul className="space-y-2 mb-6">
                  {[
                    "Complete solar panel systems for eligible students",
                    "Uninterrupted power supply for digital learning devices",
                    "Elimination of load-shedding interruptions during studies",
                    "Environmentally friendly, sustainable energy solution",
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
                    in Honhaar Jawan Punjab who meet academic performance
                    criteria.
                  </p>
                </div>
                <Link
                  href={`${applyHref}?benefit=solar`}
                  className="block w-full bg-sec2 hover:bg-primary text-white font-semibold py-3 px-6 rounded-lg text-center transition-colors"
                >
                  Apply for Solar Scheme
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
