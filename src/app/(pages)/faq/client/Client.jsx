// Faq.js
"use client";
import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FiSearch,
  FiMail,
  FiFileText,
  FiCheckCircle,
  FiHelpCircle,
} from "react-icons/fi";
import { useRouter } from "next/navigation";
import { ImSpinner } from "react-icons/im";
import SiteDetails from "@/Data/SiteData";

export const faqData = [
  {
    id: 1,
    question: `What is ${SiteDetails.programName} `,
    answer: `${SiteDetails.programName}  is an online learning platform offering courses endorsed by Government of punjab`,
    category: "General",
  },
  {
    id: 2,
    question: "How do I start learning?",
    answer: `Visit Enrollment Process and follow the steps provided. `,
    category: "Getting Started",
  },
  {
    id: 6,
    question: "How long will it take for my course to unlock after Admission?",
    answer: `Once your admission is verified, you’ll receive information on when your classes begin on your dashboard and via email based on your current batch.`,
    category: "Enrollment",
  },
  {
    id: 7,
    question: "Where do I access my courses?",
    answer: `Once your admission is confirmed, you will be provided with the Learning Portal URL and will receive an email containing detailed instructions on how to access and use your learning portal to begin your learning journey. All classes schedule will also be shared with you based on your current batch.`,
    category: "Platform",
  },
  {
    id: 8,
    question: "Are these courses beginner-friendly?",
    answer: `Yes. course include beginner to advanced-level courses. Each course provides prerequisites and learning outcomes so you can choose based on your current knowledge.`,
    category: "Platform",
  },
  {
    id: 9,
    question: "Do I receive a certificate after completing a course?",
    answer: `Yes. Once all required modules and exams are completed within a course, you'll be able to download a verifiable digital certificate from your dashboard.`,
    category: "Certification",
  },
  {
    id: 11,
    question: "Is there lifetime access to enrolled courses?",
    answer: `Yes. All courses you are enrolled in come with lifetime access — so you can revisit your courses anytime, even after completing them.`,
    category: "Platform",
  },
  {
    id: 12,
    question: "Can I use the platform on my phone?",
    answer: `Absolutely. Our platform is mobile-optimized and works seamlessly on any device via browser. There's no need to install an app.`,
    category: "Technical",
  },
  {
    id: 13,
    question: "Can I get support if I face issues?",
    answer: `Yes. We provide 24/7 email support.`,
    category: "Support",
  },
  {
    id: 15,
    question: "Can I request a specific course or topic to be added?",
    answer: `Yes, we welcome your feedback! You can email us your course or course suggestions, and our academic team will review them for future updates.`,
    category: "General",
  },
];

const categoryIcons = {
  General: <FiHelpCircle className="text-xl text-white" />,
  "Getting Started": <FiFileText className="text-xl text-white" />,
  Enrollment: <FiCheckCircle className="text-xl text-white" />,
  Platform: <FiCheckCircle className="text-xl text-white" />,
  Certification: <FiCheckCircle className="text-xl text-white" />,
  Technical: <FiSearch className="text-xl text-white" />,
  Support: <FiMail className="text-xl text-white" />,
};

const Client = () => {
  const [loading, setLoading] = useState(null);
  const router = useRouter();

  const handleClickie = (path, buttonIndex) => {
    setLoading(buttonIndex);
    setTimeout(() => {
      router.push(path);
    }, 0);
  };
  return (
    <motion.main className="py-16 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2  lg:grid-cols-3">
          {faqData.map((faq, index) => (
            <div
              key={faq.id}
              className="relative bg-primary rounded-lg  shadow-2xl  transition duration-300"
              style={{
                clipPath:
                  "polygon(0% 0%, 100% 0%, 100% 92%, 85% 92%, 85% 100%, 70% 92%, 0% 92%)",
                minHeight: "295px",
              }}
            >
              <div className="p-6 h-full flex flex-col ">
                <div className="flex gap-3 items-start mb-4">
                  <div className="bg-sec2  p-3 rounded-full flex-shrink-0">
                    {categoryIcons[faq.category] || (
                      <FiHelpCircle className="text-xl text-white" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-1">
                      {faq.question}
                    </h4>
                    <div className="text-xs font-medium text-white uppercase tracking-wider mt-2">
                      {faq.category}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-white leading-relaxed flex-grow">
                  {faq.answer}
                </p>
              </div>

              {/* Decorative corner element */}
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-gray-100"></div>
            </div>
          ))}
        </div>

        <div className="mt-20 bg-gradient-to-r from-primary/90 to-primary/90 rounded-xl p-10 text-center shadow-lg">
          <div className="p-8">
            <h3 className="text-2xl font-bold text-white mb-4 font-serif">
              Still Need Help?
            </h3>
            <p className="text-gray-200 mb-6 max-w-2xl mx-auto">
              Reach out to the {SiteDetails.programName} support team for any
              queries or assistance. We're here to support your learning
              journey.
            </p>
            <button
              onClick={() => handleClickie("/contact", 4)}
              className="group relative overflow-hidden inline-flex items-center justify-center gap-2 border-2 border-white hover:bg-white text-white hover:text-primary font-semibold px-6 py-3 rounded-md shadow-md transition transform hover:-translate-y-0.5 transition-all duration-300"
            >
              {loading === 4 ? (
                <div className="flex items-center gap-2">
                  <ImSpinner className="animate-spin" size={20} />
                  <span>Redirecting...</span>
                </div>
              ) : (
                <>
                  <FiMail className="text-lg" />
                  Contact Support
                </>
              )}
            </button>
            <p className="text-sm text-gray-200 mt-4">
              Official Email: {SiteDetails.supportEmail}
            </p>
          </div>
        </div>
      </div>
    </motion.main>
  );
};

export default Client;
