// File: @/pages/application-submitted.jsx

"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { firestore } from "@/Backend/Firebase";
import Navbar from "@/components/primary/Navbar";
import Link from "next/link";
import {
  FaCheckSquare,
  FaSpinner,
  FaUser,
  FaBook,
  FaFileAlt,
  FaClock,
  FaHourglassHalf,
  FaLock,
  FaCheck,
  FaEnvelope,
  FaTimes,
} from "react-icons/fa";
import { motion } from "framer-motion";
import Copyright from "@/components/primary/Copyright";
import { useToast } from "@/components/primary/Toast";
import SiteDetails from "@/Data/SiteData";
import { useAuthStore } from "@/store/registrationStore"; // Import the auth store

const ApplicationSubmitted = () => {
  const { user, getUserFromAnySource } = useAuthStore(); // Get user from auth store
  const [applicationDate, setApplicationDate] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    // If user is not in the store, try to load from any source
    if (!user) {
      console.log("No user in store, attempting to load from storage");
      const userData = getUserFromAnySource();

      if (!userData) {
        console.error("No user data found, redirecting to home");
        router.replace("/");
        return;
      }

      // If we got user data, fetch additional application data
      fetchApplicationData(userData.email);
    } else {
      // If user is in the store, fetch additional application data
      fetchApplicationData(user.email);
    }
  }, [user, getUserFromAnySource, router]);

  const fetchApplicationData = async (email) => {
    const q = query(
      collection(firestore, "users"),
      where("email", "==", email)
    );
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((doc) => {
      const userData = doc.data();
      const timestamp = userData.applicationSubmittedAt;
      if (timestamp) {
        const formattedDate = formatDate(timestamp.toDate());
        setApplicationDate(formattedDate);
      } else {
        setApplicationDate("N/A");
      }

      const userPassword = userData.password;
      if (userPassword) {
        setPassword(userPassword);
      }
    });
  };

  const formatDate = (date) => {
    const options = {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    };

    return new Intl.DateTimeFormat("en-GB", options).format(date);
  };

  const handleResendEmail = async () => {
    setLoading(true);
    const email = user.email;
    const formNo = user.formNo;
    const firstName = user.firstName;
    const lastName = user.lastName;

    const templateRef = doc(firestore, "email_templates", "resend_email");
    const templateSnap = await getDoc(templateRef);

    if (templateSnap.exists()) {
      const template = templateSnap.data().template;

      await fetch(
        process.env.NODE_ENV === "development"
          ? `http://localhost:3000/sendMail`
          : process.env.NODE_ENV === "production" &&
              "https://honhaarjawan.pk/sendMail",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: email,
            subject: "Resend: Your Login Credentials",
            htmlTemplate: template,
            placeholders: {
              fullName: user.fullName,
              email: email,
              formNo: formNo,
              companyName: "Honhaar Jawan",
              password: password,
            },
          }),
        }
      );

      // Use toast hook with 30-second duration
      showToast(
        `Resend email request successful! Check your inbox for the email with login credentials. If you don't receive it, contact us at ${SiteDetails.supportEmail}.`,
        "success",
        30000 // 30 seconds
      );
      setLoading(false);
      setModalOpen(false);
    } else {
      console.error("Resend email template not found in Firestore.");
      setLoading(false);
    }
  };

  const openModalWithDelay = () => {
    setModalLoading(true);
    setModalOpen(true);
    setTimeout(() => setModalLoading(false), 2500);
  };

  // Debug function to check cookies
  const debugStorage = () => {
    console.log("=== Storage Debug ===");
    console.log("User from store:", user);
    console.log("All cookies:", document.cookie);
    console.log("SessionStorage:", sessionStorage.getItem("registration"));
    console.log("LocalStorage:", localStorage.getItem("registration"));
    console.log("=== End Debug ===");
  };

  // Make it available globally for debugging
  if (typeof window !== "undefined") {
    window.debugStorage = debugStorage;
  }

  if (!user)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Loading your information...</p>
        </div>
      </div>
    );

  return (
    <>
      <Navbar />

      <div className="flex flex-col mt-16 min-h-screen bg-gray-50">
        {/* Toast Notification is now handled by ToastProvider */}

        <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center">
                  <FaCheck className="text-5xl text-green-600" />
                </div>
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              Your Application Has Been Successfully Submitted!
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We have created an account for you and sent your login credentials
              to your provided email address.
            </p>
          </div>

          {/* Progress Steps */}
          <div className="bg-white rounded-xl shadow-md mb-8 overflow-hidden">
            <div className="max-w-full px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                <div className="bg-green-50 border-l-4 border-green-500 p-6 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-green-500 p-3 rounded-full">
                      <FaUser className="text-white text-xl" />
                    </div>
                    <div>
                      <h3 className="font-bold text-green-700">
                        Step 1: Complete
                      </h3>
                      <p className="text-green-600 text-sm">Student Signup</p>
                    </div>
                  </div>
                  <FaCheck className="text-green-500 text-xl" />
                </div>

                <div className="bg-gray-50 border-l-4 border-gray-300 p-6 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gray-400 p-3 rounded-full">
                      <FaBook className="text-white text-xl" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-600">
                        Step 2: Pending
                      </h3>
                      <p className="text-gray-500 text-sm">Admission Test</p>
                    </div>
                  </div>
                  <FaClock className="text-gray-500 text-xl" />
                </div>

                <div className="bg-gray-50 border-l-4 border-gray-300 p-6 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gray-400 p-3 rounded-full">
                      <FaFileAlt className="text-white text-xl" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-600">
                        Step 3: Pending
                      </h3>
                      <p className="text-gray-500 text-sm">
                        Enrollment Confirmation
                      </p>
                    </div>
                  </div>
                  <FaLock className="text-gray-500 text-xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Next Steps Card */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-2">
                  <span className="text-white text-sm">1</span>
                </div>
                Next Steps
              </h2>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                    <FaCheck className="text-green-600 text-xs" />
                  </div>
                  <span className="text-gray-700">
                    Log in using credentials we sent to{" "}
                    <span className="text-primary font-medium">
                      {user?.email || "your email"}
                    </span>
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                    <FaCheck className="text-green-600 text-xs" />
                  </div>
                  <span className="text-gray-700">
                    Proceed with your application and attempt Online Admission
                    Test
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                    <FaCheck className="text-green-600 text-xs" />
                  </div>
                  <span className="text-gray-700">
                    A minimum of 40% marks is required to qualify for admission
                  </span>
                </li>
              </ul>
            </div>

            {/* Important Information Card */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <div className="w-8 h-8 bg-second rounded-full flex items-center justify-center mr-2">
                  <span className="text-white text-sm">!</span>
                </div>
                Important Information
              </h2>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="w-5 h-5 bg-second/20 rounded-full flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                    <span className="text-second text-sm">•</span>
                  </div>
                  <span className="text-gray-700">
                    If you didn't receive the email, you can request a resend
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 bg-second/20 rounded-full flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                    <span className="text-second text-sm">•</span>
                  </div>
                  <span className="text-gray-700">
                    If you entered the wrong email, contact{" "}
                    <a
                      href={`mailto:${SiteDetails.supportEmail}`}
                      className="text-primary font-medium"
                    >
                      {SiteDetails.supportEmail}
                    </a>
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="w-5 h-5 bg-second/20 rounded-full flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                    <span className="text-second text-sm">•</span>
                  </div>
                  <span className="text-gray-700">
                    If your email is correct but you still haven't received the
                    email, contact us for assistance
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <motion.button
              onClick={openModalWithDelay}
              className="px-6 py-3 bg-second text-white rounded-lg font-medium flex items-center justify-center"
            >
              <FaEnvelope className="mr-2" />
              Resend Email
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-primary text-white rounded-lg font-medium flex items-center justify-center"
            >
              <Link href="/login" className="flex items-center">
                <FaUser className="mr-2" />
                Candidate Login
              </Link>
            </motion.button>
          </div>

          {/* Application Details Table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <FaCheckSquare className="text-primary mr-2" />
                Application Details
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Form #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applied Courses
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Application Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Admission Test
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Application Review
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user?.formNo || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {user?.selectedCourses
                        ? user.selectedCourses.map((course, idx) => (
                            <div key={idx} className="mb-1 last:mb-0">
                              {course.name}
                            </div>
                          ))
                        : "No courses applied"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {applicationDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-second/20 text-second">
                        Not Yet Attempted
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-200 text-gray-800">
                        N/A
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </main>

        {/* Resend Email Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="bg-second text-white px-6 py-4 rounded-t-xl flex justify-between items-center">
                <h3 className="text-lg font-semibold">Resend Email Request</h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-white"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="p-6">
                <div className="bg-second/10 p-4 rounded-lg mb-6">
                  <p className="text-sm text-second">
                    Click on "Resend Email" button to receive your login
                    credentials again. Make sure to check your inbox and
                    spam/junk folder.
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleResendEmail}
                    disabled={loading}
                    className="px-4 py-2 bg-second text-white rounded-lg flex items-center disabled:opacity-75"
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      "Resend Email"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
      </div>
      <Copyright />
    </>
  );
};

export default ApplicationSubmitted;
