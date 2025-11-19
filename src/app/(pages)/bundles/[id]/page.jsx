// "use client";
// import Footer from "@/components/primary/Footer";
// import Navbar from "@/components/primary/Navbar";
// import { useParams } from "next/navigation";
// import { motion } from "framer-motion";
// import {
//   FiClock,
//   FiUsers,
//   FiBook,
//   FiCheckCircle,
//   FiCheck,
//   FiStar,
//   FiAward,
//   FiLayers,
//   FiInfo,
// } from "react-icons/fi";
// import { bundles, courses } from "@/Data/Data";
// import Image from "next/image";
// import Link from "next/link";
// import { useState } from "react";
// import PaymentModal from "../../dashboard/compo/summary";
// import useAuthStore from "@/store/useAuthStore";

// const BundlePage = () => {
//   const { user } = useAuthStore();
//   const [paymentModal, setPaymentModal] = useState(false);
//   const { id } = useParams();
//   const bundleDetails = bundles.find((B) => Number(B.id) === Number(id));

//   const [bundle, setBundle] = useState({});

//   // Check if user is enrolled in this bundle
//   const isEnrolled = user?.enrolledBundles?.includes(bundleDetails?.id);

//   if (!bundleDetails) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center p-8 bg-white rounded-xl shadow-md">
//           <h1 className="text-3xl font-bold text-gray-800 mb-4">
//             Bundle Not Found
//           </h1>
//           <p className="text-gray-600 mb-6">
//             This bundle is not available or has been removed.
//           </p>
//         </div>
//       </div>
//     );
//   }

//   const bundleCourses = bundleDetails.bundleCourses
//     .map((courseId) => {
//       const course = courses.find(
//         (course) => Number(course.id) === Number(courseId)
//       );
//       if (!course) {
//         console.warn(`Course with ID ${courseId} not found`);
//       }
//       return course;
//     })
//     .filter(Boolean);

//   return (
//     <div className="h-screen z-10 relative bg-gray-50">
//       <Navbar />
//       {/* Hero Section with Gradient Background */}
//       <div className="relative  py-20 overflow-hidden bg-gray-900/50 ">
//         <div className="absolute inset-0">
//           <div className="absolute inset-0 bg-[url('/courses/Ultimate-MS-Office.webp')] bg-center bg-cover bg-no-repeat blur-[0.5px] scale-105" />
//           {/* Optional dark overlay */}
//           <div className="absolute inset-0 bg-black/40" />
//         </div>

//         {/* Immediate animation for above-the-fold content */}
//         <motion.div
//           transition={{ duration: 0.6 }}
//           className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
//         >
//           <div className="text-center text-white">
//             <div className="inline-flex items-center bg-white/30 backdrop-blur-sm px-4 py-1 rounded-full mb-4">
//               <FiLayers className="mr-2 text-blue-300" />
//               <span className="text-sm font-medium text-white">
//                 Course Bundle
//               </span>
//             </div>

//             <h1 className="text-4xl md:text-5xl font-bold mb-4">
//               {bundleDetails.name}
//             </h1>

//             <p className="text-xl text-white/90 max-w-3xl mx-auto">
//               Learn many skills with this complete bundle of{" "}
//               {bundleDetails.bundleCourses.length} courses.
//             </p>

//             <div className="mt-8 flex flex-wrap justify-center gap-4">
//               <div className="flex items-center font-semibold bg-white/50 px-4 py-2 rounded-lg">
//                 <FiClock className="mr-2 text-white" />
//                 <span>{bundleDetails.duration} Duration</span>
//               </div>
//               <div className="flex items-center font-semibold bg-white/50 px-4 py-2 rounded-lg">
//                 <FiBook className="mr-2 text-white" />
//                 <span>
//                   {bundleDetails.bundleCourses.length} Courses Included
//                 </span>
//               </div>
//             </div>
//           </div>
//         </motion.div>
//       </div>

//       {/* Government Value Proposition */}
//       <div className="bg-blue-50 border-b border-blue-100 ">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//           <div className="text-center mb-8">
//             <div className="inline-flex items-center bg-second/40 text-primary px-4 py-1 rounded-full mb-4">
//               <FiAward className="mr-2" />
//               <span className="text-md font-medium">
//                 Government Certified Bundle
//               </span>
//             </div>
//             <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
//               Official Bundle Benefits
//             </h2>
//           </div>

