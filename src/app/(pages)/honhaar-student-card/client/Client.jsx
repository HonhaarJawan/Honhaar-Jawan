"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import SiteDetails from "../../../../Data/SiteData";
import { FaBriefcase, FaGlobeAmericas, FaLaptop } from "react-icons/fa";

const Client = () => {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    {
      label: "Overview",
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Overview</h2>
          <p>
            The {SiteDetails.studentCard} is an innovative initiative introduced
            under the {SiteDetails.programName} Program with the appreciation of
            our Honourable Minister of Education, Punjab, Rana Sikandar Hayat.
            Designed to empower young learners, this card provides access to
            essential IT training and development opportunities. It connects
            trainees to key resources such as the LMS, laptop and solar schemes,
            Education Finance, Study Abroad, Internships and more—ensuring
            transparent, secure, and efficient delivery of benefits to every
            eligible participant.
          </p>

          <h3 className="text-xl font-semibold mt-6">Key Features</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Laptop Scheme</li>
            <li>Solar Scheme</li>
            <li>Education Finance</li>
            <li>Internships</li>
          </ul>
        </div>
      ),
    },
    {
      label: "Eligibility",
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Eligibility Criteria</h2>
          <ul className="list-disc pl-6 space-y-1 mt-3">
            <li>Resident of Pakistan</li>
            <li>Age between 15 to 40 years</li>
            <li>Valid CNIC / B-Form</li>
            <li>
              Enrolled in a registered course under {SiteDetails.programName}
            </li>
            <li>No previous record of {SiteDetails.studentCard}</li>
          </ul>
        </div>
      ),
    },
    {
      label: "How to Apply",
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">How to Apply</h2>
          <ol className="list-decimal pl-6 space-y-1 mt-3">
            <li>
              Visit <span className="underline">{SiteDetails.domain}</span>
            </li>
            <li>
              Click "{SiteDetails.studentCard}" menu, then the Apply button
            </li>
            <li>
              Fill the application form, provide correct information, and upload
              the paid challan slip
            </li>
            <li>Verification is conducted by the Honhaar Team</li>
            <li>
              Upon approval, the {SiteDetails.studentCard} is issued and
              activated
            </li>
          </ol>
        </div>
      ),
    },
    {
      label: "Charges / Fees",
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Charges / Fees</h2>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Card Issuance Fee: Free of cost</li>
          </ul>
        </div>
      ),
    },
    {
      label: "Key Conditions",
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Key Conditions</h2>
          <ul className="list-disc pl-6 space-y-1 mt-3">
            <li>Eligible for Laptop Scheme</li>
            <li>Eligible for Solar Scheme</li>
            <li>Eligible for Taleem Finance</li>
            <li>Eligible for Internships</li>
            <li>
              Misuse (e.g., selling the card or illegal use) may lead to
              termination and blacklisting
            </li>
          </ul>
        </div>
      ),
    },
    {
      label: "Terms & Conditions",
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Terms & Conditions</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>
              Only students enrolled in IT training courses under the{" "}
              {SiteDetails.programName} program are eligible to apply for the{" "}
              {SiteDetails.studentCard}. Students must successfully complete
              their course and obtain a minimum of 100% marks in their final
              evaluation to qualify.
            </li>
            <li>
              Students must attend all mandatory classes and meet the attendance
              and assignment requirements set by the training provider. Failure
              to appear in the final assessment will result in disqualification.
            </li>

            <li>
              All academic records, attendance, and marks will be verified by
              the program management before issuing the{" "}
              {SiteDetails.studentCard}. Any misrepresentation, falsification,
              or cheating will lead to immediate disqualification.
            </li>

            <li>
              Rewards (such as laptops or solar panels) are subject to
              availability and will be distributed in phases. The program
              reserves the right to modify, replace, or withdraw any reward
              without prior notice.
            </li>

            <li>
              The {SiteDetails.studentCard} and any associated rewards are
              non-transferable and may only be used by the selected student.
            </li>

            <li>
              {SiteDetails.programName} reserves the right to revise, amend, or
              update these terms and conditions at any time without prior
              notice.
            </li>

            <li>
              All decisions made by {SiteDetails.programName} regarding
              eligibility, merit ranking, and reward distribution shall be final
              and binding.
            </li>
          </ol>
        </div>
      ),
    },
  ];
  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-gray-50 to-white" />
      <div className="text-gray-900 leading-relaxed   mx-auto">
        {/* Main content */}
        <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero section with clean government layout */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch mb-12">
            {/* Top — Left: Card Mockup */}
            {/* Top — Left: Card Mockup */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
              {/* Student Card Image */}
              <div className="p-6 flex items-center justify-center border-b border-gray-200">
                <img
                  src="/Student-Card.avif"
                  alt={`${SiteDetails.studentCard} mockup`}
                  className="rounded-lg border shadow-lg max-h-80 object-contain transform transition-transform duration-300"
                />
              </div>

              {/* Redesigned Benefits Section */}
              <div className="px-6 py-6 bg-white">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <svg
                    className="w-6 h-6 mr-2 text-second"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  Benefits Student Card Provides
                </h3>

                <div className="space-y-4">
                  {[
                    {
                      title: "Study Abroad & Education Finance",
                      description:
                        "Access financial support for international education opportunities",
                      icon: <FaGlobeAmericas className="w-6 h-6" />,
                      color: "text-primary",
                    },
                    {
                      title: "Solar & Laptop Scheme",
                      description:
                        "Get technology resources and renewable energy solutions for studies",
                      icon: <FaLaptop className="w-6 h-6" />,
                      color: "text-primary",
                    },
                    {
                      title: "Internships",
                      description:
                        "Connect with professional development opportunities and work experience",
                      icon: <FaBriefcase className="w-6 h-6" />,
                      color: "text-primary",
                    },
                  ].map((benefit, index) => (
                    <div
                      key={benefit.title}
                      className="flex items-start p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 hover:shadow-xs transition-all duration-200"
                    >
                      <div className={`p-2 rounded-lg ${benefit.color} mr-4`}>
                        {benefit.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {benefit.title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 lg:p-8 flex flex-col">
              <div className="mb-5">
                <div className="flex items-center mb-3">
                  <span className="inline-block h-8 w-1.5 bg-second rounded-full mr-3" />
                  <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">
                    {SiteDetails.studentCard} — Overview
                  </h2>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  The <strong>{SiteDetails.studentCard}</strong> was launched by{" "}
                  <strong>Honhaar Jawan</strong> under the{" "}
                  <strong>{SiteDetails.programName}</strong> , empowering
                  eligible students to access financial and material support for
                  their studies.
                </p>
              </div>

              {/* Eligibility & Docs */}
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Eligibility
                  </h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li className="flex gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-second/90" />
                      CNIC/B-Form & domicile (or proof of residence)
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-second/90" />
                      Enrollment/Admission (where applicable)
                    </li>
                  </ul>

                  {/* Distribution Section */}
                  <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">
                    Student Card Distribution
                  </h3>
                  <ul className="space-y-1 text-gray-700 text-sm">
                    <li>
                      Punjab:{" "}
                      <span className="font-semibold text-green-700">
                        20,000 cards
                      </span>
                    </li>
                    <li>
                      Khyber Pakhtunkhwa:{" "}
                      <span className="font-semibold text-green-700">
                        15,000 cards
                      </span>
                    </li>
                    <li>
                      Sindh:{" "}
                      <span className="font-semibold text-green-700">
                        15,000 cards
                      </span>
                    </li>
                    <li>
                      Balochistan:{" "}
                      <span className="font-semibold text-green-700">
                        15,000 cards
                      </span>
                    </li>
                    <li>
                      Gilgit-Baltistan:{" "}
                      <span className="font-semibold text-green-700">
                        7,500 cards
                      </span>
                    </li>
                    <li>
                      Azad Kashmir:{" "}
                      <span className="font-semibold text-green-700">
                        7,500 cards
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-10">
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-8 h-8 text-second"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-900">
                        Important Note
                      </p>
                      <p className="text-sm text-gray-600">
                        Make sure you meet all eligibility criteria before
                        applying
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-second to-second/80 p-5 border border-second/30">
                  <h4 className="text-black font-semibold">Ready to apply?</h4>
                  <Link
                    className="mt-4 inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold bg-white text-second hover:bg-sec2 hover:text-white border border-primary transition w-full"
                    href="/apply-honhaar-student-card"
                  >
                    Apply Honhaar Student Card
                  </Link>
                </div>
              </div>
            </div>

            {/* Bottom — Full-width CTA / Timeline */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 lg:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                {/* Stepper */}
                <div className="md:col-span-4">
                  <h3 className="text-lg font-semibold text-gray-600">
                    Honhaar Student Card Application Steps
                  </h3>
                  <ol className="mt-4 grid grid-cols-1 sm:grid-cols-2  lg:grid-cols-4 gap-4">
                    {[
                      {
                        t: "Apply Online",
                        d: "Start with the Admission Guideline steps and share accurate details.",
                      },
                      {
                        t: "Complete Your Course",
                        d: "Finish your enrolled course 100% to become eligible for the card.",
                      },
                      {
                        t: "Apply for Honhaar Card",
                        d: "Fill the Honhaar Student Card application form with your latest info.",
                      },
                      {
                        t: "Verification & Issuance",
                        d: "Documents are reviewed. Once approved, your card is issued with benefits.",
                      },
                    ].map((st, i) => (
                      <li
                        key={st.t}
                        className="rounded-lg border border-gray-200 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-500">
                            Step {i + 1}
                          </span>
                          <span className="h-6 w-6 rounded-full bg-second text-white text-xs grid place-items-center">
                            {i + 1}
                          </span>
                        </div>
                        <div className="mt-2 text-sm font-semibold text-gray-900">
                          {st.t}
                        </div>
                        <div className="text-sm text-gray-600">{st.d}</div>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </section>

          {/* Program information with clean tabs */}
          <section className="mb-12">
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <div className="w-1 h-8 bg-second mr-3"></div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Program Information
                </h2>
              </div>

              <div className="border-b border-gray-300">
                <nav className="flex flex-wrap gap-2" aria-label="Tabs">
                  {tabs.map((tab, index) => (
                    <button
                      key={tab.label}
                      onClick={() => setActiveTab(index)}
                      className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors duration-200 ${
                        activeTab === index
                          ? "border-second text-second bg-blue-50"
                          : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-400"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Tab content */}
            <div className="bg-white rounded-lg border border-gray-300 shadow-md">
              <div className="p-6 lg:p-8">{tabs[activeTab].content}</div>
            </div>
          </section>

          {/* Important notices - Government alert style */}
          <section className="bg-blue-50 border-l-4 border-second rounded-r-lg p-6 mb-8">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-second mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Important Notice
                </h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-start">
                    <span className="text-second mr-2">•</span>
                    <span>
                      Applications are processed on a first-come, first-served
                      basis subject to eligibility verification
                    </span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-second mr-2">•</span>
                    <span>
                      All documents must be verified through NADRA database
                    </span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-second mr-2">•</span>
                    <span>
                      {SiteDetails.studentCard}s are non-transferable and
                      Honhaar Jawan property
                    </span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-second mr-2">•</span>
                    <span>
                      For queries, contact the Help Desk at{" "}
                      {SiteDetails.supportEmail}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
      {/* Government-style final CTA */}
      <footer className="bg-primary text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-bold mb-4">
            Ready to Start Your Application?
          </h3>
          <p className="text-lg text-blue-100 mb-6 max-w-2xl mx-auto">
            Join thousands of students who have transformed their careers
            through the {SiteDetails.programName} Student Program
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              className=" inline-flex items-center justify-center px-8 py-5 rounded-md font-semibold bg-sec2 hover:bg-white text-white hover:text-sec2  border border-primary transition"
              href="/apply-honhaar-student-card"
            >
              Apply Honhaar Student Card
            </Link>
            <Link
              href="/contact"
              className=" inline-flex items-center justify-center px-8 py-5 rounded-md font-semibold bg-white text-sec2 hover:bg-sec2 hover:text-white  border border-primary transition"
            >
              Need Help?
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Client;
