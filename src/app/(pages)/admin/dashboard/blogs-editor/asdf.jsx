// // // /app/admin/dashboard/blogs-editor/page.jsx
// "use client";

// import { useState, useEffect, useCallback } from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';
// import { motion, AnimatePresence } from 'framer-motion';
// import { toast, Toaster } from 'react-hot-toast';
// import { 
//   FaSave, 
//   FaEye, 
//   FaPlus, 
//   FaTrash, 
//   FaUpload,
//   FaClock,
//   FaCalendar,
//   FaTag,
//   FaImage,
//   FaCode,
//   FaList,
//   FaLink
// } from 'react-icons/fa';
// import SidebarWrapper from '@/adminComponents/SidebarWrapper';
// import AdminProtectedRoutes from '@/ProtectedRoutes/AdminProtectedRoutes';
// import BlogForm from '@/adminComponents/BlogsEditor/BlogForm';
// import PreviewPane from '@/adminComponents/BlogsEditor/PreviewPane';
// import { 
//   createBlog, 
//   updateBlog, 
//   deleteBlog, 
//   getBlogById, 
//   getAllBlogs 
// } from '@/lib/firebase/blogs';

// const BlogsEditor = () => {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const blogId = searchParams.get('id');
  
//   const [blogData, setBlogData] = useState({
//     id: '',
//     title: '',
//     content: '',
//     excerpt: '',
//     category: '',
//     date: new Date().toLocaleDateString(),
//     timestamp: new Date(),
//     author: '',
//     readTime: '',
//     isNew: false,
//     modules: 0,
//     duration: '',
//     level: '',
//     highlights: {
//       modules: '',
//       duration: '',
//       level: ''
//     },
//     whoShouldEnroll: '',
//     enrollmentProcess: [],
//     relatedPosts: [],
//     imageURL: ''
//   });
  
//   const [isLoading, setIsLoading] = useState(false);
//   const [isSaving, setIsSaving] = useState(false);
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [showPreview, setShowPreview] = useState(false);
//   const [autoSave, setAutoSave] = useState(false);
//   const [unsavedChanges, setUnsavedChanges] = useState(false);
//   const [allBlogs, setAllBlogs] = useState([]);
//   const [showAdvanced, setShowAdvanced] = useState(false);

//   // Load blog data if editing
//   useEffect(() => {
//     if (blogId) {
//       loadBlog(blogId);
//     }
//     loadAllBlogs();
//   }, [blogId]);

//   // Auto-save functionality
//   useEffect(() => {
//     if (autoSave && unsavedChanges && blogData.id && blogData.title && blogData.content) {
//       const timer = setTimeout(() => {
//         handleSave(true);
//       }, 2000);
      
//       return () => clearTimeout(timer);
//     }
//   }, [blogData, autoSave, unsavedChanges]);

//   const loadBlog = async (id) => {
//     setIsLoading(true);
//     try {
//       const blog = await getBlogById(id);
//       if (blog) {
//         setBlogData({
//           ...blog,
//           timestamp: blog.timestamp?.toDate?.() || new Date(blog.timestamp) || new Date(),
//           date: blog.date || new Date(blog.timestamp?.toDate?.() || blog.timestamp).toLocaleDateString()
//         });
//       }
//     } catch (error) {
//       toast.error('Failed to load blog');
//       console.error('Error loading blog:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const loadAllBlogs = async () => {
//     try {
//       const blogs = await getAllBlogs();
//       setAllBlogs(blogs);
//     } catch (error) {
//       console.error('Error loading all blogs:', error);
//     }
//   };

//   const handleInputChange = useCallback((field, value) => {
//     setBlogData(prev => ({
//       ...prev,
//       [field]: value
//     }));
//     setUnsavedChanges(true);
//   }, []);

//   const handleNestedChange = useCallback((parentField, childField, value) => {
//     setBlogData(prev => ({
//       ...prev,
//       [parentField]: {
//         ...prev[parentField],
//         [childField]: value
//       }
//     }));
//     setUnsavedChanges(true);
//   }, []);

//   const handleArrayChange = useCallback((field, newArray) => {
//     setBlogData(prev => ({
//       ...prev,
//       [field]: newArray
//     }));
//     setUnsavedChanges(true);
//   }, []);

//   const calculateReadTime = () => {
//     const wordsPerMinute = 200;
//     const words = blogData.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
//     const minutes = Math.ceil(words / wordsPerMinute);
//     const readTime = `${minutes} min read`;
    
//     handleInputChange('readTime', readTime);
//     toast.success(`Read time calculated: ${readTime}`);
//   };

//   const validateForm = () => {
//     if (!blogData.id.trim()) {
//       toast.error('Slug/ID is required');
//       return false;
//     }
    