//           <div className="grid md:grid-cols-3 gap-6">
//             <motion.div
//               className="bg-second/20 p-6 rounded-lg shadow-sm border border-blue-200"
//             >
//               <div className="bg-primary/20 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
//                 <FiLayers className="text-second text-xl" />
//               </div>
//               <h3 className="font-bold text-gray-900 text-lg mb-2">
//                 Comprehensive Curriculum
//               </h3>
//               <p className="text-gray-600 text-sm">
//                 Approved by the Ministry of Education, covering all essential
//                 aspects of the subject matter.
//               </p>
//             </motion.div>

//             <motion.div
//               className="bg-second/20 p-6 rounded-lg shadow-sm border border-blue-200"
//             >
//               <div className="bg-primary/20 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
//                 <FiBook className="text-second text-xl" />
//               </div>
//               <h3 className="font-bold text-gray-900 text-lg mb-2">
//                 Official Certification
//               </h3>
//               <p className="text-gray-600 text-sm">
//                 Earn a government-recognized certificate upon successful
//                 completion of the bundle.
//               </p>
//             </motion.div>

//             <motion.div
//               className="bg-second/20 p-6 rounded-lg shadow-sm border border-blue-200"
//             >
//               <div className="bg-primary/20 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
//                 <FiCheckCircle className="text-second text-xl" />
//               </div>
//               <h3 className="font-bold text-gray-900 text-lg mb-2">
//                 Quality Assurance
//               </h3>
//               <p className="text-gray-600 text-sm">
//                 Curriculum developed and monitored by government education
//                 experts.
//               </p>
//             </motion.div>
//           </div>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
//         <div className="grid lg:grid-cols-3 gap-8">
//           {/* Left Column - Bundle Content */}
//           <div className="lg:col-span-2 space-y-8">
//             {/* Program Overview */}
//             <motion.div
//               className="bg-white rounded-lg p-8 shadow-sm border border-blue-200"
//             >
//               <div className="flex items-center mb-8">
//                 <div className="bg-second/20 p-3 rounded-lg mr-4">
//                   <FiInfo className="text-second text-2xl" />
//                 </div>
//                 <h2 className="text-2xl font-bold text-gray-900">
//                   Bundle Overview
//                 </h2>
//               </div>

//               <div className="prose max-w-none text-gray-600">
//                 <p className="mb-4">
//                   This government-certified bundle {bundleDetails.title} is part
//                   of our national skills development initiative.
//                 </p>
//                 <p>
//                   Upon successful completion, participants will receive official
//                   certification recognized by the Ministry of Education and
//                   relevant industry partners.
//                 </p>
//               </div>
//             </motion.div>
//           </div>

//           {/* Right Column - Registration */}
//           <div className="lg:col-span-1">
//             <motion.div
//               className="bg-white rounded-lg p-8 shadow-sm border border-blue-200"
//             >
//               <div className="space-y-6">
//                 {/* Official Badge */}
//                 <div className="bg-second hover:bg-primary text-white px-4 py-2 rounded-lg text-center font-medium">
//                   <div className="flex items-center justify-center">
//                     <FiAward className="mr-2" />
//                     <span>Official Registration</span>
//                   </div>
//                 </div>

