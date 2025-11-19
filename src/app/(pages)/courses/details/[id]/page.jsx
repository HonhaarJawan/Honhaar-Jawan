// CourseDetails.js
"use client";
import { useState, useEffect } from "react";
import PageInfo from "@/components/PageInfo";
import Navbar from "@/components/primary/Navbar";
import { courses } from "@/Data/Data";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  FaArrowRight,
  FaCertificate,
  FaCheck,
  FaClock,
  FaIdCardAlt,
  FaPlayCircle,
  FaStar,
  FaUsers,
  FaGraduationCap,
  FaLanguage,
  FaBookOpen,
  FaChartLine,
  FaDownload,
  FaShare,
  FaCopy,
  FaTimes,
  FaWhatsapp,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaTelegram,
  FaChevronDown,
} from "react-icons/fa";
import Copyright from "@/components/primary/Copyright";
import { ImSpinner } from "react-icons/im";

// Guard helper
const safeArray = (arr) => (Array.isArray(arr) ? arr : []);

const CourseDetails = () => {
  const { id } = useParams();
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [loading, setLoading] = useState(null);
  const router = useRouter();

  // Find the course by its slug
  const course = courses.find((c) => c.slug === id);

  // Get current URL for sharing
  const courseUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/courses/details/${id}`
      : `https://honhaarjawan.pk/courses/details/${id}`;

  const shareText = `Check out this amazing course: ${
    course?.name || "Course"
  } - Transform your career with expert-led training!`;

  const handleClickie = (path, buttonIndex) => {
    setLoading(buttonIndex);
    setTimeout(() => {
      router.push(path);
    }, 0);
  };

  // Share handlers
  const handleNativeShare = async () => {
    setLoading("share");
    if (navigator.share) {
      try {
        await navigator.share({
          title: course?.name || "Amazing Course",
          text: shareText,
          url: courseUrl,
        });
        setLoading(null);
      } catch (error) {
        setLoading(null);
        if (error.name !== "AbortError") {
          console.error("Error sharing:", error);
          setShowShareModal(true);
        }
      }
    } else {
      setLoading(null);
      setShowShareModal(true);
    }
  };

  const handleCopyLink = async () => {
    setLoading("copy");
    try {
      await navigator.clipboard.writeText(courseUrl);
      setCopySuccess(true);
      setLoading(null);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      setLoading(null);
      console.error("Failed to copy:", error);
    }
  };

  const shareLinks = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(
      `${shareText} ${courseUrl}`
    )}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      courseUrl
    )}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText
    )}&url=${encodeURIComponent(courseUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      courseUrl
    )}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(
      courseUrl
    )}&text=${encodeURIComponent(shareText)}`,
  };

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") setShowShareModal(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center p-12 bg-white rounded-2xl shadow-2xl max-w-md mx-4">
          <div className="text-6xl mb-6">🔍</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Course Not Found
          </h1>
          <p className="text-gray-600 mb-6 leading-relaxed">
            We couldn't find the course you're looking for. Please check the URL
            or return to our course catalog.
          </p>
          <button
            onClick={() => handleClickie("/courses", 1)}
            className="group relative overflow-hidden inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold min-w-[180px] min-h-[48px] transform hover:-translate-y-0.5 transition-all duration-300 shadow-md hover:shadow-lg"
            disabled={loading === 1}
          >
            {loading === 1 ? (
              <div className="flex items-center justify-center gap-2">
                <ImSpinner className="animate-spin" size={20} />
                Redirecting...
              </div>
            ) : (
              <>
                Browse Courses <FaArrowRight />
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Safe fallback arrays
  const learningObjectives = safeArray(course.learn);
  const curriculum = safeArray(course.topiccovered);
  const courseFor = safeArray(course.coursefor);
  const description = safeArray(course.description);
  const curriculumData = safeArray(course.curriculumData);

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <div className="relative bg-primary text-white overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 mt-8   py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                {course.name}
              </h1>

              <p className="text-xl text-gray-200 leading-relaxed line-clamp-[10] max-w-2xl">
                {description}
              </p>

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                  <FaUsers />
                  <span>{course.targetAudience}</span>
                </div>
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <img
                src={course.image}
                alt={course.name}
                className="relative w-full rounded-2xl h-full lg:h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Course Overview Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <FaBookOpen className="text-sec2 text-xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      Course Level
                    </h3>
                    <p className="text-gray-600">Beginner to Advanced</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <FaCertificate className="text-sec2 text-xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      Certification
                    </h3>
                    <p className="text-gray-600">{course.certificate}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <FaChartLine className="text-sec2 text-xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      Career Impact
                    </h3>
                    <p className="text-gray-600">High Growth Potential</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Description */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <div className="w-1 h-8 bg-second rounded-full"></div>
                Course Overview
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                {description}
              </p>
            </div>

            {/* Learning Objectives */}
            {learningObjectives.length > 0 && (
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <div className="w-1 h-8 bg-second rounded-full"></div>
                  What You'll Learn
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {learningObjectives.map((objective, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mt-1">
                        <FaCheck className="text-green-600 text-sm" />
                      </div>
                      <p className="text-gray-700 font-medium">{objective}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Course Topics */}
            {curriculum.length > 0 && (
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <div className="w-1 h-8 bg-second rounded-full"></div>
                  Course Curriculum
                </h2>
                <div className="space-y-4">
                  {curriculum.map((topic, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                        {index + 1}
                      </div>
                      <p className="text-gray-700 font-medium">
                        {typeof topic === "string" ? topic : topic.outcome}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Target Audience */}
            {courseFor.length > 0 && (
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <div className="w-1 h-8 bg-second rounded-full"></div>
                  Who This Course Is For
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {courseFor.map((audience, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 rounded-xl border border-orange-100"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <FaUsers className="text-primary text-sm" />
                      </div>
                      <p className="text-gray-700 font-medium">{audience}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Enrollment Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden top-6">
              <div className="bg-primary p-6 text-white">
                <h3 className="text-xl font-bold mb-2">
                  Ready to Start Learning?
                </h3>
                <p className="text-blue-100">
                  Join thousands of successful students
                </p>
              </div>

              <div className="p-6 space-y-6">
                {/* Course Details */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <FaClock className="text-primary" />
                      <span className="text-gray-600 font-medium">
                        Duration
                      </span>
                    </div>
                    <span className="text-gray-800 font-semibold">
                      {course.duration}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <FaIdCardAlt className="text-primary" />
                      <span className="text-gray-600 font-medium">
                        Eligibility
                      </span>
                    </div>
                    <span className="text-gray-800 font-semibold text-right text-sm">
                      {course.targetAudience}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <FaCertificate className="text-primary" />
                      <span className="text-gray-600 font-medium">
                        Certificate
                      </span>
                    </div>
                    <span className="text-gray-800 font-semibold">
                      {course.certificate}
                    </span>
                  </div>

                </div>

                {/* Call to Action */}
                <div className="space-y-3">
                  <button
                    onClick={() => router.push("/new-registration")}
                    className="group relative overflow-hidden w-full flex items-center hover:bg-sec2 justify-center gap-3 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:text-white min-h-[50px] transform hover:-translate-y-0.5 transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    Apply Now
                  </button>{" "}
                  <button
                    onClick={handleNativeShare}
                    disabled={loading === "share"}
                    className="group relative overflow-hidden w-full flex items-center hover:bg-sec2 justify-center gap-3 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:text-white min-h-[50px] transform hover:-translate-y-0.5 transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    {loading === "share" ? (
                      <div className="flex items-center justify-center gap-2">
                        <ImSpinner className="animate-spin" size={20} />
                        Sharing...
                      </div>
                    ) : (
                      <>
                        <FaShare /> Share Course
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Instructor/Support Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-lg border border-blue-100">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-second rounded-full flex items-center justify-center mx-auto">
                  <FaGraduationCap className="text-white text-2xl" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">
                    Expert Support
                  </h3>
                </div>
                <p className="text-gray-600 text-sm mt-2">
                  Get expert guidance from our dedicated support team.
                </p>{" "}
                <button
                  onClick={() => handleClickie("/contact", 2)}
                  disabled={loading === 2}
                  className="group relative overflow-hidden inline-flex items-center justify-center gap-2 px-6 py-3 bg-second text-white rounded-lg transition-colors font-semibold text-sm min-h-[44px] transform hover:-translate-y-0.5 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  {loading === 2 ? (
                    <div className="flex items-center justify-center gap-2">
                      <ImSpinner className="animate-spin" size={16} />
                      Redirecting...
                    </div>
                  ) : (
                    <>
                      Contact Support <FaArrowRight />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* NEW: Detailed Curriculum with Dropdowns */}
        {curriculumData.length > 0 && (
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <div className="w-1 h-8 bg-second  rounded-full"></div>
              Detailed Curriculum
            </h2>
            <div className="space-y-4">
              {curriculumData.map((section, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-xl overflow-hidden"
                >
                  <div className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer">
                    <h3 className="font-semibold text-gray-800 text-lg flex items-center gap-3">
                      <FaChevronDown className="text-primary" />
                      {section.curriculumTitle}
                    </h3>
                  </div>
                  <div className="p-4 bg-white">
                    <div className="space-y-3">
                      {safeArray(section.curriculumPoints).map(
                        (point, pointIndex) => (
                          <div
                            key={pointIndex}
                            className="flex items-start gap-3"
                          >
                            <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-1">
                              <FaCheck className="text-primary text-xs" />
                            </div>
                            <p className="text-gray-700">{point}</p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                Share This Course
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FaTimes size={20} />
              </button>
            </div>

            {/* Social Media Buttons */}
            <div className="space-y-3 mb-6">
              <a
                href={shareLinks.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-4 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FaWhatsapp className="text-green-500 text-xl" />
                <span className="font-medium">Share on WhatsApp</span>
              </a>

              <a
                href={shareLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-4 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FaFacebook className="text-blue-600 text-xl" />
                <span className="font-medium">Share on Facebook</span>
              </a>

              <a
                href={shareLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-4 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FaTwitter className="text-blue-400 text-xl" />
                <span className="font-medium">Share on Twitter</span>
              </a>

              <a
                href={shareLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-4 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FaLinkedin className="text-blue-700 text-xl" />
                <span className="font-medium">Share on LinkedIn</span>
              </a>

              <a
                href={shareLinks.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-4 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FaTelegram className="text-blue-500 text-xl" />
                <span className="font-medium">Share on Telegram</span>
              </a>
            </div>

            {/* Copy Link Section */}
            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-600 mb-3">Or copy the link:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={courseUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                />
                <button
                  onClick={handleCopyLink}
                  disabled={loading === "copy"}
                  className={`group relative overflow-hidden px-4 py-2 rounded-lg font-medium text-sm transition-colors min-w-[80px] min-h-[40px] flex items-center justify-center transform hover:-translate-y-0.5 transition-all duration-300 ${
                    copySuccess
                      ? "bg-green-500 text-white shadow-md"
                      : "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg"
                  }`}
                >
                  {loading === "copy" ? (
                    <ImSpinner className="animate-spin" size={16} />
                  ) : copySuccess ? (
                    "Copied!"
                  ) : (
                    <FaCopy />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <div className="bg-second text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Do you have questions?
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              We'll help you to grow your career and growth
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => handleClickie("/apply-now", 3)}
                disabled={loading === 3}
                className="group relative overflow-hidden inline-flex items-center justify-center gap-3 px-8 py-4 bg-primary hover:border border-white text-white rounded-xl font-bold text-lg transform hover:-translate-y-0.5 transition-all duration-300 shadow-2xl hover:shadow-xl min-w-[220px] min-h-[60px]"
              >
                {loading === 3 ? (
                  <div className="flex items-center justify-center gap-2">
                    <ImSpinner className="animate-spin" size={24} />
                    Redirecting...
                  </div>
                ) : (
                  "Start Your Journey"
                )}
              </button>
              <button
                onClick={() => handleClickie("/contact", 4)}
                disabled={loading === 4}
                className="group relative overflow-hidden inline-flex items-center justify-center gap-3 px-8 py-4 border-2 border-white/30 text-white rounded-xl font-bold text-lg hover:bg-white/10 transition-all duration-300 min-w-[220px] min-h-[60px] transform hover:-translate-y-0.5 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                {loading === 4 ? (
                  <div className="flex items-center justify-center gap-2">
                    <ImSpinner className="animate-spin" size={24} />
                    Redirecting...
                  </div>
                ) : (
                  "Have Questions? Contact Us"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Copyright />
    </div>
  );
};

export default CourseDetails;