//     if (!blogData.title.trim()) {
//       toast.error('Title is required');
//       return false;
//     }
    
//     if (!blogData.content.trim()) {
//       toast.error('Content is required');
//       return false;
//     }

//     // Validate slug format
//     const slugPattern = /^[a-z0-9-]+$/;
//     if (!slugPattern.test(blogData.id)) {
//       toast.error('Slug must contain only lowercase letters, numbers, and hyphens');
//       return false;
//     }

//     return true;
//   };

//   const checkSlugUniqueness = async (slug) => {
//     if (!slug || slug === blogId) return true;
    
//     try {
//       const existingBlog = await getBlogById(slug);
//       return !existingBlog;
//     } catch (error) {
//       return true; // Assume unique if error
//     }
//   };

//   const handleSave = async (isAutoSave = false) => {
//     if (!validateForm()) return;

//     // Check slug uniqueness for new blogs
//     if (!blogId && !(await checkSlugUniqueness(blogData.id))) {
//       toast.error('Slug already exists. Please choose a different one.');
//       return;
//     }

//     setIsSaving(true);
    
//     try {
//       const blogToSave = {
//         ...blogData,
//         timestamp: new Date(),
//         updatedAt: new Date()
//       };

//       if (blogId) {
//         await updateBlog(blogId, blogToSave);
//         if (!isAutoSave) toast.success('Blog updated successfully');
//       } else {
//         await createBlog(blogData.id, { ...blogToSave, createdAt: new Date() });
//         router.push(`/admin/dashboard/blogs-editor?id=${blogData.id}`);
//         if (!isAutoSave) toast.success('Blog created successfully');
//       }
      