//                 {/* Program Details */}
//                 <div className="text-center border-b border-blue-100 pb-4">
//                   <h1 className="text-gray-500 text-sm mb-1">
//                     Government-Subsidized Program
//                   </h1>
//                 </div>
//                 {/* enrollment button */}
//                 {user?.status === 4 ? (
//                   // Always show for status 4
//                   <div className="text-center space-y-4">
//                     {isEnrolled ? (
//                       <>
//                         <p className="text-green-600 font-semibold text-sm">
//                           🎉 You’re already enrolled in this bundle!
//                         </p>
//                         <button
//                           onClick={() => (window.location.href = "/dashboard")}
//                           className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-2 px-4 rounded-lg transition"
//                         >
//                           Go to Dashboard
//                         </button>
//                       </>
//                     ) : (
//                       <>
//                         <p className="text-black font-medium text-sm">
//                           ✅ You are eligible to enroll in this bundle.
//                         </p>
//                         <button
//                           onClick={() => {
//                             setBundle(bundleDetails);
//                             setPaymentModal(true);
//                           }}
//                           className="w-full btn btn-lg bg-second hover:bg-primary text-white hover:shadow-lg transition-all"
//                         >
//                           Enroll in Bundle
//                         </button>
//                       </>
//                     )}
//                   </div>
//                 ) : isEnrolled ? (
//                   // For statuses other than 4
//                   <div className="text-center space-y-3">
//                     <p className="text-green-600 font-semibold text-sm">
//                       🎉 You are already enrolled in this bundle!
//                     </p>
//                     <button
//                       onClick={() => (window.location.href = "/dashboard")}
//                       className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-2 px-4 rounded-lg transition"
//                     >
//                       Go to Dashboard
//                     </button>
//                   </div>
//                 ) : (
//                   <>
//                     <button
//                       onClick={() => {
//                         if (user) {
//                           if (user.status === 0 || user.status === 3) {
//                             setBundle(bundleDetails);
//                             setPaymentModal(true);
//                           }
//                         }
//                       }}
//                       className={`w-full btn btn-lg ${
//                         !user || (user?.status !== 0 && user?.status !== 3)
//                           ? "bg-gray-400 cursor-not-allowed"
//                           : "bg-second hover:bg-primary"
//                       } text-white hover:shadow-lg transition-all`}
//                       disabled={
//                         !user || (user?.status !== 0 && user?.status !== 3)
//                       }
//                     >
//                       Enroll in Bundle
//                     </button>

//                     {!user && (
//                       <div className="text-center mt-4 space-y-2">
//                         <p className="text-yellow-600 font-semibold">
//                           🔒 Please login to enroll in this bundle
//                         </p>
//                         <button
//                           onClick={() =>
//                             (window.location.href = `/login?returnUrl=${encodeURIComponent(
//                               window.location.pathname
//                             )}`)
//                           }
//                           className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-2 px-4 rounded-lg transition"
//                         >
//                           Login Now
//                         </button>
//                       </div>
//                     )}

//                     {user?.status === 1 && (
//                       <div className="text-center mt-4 space-y-2">
//                         <p className="text-yellow-600 font-semibold">
//                           ⚠️ You haven't registered your degree documents yet!
//                         </p>
//                         <p className="text-sm text-gray-600">
//                           Please complete your academic verification in your
//                           dashboard
//                         </p>
//                         <button
//                           onClick={() => (window.location.href = "/dashboard")}
//                           className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-2 px-4 rounded-lg transition"
//                         >
//                           Complete Verification
//                         </button>
//                       </div>
//                     )}

//                     {user?.status === 2 && (
//                       <div className="text-center mt-4 space-y-2">
//                         <p className="text-yellow-600 font-semibold">
//                           ⚠️ Your account verification is pending!
//                         </p>
//                         <p className="text-sm text-gray-600">
//                           Our team is reviewing your documents. This may take 24
//                           hours.
//                         </p>
//                         <button 
//                           onClick={() => (window.location.href = "/dashboard")}
//                           className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-2 px-4 rounded-lg transition"
//                         >
//                           Go to Dashboard
//                         </button>
//                       </div>
//                     )}
//                   </>
//                 )}

//                 {/* Government Disclaimer */}
//                 <div className="text-xs text-gray-500 text-center">
//                   <p>
//                     This Bundle is administered by the Ministry of Education in
//                     partnership with accredited institutions.
//                   </p>
//                 </div>
//               </div>
//             </motion.div>
//           </div>
//         </div>
//       </div>

//       {/* Three Column Section */}
//       <div className="w-full flex flex-col md:flex-row gap-2 justify-center px-5">
//         {/* Bundle Description */}
//         <motion.div
//           className="bg-white w-full md:w-1/2 lg:w-1/3 rounded-md p-5 md:p-8 shadow-lg border-2 border-primary"
//         >
//           <div className="flex items-center mb-8">
//             <div className="p-3 bg-primary rounded-lg mr-4">
//               <FiInfo className="text-white text-2xl" />
//             </div>
//             <h2 className="text-2xl font-bold text-gray-900">
//               Detailed Bundle Description
//             </h2>
//           </div>

//           <div className="prose max-w-none text-gray-600">
//             <p>{bundleDetails.description}</p>
//           </div>
//         </motion.div>

