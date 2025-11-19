// Client.js - Updated with Home Page Layout
"use client";
import { courses } from "@/Data/Data";
import useAuthStore from "@/store/useAuthStore";
import Link from "next/link";
import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import PageInfo from "@/components/PageInfo";
import Navbar from "@/components/primary/Navbar";
import { useRouter } from "next/navigation";
import Copyright from "@/components/primary/Copyright";
import { ImSpinner } from "react-icons/im";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
    },
  },
};

// Government color scheme
const govtColors = {
  primary: "#1e40af",
  accent: "#dc2626",
  text: "#1f2937",
};

// Function to shuffle array randomly
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const Client = () => {
  const [loading, setLoading] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleClickie = (e, index, path) => {
    e.preventDefault();
    setLoading(index);
    setTimeout(() => {
      router.push(path);
      setLoading(null);
    }, 0);
  };

  // Enhance courses with additional data - SAME AS HOME PAGE
  const enhancedCourses = useMemo(
    () =>
      courses.map((course, index) => ({
        ...course,
        id: course.id || index,
        rating: 4.2 + Math.random() * 0.6,
        reviews: Math.floor(Math.random() * 200) + 50,
        duration:
          course.duration || `${Math.floor(Math.random() * 6) + 4} weeks`,
      })),
    []
  );

  // Filter courses based on active filter and search query - SEARCH BY NAME ONLY
  const filteredCourses = useMemo(() => {
    let filtered = enhancedCourses;

    // First apply category filter
    if (activeFilter === "all") {
      filtered = enhancedCourses; // Show all courses without shuffling for courses page
    } else if (activeFilter === "certifications") {
      filtered = enhancedCourses.filter(
        (course) => course.isCertification === true
      );
    } else if (activeFilter === "honhaar") {
      // Only show courses that do NOT have the isCertification property at all
      filtered = enhancedCourses.filter(
        (course) => !course.hasOwnProperty("isCertification")
      );
    }

    // Then apply search filter by name only
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((course) => {
        const courseName = course.name?.toString().toLowerCase() || "";
        return courseName.includes(query);
      });
    }

    return filtered;
  }, [activeFilter, enhancedCourses, searchQuery]);

  const content = {
    heading: "Our Courses",
    sub: "Offering 80+ Courses in Different Domains of IT with Expert Instructors",
    all: "All Courses",
    explore: "All Courses",
    honhaar: "3-6 Months Courses (Technical & Non-Technical)",
    certifications: "International Certifications Programs with Exam Prep",
  };

  return (
    <section className="w-full px-4 max-w-7xl mx-auto py-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold" style={{ color: govtColors.text }}>
            {content.heading}
          </h2>
          <p className="text-sm text-gray-600 mt-2">{content.sub}</p>
        </div>
        <button
          onClick={(e) => handleClickie(e, 0, "/enrollment-process")}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-sec2 hover:bg-primary font-medium transition-all text-white duration-200 hover:shadow-md"
        >
          {loading === 0 ? (
            <>
              <ImSpinner className="animate-spin" size={14} />
              <span>Loading...</span>
            </>
          ) : (
            "Enrollment Process"
          )}
        </button>
      </div>

      {/* Filter Buttons and Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
              activeFilter === "all"
                ? "bg-primary text-white shadow-md"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            All Courses
          </button>
          <button
            onClick={() => setActiveFilter("honhaar")}
            className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
              activeFilter === "honhaar"
                ? "bg-primary text-white shadow-md"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            {content.honhaar}
          </button>
          <button
            onClick={() => setActiveFilter("certifications")}
            className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
              activeFilter === "certifications"
                ? "bg-primary text-white shadow-md"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            {content.certifications}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="w-full mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search courses by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Courses Section */}
      <div>
        <h3
          className="text-2xl font-semibold mb-6"
          style={{ color: govtColors.text }}
        >
          {searchQuery ? `Search Results for "${searchQuery}"` : content.all}
        </h3>

        {/* Results count */}
        {searchQuery && (
          <p className="text-sm text-gray-600 mb-4">
            Found {filteredCourses.length} course
            {filteredCourses.length !== 1 ? "s" : ""}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCourses.map((course, index) => (
            <div
              key={course.id}
              variants={itemVariants}
              className="group flex flex-col cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
              onClick={(e) =>
                handleClickie(e, index + 1, `/courses/details/${course.slug}`)
              }
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleClickie(
                    e,
                    index + 1,
                    `/courses/details/${course.slug}`
                  );
                }
              }}
            >
              <div className="relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 flex flex-col h-full group-hover:border-blue-300">
                {/* Image Container */}
                <div className="relative h-full sm:h-40 md:h-44  overflow-hidden bg-gray-50">
                  <img
                    src={course.image}
                    alt={course.name}
                    className="w-full h-full"
                  />
                </div>

                {/* Content Section */}
                <div className="p-4 flex flex-col flex-grow">
                  {/* Course Title */}
                  <h3
                    className="text-base font-semibold mb-3 line-clamp-2 flex-grow leading-tight group-hover:text-blue-700 transition-colors"
                    style={{ color: govtColors.text }}
                  >
                    {course.name}
                  </h3>

                  {/* Simplified Metadata */}
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {course.duration}
                      </span>
                      <span className="flex items-center gap-1 text-green-600">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Certificate
                      </span>
                    </div>

                    {/* Rating display */}
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">★</span>
                      <span className="text-xs font-medium">
                        {course.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* Action button */}
                  <div className="mt-auto pt-3 border-t border-gray-100">
                    <button className="w-full text-white flex items-center justify-center gap-2 text-sm font-medium py-2 px-3 rounded-md transition-all duration-200 bg-sec2 hover:bg-primary">
                      {loading === index + 1 ? (
                        <>
                          <ImSpinner className="animate-spin" size={14} />
                          <span>Loading...</span>
                        </>
                      ) : (
                        <>
                          <span>View Details</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Show message when no courses found */}
        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {searchQuery
                ? `No courses found for "${searchQuery}". Try a different search term.`
                : "No courses found for the selected filter."}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default Client;
