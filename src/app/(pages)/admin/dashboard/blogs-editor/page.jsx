"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ToastProvider, useToast } from "@/components/primary/Toast";
import {
  FaSave,
  FaEye,
  FaPlus,
  FaTrash,
  FaClock,
  FaCalendar,
  FaTag,
  FaCode,
  FaList,
  FaLink,
  FaUser,
  FaSearch,
  FaGripVertical,
  FaTimes,
  FaEdit,
  FaSpinner,
  FaExclamationTriangle,
  FaCheckCircle,
  FaArrowLeft,
} from "react-icons/fa";
import AdminProtectedRoutes from "@/ProtectedRoutes/AdminProtectedRoutes";
import SidebarWrapper from "@/adminComponents/SidebarWrapper";
import { firestore } from "@/Backend/Firebase";

import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { ImSpinner } from "react-icons/im";

// Error Display Component
const ErrorDisplay = ({ errors, onDismiss }) => {
  if (!errors.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4"
    >
      <div className="flex items-start gap-3">
        <FaExclamationTriangle className="text-red-500 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-red-800 mb-2">
            Please fix the following errors:
          </h4>
          <ul className="space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-red-700 text-sm">
                • {error}
              </li>
            ))}
          </ul>
        </div>
        <button onClick={onDismiss} className="text-red-500 hover:text-red-700">
          <FaTimes size={14} />
        </button>
      </div>
    </motion.div>
  );
};

