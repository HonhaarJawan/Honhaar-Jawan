"use client";
import Link from "next/link";
import React from "react";

const Opportunities = () => {
  // 1. Card data: stored in an array of objects
  const opportunitiesData = [
    {
      title: "Internship Program",
      description:
        "Kickstart your professional journey with hands-on industry experience. Work alongside seasoned mentors, learn modern tools, and build a foundation for your career.",
      quote:
        "نوجوانوں کے لیے ایک بہترین موقع جو عملی دنیا میں قدم رکھنے سے پہلے تجربہ حاصل کرنا چاہتے ہیں۔",
      buttonText: "Apply Now",
      link: "/internship"
    },
    {
      title: "honhaar Opportunity",
      description:
        "Receive financial support to pursue your educational goals. Our honhaars aim to ease your financial burden so you can focus on skill development and academic excellence.",
      quote:
        "علم اور صلاحیتوں کو آگے بڑھانے کا ایک بہترین ذریعہ، جہاں مالی معاونت آپ کی راہ ہموار کرتی ہے۔",
      buttonText: "Apply Now",
      link: "/honhaar"
    },
    {
      title: "Project-Based Learning",
      description:
        "Immerse yourself in practical, real-world projects. Enhance your portfolio and gain hands-on experience by collaborating with peers and industry professionals.",
      quote:
        "عملی منصوبوں کے ذریعے مہارتیں سیکھیں اور حقیقی دنیا کے مسائل کا حل دریافت کریں۔",
      buttonText: "Apply Now",
      link: "/signup"
    },
  ];

  return (
    <section className="px-4 bg-white border">
        {/* Cards container */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* 2. Map over the data array to render each card */}
        {opportunitiesData.map((item, index) => (
          <div
            key={index}
            className="border-2 border-primary p-6 bg-white"
          >
            {/* Card Content */}
            <h3 className="z-10 text-2xl font-semibold group-hover:text-white mb-3">
              {item.title}
            </h3>
            <p className="z-10 text-sm md:text-base text-zinc-800 group-hover:text-white duration-200 mb-4">
              {item.description}
            </p>
            <p className="z-10 text-base md:text-lg font-medium italic text-zinc-600 group-hover:text-white mb-4">
              {item.quote}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Opportunities;
