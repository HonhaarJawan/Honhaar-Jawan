import React from "react";
import { motion } from "framer-motion";
import { FaUser, FaStar, FaQuoteLeft } from "react-icons/fa";

const reviews = [
  {
    name: "Ayesha Khan",
    role: "Front-End Developer",
    text: "The courses inside these bundles transformed my career. The hands-on projects and certification opened doors I never imagined!",
    rating: 5,
  },
  {
    name: "Bilal Ahmed",
    role: "Data Analyst",
    text: "I appreciated the structured curriculum aligned with industry standards. The placement assistance was a game-changer for me.",
    rating: 4,
  },
  {
    name: "Sara Malik",
    role: "UI/UX Designer",
    text: "Excellent trainers and real-world assignments. The certificate from Honhaar Jawan gave me the confidence to step into the job market.",
    rating: 5,
  },
];

const OverallInsights = () => {
  return (
    <section className="max-w-7xl mx-auto px-4 py-16 bg-gray-50">
      <div
        className="text-center mb-12"
      >
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          What People Are Saying
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Real feedback from graduates of our program and course bundles.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {reviews.map((review, index) => (
          <div
            key={index}
            className="bg-white p-8 rounded-xl shadow-md border border-gray-200 hover:border-green-700 transition-all flex flex-col"
          >
            <div className="flex items-center mb-4">
              <FaUser className="text-3xl text-green-700 mr-3" />
              <div>
                <p className="text-lg font-semibold text-gray-800">
                  {review.name}
                </p>
                <p className="text-sm text-gray-500">{review.role}</p>
              </div>
            </div>
            <div className="flex items-center mb-4">
              {[...Array(review.rating)].map((_, i) => (
                <FaStar key={i} className="text-yellow-500 mr-1" />
              ))}
              {[...Array(5 - review.rating)].map((_, i) => (
                <FaStar
                  key={i + review.rating}
                  className="text-gray-300 mr-1"
                />
              ))}
            </div>
            <div className="flex-1">
              <FaQuoteLeft className="text-2xl text-gray-300 mb-2" />
              <p className="text-gray-700 italic">{review.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default OverallInsights;
