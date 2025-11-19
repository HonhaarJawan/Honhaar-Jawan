"use client";
import React from "react";
import {
  FaUserCheck,
  FaUpload,
  FaSearch,
  FaUniversity,
  FaBookmark,
} from "react-icons/fa";

const steps = [
  {
    n: "1",
    title: "Eligibility Check",
    desc: "Verify your eligibility by confirming your domicile, CNIC, age, and educational qualifications before proceeding with the application.",
  },
  {
    n: "2",
    title: "Review Documents & Online Application",
    desc: "Fill out the online registration form with all required information and submit it for verification.",
  },
  {
    n: "3",
    title: "Entry Test",
    desc: "Pass the entry test with a minimum score of 40% to qualify for the next step.",
  },
  {
    n: "4",
    title: "Confirm Your Seat",
    desc: "Complete your application process and confirm your seat through final submission.",
  },
  {
    n: "5",
    title: "Oriention & Start Learning",
    desc: "Log in to the LMS portal using the credentials provided in your dashboard.",
  },
];

const iconMap = {
  1: FaUserCheck,
  2: FaUpload,
  3: FaSearch,
  4: FaBookmark,
  5: FaUniversity,
};

const StepsGuide = () => {
  return (
    <section className="relative bg-gradient-to-b -50 via-white to-emerald-50">
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-second mb-10">
          How to Apply{" "}
          <span className="text-emerald-600">/ داخلہ کا طریقہ کار</span>
        </h2>

        <div className="grid md:grid-cols-5 gap-6">
          {steps.map((s) => {
            const Icon = iconMap[s.n];
            return (
              <div
                key={s.n}
                className="group relative overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100/20 to-transparent opacity-0 group-hover:opacity-100 transition-all"></div>
                <div className="p-6 flex flex-col items-center text-center relative z-10">
                  <div className="w-14 h-14 mb-4 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl transition">
                    <Icon />
                  </div>
                  <div className="font-bold text-lg text-gray-800">
                    Step {s.n}: {s.title}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12">
          <a
            href="/apply-now"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white bg-sec2 hover:bg-primary  transition-all duration-300 text-lg"
          >
            🚀 Start Your Application
          </a>
        </div>
      </div>
    </section>
  );
};

export default StepsGuide;