//       setUnsavedChanges(false);
//       if (isAutoSave) {
//         toast.success('Auto-saved', { duration: 1000 });
//       }
//     } catch (error) {
//       toast.error(isAutoSave ? 'Auto-save failed' : 'Failed to save blog');
//       console.error('Error saving blog:', error);
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const handleDelete = async () => {
//     if (!blogId) return;
    
//     try {
//       await deleteBlog(blogId);
//       toast.success('Blog deleted successfully');
//       router.push('/admin/dashboard/blogs-editor');
//     } catch (error) {
//       toast.error('Failed to delete blog');
//       console.error('Error deleting blog:', error);
//     }
//     setShowDeleteModal(false);
//   };

//   const handleNew = () => {
//     if (unsavedChanges) {
//       if (!confirm('You have unsaved changes. Are you sure you want to create a new blog?')) {
//         return;
//       }
//     }
//     router.push('/admin/dashboard/blogs-editor');
//     setBlogData({
//       id: '',
//       title: '',
//       content: '',
//       excerpt: '',
//       category: '',
//       date: new Date().toLocaleDateString(),
//       timestamp: new Date(),
//       author: '',
//       readTime: '',
//       isNew: false,
//       modules: 0,
//       duration: '',
//       level: '',
//       highlights: {
//         modules: '',
//         duration: '',
//         level: ''
//       },
//       whoShouldEnroll: '',
//       enrollmentProcess: [],
//       relatedPosts: [],
//       imageURL: ''
//     });
//     setUnsavedChanges(false);
//   };

//   return (
//     <AdminProtectedRoutes>
//       <SidebarWrapper>
//         <div className="max-w-7xl mx-auto">
//           <Toaster position="top-right" />
          
//           {/* Toolbar */}
//           <motion.div 
//             initial={{ opacity: 0, y: -20 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-6 shadow-sm"
//           >
//             <div className="flex flex-wrap items-center justify-between gap-4">
//               <div className="flex items-center gap-2">
//                 <h1 className="text-xl font-bold text-gray-800">
//                   {blogId ? 'Edit Blog' : 'Create New Blog'}
//                 </h1>
//                 {unsavedChanges && (
//                   <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded-full">
//                     Unsaved changes
//                   </span>
//                 )}
//               </div>
              
//               <div className="flex items-center gap-3 flex-wrap">
//                 <label className="flex items-center gap-2 text-sm">
//                   <input
//                     type="checkbox"
//                     checked={autoSave}
//                     onChange={(e) => setAutoSave(e.target.checked)}
//                     className="rounded"
//                   />
//                   Auto-save
//                 </label>
                
//                 <button
//                   onClick={calculateReadTime}
//                   className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
//                   title="Calculate read time"
//                 >
//                   <FaClock size={14} />
//                   <span className="hidden sm:inline">Read Time</span>
//                 </button>
                
//                 <button
//                   onClick={() => setShowPreview(!showPreview)}
//                   className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
//                 >
//                   <FaEye size={14} />
//                   <span className="hidden sm:inline">
//                     {showPreview ? 'Hide' : 'Show'} Preview
//                   </span>
//                 </button>
                
//                 <button
//                   onClick={handleNew}
//                   className="flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
//                 >
//                   <FaPlus size={14} />
//                   <span className="hidden sm:inline">New</span>
//                 </button>
                
//                 {blogId && (
//                   <button
//                     onClick={() => setShowDeleteModal(true)}
//                     className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
//                   >
//                     <FaTrash size={14} />
//                     <span className="hidden sm:inline">Delete</span>
//                   </button>
//                 )}
                
//                 <button
//                   onClick={() => handleSave(false)}
//                   disabled={isSaving || !validateForm()}
//                   className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-lg hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
//                 >
//                   <FaSave size={14} />
//                   {isSaving ? 'Saving...' : 'Save'}
//                 </button>
//               </div>
//             </div>
//           </motion.div>

//           {/* Main Content */}
//           <div className={`grid gap-6 ${showPreview ? 'lg:grid-cols-2' : 'lg:grid-cols-1'}`}>
//             {/* Form Panel */}
//             <motion.div
//               layout
//               className="bg-white rounded-xl shadow-sm border border-gray-200"
//             >
//               <div className="p-6">
//                 <BlogForm
//                   blogData={blogData}
//                   onInputChange={handleInputChange}
//                   onNestedChange={handleNestedChange}
//                   onArrayChange={handleArrayChange}
//                   allBlogs={allBlogs}
//                   showAdvanced={showAdvanced}
//                   onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
//                 />
//               </div>
//             </motion.div>

//             {/* Preview Panel */}
//             <AnimatePresence>
//               {showPreview && (
//                 <motion.div
//                   initial={{ opacity: 0, x: 300 }}
//                   animate={{ opacity: 1, x: 0 }}
//                   exit={{ opacity: 0, x: 300 }}
//                   className="bg-white rounded-xl shadow-sm border border-gray-200"
//                 >
//                   <div className="p-6">
//                     <PreviewPane blogData={blogData} />
//                   </div>
//                 </motion.div>
//               )}
//             </AnimatePresence>
//           </div>

//           {/* Delete Confirmation Modal */}
//           <AnimatePresence>
//             {showDeleteModal && (
//               <motion.div
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: 1 }}
//                 exit={{ opacity: 0 }}
//                 className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
//                 onClick={() => setShowDeleteModal(false)}
//               >
//                 <motion.div
//                   initial={{ opacity: 0, scale: 0.9 }}
//                   animate={{ opacity: 1, scale: 1 }}
//                   exit={{ opacity: 0, scale: 0.9 }}
//                   className="bg-white rounded-xl p-6 max-w-md w-full"
//                   onClick={(e) => e.stopPropagation()}
//                 >
//                   <h3 className="text-lg font-bold text-gray-900 mb-2">
//                     Delete Blog
//                   </h3>
//                   <p className="text-gray-600 mb-6">
//                     Are you sure you want to delete "{blogData.title}"? This action cannot be undone.
//                   </p>
//                   <div className="flex gap-3 justify-end">
//                     <button
//                       onClick={() => setShowDeleteModal(false)}
//                       className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
//                     >
//                       Cancel
//                     </button>
//                     <button
//                       onClick={handleDelete}
//                       className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
//                     >
//                       Delete
//                     </button>
//                   </div>
//                 </motion.div>
//               </motion.div>
//             )}
//           </AnimatePresence>

//           {isLoading && (
//             <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-40">
//               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
//             </div>
//           )}
//         </div>
//       </SidebarWrapper>
//     </AdminProtectedRoutes>
//   );
// };

// export default BlogsEditor;

// // /adminComponents/BlogsEditor/BlogForm.jsx
// "use client";

// import { useState } from 'react';
// import { motion } from 'framer-motion';
// import { FaPlus, FaTrash, FaCode, FaImage, FaCalendar } from 'react-icons/fa';
// import RichEditor from './RichEditor';
// import ImageUploader from './ImageUploader';
// import ListsEditor from './ListsEditor';
// import RelatedPostsPicker from './RelatedPostsPicker';

// const BlogForm = ({
//   blogData,
//   onInputChange,
//   onNestedChange,
//   onArrayChange,
//   allBlogs,
//   showAdvanced,
//   onToggleAdvanced
// }) => {
//   const [activeTab, setActiveTab] = useState('basic');

//   const categories = [
//     'Technology',
//     'Web Development',
//     'Programming',
//     'Tutorial',
//     'News',
//     'Review'
//   ];

//   const levels = ['Beginner', 'Intermediate', 'Advanced'];

//   const handleDateChange = (dateString) => {
//     const date = new Date(dateString);
//     onInputChange('date', date.toLocaleDateString());
//     onInputChange('timestamp', date);
//   };

