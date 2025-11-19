"use client";
import React, { useState } from "react";
import {
  FaArrowRight,
  FaTag,
  FaCalendarAlt,
  FaUser,
  FaClock,
  FaFire,
  FaEye,
  FaHeart,
  FaBookmark,
} from "react-icons/fa";
import Link from "next/link";
import { getAllBlogs } from "@/Data/Blogs";
import { ImSpinner } from "react-icons/im";
import { useRouter } from "next/navigation";
const Client = () => {
  const [likedBlogs, setLikedBlogs] = useState(new Set());
  const [bookmarkedBlogs, setBookmarkedBlogs] = useState(new Set());
  const [loading, setLoading] = useState(null);
  const router = useRouter();

  // Get all blogs from data file and sort by timestamp
  const blogs = getAllBlogs().sort((a, b) => {
    // Sort by isNew first, then by timestamp
    if (a.isNew && !b.isNew) return -1;
    if (!a.isNew && b.isNew) return 1;
    return new Date(b.timestamp) - new Date(a.timestamp);
  });

  const handleClickie = (path, buttonIndex) => {
    setLoading(buttonIndex);
    setTimeout(() => {
      router.push(path);
    }, 0);
  };

  const toggleLike = (blogId) => {
    setLikedBlogs((prev) => {
      const newLiked = new Set(prev);
      if (newLiked.has(blogId)) {
        newLiked.delete(blogId);
      } else {
        newLiked.add(blogId);
      }
      return newLiked;
    });
  };

  const toggleBookmark = (blogId) => {
    setBookmarkedBlogs((prev) => {
      const newBookmarked = new Set(prev);
      if (newBookmarked.has(blogId)) {
        newBookmarked.delete(blogId);
      } else {
        newBookmarked.add(blogId);
      }
      return newBookmarked;
    });
  };

  // Auto update timestamps every 15 days
  React.useEffect(() => {
    const today = new Date();
    const lastUpdate = localStorage.getItem("lastUpdate");

    if (!lastUpdate || daysBetween(new Date(lastUpdate), today) >= 15) {
      // Update timestamps
      blogs.forEach((blog) => {
        blog.timestamp =
          new Date(blog.timestamp).getTime() + 15 * 24 * 60 * 60 * 1000;
      });

      localStorage.setItem("lastUpdate", today.toISOString());
    }
  }, []);

  const daysBetween = (date1, date2) => {
    const diffTime = Math.abs(date2 - date1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      {/* Featured Blog */}
      {blogs.length > 0 && (
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3">
            <div className="p-2 bg-second rounded-xl">
              <FaFire className="text-white text-xl" />
            </div>
            Featured Post
          </h2>

          <div className="relative">
            <div className="absolute inset-0 bg-second rounded-3xl blur-md opacity-40 transition-opacity duration-500"></div>

            <div className="relative bg-white overflow-hidden rounded-br-3xl rounded-tl-3xl border border-white/20">
              <div className="p-10">
                <div className="flex justify-between items-start mb-8">
                  <div className="text-black px-6 py-3 text-sm font-bold flex items-center gap-2 overflow-hidden">
                    <FaTag className="text-sm" />
                    <span>{blogs[0].category}</span>
                  </div>
                </div>
                <style jsx>{`
                  @keyframes rotate3d {
                    0% {
                      transform: perspective(1200px) rotateY(-10deg)
                        rotateX(5deg);
                    }
                    50% {
                      transform: perspective(1200px) rotateY(10deg)
                        rotateX(-5deg);
                    }
                    100% {
                      transform: perspective(1200px) rotateY(-10deg)
                        rotateX(5deg);
                    }
                  }

                  .card-3d-rotate {
                    animation: rotate3d 8s ease-in-out infinite;
                    transform-style: preserve-3d;
                    transition: transform 0.3s ease;
                  }

                  .govt-badge {
                    background: linear-gradient(
                      135deg,
                      #f59e0b 0%,
                      #d97706 100%
                    );
                    box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
                  }

                  .stat-card {
                    position: relative;
                    overflow: hidden;
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                  }

                  .stat-card::before {
                    content: "";
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(
                      135deg,
                      rgba(0, 0, 0, 0.7) 0%,
                      rgba(0, 0, 0, 0.4) 50%,
                      rgba(0, 0, 0, 0.7) 100%
                    );
                    z-index: 1;
                  }

                  .stat-card-content {
                    position: relative;
                    z-index: 10;
                  }
                `}</style>
                <div className="flex flex-col lg:flex-row">
                  <div className="">
                    {" "}
                    <h2 className="text-4xl md:text-5xl font-black text-gray-800 mb-6 leading-tight">
                      {blogs[0].title}
                    </h2>
                    <p className="text-gray-600 mb-8 text-xl leading-relaxed">
                      {blogs[0].excerpt}
                    </p>
                  </div>
                  <img
                    src="/Student-Card.avif"
                    alt=""
                    className="h-80 card-3d-rotate  rounded-xl"
                  />
                </div>

                <div className="flex items-center justify-between my-5">
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-full">
                      <FaCalendarAlt className="text-primary" />
                      <span className="font-medium">
                        November 1, 2025
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-full">
                      <FaUser className="text-primary" />
                      <span className="font-medium">Honhaar Jawan</span>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-full">
                      <FaClock className="text-primary" />
                      <span className="font-medium">{blogs[0].readTime}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleLike(blogs[0].id)}
                      className={`p-3 rounded-full transition-all duration-300 transform hover:scale-110 ${
                        likedBlogs.has(blogs[0].id)
                          ? "bg-red-100 text-red-500 shadow-lg"
                          : "bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-500"
                      }`}
                    >
                      <FaHeart
                        className={
                          likedBlogs.has(blogs[0].id) ? "animate-pulse" : ""
                        }
                      />
                    </button>
                    <button
                      onClick={() => toggleBookmark(blogs[0].id)}
                      className={`p-3 rounded-full transition-all duration-300 transform hover:scale-110 ${
                        bookmarkedBlogs.has(blogs[0].id)
                          ? "bg-blue-100 text-blue-500 shadow-lg"
                          : "bg-gray-100 hover:bg-blue-100 text-gray-500 hover:text-blue-500"
                      }`}
                    >
                      <FaBookmark
                        className={
                          bookmarkedBlogs.has(blogs[0].id)
                            ? "animate-bounce"
                            : ""
                        }
                      />
                    </button>
                  </div>
                </div>

                <button
                  onClick={() =>
                    handleClickie(
                      `/blogs/details/${blogs[0].id}`,
                      `featured-${blogs[0].id}`
                    )
                  }
                  className="group overflow-hidden inline-flex items-center bg-second text-white font-bold px-8 py-4 rounded-2xl gap-3 transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
                >
                  {loading === `featured-${blogs[0].id}` ? (
                    <div className="flex items-center gap-2">
                      <ImSpinner className="animate-spin" size={20} />
                      <span>Loading...</span>
                    </div>
                  ) : (
                    <>
                      Read Full Article <FaArrowRight className="text-lg" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* All Blogs Grid */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-gray-800 mb-10 flex items-center gap-3">
          <div className="p-2 bg-second rounded-xl">
            <FaEye className="text-white text-xl" />
          </div>
          All Posts
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.map((blog, index) => (
            <article
              key={blog.id}
              className="group relative  rounded-2xl overflow-hidden shadow-2xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-white/20 h-[400px] flex flex-col"
            >
              {/* Gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-second/5 via-primary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              {/* New badge */}
              {blog.isNew && (
                <div
                  className="absolute top-4 right-4 bg-second text-white px-3 py-1 text-xs font-bold flex items-center gap-1 z-10 animate-bounce"
                  style={{
                    clipPath:
                      "polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)",
                  }}
                >
                  <FaFire className="text-xs" /> NEW
                </div>
              )}

              {/* Blog header */}
              <div className="p-6 pb-0">
                <div className="flex justify-between items-center mb-4">
                  <div className=" text-black px-4 py-2 text-sm font-bold flex items-center gap-2">
                    <FaTag className="text-xs" />
                    <span>{blog.category}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    <FaClock className="text-xs" /> {blog.readTime}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-800 mb-4 h-14 line-clamp-2 group-hover:text-primary transition-colors">
                  {blog.title}
                </h3>
              </div>

              {/* Content */}
              <div className="p-6 pt-0 flex-grow flex flex-col justify-between">
                <p className="text-gray-600 mb-6 h-[72px] line-clamp-3 leading-relaxed">
                  {blog.excerpt}
                </p>

                <div className="mt-auto">
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                    <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-full">
                      <FaCalendarAlt className="text-primary text-xs" />
                      <span className="text-xs">
                        November 1, 2025
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-full">
                      <FaUser className="text-primary text-xs" />
                      <span className="text-xs">{blog.author}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() =>
                        handleClickie(
                          `/blogs/details/${blog.id}`,
                          `blog-${blog.id}`
                        )
                      }
                      className="group relative overflow-hidden flex items-center bg-second text-white font-bold px-6 py-3 rounded-xl gap-2 transition-all duration-300 transform hover:-translate-y-0.5 shadow-md hover:shadow-lg"
                    >
                      {loading === `blog-${blog.id}` ? (
                        <div className="flex items-center gap-2">
                          <ImSpinner className="animate-spin" size={16} />
                          <span>Loading...</span>
                        </div>
                      ) : (
                        <>
                          Read More <FaArrowRight className="text-sm" />
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleLike(blog.id)}
                        className={`p-2 rounded-full transition-all duration-300 transform hover:scale-110 ${
                          likedBlogs.has(blog.id)
                            ? "bg-red-100 text-red-500 shadow-md"
                            : "bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500"
                        }`}
                      >
                        <FaHeart
                          className={`text-sm ${
                            likedBlogs.has(blog.id) ? "animate-pulse" : ""
                          }`}
                        />
                      </button>
                      <button
                        onClick={() => toggleBookmark(blog.id)}
                        className={`p-2 rounded-full transition-all duration-300 transform hover:scale-110 ${
                          bookmarkedBlogs.has(blog.id)
                            ? "bg-blue-100 text-blue-500 shadow-md"
                            : "bg-gray-100 hover:bg-blue-100 text-gray-400 hover:text-blue-500"
                        }`}
                      >
                        <FaBookmark
                          className={`text-sm ${
                            bookmarkedBlogs.has(blog.id) ? "animate-bounce" : ""
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Client;
