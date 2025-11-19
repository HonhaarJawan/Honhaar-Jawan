// BlogDetails.js
"use client";
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FaCalendarAlt,
  FaUser,
  FaClock,
  FaArrowLeft,
  FaShare,
  FaTag,
  FaPlayCircle,
  FaCheckCircle,
  FaGraduationCap,
  FaExternalLinkAlt,
  FaStar,
  FaBookmark,
  FaUsers,
} from "react-icons/fa";
import Navbar from "@/components/primary/Navbar";
import Link from "next/link";
import { getBlogById } from "@/Data/Blogs";
import Copyright from "@/components/primary/Copyright";
import { ImSpinner } from "react-icons/im";
import SiteDetails from "@/Data/SiteData";

const BlogDetails = () => {
  const params = useParams();
  const blogId = params.id;
  const [loading, setLoading] = useState(null);
  const router = useRouter();

  // Get blog data from the data file
  const blog = getBlogById(blogId);

  const handleClickie = (path, buttonIndex) => {
    setLoading(buttonIndex);
    setTimeout(() => {
      router.push(path);
    }, 0);
  };

  // If blog not found, show 404
  if (!blog) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-lime-100">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 shadow-xl border border-white/20">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Blog Not Found
            </h1>
            <p className="text-gray-600 mb-8">
              The blog post you're looking for doesn't exist.
            </p>
            <button
              onClick={() => handleClickie("/blogs", "back-to-blogs")}
              className="group relative overflow-hidden inline-flex items-center bg-gradient-to-r from-[#315c2b] to-[#6f732f] hover:from-[#6f732f] hover:to-[#315c2b] text-white font-medium px-8 py-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {loading === "back-to-blogs" ? (
                <div className="flex items-center gap-2">
                  <ImSpinner className="animate-spin" size={20} />
                  <span>Redirecting...</span>
                </div>
              ) : (
                <>
                  <FaArrowLeft className="mr-2" /> Back to News & Events
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-lime-300 via-green-200 to-emerald-200 ">
      <Navbar />

      <div className=" mx-auto px-4 py-8">
        {/* Back button */}
        <div className="mb-8">
          <button
            onClick={() => handleClickie("/blogs", "back-to-blogs")}
            className="group relative overflow-hidden inline-flex items-center text-[#315c2b] hover:text-[#6f732f] transition-all duration-300 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm hover:shadow-md border border-white/30"
          >
            {loading === "back-to-blogs" ? (
              <div className="flex items-center gap-2">
                <ImSpinner className="animate-spin" size={16} />
                <span>Redirecting...</span>
              </div>
            ) : (
              <>
                <FaArrowLeft className="mr-2 transform group-hover:-translate-x-1 transition-transform duration-300" />
                Back to News & Events
              </>
            )}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="w-full lg:w-2/3">
            <article className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 md:p-10 shadow-xl border border-white/20">
              {/* Blog header */}
              <div className="mb-8">
                <div className="bg-gradient-to-r from-[#315c2b] to-[#6f732f] text-white px-6 py-3 rounded-2xl text-sm font-semibold inline-flex items-center gap-3 mb-6 shadow-lg">
                  <FaTag className="text-sm" />
                  <span>{blog.category}</span>
                </div>

                <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-gray-800 via-[#315c2b] to-[#6f732f] bg-clip-text text-transparent mb-8 leading-tight">
                  {blog.title}
                </h1>

                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 p-6 bg-gradient-to-r from-green-50 via-white to-lime-50 rounded-2xl border border-[#315c2b]/20 shadow-sm">
                  <div className="flex items-center gap-3 group">
                    <div className="p-2 bg-[#315c2b]/10 rounded-lg group-hover:bg-[#315c2b]/20 transition-colors duration-300">
                      <FaCalendarAlt className="text-[#315c2b]" />
                    </div>
                    <span className="font-medium">{blog.date}</span>
                  </div>
                  <div className="flex items-center gap-3 group">
                    <div className="p-2 bg-[#22C55E]/10 rounded-lg group-hover:bg-[#22C55E]/20 transition-colors duration-300">
                      <FaClock className="text-[#22C55E]" />
                    </div>
                    <span className="font-medium">{blog.readTime}</span>
                  </div>
                </div>
              </div>

              {/* Course highlights - Show only if highlights exist */}
              {blog.highlights && (
                <div className="bg-gradient-to-br from-[#315c2b]/5 via-[#6f732f]/5 to-[#CFF333]/10 p-8 rounded-2xl mb-10 border border-[#315c2b]/20 shadow-lg">
                  <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-3 text-xl">
                    <div className="p-3 bg-gradient-to-r from-[#315c2b] to-[#6f732f] rounded-xl shadow-lg">
                      <FaGraduationCap className="text-white text-lg" />
                    </div>
                    {blog.category === "New Course"
                      ? "Course Highlights"
                      : "Key Information"}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Object.entries(blog.highlights).map(
                      ([key, value], index) => (
                        <div
                          key={key}
                          className="text-center bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-white/30"
                        >
                          <div
                            className={`text-4xl font-bold mb-2 bg-gradient-to-r ${
                              index === 0
                                ? "from-[#315c2b] to-[#6f732f]"
                                : index === 1
                                ? "from-[#6f732f] to-[#22C55E]"
                                : "from-[#22C55E] to-[#CFF333]"
                            } bg-clip-text text-transparent`}
                          >
                            {value}
                          </div>
                          <div className="text-sm text-gray-600 capitalize font-semibold">
                            {key}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Blog content */}
              <div className="prose max-w-none text-gray-700 leading-relaxed">
                <div dangerouslySetInnerHTML={{ __html: blog.content }} />

                {/* Learning System Info - Show only if exists */}
                {blog.learningSystemInfo && (
                  <div className="bg-gradient-to-r from-[#315c2b]/5 to-[#6f732f]/5 p-8 rounded-2xl my-10 border-l-4 border-[#315c2b] shadow-lg">
                    <h3 className="font-bold text-gray-800 mb-4 text-xl flex items-center gap-3">
                      <div className="w-2 h-2 bg-gradient-to-r from-[#315c2b] to-[#6f732f] rounded-full animate-pulse"></div>
                      How the Learning System Works:
                    </h3>
                    <p className="text-gray-700 leading-relaxed text-lg">
                      {blog.learningSystemInfo}
                    </p>
                  </div>
                )}

                {/* Who Should Enroll - Show only if exists */}
                {blog.whoShouldEnroll && (
                  <div className="bg-gradient-to-r from-[#6f732f]/5 to-[#22C55E]/5 p-8 rounded-2xl my-10 border-l-4 border-[#6f732f] shadow-lg">
                    <h3 className="font-bold text-gray-800 mb-4 text-xl flex items-center gap-3">
                      <div className="w-2 h-2 bg-gradient-to-r from-[#6f732f] to-[#22C55E] rounded-full animate-pulse"></div>
                      Who Should Enroll:
                    </h3>
                    <p className="text-gray-700 leading-relaxed text-lg">
                      {blog.whoShouldEnroll}
                    </p>
                  </div>
                )}

                {/* Contact Info - Show only if exists */}
                {blog.contactInfo && (
                  <div className="bg-gradient-to-r from-gray-50 to-green-50 p-8 rounded-2xl my-10 shadow-lg border border-gray-200">
                    <p className="text-gray-700 leading-relaxed text-lg">
                      {blog.contactInfo}
                    </p>
                  </div>
                )}

                {/* Enrollment Process Button - Replace the old process with this */}
                {(blog.enrollmentProcess || blog.applicationProcess) && (
                  <div className="bg-gradient-to-br from-[#315c2b] via-[#6f732f] to-[#22C55E] p-10 rounded-2xl my-10 text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
                    <div className="relative z-10">
                      <h3 className="text-3xl font-bold text-white mb-4">
                        Ready to Get Started?
                      </h3>
                      <p className="text-green-100 mb-8 text-lg max-w-2xl mx-auto">
                        Follow our simple enrollment process to secure your spot
                        and begin your learning journey.
                      </p>
                      <button
                        onClick={() =>
                          handleClickie(
                            "/enrollment-process",
                            "enrollment-process"
                          )
                        }
                        className="group relative overflow-hidden inline-flex items-center bg-white text-[#315c2b] hover:text-[#6f732f] font-bold py-5 px-10 rounded-2xl gap-4 transition-all duration-300 shadow-2xl hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        {loading === "enrollment-process" ? (
                          <div className="flex items-center gap-2">
                            <ImSpinner className="animate-spin" size={20} />
                            <span>Redirecting...</span>
                          </div>
                        ) : (
                          <>
                            <div className="p-2 bg-[#315c2b]/10 rounded-lg group-hover:bg-[#6f732f]/10 transition-colors duration-300">
                              <FaGraduationCap className="text-xl" />
                            </div>
                            <span className="text-lg">
                              View Enrollment Process
                            </span>
                            <FaExternalLinkAlt className="text-sm group-hover:translate-x-1 transition-transform duration-300" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Special message for announcements */}
                {blog.category === "Announcement" && (
                  <div className="bg-gradient-to-r from-[#22C55E]/10 to-[#CFF333]/10 p-8 rounded-2xl my-10 border-l-4 border-[#22C55E] shadow-lg">
                    <div className="flex items-start gap-6">
                      <div className="p-3 bg-[#22C55E]/10 rounded-xl flex-shrink-0">
                        <FaCheckCircle className="text-[#22C55E] text-2xl" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 mb-4 text-xl">
                          Don't Miss Out!
                        </p>
                        <p className="text-gray-700 mb-6 leading-relaxed text-lg">
                          Don't miss out on the chance to secure your future.
                          Apply today and be part of Punjab's bright, skilled
                          workforce.
                        </p>
                        <p className="font-bold text-[#22C55E] text-xl">
                          Join {SiteDetails.programName} today and help shape the future of Punjab!
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </article>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-1/3">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20 sticky top-24">
              {/* Quick Action Card */}
              <div className=" border-t-2 border-[#315c2b]/10">
                <div className="bg-gradient-to-br from-[#315c2b]/10 via-[#6f732f]/5 to-[#22C55E]/10 p-8 rounded-2xl border border-[#315c2b]/20 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#315c2b]/20 to-[#6f732f]/20 rounded-full -translate-y-10 translate-x-10"></div>
                  <div className="relative z-10">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                      <FaUsers className="text-[#315c2b]" />
                      Join  {SiteDetails.programName} Community
                    </h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      Connect with thousands of learners and start your skills
                      development journey today.
                    </p>
                    <button
                      onClick={() =>
                        handleClickie("/enrollment-process", "join-community")
                      }
                      className="group relative overflow-hidden w-full bg-gradient-to-r from-[#315c2b] to-[#6f732f] hover:from-[#6f732f] hover:to-[#22C55E] text-white py-4 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 transform hover:-translate-y-0.5"
                    >
                      {loading === "join-community" ? (
                        <div className="flex items-center gap-2">
                          <ImSpinner className="animate-spin" size={20} />
                          <span>Redirecting...</span>
                        </div>
                      ) : (
                        <>
                          <FaGraduationCap className="group-hover:scale-110 transition-transform duration-300" />
                          <span>Start Learning</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Copyright />
    </div>
  );
};

export default BlogDetails;