//   const tabs = [
//     { id: 'basic', label: 'Basic Info', icon: '📝' },
//     { id: 'content', label: 'Content', icon: '✍️' },
//     { id: 'metadata', label: 'Metadata', icon: '🏷️' },
//     { id: 'advanced', label: 'Advanced', icon: '⚙️' }
//   ];

//   return (
//     <div className="space-y-6">
//       {/* Tab Navigation */}
//       <div className="border-b border-gray-200">
//         <nav className="flex space-x-8">
//           {tabs.map((tab) => (
//             <button
//               key={tab.id}
//               onClick={() => setActiveTab(tab.id)}
//               className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
//                 activeTab === tab.id
//                   ? 'border-amber-500 text-amber-600'
//                   : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//               }`}
//             >
//               <span className="mr-2">{tab.icon}</span>
//               {tab.label}
//             </button>
//           ))}
//         </nav>
//       </div>

//       {/* Basic Info Tab */}
//       {activeTab === 'basic' && (
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="space-y-6"
//         >
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Slug/ID *
//               </label>
//               <input
//                 type="text"
//                 value={blogData.id}
//                 onChange={(e) => onInputChange('id', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
//                 className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
//                 placeholder="my-blog-post"
//                 pattern="[a-z0-9-]+"
//                 required
//               />
//               <p className="text-xs text-gray-500 mt-1">
//                 Only lowercase letters, numbers, and hyphens allowed
//               </p>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Title *
//               </label>
//               <input
//                 type="text"
//                 value={blogData.title}
//                 onChange={(e) => onInputChange('title', e.target.value)}
//                 className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
//                 placeholder="Enter blog title"
//                 required
//               />
//             </div>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Excerpt
//             </label>
//             <textarea
//               value={blogData.excerpt}
//               onChange={(e) => onInputChange('excerpt', e.target.value)}
//               rows={3}
//               className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
//               placeholder="Brief description of the blog post"
//             />
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Author
//               </label>
//               <input
//                 type="text"
//                 value={blogData.author}
//                 onChange={(e) => onInputChange('author', e.target.value)}
//                 className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
//                 placeholder="Author name"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Category
//               </label>
//               <select
//                 value={blogData.category}
//                 onChange={(e) => onInputChange('category', e.target.value)}
//                 className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
//               >
//                 <option value="">Select category</option>
//                 {categories.map((cat) => (
//                   <option key={cat} value={cat}>{cat}</option>
//                 ))}
//               </select>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Read Time
//               </label>
//               <input
//                 type="text"
//                 value={blogData.readTime}
//                 onChange={(e) => onInputChange('readTime', e.target.value)}
//                 className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
//                 placeholder="5 min read"
//               />
//             </div>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 <FaCalendar className="inline mr-2" />
//                 Publication Date
//               </label>
//               <input
//                 type="date"
//                 value={blogData.timestamp ? new Date(blogData.timestamp).toISOString().split('T')[0] : ''}
//                 onChange={(e) => handleDateChange(e.target.value)}
//                 className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
//               />
//             </div>

//             <div className="flex items-center space-x-4 pt-8">
//               <label className="flex items-center">
//                 <input
//                   type="checkbox"
//                   checked={blogData.isNew}
//                   onChange={(e) => onInputChange('isNew', e.target.checked)}
//                   className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
//                 />
//                 <span className="ml-2 text-sm text-gray-700">Mark as new</span>
//               </label>
//             </div>
//           </div>

//           <ImageUploader
//             imageURL={blogData.imageURL}
//             onImageChange={(url) => onInputChange('imageURL', url)}
//           />
//         </motion.div>
//       )}

//       {/* Content Tab */}
//       {activeTab === 'content' && (
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="space-y-6"
//         >
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Content *
//             </label>
//             <RichEditor
//               value={blogData.content}
//               onChange={(content) => onInputChange('content', content)}
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Who Should Enroll
//             </label>
//             <textarea
//               value={blogData.whoShouldEnroll}
//               onChange={(e) => onInputChange('whoShouldEnroll', e.target.value)}
//               rows={3}
//               className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
//               placeholder="Describe who this content is for"
//             />
//           </div>

//           <ListsEditor
//             title="Enrollment Process"
//             items={blogData.enrollmentProcess}
//             onChange={(items) => onArrayChange('enrollmentProcess', items)}
//             placeholder="Add enrollment step"
//           />
//         </motion.div>
//       )}