// Firestore helper functions
const createBlog = async (id, data) => {
  try {
    const docRef = doc(firestore, "blogs", id);
    await setDoc(docRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error creating blog:", error);
    throw error;
  }
};

const updateBlog = async (id, data) => {
  try {
    const docRef = doc(firestore, "blogs", id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error updating blog:", error);
    throw error;
  }
};

const deleteBlog = async (id) => {
  try {
    const docRef = doc(firestore, "blogs", id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting blog:", error);
    throw error;
  }
};

const getBlogById = async (id) => {
  try {
    const docRef = doc(firestore, "blogs", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting blog by ID:", error);
    return null;
  }
};

const getAllBlogs = async () => {
  try {
    const q = query(
      collection(firestore, "blogs"),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    const documents = [];
    querySnapshot.forEach((doc) => {
      documents.push({ id: doc.id, ...doc.data() });
    });

    return documents;
  } catch (error) {
    console.error("Error getting all blogs:", error);
    return [];
  }
};

// Generate slug from title
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
};

// Rich Text Editor Component
const RichEditor = ({ value, onChange }) => {
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={20}
        className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 font-mono text-sm resize-none transition-all duration-300"
        placeholder="Start writing your blog content... (supports raw HTML)"
      />
      <div className="mt-2 text-sm text-gray-500">
        Tip: You can use HTML tags for rich formatting
      </div>
    </div>
  );
};

// Lists Editor Component
const ListsEditor = ({ title, items, onChange, placeholder }) => {
  const addItem = () => {
    onChange([...items, ""]);
  };

  const removeItem = (index) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index, value) => {
    const updated = [...items];
    updated[index] = value;
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-700">
          {title}
        </label>
        <button
          onClick={addItem}
          className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-all duration-300 text-sm font-medium"
        >
          <FaPlus size={12} />
          Add Item
        </button>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {items.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex-shrink-0 text-gray-400 cursor-move">
                <FaGripVertical size={14} />
              </div>
              <input
                type="text"
                value={item}
                onChange={(e) => updateItem(index, e.target.value)}
                className="flex-1 p-3 border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-300"
                placeholder={placeholder}
              />
              <button
                onClick={() => removeItem(index)}
                className="flex-shrink-0 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Remove item"
              >
                <FaTrash size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {items.length === 0 && (
          <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
            <FaList size={32} className="mx-auto text-gray-300 mb-4" />
            <p className="mb-4">No items added yet</p>
            <button
              onClick={addItem}
              className="text-amber-600 hover:text-amber-700 underline font-medium"
            >
              Add the first item
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Related Posts Picker Component
const RelatedPostsPicker = ({ selectedPosts, allBlogs, onChange }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const filteredBlogs = allBlogs.filter(
    (blog) =>
      blog.title?.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selectedPosts.find((post) => post.id === blog.id)
  );

  const addPost = (blog) => {
    const newPost = {
      id: blog.id,
      title: blog.title,
      category: blog.category,
      date: blog.date,
      slug: blog.id,
    };
    onChange([...selectedPosts, newPost]);
    setSearchTerm("");
    setShowSearch(false);
  };

  const removePost = (index) => {
    onChange(selectedPosts.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-700">
          <FaLink className="inline mr-2" />
          Related Posts
        </label>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all duration-300 text-sm font-medium"
        >
          <FaPlus size={12} />
          Add Related Post
        </button>
      </div>

      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-gray-50 rounded-xl border border-gray-200"
          >
            <div className="relative">
              <FaSearch
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={14}
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                placeholder="Search for posts to add..."
              />
            </div>

            {searchTerm && (
              <div className="mt-3 max-h-48 overflow-y-auto">
                {filteredBlogs.length > 0 ? (
                  <div className="space-y-2">
                    {filteredBlogs.slice(0, 5).map((blog) => (
                      <button
                        key={blog.id}
                        onClick={() => addPost(blog)}
                        className="w-full text-left p-3 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200"
                      >
                        <div className="font-medium text-gray-900">
                          {blog.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {blog.category} • {blog.date}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No posts found matching "{searchTerm}"
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        <AnimatePresence>
          {selectedPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg"
            >
              <div className="flex-1">
                <div className="font-medium text-gray-900">{post.title}</div>
                <div className="text-sm text-gray-500">
                  {post.category} • {post.date}
                </div>
              </div>
              <button
                onClick={() => removePost(index)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Remove related post"
              >
                <FaTrash size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {selectedPosts.length === 0 && (
          <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
            <FaLink size={32} className="mx-auto text-gray-300 mb-4" />
            <p>No related posts added</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Full Screen Preview Modal
const PreviewModal = ({ isOpen, onClose, blogData }) => {
  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FaEye className="text-amber-500" />
                Blog Preview
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <FaTimes size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <article className="prose prose-lg max-w-none">
                {/* Header */}
                <header className="space-y-6 mb-8">
                  {blogData.isNew && (
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      New
                    </div>
                  )}

                  <h1 className="text-4xl font-bold text-gray-900 leading-tight mb-4">
                    {blogData.title || "Untitled Blog Post"}
                  </h1>

                  {blogData.excerpt && (
                    <p className="text-xl text-gray-600 leading-relaxed">
                      {blogData.excerpt}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 p-4 bg-gray-50 rounded-xl">
                    {blogData.author && (
                      <div className="flex items-center gap-2">
                        <FaUser size={14} />
                        <span>{blogData.author}</span>
                      </div>
                    )}

                    {blogData.date && (
                      <div className="flex items-center gap-2">
                        <FaCalendar size={14} />
                        <span>{formatDate(blogData.timestamp)}</span>
                      </div>
                    )}

                    {blogData.readTime && (
                      <div className="flex items-center gap-2">
                        <FaClock size={14} />
                        <span>{blogData.readTime}</span>
                      </div>
                    )}

                    {blogData.category && (
                      <div className="flex items-center gap-2">
                        <FaTag size={14} />
                        <span>{blogData.category}</span>
                      </div>
                    )}
                  </div>
                </header>

                {/* Content */}
                <div
                  className="prose prose-lg max-w-none mb-8"
                  dangerouslySetInnerHTML={{
                    __html:
                      blogData.content ||
                      '<p class="text-gray-500 italic">Start writing to see content preview...</p>',
                  }}
                />

                {/* Metadata Sections */}
                {(blogData.modules > 0 ||
                  blogData.duration ||
                  blogData.level) && (
                  <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 mb-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      Course Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {blogData.modules > 0 && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">
                            Modules
                          </dt>
                          <dd className="text-lg font-semibold text-gray-900">
                            {blogData.highlights?.modules || blogData.modules}
                          </dd>
                        </div>
                      )}

                      {blogData.duration && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">
                            Duration
                          </dt>
                          <dd className="text-lg font-semibold text-gray-900">
                            {blogData.highlights?.duration || blogData.duration}
                          </dd>
                        </div>
                      )}

                      {blogData.level && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">
                            Level
                          </dt>
                          <dd className="text-lg font-semibold text-gray-900">
                            {blogData.highlights?.level || blogData.level}
                          </dd>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Who Should Enroll */}
                {blogData.whoShouldEnroll && (
                  <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 mb-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      Who Should Enroll
                    </h3>
                    <p className="text-gray-700">{blogData.whoShouldEnroll}</p>
                  </div>
                )}

                {/* Enrollment Process */}
                {blogData.enrollmentProcess?.length > 0 && (
                  <div className="bg-green-50 p-6 rounded-xl border border-green-200 mb-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      Enrollment Process
                    </h3>
                    <ol className="list-decimal list-inside space-y-2">
                      {blogData.enrollmentProcess.map((step, index) => (
                        <li key={index} className="text-gray-700">
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Related Posts */}
                {blogData.relatedPosts?.length > 0 && (
                  <div className="border-t border-gray-200 pt-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">
                      Related Posts
                    </h3>
                    <div className="grid gap-4">
                      {blogData.relatedPosts.map((post, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {post.title}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {post.category} • {post.date}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Blog List Item Component
const BlogListItem = ({ blog, onEdit, onDelete }) => {
  const formatDate = (timestamp) => {
    if (!timestamp) return "No date";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
              {blog.title || "Untitled"}
            </h3>
            {blog.isNew && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                New
              </span>
            )}
          </div>

          {blog.excerpt && (
            <p className="text-gray-600 mb-3 line-clamp-2">{blog.excerpt}</p>
          )}

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <FaUser size={12} />
              <span>{blog.author || "No author"}</span>
            </div>
            <div className="flex items-center gap-1">
              <FaCalendar size={12} />
              <span>{formatDate(blog.createdAt)}</span>
            </div>
            {blog.category && (
              <div className="flex items-center gap-1">
                <FaTag size={12} />
                <span>{blog.category}</span>
              </div>
            )}
            {blog.readTime && (
              <div className="flex items-center gap-1">
                <FaClock size={12} />
                <span>{blog.readTime}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={() => onEdit(blog.id)}
            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            title="Edit blog"
          >
            <FaEdit size={16} />
          </button>
          <button
            onClick={() => onDelete(blog)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete blog"
          >
            <FaTrash size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// Blog List Component
const BlogsList = ({ blogs, onEdit, onDelete, onCreateNew, onRefresh }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">All Blogs</h2>
        <div className="flex gap-3">
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300 font-medium"
          >
            Load Blogs
          </button>
          <button
            onClick={onCreateNew}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold"
          >
            <FaPlus size={16} />
            Create New Blog
          </button>
        </div>
      </div>

      {blogs.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-white rounded-2xl p-12 shadow-lg border border-gray-200">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaEdit size={32} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              No blogs yet
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Get started by creating your first blog post. Share your thoughts,
              tutorials, or announcements with your audience.
            </p>
            <button
              onClick={onCreateNew}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold"
            >
              <FaPlus size={16} />
              Create Your First Blog
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {blogs.map((blog) => (
            <BlogListItem
              key={blog.id}
              blog={blog}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Blog Form Component
const BlogForm = ({
  blogData,
  onInputChange,
  onNestedChange,
  onArrayChange,
  allBlogs,
  errors,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState("basic");

  const categories = [
    "Technology",
    "Web Development",
    "Programming",
    "Tutorial",
    "News",
    "Review",
    "Announcement",
    "New Course",
  ];

  const levels = ["Beginner", "Intermediate", "Advanced"];

  const handleDateChange = (dateString) => {
    const date = new Date(dateString);
    onInputChange("date", date.toLocaleDateString());
    onInputChange("timestamp", date);
  };

  const handleTitleChange = (title) => {
    onInputChange("title", title);
    // Auto-generate slug if it's empty or matches previous title slug
    if (
      !blogData.id ||
      blogData.id === generateSlug(blogData.previousTitle || "")
    ) {
      const newSlug = generateSlug(title);
      onInputChange("id", newSlug);
      onInputChange("previousTitle", title);
    }
  };

  const tabs = [
    { id: "basic", label: "Basic Info", icon: "📝" },
    { id: "content", label: "Content", icon: "✍️" },
    { id: "metadata", label: "Metadata", icon: "🏷️" },
    { id: "advanced", label: "Advanced", icon: "⚙️" },
  ];

  const getFieldError = (fieldName) => {
    return errors.find((error) => error.includes(fieldName.toLowerCase()));
  };

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-300"
      >
        <FaArrowLeft size={14} />
        Back to Blogs List
      </button>

      {/* Tab Navigation */}
      <div className="border-b-2 border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-2 border-b-2 font-semibold text-sm transition-all duration-300 ${
                activeTab === tab.id
                  ? "border-amber-500 text-amber-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Basic Info Tab */}
      {activeTab === "basic" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Title *
              </label>
              <input
                type="text"
                value={blogData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className={`w-full p-4 border-2 rounded-xl focus:ring-4 focus:ring-amber-500/20 transition-all duration-300 ${
                  getFieldError("title")
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-300 focus:border-amber-500"
                }`}
                placeholder="Enter blog title"
                required
              />
              {getFieldError("title") && (
                <p className="mt-2 text-sm text-red-600">
                  {getFieldError("title")}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Slug/ID *
              </label>
              <input
                type="text"
                value={blogData.id}
                onChange={(e) =>
                  onInputChange(
                    "id",
                    e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                  )
                }
                className={`w-full p-4 border-2 rounded-xl focus:ring-4 focus:ring-amber-500/20 transition-all duration-300 ${
                  getFieldError("slug") || getFieldError("id")
                    ? "border-red-500 focus:border-red-500"
                    : "border-gray-300 focus:border-amber-500"
                }`}
                placeholder="my-blog-post"
                pattern="[a-z0-9-]+"
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                Only lowercase letters, numbers, and hyphens allowed.
                Auto-generated from title.
              </p>
              {(getFieldError("slug") || getFieldError("id")) && (
                <p className="mt-1 text-sm text-red-600">
                  {getFieldError("slug") || getFieldError("id")}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Excerpt
            </label>
            <textarea
              value={blogData.excerpt}
              onChange={(e) => onInputChange("excerpt", e.target.value)}
              rows={4}
              className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-300"
              placeholder="Brief description of the blog post"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Author
              </label>
              <input
                type="text"
                value={blogData.author}
                onChange={(e) => onInputChange("author", e.target.value)}
                className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-300"
                placeholder="Author name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Category
              </label>
              <select
                value={blogData.category}
                onChange={(e) => onInputChange("category", e.target.value)}
                className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-300"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Read Time
              </label>
              <input
                type="text"
                value={blogData.readTime}
                onChange={(e) => onInputChange("readTime", e.target.value)}
                className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-300"
                placeholder="5 min read"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <FaCalendar className="inline mr-2" />
                Publication Date
              </label>
              <input
                type="date"
                value={
                  blogData.timestamp
                    ? new Date(blogData.timestamp).toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-300"
              />
            </div>

            <div className="flex items-center space-x-6 pt-12">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={blogData.isNew}
                  onChange={(e) => onInputChange("isNew", e.target.checked)}
                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 w-5 h-5"
                />
                <span className="ml-3 text-sm font-medium text-gray-700">
                  Mark as new
                </span>
              </label>
            </div>
          </div>
        </motion.div>
      )}

      {/* Content Tab */}
      {activeTab === "content" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Content *
            </label>
            <RichEditor
              value={blogData.content}
              onChange={(content) => onInputChange("content", content)}
            />
            {getFieldError("content") && (
              <p className="mt-2 text-sm text-red-600">
                {getFieldError("content")}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Who Should Enroll
            </label>
            <textarea
              value={blogData.whoShouldEnroll}
              onChange={(e) => onInputChange("whoShouldEnroll", e.target.value)}
              rows={4}
              className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-300"
              placeholder="Describe who this content is for"
            />
          </div>

          <ListsEditor
            title="Enrollment Process"
            items={blogData.enrollmentProcess}
            onChange={(items) => onArrayChange("enrollmentProcess", items)}
            placeholder="Add enrollment step"
          />
        </motion.div>
      )}

      {/* Metadata Tab */}
      {activeTab === "metadata" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Modules
              </label>
              <input
                type="number"
                value={blogData.modules}
                onChange={(e) =>
                  onInputChange("modules", parseInt(e.target.value) || 0)
                }
                className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-300"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Duration
              </label>
              <input
                type="text"
                value={blogData.duration}
                onChange={(e) => onInputChange("duration", e.target.value)}
                className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-300"
                placeholder="2 weeks"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Level
              </label>
              <select
                value={blogData.level}
                onChange={(e) => onInputChange("level", e.target.value)}
                className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-300"
              >
                <option value="">Select level</option>
                {levels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Highlights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Modules Highlight
                </label>
                <input
                  type="text"
                  value={blogData.highlights?.modules || ""}
                  onChange={(e) =>
                    onNestedChange("highlights", "modules", e.target.value)
                  }
                  className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-300"
                  placeholder="12 modules"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Duration Highlight
                </label>
                <input
                  type="text"
                  value={blogData.highlights?.duration || ""}
                  onChange={(e) =>
                    onNestedChange("highlights", "duration", e.target.value)
                  }
                  className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-300"
                  placeholder="6 weeks"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Level Highlight
                </label>
                <input
                  type="text"
                  value={blogData.highlights?.level || ""}
                  onChange={(e) =>
                    onNestedChange("highlights", "level", e.target.value)
                  }
                  className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-300"
                  placeholder="Beginner to Advanced"
                />
              </div>
            </div>
          </div>

          <RelatedPostsPicker
            selectedPosts={blogData.relatedPosts}
            allBlogs={allBlogs}
            onChange={(posts) => onArrayChange("relatedPosts", posts)}
          />
        </motion.div>
      )}

      {/* Advanced Tab */}
      {activeTab === "advanced" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="bg-gray-50 p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              <FaCode className="inline mr-2" />
              Raw JSON Editor
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Advanced users can edit the raw blog data in format.
            </p>
            <textarea
              value={JSON.stringify(blogData, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  Object.keys(parsed).forEach((key) => {
                    onInputChange(key, parsed[key]);
                  });
                } catch (error) {
                  // Invalid JSON, ignore
                }
              }}
              rows={25}
              className="w-full p-4 border-2 border-gray-300 rounded-xl font-mono text-sm focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-300"
            />
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Main Blog Editor Component
const BlogsContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const blogId = searchParams.get("id");
  const { showToast } = useToast();

  const [blogData, setBlogData] = useState({
    id: "",
    title: "",
    content: "",
    excerpt: "",
    category: "",
    date: new Date().toLocaleDateString(),
    timestamp: new Date(),
    author: "",
    readTime: "",
    isNew: false,
    modules: 0,
    duration: "",
    level: "",
    highlights: {
      modules: "",
      duration: "",
      level: "",
    },
    whoShouldEnroll: "",
    enrollmentProcess: [],
    relatedPosts: [],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [allBlogs, setAllBlogs] = useState([]);
  const [errors, setErrors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState(null);

  // Load blog data if editing
  useEffect(() => {
    if (blogId) {
      setShowForm(true);
      loadBlog(blogId);
    } else {
      setShowForm(false);
    }
  }, [blogId]);

  const loadBlog = async (id) => {
    setIsLoading(true);
    try {
      const blog = await getBlogById(id);
      if (blog) {
        setBlogData({
          ...blog,
          timestamp:
            blog.timestamp?.toDate?.() ||
            new Date(blog.timestamp) ||
            new Date(),
          date:
            blog.date ||
            new Date(
              blog.timestamp?.toDate?.() || blog.timestamp
            ).toLocaleDateString(),
          highlights: blog.highlights || {
            modules: "",
            duration: "",
            level: "",
          },
          enrollmentProcess: blog.enrollmentProcess || [],
          relatedPosts: blog.relatedPosts || [],
        });
      } else {
        showToast("Blog not found", "error");
        router.push("/admin/dashboard/blogs-editor");
      }
    } catch (error) {
      showToast("Failed to load blog", "error");
      console.error("Error loading blog:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllBlogs = async () => {
    try {
      const blogs = await getAllBlogs();
      setAllBlogs(blogs || []);
    } catch (error) {
      console.error("Error loading all blogs:", error);
      showToast("Failed to load blogs", "error");
    }
  };

  const handleInputChange = useCallback(
    (field, value) => {
      setBlogData((prev) => ({
        ...prev,
        [field]: value,
      }));
      setUnsavedChanges(true);
      // Clear errors when user starts typing
      if (errors.length > 0) {
        setErrors([]);
      }
    },
    [errors.length]
  );

  const handleNestedChange = useCallback((parentField, childField, value) => {
    setBlogData((prev) => ({
      ...prev,
      [parentField]: {
        ...prev[parentField],
        [childField]: value,
      },
    }));
    setUnsavedChanges(true);
  }, []);

  const handleArrayChange = useCallback((field, newArray) => {
    setBlogData((prev) => ({
      ...prev,
      [field]: newArray,
    }));
    setUnsavedChanges(true);
  }, []);

  const calculateReadTime = () => {
    const wordsPerMinute = 200;
    const words = blogData.content.replace(/<[^>]*>/g, "").split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    const readTime = `${minutes} min read`;

    handleInputChange("readTime", readTime);
    showToast(`Read time calculated: ${readTime}`, "success");
  };

  const validateForm = () => {
    const newErrors = [];

    if (!blogData.id?.trim()) {
      newErrors.push("Slug/ID is required");
    }

    if (!blogData.title?.trim()) {
      newErrors.push("Title is required");
    }

    if (!blogData.content?.trim()) {
      newErrors.push("Content is required");
    }

    // Validate slug format
    const slugPattern = /^[a-z0-9-]+$/;
    if (blogData.id && !slugPattern.test(blogData.id)) {
      newErrors.push(
        "Slug must contain only lowercase letters, numbers, and hyphens"
      );
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const checkSlugUniqueness = async (slug) => {
    if (!slug || slug === blogId) return true;

    try {
      const existingBlog = await getBlogById(slug);
      return !existingBlog;
    } catch (error) {
      return true; // Assume unique if error
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      showToast("Please fix the errors before saving", "error");
      return;
    }

    // Check slug uniqueness for new blogs
    if (!blogId && !(await checkSlugUniqueness(blogData.id))) {
      setErrors(["Slug already exists. Please choose a different one."]);
      showToast("Slug already exists. Please choose a different one.", "error");
      return;
    }

    setIsSaving(true);

    try {
      const blogToSave = {
        ...blogData,
        timestamp: new Date(),
        updatedAt: new Date(),
      };

      if (blogId) {
        await updateBlog(blogId, blogToSave);
        showToast("Blog updated successfully", "success");
      } else {
        await createBlog(blogData.id, { ...blogToSave, createdAt: new Date() });
        router.push(`/admin/dashboard/blogs-editor?id=${blogData.id}`);
        showToast("Blog created successfully", "success");
      }

      setUnsavedChanges(false);
      setErrors([]);
      loadAllBlogs(); // Refresh the list
    } catch (error) {
      showToast("Failed to save blog", "error");
      console.error("Error saving blog:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!blogToDelete) return;

    try {
      await deleteBlog(blogToDelete.id);
      showToast("Blog deleted successfully", "success");
      loadAllBlogs(); // Refresh the list

      // If we're currently editing the deleted blog, go back to list
      if (blogId === blogToDelete.id) {
        router.push("/admin/dashboard/blogs-editor");
      }
    } catch (error) {
      showToast("Failed to delete blog", "error");
      console.error("Error deleting blog:", error);
    }
    setShowDeleteModal(false);
    setBlogToDelete(null);
  };

  const handleCreateNew = () => {
    if (unsavedChanges) {
      if (
        !confirm(
          "You have unsaved changes. Are you sure you want to create a new blog?"
        )
      ) {
        return;
      }
    }

    // Reset blog data
    setBlogData({
      id: "",
      title: "",
      content: "",
      excerpt: "",
      category: "",
      date: new Date().toLocaleDateString(),
      timestamp: new Date(),
      author: "",
      readTime: "",
      isNew: false,
      modules: 0,
      duration: "",
      level: "",
      highlights: {
        modules: "",
        duration: "",
        level: "",
      },
      whoShouldEnroll: "",
      enrollmentProcess: [],
      relatedPosts: [],
    });
    setUnsavedChanges(false);
    setErrors([]);
    setShowForm(true);
    router.push("/admin/dashboard/blogs-editor");
  };

  const handleEditBlog = (id) => {
    if (unsavedChanges) {
      if (
        !confirm(
          "You have unsaved changes. Are you sure you want to edit another blog?"
        )
      ) {
        return;
      }
    }
    router.push(`/admin/dashboard/blogs-editor?id=${id}`);
  };

  const handleDeleteBlog = (blog) => {
    setBlogToDelete(blog);
    setShowDeleteModal(true);
  };

  const handleBackToList = () => {
    if (unsavedChanges) {
      if (
        !confirm("You have unsaved changes. Are you sure you want to go back?")
      ) {
        return;
      }
    }
    setShowForm(false);
    setUnsavedChanges(false);
    setErrors([]);
    router.push("/admin/dashboard/blogs-editor");
  };

  const canSave =
    blogData.id?.trim() && blogData.title?.trim() && blogData.content?.trim();

  return (
    <ToastProvider>
      <AdminProtectedRoutes>
        <SidebarWrapper>
          <div className="max-w-7xl mx-auto">
            {showForm ? (
              <>
                {/* Toolbar for Form */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6 mb-8 shadow-lg"
                >
                  <div className="flex flex-wrap items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                        {blogId ? "Edit Blog" : "Create New Blog"}
                      </h1>
                      {unsavedChanges && (
                        <span className="px-3 py-1 bg-amber-200 text-amber-800 rounded-full text-sm font-semibold">
                          Unsaved changes
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                      <button
                        onClick={calculateReadTime}
                        className="flex items-center gap-2 px-4 py-3 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-all duration-300 font-medium"
                        title="Calculate read time"
                      >
                        <FaClock size={16} />
                        <span className="hidden sm:inline">
                          Calculate Read Time
                        </span>
                      </button>

                      <button
                        onClick={() => setShowPreviewModal(true)}
                        className="flex items-center gap-2 px-4 py-3 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-all duration-300 font-medium"
                      >
                        <FaEye size={16} />
                        <span className="hidden sm:inline">Preview</span>
                      </button>

                      {blogId && (
                        <button
                          onClick={() =>
                            handleDeleteBlog({
                              id: blogId,
                              title: blogData.title,
                            })
                          }
                          className="flex items-center gap-2 px-4 py-3 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-all duration-300 font-medium"
                        >
                          <FaTrash size={16} />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      )}

                      <button
                        onClick={handleSave}
                        disabled={isSaving || !canSave}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl font-semibold"
                      >
                        {isSaving ? (
                          <>
                            <FaSpinner className="animate-spin" size={16} />
                            Saving...
                          </>
                        ) : (
                          <>
                            <FaSave size={16} />
                            Save Blog
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>

                {/* Error Display */}
                <ErrorDisplay errors={errors} onDismiss={() => setErrors([])} />

                {/* Main Form Content */}
                <motion.div
                  layout
                  className="bg-white rounded-2xl shadow-lg border border-gray-200"
                >
                  <div className="p-8">
                    <BlogForm
                      blogData={blogData}
                      onInputChange={handleInputChange}
                      onNestedChange={handleNestedChange}
                      onArrayChange={handleArrayChange}
                      allBlogs={allBlogs}
                      errors={errors}
                      onBack={handleBackToList}
                    />
                  </div>
                </motion.div>
              </>
            ) : (
              <>
                {/* Header for List */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6 mb-8 shadow-lg"
                >
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                    Blog Management
                  </h1>
                  <p className="text-gray-600 mt-2">
                    Create, edit, and manage your blog posts
                  </p>
                </motion.div>

                {/* Blog List */}
                <motion.div
                  layout
                  className="bg-white rounded-2xl shadow-lg border border-gray-200"
                >
                  <div className="p-8">
                    <BlogsList
                      blogs={allBlogs}
                      onEdit={handleEditBlog}
                      onDelete={handleDeleteBlog}
                      onCreateNew={handleCreateNew}
                      onRefresh={loadAllBlogs}
                    />
                  </div>
                </motion.div>
              </>
            )}

            {/* Preview Modal */}
            <PreviewModal
              isOpen={showPreviewModal}
              onClose={() => setShowPreviewModal(false)}
              blogData={blogData}
            />

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
              {showDeleteModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                  onClick={() => setShowDeleteModal(false)}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="text-center">
                      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                        <FaTrash className="h-8 w-8 text-red-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">
                        Delete Blog Post
                      </h3>
                      <p className="text-gray-600 mb-8">
                        Are you sure you want to delete "{blogToDelete?.title}"?
                        This action cannot be undone.
                      </p>
                      <div className="flex gap-4 justify-center">
                        <button
                          onClick={() => {
                            setShowDeleteModal(false);
                            setBlogToDelete(null);
                          }}
                          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleDelete}
                          className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
                        >
                          Delete Blog
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading Overlay */}
            {isLoading && (
              <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-40">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
                  <FaSpinner className="animate-spin text-amber-500 text-4xl mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Loading blog...</p>
                </div>
              </div>
            )}
          </div>
        </SidebarWrapper>
      </AdminProtectedRoutes>
    </ToastProvider>
  );
};

const BlogsEditor = () => (
  <Suspense
    fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center gap-4 text-gray-800 bg-white rounded-2xl p-8 shadow-xl border border-gray-200">
          <ImSpinner className="animate-spin text-3xl text-yellow-600" />
          <span className="text-lg font-semibold">Loading Blogs Hub...</span>
        </div>
      </div>
    }
  >
    <BlogsContent />
  </Suspense>
);

export default BlogsEditor;