//         {/* Learning Outcomes */}
//         <motion.div
//           className="bg-white w-full md:w-1/2 lg:w-1/3 border-2 border-primary rounded-md p-8 shadow-lg"
//         >
//           <div className="flex items-center mb-8">
//             <div className="p-3 bg-primary rounded-lg mr-4">
//               <FiCheckCircle className="text-white text-xl" />
//             </div>
//             <h2 className="text-2xl font-bold text-black">
//               What You Will Learn
//             </h2>
//           </div>

//           <div className="flex flex-col gap-6">
//             {bundleDetails.courseOutline?.map((outcome, index) => (
//               <motion.div
//                 key={index}
//                 className="flex items-start gap-1 group"
//               >
//                 <div className="p-2 bg-second/70 rounded-lg group-hover:bg-second/90 transition-colors">
//                   <FiCheckCircle className="text-white text-md" />
//                 </div>
//                 <div>
//                   <h3 className="font-semibold text-black text-sm">
//                     {outcome.split(".")[0]}
//                   </h3>
//                   {outcome.includes(":") && (
//                     <p className="text-black text-xs mt-1 leading-snug">
//                       {outcome.split(":")[1].trim()}
//                     </p>
//                   )}
//                 </div>
//               </motion.div>
//             ))}
//           </div>
//         </motion.div>

//         {/* Eligibility Requirements */}
//         <motion.div
//           className="bg-white w-full md:w-1/2 lg:w-1/3 rounded-md p-8 shadow-lg border-2 border-primary"
//         >
//           <div className="flex items-center mb-8">
//             <div className="p-3 bg-primary rounded-lg mr-4">
//               <FiCheck className="text-white text-2xl" />
//             </div>
//             <h2 className="text-2xl font-bold text-gray-900">
//               Eligibility Requirements
//             </h2>
//           </div>

//           <div className="flex flex-col gap-4">
//             {bundleDetails.eligibility?.map((requirement, index) => (
//               <motion.div
//                 key={index}
//                 initial={{ opacity: 0, x: -20 }}
//                 whileInView={{ opacity: 1, x: 0 }}
//                 transition={{ duration: 0.4, delay: index * 0.1 }}
//                 viewport={{ once: true }}
//                 className="flex items-start gap-3"
//               >
//                 <div className="p-1.5 bg-primary/10 rounded-full mt-1">
//                   <FiCheck className="text-primary text-sm" />
//                 </div>
//                 <p className="text-gray-700 text-sm">{requirement}</p>
//               </motion.div>
//             ))}
//           </div>
//         </motion.div>
//       </div>

//       {/* Bundle Summary Section */}

//       {/* Courses Section */}
//       <motion.div
//         className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
//       >
//         <div className="text-center mb-12">
//           <h2 className="text-3xl font-bold text-gray-900">
//             Courses in This Bundle
//           </h2>
//           <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
//             This bundle includes the following excellent courses.
//           </p>
//         </div>

//         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
//           {bundleCourses?.map((course, index) => (
//             <motion.div
//               key={course?.id || index}
//               initial={{ opacity: 0, y: 20 }}
//               whileInView={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.3, delay: index * 0.1 }}
//               viewport={{ once: true }}
//               className="group"
//             >
//               <Link href={`/details/${course?.id}`} className="block">
//                 <div className="relative aspect-video overflow-hidden rounded-lg transition-all duration-300 group-hover:shadow-lg">
//                   <Image
//                     src={course?.image || "/course-placeholder.jpg"}
//                     alt={course?.name || "Course"}
//                     fill
//                     className="object-cover transition-transform duration-300 group-hover:scale-105"
//                     sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
//                   />
//                   <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
//                 </div>
//                 <div className="mt-3 bg-white p-3 rounded-lg shadow-sm group-hover:shadow-md transition-shadow duration-300">
//                   <h3 className="font-medium text-gray-900 text-center group-hover:text-primary transition-colors duration-200">
//                     {course?.name}
//                   </h3>
//                 </div>
//               </Link>
//             </motion.div>
//           ))}
//         </div>
//       </motion.div>

//       {paymentModal && (
//         <PaymentModal
//           user={user}
//           isPaymentModal={paymentModal}
//           setIsPaymentModal={setPaymentModal}
//           bundle={bundle}
//         />
//       )}

//       <Footer />
//     </div>
//   );
// };
// // app/api/cron/approval-cron
// export default BundlePage;