//       {/* Metadata Tab */}
//       {activeTab === 'metadata' && (
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="space-y-6"
//         >
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Modules
//               </label>
//               <input
//                 type="number"
//                 value={blogData.modules}
//                 onChange={(e) => onInputChange('modules', parseInt(e.target.value) || 0)}
//                 className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
//                 min="0"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Duration
//               </label>
//               <input
//                 type="text"
//                 value={blogData.duration}
//                 onChange={(e) => onInputChange('duration', e.target.value)}
//                 className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
//                 placeholder="2 weeks"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Level
//               </label>
//               <select
//                 value={blogData.level}
//                 onChange={(e) => onInputChange('level', e.target.value)}
//                 className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
//               >
//                 <option value="">Select level</option>
//                 {levels.map((level) => (
//                   <option key={level} value={level}>{level}</option>
//                 ))}
//               </select>
//             </div>
//           </div>

//           <div>
//             <h3 className="text-lg font-medium text-gray-900 mb-4">Highlights</h3>
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Modules Highlight
//                 </label>
//                 <input
//                   type="text"
//                   value={blogData.highlights.modules}
//                   onChange={(e) => onNestedChange('highlights', 'modules', e.target.value)}
//                   className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
//                   placeholder="12 modules"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Duration Highlight
//                 </label>
//                 <input
//                   type="text"
//                   value={blogData.highlights.duration}
//                   onChange={(e) => onNestedChange('highlights', 'duration', e.target.value)}
//                   className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
//                   placeholder="6 weeks"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Level Highlight
//                 </label>
//                 <input
//                   type="text"
//                   value={blogData.highlights.level}
//                   onChange={(e) => onNestedChange('highlights', 'level', e.target.value)}
//                   className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
//                   placeholder="Beginner to Advanced"
//                 />
//               </div>
//             </div>
//           </div>

//           <RelatedPostsPicker
//             selectedPosts={blogData.relatedPosts}
//             allBlogs={allBlogs}
//             onChange={(posts) => onArrayChange('relatedPosts', posts)}
//           />
//         </motion.div>
//       )}

//       {/* Advanced Tab */}
//       {activeTab === 'advanced' && (
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="space-y-6"
//         >
//           <div className="bg-gray-50 p-4 rounded-lg">
//             <h3 className="text-lg font-medium text-gray-900 mb-2">
//               <FaCode className="inline mr-2" />
//               Raw JSON Editor
//             </h3>
//             <p className="text-sm text-gray-600 mb-4">
//               Advanced users can edit the raw blog data in JSON format.
//             </p>
//             <textarea
//               value={JSON.stringify(blogData, null, 2)}
//               onChange={(e) => {
//                 try {
//                   const parsed = JSON.parse(e.target.value);
//                   Object.keys(parsed).forEach(key => {
//                     onInputChange(key, parsed[key]);
//                   });
//                 } catch (error) {
//                   // Invalid JSON, ignore
//                 }
//               }}
//               rows={20}
//               className="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
//             />
//           </div>
//         </motion.div>
//       )}
//     </div>
//   );
// };

// export default BlogForm;

// // /adminComponents/BlogsEditor/RichEditor.jsx
// "use client";

// import { useEffect, useRef, useState } from 'react';
// import dynamic from 'next/dynamic';

// const ReactQuill = dynamic(() => import('react-quill'), { 
//   ssr: false,
//   loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />
// });

// const RichEditor = ({ value, onChange }) => {
//   const [mounted, setMounted] = useState(false);

//   useEffect(() => {
//     setMounted(true);
//   }, []);

//   const modules = {
//     toolbar: [
//       [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
//       ['bold', 'italic', 'underline', 'strike'],
//       [{ 'color': [] }, { 'background': [] }],
//       [{ 'list': 'ordered'}, { 'list': 'bullet' }],
//       [{ 'indent': '-1'}, { 'indent': '+1' }],
//       [{ 'align': [] }],
//       ['link', 'image', 'video'],
//       ['blockquote', 'code-block'],
//       ['clean']
//     ],
//   };

//   const formats = [
//     'header', 'bold', 'italic', 'underline', 'strike',
//     'color', 'background', 'list', 'bullet', 'indent',
//     'align', 'link', 'image', 'video', 'blockquote', 'code-block'
//   ];

//   if (!mounted) {
//     return <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />;
//   }

//   return (
//     <div className="prose-editor">
//       <ReactQuill
//         value={value}
//         onChange={onChange}
//         modules={modules}
//         formats={formats}
//         theme="snow"
//         placeholder="Start writing your blog content..."
//         style={{ height: '300px', marginBottom: '50px' }}
//       />
//       <style jsx global>{`
//         .ql-editor {
//           min-height: 200px;
//           font-size: 16px;
//           line-height: 1.6;
//         }
//         .ql-toolbar {
//           border-top-left-radius: 8px;
//           border-top-right-radius: 8px;
//         }
//         .ql-container {
//           border-bottom-left-radius: 8px;
//           border-bottom-right-radius: 8px;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default RichEditor;

// // /adminComponents/BlogsEditor/ImageUploader.jsx
// "use client";

// import { useState } from 'react';
// import { motion } from 'framer-motion';
// import { FaUpload, FaTrash, FaImage } from 'react-icons/fa';
// import { toast } from 'react-hot-toast';
// import { uploadImage } from '@/lib/firebase/storage';

// const ImageUploader = ({ imageURL, onImageChange }) => {
//   const [uploading, setUploading] = useState(false);
//   const [dragOver, setDragOver] = useState(false);

//   const handleFileSelect = async (file) => {
//     if (!file) return;

//     // Validate file type
//     if (!file.type.startsWith('image/')) {
//       toast.error('Please select an image file');
//       return;
//     }

//     // Validate file size (max 5MB)
//     if (file.size > 5 * 1024 * 1024) {
//       toast.error('File size must be less than 5MB');
//       return;
//     }

//     setUploading(true);
//     try {
//       const url = await uploadImage(file, 'blogs');
//       onImageChange(url);
//       toast.success('Image uploaded successfully');
//     } catch (error) {
//       toast.error('Failed to upload image');
//       console.error('Upload error:', error);
//     } finally {
//       setUploading(false);
//     }
//   };

//   const handleDrop = (e) => {
//     e.preventDefault();
//     setDragOver(false);
//     const file = e.dataTransfer.files[0];
//     handleFileSelect(file);
//   };

//   const handleDragOver = (e) => {
//     e.preventDefault();
//     setDragOver(true);
//   };

//   const handleDragLeave = (e) => {
//     e.preventDefault();
//     setDragOver(false);
//   };

//   return (
//     <div>
//       <label className="block text-sm font-medium text-gray-700 mb-2">
//         <FaImage className="inline mr-2" />
//         Featured Image
//       </label>
      
//       {imageURL ? (
//         <div className="relative">
//           <img
//             src={imageURL}
//             alt="Featured"
//             className="w-full h-48 object-cover rounded-lg border border-gray-300"
//           />
//           <button
//             onClick={() => onImageChange('')}
//             className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
//             title="Remove image"
//           >
//             <FaTrash size={12} />
//           </button>
//         </div>
//       ) : (
//         <motion.div
//           onDrop={handleDrop}
//           onDragOver={handleDragOver}
//           onDragLeave={handleDragLeave}
//           className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
//             dragOver
//               ? 'border-amber-400 bg-amber-50'
//               : 'border-gray-300 hover:border-amber-400 hover:bg-amber-50'
//           }`}
//         >
//           {uploading ? (
//             <div className="flex items-center justify-center">
//               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
//               <span className="ml-2 text-gray-600">Uploading...</span>
//             </div>
//           ) : (
//             <>
//               <FaUpload size={32} className="mx-auto text-gray-400 mb-4" />
//               <p className="text-gray-600 mb-4">
//                 Drop an image here, or{' '}
//                 <label className="text-amber-600 hover:text-amber-700 cursor-pointer underline">
//                   browse
//                   <input
//                     type="file"
//                     accept="image/*"
//                     onChange={(e) => handleFileSelect(e.target.files[0])}
//                     className="hidden"
//                   />
//                 </label>
//               </p>
//               <p className="text-xs text-gray-500">
//                 PNG, JPG, GIF up to 5MB
//               </p>
//             </>
//           )}
//         </motion.div>
//       )}
//     </div>
//   );
// };

// export default ImageUploader;

// // /adminComponents/BlogsEditor/ListsEditor.jsx
// "use client";

// import { motion, AnimatePresence } from 'framer-motion';
// import { FaPlus, FaTrash, FaGripVertical } from 'react-icons/fa';

// const ListsEditor = ({ title, items, onChange, placeholder }) => {
//   const addItem = () => {
//     onChange([...items, '']);
//   };

//   const removeItem = (index) => {
//     onChange(items.filter((_, i) => i !== index));
//   };

//   const updateItem = (index, value) => {
//     const updated = [...items];
//     updated[index] = value;
//     onChange(updated);
//   };

//   return (
//     <div>
//       <div className="flex items-center justify-between mb-3">
//         <label className="block text-sm font-medium text-gray-700">
//           {title}
//         </label>
//         <button
//           onClick={addItem}
//           className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors text-sm"
//         >
//           <FaPlus size={12} />
//           Add Item
//         </button>
//       </div>

//       <div className="space-y-2">
//         <AnimatePresence>
//           {items.map((item, index) => (
//             <motion.div
//               key={index}
//               initial={{ opacity: 0, height: 0 }}
//               animate={{ opacity: 1, height: 'auto' }}
//               exit={{ opacity: 0, height: 0 }}
//               className="flex items-center gap-2"
//             >
//               <div className="flex-shrink-0 text-gray-400 cursor-move">
//                 <FaGripVertical size={12} />
//               </div>
//               <input
//                 type="text"
//                 value={item}
//                 onChange={(e) => updateItem(index, e.target.value)}
//                 className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
//                 placeholder={placeholder}
//               />
//               <button
//                 onClick={() => removeItem(index)}
//                 className="flex-shrink-0 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
//                 title="Remove item"
//               >
//                 <FaTrash size={12} />
//               </button>
//             </motion.div>
//           ))}
//         </AnimatePresence>

//         {items.length === 0 && (
//           <div className="text-center py-8 text-gray-500">
//             <p>No items added yet</p>
//             <button
//               onClick={addItem}
//               className="mt-2 text-amber-600 hover:text-amber-700 underline"
//             >
//               Add the first item
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ListsEditor;

// // /adminComponents/BlogsEditor/RelatedPostsPicker.jsx
// "use client";

// import { useState } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { FaPlus, FaTrash, FaSearch, FaLink } from 'react-icons/fa';

// const RelatedPostsPicker = ({ selectedPosts, allBlogs, onChange }) => {
//   const [searchTerm, setSearchTerm] = useState('');
//   const [showSearch, setShowSearch] = useState(false);

//   const filteredBlogs = allBlogs.filter(blog => 
//     blog.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
//     !selectedPosts.find(post => post.id === blog.id)
//   );

//   const addPost = (blog) => {
//     const newPost = {
//       id: blog.id,
//       title: blog.title,
//       category: blog.category,
//       date: blog.date,
//       slug: blog.id
//     };
//     onChange([...selectedPosts, newPost]);
//     setSearchTerm('');
//     setShowSearch(false);
//   };

//   const removePost = (index) => {
//     onChange(selectedPosts.filter((_, i) => i !== index));
//   };

//   return (
//     <div>
//       <div className="flex items-center justify-between mb-3">
//         <label className="block text-sm font-medium text-gray-700">
//           <FaLink className="inline mr-2" />
//           Related Posts
//         </label>
//         <button
//           onClick={() => setShowSearch(!showSearch)}
//           className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
//         >
//           <FaPlus size={12} />
//           Add Related Post
//         </button>
//       </div>

//       <AnimatePresence>
//         {showSearch && (
//           <motion.div
//             initial={{ opacity: 0, height: 0 }}
//             animate={{ opacity: 1, height: 'auto' }}
//             exit={{ opacity: 0, height: 0 }}
//             className="mb-4 p-4 bg-gray-50 rounded-lg"
//           >
//             <div className="relative">
//               <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
//               <input
//                 type="text"
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 placeholder="Search for posts to add..."
//               />
//             </div>

//             {searchTerm && (
//               <div className="mt-2 max-h-48 overflow-y-auto">
//                 {filteredBlogs.length > 0 ? (
//                   <div className="space-y-1">
//                     {filteredBlogs.slice(0, 5).map((blog) => (
//                       <button
//                         key={blog.id}
//                         onClick={() => addPost(blog)}
//                         className="w-full text-left p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200"
//                       >
//                         <div className="font-medium text-gray-900">{blog.title}</div>
//                         <div className="text-sm text-gray-500">
//                           {blog.category} • {blog.date}
//                         </div>
//                       </button>
//                     ))}
//                   </div>
//                 ) : (
//                   <div className="text-center py-4 text-gray-500">
//                     No posts found matching "{searchTerm}"
//                   </div>
//                 )}
//               </div>
//             )}
//           </motion.div>
//         )}
//       </AnimatePresence>

//       <div className="space-y-2">
//         <AnimatePresence>
//           {selectedPosts.map((post, index) => (
//             <motion.div
//               key={post.id}
//               initial={{ opacity: 0, height: 0 }}
//               animate={{ opacity: 1, height: 'auto' }}
//               exit={{ opacity: 0, height: 0 }}
//               className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
//             >
//               <div className="flex-1">
//                 <div className="font-medium text-gray-900">{post.title}</div>
//                 <div className="text-sm text-gray-500">
//                   {post.category} • {post.date}
//                 </div>
//               </div>
//               <button
//                 onClick={() => removePost(index)}
//                 className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
//                 title="Remove related post"
//               >
//                 <FaTrash size={12} />
//               </button>
//             </motion.div>
//           ))}
//         </AnimatePresence>

//         {selectedPosts.length === 0 && (
//           <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
//             <FaLink size={24} className="mx-auto text-gray-300 mb-2" />
//             <p>No related posts added</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default RelatedPostsPicker;

// // /adminComponents/BlogsEditor/PreviewPane.jsx
// "use client";

// import { motion } from 'framer-motion';
// import { FaCalendar, FaUser, FaClock, FaTag } from 'react-icons/fa';

// const PreviewPane = ({ blogData }) => {
//   const formatDate = (date) => {
//     if (!date) return '';
//     return new Date(date).toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric'
//     });
//   };

//   return (
//     <motion.div
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       className="prose prose-lg max-w-none"
//     >
//       <div className="sticky top-0 bg-white pb-4 mb-6 border-b border-gray-200">
//         <h2 className="text-lg font-bold text-gray-900 mb-0">Preview</h2>
//         <p className="text-sm text-gray-500 mt-1">Live preview of your blog post</p>
//       </div>

//       <article className="space-y-6">
//         {/* Header */}
//         <header className="space-y-4">
//           {blogData.imageURL && (
//             <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
//               <img
//                 src={blogData.imageURL}
//                 alt={blogData.title}
//                 className="w-full h-full object-cover"
//               />
//             </div>
//           )}

//           {blogData.isNew && (
//             <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
//               New
//             </div>
//           )}

//           <h1 className="text-3xl font-bold text-gray-900 leading-tight">
//             {blogData.title || 'Untitled Blog Post'}
//           </h1>

//           {blogData.excerpt && (
//             <p className="text-xl text-gray-600 leading-relaxed">
//               {blogData.excerpt}
//             </p>
//           )}

//           <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
//             {blogData.author && (
//               <div className="flex items-center gap-1">
//                 <FaUser size={12} />
//                 <span>{blogData.author}</span>
//               </div>
//             )}
            
//             {blogData.date && (
//               <div className="flex items-center gap-1">
//                 <FaCalendar size={12} />
//                 <span>{formatDate(blogData.timestamp)}</span>
//               </div>
//             )}
            
//             {blogData.readTime && (
//               <div className="flex items-center gap-1">
//                 <FaClock size={12} />
//                 <span>{blogData.readTime}</span>
//               </div>
//             )}
            
//             {blogData.category && (
//               <div className="flex items-center gap-1">
//                 <FaTag size={12} />
//                 <span>{blogData.category}</span>
//               </div>
//             )}
//           </div>
//         </header>

//         {/* Content */}
//         <div 
//           className="prose prose-lg max-w-none"
//           dangerouslySetInnerHTML={{ 
//             __html: blogData.content || '<p class="text-gray-500 italic">Start writing to see content preview...</p>' 
//           }}
//         />

//         {/* Metadata Sections */}
//         {(blogData.modules > 0 || blogData.duration || blogData.level) && (
//           <div className="bg-amber-50 p-6 rounded-lg border border-amber-200">
//             <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Details</h3>
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//               {blogData.modules > 0 && (
//                 <div>
//                   <dt className="text-sm font-medium text-gray-500">Modules</dt>
//                   <dd className="text-lg font-semibold text-gray-900">
//                     {blogData.highlights.modules || blogData.modules}
//                   </dd>
//                 </div>
//               )}
              
//               {blogData.duration && (
//                 <div>
//                   <dt className="text-sm font-medium text-gray-500">Duration</dt>
//                   <dd className="text-lg font-semibold text-gray-900">
//                     {blogData.highlights.duration || blogData.duration}
//                   </dd>
//                 </div>
//               )}
              
//               {blogData.level && (
//                 <div>
//                   <dt className="text-sm font-medium text-gray-500">Level</dt>
//                   <dd className="text-lg font-semibold text-gray-900">
//                     {blogData.highlights.level || blogData.level}
//                   </dd>
//                 </div>
//               )}
//             </div>
//           </div>
//         )}

//         {/* Who Should Enroll */}
//         {blogData.whoShouldEnroll && (
//           <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
//             <h3 className="text-lg font-semibold text-gray-900 mb-3">Who Should Enroll</h3>
//             <p className="text-gray-700">{blogData.whoShouldEnroll}</p>
//           </div>
//         )}

//         {/* Enrollment Process */}
//         {blogData.enrollmentProcess.length > 0 && (
//           <div className="bg-green-50 p-6 rounded-lg border border-green-200">
//             <h3 className="text-lg font-semibold text-gray-900 mb-4">Enrollment Process</h3>
//             <ol className="list-decimal list-inside space-y-2">
//               {blogData.enrollmentProcess.map((step, index) => (
//                 <li key={index} className="text-gray-700">{step}</li>
//               ))}
//             </ol>
//           </div>
//         )}

//         {/* Related Posts */}
//         {blogData.relatedPosts.length > 0 && (
//           <div className="border-t border-gray-200 pt-6">
//             <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Posts</h3>
//             <div className="grid gap-4">
//               {blogData.relatedPosts.map((post, index) => (
//                 <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
//                   <div>
//                     <h4 className="font-medium text-gray-900">{post.title}</h4>
//                     <p className="text-sm text-gray-500">{post.category} • {post.date}</p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}
//       </article>
//     </motion.div>
//   );
// };

// export default PreviewPane;