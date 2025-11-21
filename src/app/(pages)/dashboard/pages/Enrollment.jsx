"use client";
import React, { useState, useMemo, useEffect } from "react";
import {
  FaCheck,
  FaPlus,
  FaArrowLeft,
  FaTrash,
  FaFileAlt,
  FaBook,
  FaCheckCircle,
  FaClock,
  FaKey,
  FaGraduationCap,
  FaBookOpen,
  FaInfoCircle,
  FaEdit,
  FaCopy,
} from "react-icons/fa";
import { motion } from "framer-motion";
import AddCourses from "../compo/AdditionalCourses/AddCourses";
import Copyright from "@/components/primary/Copyright";
import { doc, updateDoc } from "firebase/firestore";
import { firestore } from "@/Backend/Firebase";
import { useRouter } from "next/navigation";
import { ImSpinner } from "react-icons/im";
import { useToast } from "@/components/primary/Toast";
import SiteDetails from "@/Data/SiteData";

// 🟢 NEW: Custom function to calculate class delay based on admission date
const calculateClassDelay = (admissionDate) => {
  // Ensure the input is a JavaScript Date object
  const date = new Date(admissionDate);
  if (isNaN(date.getTime())) {
    throw new Error("Invalid date provided.");
  }

  const day = date.getDate(); // Gets the day of the month (1-31)
  let daysToAdd = 0;

  // --- SPECIFIC DAYS LOGIC ---
  if (day >= 1 && day < 10) {
    daysToAdd = 20 - day;
  } else if (day >= 10 && day < 20) {
    daysToAdd = 31 - day;
  } else if (
    (day >= 20 && day < 31) ||
    (day >= 20 && day < 30) ||
    (day >= 20 && day < 28)
  ) {
    daysToAdd = 41 - day;
  }

  return daysToAdd;
};

const Enrollment = ({ user }) => {
  const [showAddCourses, setShowAddCourses] = useState(false);
  const [loading, setLoading] = useState(null);
  const [copiedPSID, setCopiedPSID] = useState(null);

  // 🟢 NEW: State for testing with custom date
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [customTestDate, setCustomTestDate] = useState("");

  const router = useRouter();
  const { showToast } = useToast();

  // 🟢 DEBUG: Log the PaidAt value to see what we're working with
  useEffect(() => {
    console.log("User PaidAt value:", user?.PaidAt);
    console.log("User PaidAt type:", typeof user?.PaidAt);

    if (user?.PaidAt) {
      let paidDate;
      if (user.PaidAt.toDate) {
        paidDate = user.PaidAt.toDate();
      } else if (user.PaidAt.seconds) {
        paidDate = new Date(user.PaidAt.seconds * 1000);
      } else {
        paidDate = new Date(user.PaidAt);
      }
      console.log("Parsed PaidAt date:", paidDate);
      console.log("Current date:", new Date());
    }
  }, [user?.PaidAt]);

  // 🟢 FIXED: Check if access date has passed based on custom calculation
  const hasAccessDatePassed = useMemo(() => {
    // 🟢 TESTING: Use custom date if enabled
    const dateToCheck =
      useCustomDate && customTestDate
        ? new Date(customTestDate)
        : user?.PaidAt
          ? user.PaidAt.toDate
            ? user.PaidAt.toDate()
            : user.PaidAt.seconds
              ? new Date(user.PaidAt.seconds * 1000)
              : new Date(user.PaidAt)
          : null;

    if (!dateToCheck) {
      console.log("No date found");
      return false;
    }

    try {
      // Check if the date is valid
      if (isNaN(dateToCheck.getTime())) {
        console.log("Invalid date");
        return false;
      }

      // Calculate the delay using the custom function
      const delayDays = calculateClassDelay(dateToCheck);
      console.log(
        `Calculated delay: ${delayDays} days from ${dateToCheck.toLocaleDateString()}`
      );

      const currentDate = new Date();
      const accessDate = new Date(dateToCheck);
      accessDate.setDate(dateToCheck.getDate() + delayDays);

      console.log(`Access date: ${accessDate.toLocaleDateString()}`);
      console.log(`Current date: ${currentDate.toLocaleDateString()}`);

      return currentDate >= accessDate;
    } catch (error) {
      console.error("Error calculating access date:", error);
      return false;
    }
  }, [user?.PaidAt, useCustomDate, customTestDate]);

  // 🟢 FIXED: Calculate expected access date using custom function
  const expectedAccessDate = useMemo(() => {
    // 🟢 TESTING: Use custom date if enabled
    const dateToCheck =
      useCustomDate && customTestDate
        ? new Date(customTestDate)
        : user?.PaidAt
          ? user.PaidAt.toDate
            ? user.PaidAt.toDate()
            : user.PaidAt.seconds
              ? new Date(user.PaidAt.seconds * 1000)
              : new Date(user.PaidAt)
          : null;

    if (!dateToCheck) {
      console.log("No date for expected access date");
      return "N/A";
    }

    try {
      if (isNaN(dateToCheck.getTime())) {
        return "N/A";
      }

      // Calculate the delay using the custom function
      const delayDays = calculateClassDelay(dateToCheck);
      const accessDate = new Date(dateToCheck);
      accessDate.setDate(dateToCheck.getDate() + delayDays);

      return accessDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error calculating expected access date:", error);
      return "N/A";
    }
  }, [user?.PaidAt, useCustomDate, customTestDate]);

  // 🟢 Simple paid date display for debugging
  const paidDateDisplay = useMemo(() => {
    // 🟢 TESTING: Use custom date if enabled
    const dateToCheck =
      useCustomDate && customTestDate
        ? new Date(customTestDate)
        : user?.PaidAt
          ? user.PaidAt.toDate
            ? user.PaidAt.toDate()
            : user.PaidAt.seconds
              ? new Date(user.PaidAt.seconds * 1000)
              : new Date(user.PaidAt)
          : null;

    if (!dateToCheck) return "N/A";

    try {
      if (isNaN(dateToCheck.getTime())) return "Invalid Date";

      return dateToCheck.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error displaying paid date:", error);
      return "N/A";
    }
  }, [user?.PaidAt, useCustomDate, customTestDate]);

  // 🟢 TESTING: Override for testing
  const forceShowEnrollment = useMemo(() => {
    // You can temporarily set this to true to bypass the date check
    return false; // Set to true to force show enrollment page
  }, []);

  // Function to copy PSID to clipboard
  const copyPSIDToClipboard = (psid) => {
    navigator.clipboard
      .writeText(psid)
      .then(() => {
        setCopiedPSID(psid);
        showToast("PSID copied to clipboard!", "success");
        // Reset the copied state after 2 seconds
        setTimeout(() => setCopiedPSID(null), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy PSID: ", err);
        showToast("Failed to copy PSID", "error");
      });
  };

  // Rest of your component code remains the same...
  const handleClickie = (e, index, path) => {
    e.preventDefault();
    setLoading(index);
    setTimeout(() => {
      router.push(path);
    }, 0);
  };

  const pendingInvoices = user?.additionalCourses_pending_invoice || [];

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleGoToAddCourses = () => {
    setShowAddCourses(true);
    scrollToTop();
  };

  const handlePSIDGenerated = () => {
    setShowAddCourses(false);
    scrollToTop();
    showToast("PSID generated successfully!", "success");
  };

  const handleDeleteCourse = async (invoiceNumber) => {
    const updatedInvoices = pendingInvoices.filter(
      (invoice) => invoice.invoiceNumber !== invoiceNumber
    );

    const userDocRef = doc(firestore, "users", user.email);
    try {
      await updateDoc(userDocRef, {
        additionalCourses_pending_invoice: updatedInvoices,
      });
      showToast("Course deleted successfully!", "success");
    } catch (error) {
      console.error("Error deleting course:", error);
      showToast("Error deleting course", "error");
    }
  };

  const getStatusClass = (status) => {
    if (status === "approved") return "bg-green-600";
    if (status === "pending") return "bg-yellow-500";
    return "bg-red-500";
  };

  // 🟢 Use force override for testing
  const shouldShowEnrollment = forceShowEnrollment || hasAccessDatePassed;

  // 🟢 When inside AddCourses
  if (showAddCourses) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-4 pt-10">
          <AddCourses user={user} onSuccess={handlePSIDGenerated} />
          <div className="flex justify-center">
            <button
              onClick={() => {
                setShowAddCourses(false);
                scrollToTop();
              }}
              className="mt-8 mb-6 flex group relative overflow-hidden rounded-lg bg-primary text-white p-4 shadow-md hover:bg-second transform hover:-translate-y-0.5 transition-all duration-300 items-center"
            >
              <div className="flex flex-col items-center">
                <span className="font-medium flex items-center gap-1 text-white">
                  <FaArrowLeft className="mr-2" /> Back
                </span>
              </div>
            </button>
          </div>
        </div>
        <div className="mt-6">
          <Copyright />
        </div>
      </div>
    );
  }

  // 🟢 If access date hasn't passed OR we're not forcing, show waiting page
  if (!shouldShowEnrollment) {
    console.log("Showing waiting page because:", {
      hasAccessDatePassed,
      forceShowEnrollment,
      shouldShowEnrollment,
      paidDate: user?.PaidAt,
    });

    return (
      <div className="min-h-screen bg-gray-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-7xl mx-auto py-8 px-6"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200"
          >
            {/* Header Section */}
            <div className="px-6 py-5 border-b border-gray-300 bg-primary">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-white p-3 rounded-full">
                    <FaClock className="text-primary text-2xl" />
                  </div>
                  <div className="text-white">
                    <p className="text-sm font-medium">Admission Confirmed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="px-8 py-6">
              <div className="border-b border-gray-200 pb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Your Admission is Confirmed
                </h1>
                <p className="text-gray-600">
                  Thank you for your payment! Your classes are starting soon and
                  your enrollment details will be available on{" "}
                  <span className="font-semibold text-primary">
                    {expectedAccessDate}
                  </span>
                  . You will be notified via email when your classes are
                  starting.
                </p>
              </div>

              {/* Simple Next Steps */}
              <div className="py-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  What's Next?
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-primary text-white mt-1">
                      <span className="text-xs text-white font-semibold">
                        !
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-600">
                        Your classes are starting soon! You will be notified via
                        email when your classes are starting.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-primary text-white mt-1">
                      <span className="text-xs text-white font-semibold">
                        <FaCheck />
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-600">
                        Access to your learning portal will be granted on{" "}
                        <span className="font-medium text-primary">
                          {expectedAccessDate}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* NEW: Portal Credentials Information */}
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-primary text-white mt-1">
                      <span className="text-xs text-white font-semibold">
                        <FaKey />
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-600">
                        Your portal login credentials will be displayed here on{" "}
                        <span className="font-medium text-primary">
                          {expectedAccessDate}
                        </span>{" "}
                        once your access is activated. You'll be able to login
                        and start your learning journey immediately.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Urdu Section */}
            <div
              className="bg-gray-50 px-8 py-6 border-t border-gray-200"
              dir="rtl"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                آپ کی داخلہ کی تصدیق ہو گئی ہے
              </h2>
              <div className="space-y-3 text-gray-600">
                <p>
                  آپ کی ادائیگی کا شکریہ! آپ کی کلاسیں جلد شروع ہو رہی ہیں اور
                  آپ کی اندراج کی تفصیلات{" "}
                  <span className="font-semibold text-primary">
                    {expectedAccessDate}
                  </span>{" "}
                  کو دستیاب ہو جائیں گی۔
                </p>
                <p>
                  آپ کو ای میل کے ذریعے مطلع کیا جائے گا جب آپ کی کلاسیں شروع ہو
                  رہی ہوں گی۔
                </p>
                <p>
                  آپ کی کلاسیں جلد شروع ہو رہی ہیں! آپ کو ای میل کے ذریعے مطلع
                  کیا جائے گا جب آپ کی کلاسیں شروع ہو رہی ہوں گی۔
                </p>

                {/* NEW: Urdu Portal Credentials Information */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <p className="text-blue-800 font-semibold mb-2">
                    پورٹل کی لاگ ان تفصیلات
                  </p>
                  <p className="text-blue-700">
                    <span className="font-semibold">{expectedAccessDate}</span>{" "}
                    کو، آپ کو اپنی لاگ ان کی تفصیلات یہاں دکھائی دیں گی۔ پورٹل
                    میں ویڈیو لیکچرز، کوئز، اسائنمنٹس اور instructors کے ساتھ
                    براہ راست بات چیت کی سہولت موجود ہوگی۔
                  </p>
                </div>

                <p className="pt-4">
                  آپ کے پورٹل کی لاگ ان credentials بھی{" "}
                  <span className="font-semibold text-primary">
                    {expectedAccessDate}
                  </span>{" "}
                  کو یہاں ظاہر کی جائیں گی، جس کے بعد آپ فوری طور پر اپنی
                  learning journey شروع کر سکیں گے۔
                </p>

                <p className="pt-2">
                  رابطہ:{" "}
                  <span className="font-semibold text-primary">
                    {SiteDetails.supportEmail}
                  </span>
                </p>
              </div>
            </div>

            {/* Support Section */}
            <div className="bg-primary bg-opacity-5 px-8 py-6 border-t border-gray-200">
              <div className="text-center">
                <p className="text-gray-600 mb-3">
                  Need immediate assistance? Contact our support team:
                </p>
                <button
                  onClick={(e) =>
                    handleClickie(e, 1, `mailto:${SiteDetails.supportEmail}`)
                  }
                  className="text-primary font-semibold hover:underline text-lg"
                >
                  {SiteDetails.supportEmail}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
        <div className="mt-8">
          <Copyright />
        </div>
      </div>
    );
  }

  // 🟢 Original Enrollment Page (shown after access date)
  console.log("Showing enrollment page because access date has passed");

  const loginDetails = [
    { field: "Login Portal", value: "https://portal.honhaarjawan.pk/login" },
    { field: "Email", value: user?.email || "N/A" },
    { field: "Password", value: user?.password || "N/A" },
  ];

  return (
    <>
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* HEAD + Header */}
        <section className="space-y-8">
          {/* Logo */}
          <div className="w-full flex justify-center">
            <img
              src={SiteDetails.logo}
              alt={`${SiteDetails.companyName} logo`}
              className="h-20 md:h-24 mx-auto object-contain"
            />
          </div>

          {/* Congrats Header Card */}
          <div className="border border-gray-200 rounded-xl bg-white">
            <div className="p-5 md:p-6 flex items-start gap-4">
              <div className="rounded-full bg-primary p-3 shrink-0">
                {/* Make sure you have: import { FaCheck } from "react-icons/fa" */}
                <FaCheck className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-black leading-snug">
                  Congratulations! Your Classes Have Started
                </h1>
                <p className="mt-3 text-gray-700 leading-relaxed">
                  We are excited to inform you that your application and
                  documents have been successfully verified. You are now
                  enrolled in the{" "}
                  <span className="font-semibold text-primary">
                    {SiteDetails.companyName}
                  </span>{" "}
                  program, and your learning journey begins here! Your
                  enrollment is complete! You can now start your learning
                  journey by copying your login credentials above and accessing
                  the{" "}
                  <span className="font-semibold">
                    {SiteDetails.companyName}
                  </span>{" "}
                  portal. Get ready to begin your educational adventure!
                </p>
              </div>
            </div>
          </div>

          {/* Login Details */}
          <div className="rounded-xl overflow-hidden border border-gray-200 bg-white">
            <h2 className="bg-primary text-white px-5 py-3 md:px-6 md:py-3.5 font-semibold">
              LMS Portal Login Details
            </h2>

            <div className="divide-y divide-gray-200">
              {loginDetails.map((detail, index) => (
                <div
                  key={index}
                  className="px-5 py-3 md:px-6 md:py-4 hover:bg-gray-50/80 transition-colors"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-2 md:gap-4">
                    <span className="md:col-span-4 font-medium text-gray-800">
                      {detail.field}
                    </span>
                    <span className="md:col-span-8">
                      <span className="inline-block font-mono text-sm md:text-base text-gray-900 bg-gray-50 border border-gray-200 rounded px-2.5 py-1.5">
                        {detail.value}
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Add More Courses Button */}
        <div className="flex justify-start">
          <button
            onClick={handleGoToAddCourses}
            className="group relative overflow-hidden rounded-lg bg-primary text-white p-4 shadow-md hover:bg-second transform hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
          >
            <div className="flex flex-col items-center">
              <span className="font-medium flex items-center gap-1 text-white">
                <FaPlus /> Add More Courses
              </span>
            </div>
          </button>
        </div>

        {/* Course Registrations Awaiting Confirmation */}
        {pendingInvoices.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Your Learning Journey
                </h2>
                <p className="text-gray-600 mt-1">
                  Course Enrollment awaiting confirmation
                </p>
              </div>
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                {pendingInvoices.length}{" "}
                {pendingInvoices.length === 1 ? "Invoice" : "Invoices"}
              </span>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingInvoices.map((invoice, index) => {
                const totalInvestment = invoice.selectedCourses.reduce(
                  (sum, course) => sum + course.coursePrice,
                  0
                );
                const courseCount = invoice.selectedCourses.length;
                const psidValue = `${invoice.payProId}`;

                return (
                  <div
                    key={index}
                    className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300"
                  >
                    <div className="bg-second h-2"></div>
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="p-2 rounded-lg">
                            <FaGraduationCap className="text-primary text-lg" />
                          </div>
                          <h3 className="ml-3 text-lg font-semibold text-gray-900">
                            Pending
                          </h3>
                        </div>
                        <span className="px-2 py-1 text-xs rounded-full font-medium bg-sec2/40">
                          Pending
                        </span>
                      </div>

                      {/* PSID with Copy Button */}
                      <div className="flex items-center justify-between mb-4">
                        <h1 className="flex items-center gap-1 text-gray-600 text-sm">
                          <span className="text-sec2 text-lg font-bold">
                            PSID:{" "}
                          </span>
                          {psidValue}
                        </h1>
                        <button
                          onClick={() => copyPSIDToClipboard(psidValue)}
                          className={`p-2 rounded-md transition-all ${
                            copiedPSID === psidValue
                              ? "bg-green-100 text-green-600"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                          title={
                            copiedPSID === psidValue ? "Copied!" : "Copy PSID"
                          }
                        >
                          {copiedPSID === psidValue ? <FaCheck /> : <FaCopy />}
                        </button>
                      </div>

                      {/* Courses */}
                      <div className="mb-5">
                        <p className="text-sm text-gray-500 mb-2 flex items-center">
                          <FaBookOpen className="mr-1 text-gray-400" /> Your
                          Selected Courses
                        </p>
                        <ul className="space-y-2">
                          {invoice.selectedCourses.map((course, idx) => (
                            <li key={idx} className="flex items-start">
                              <div className="bg-green-100 rounded-full p-1 mr-2 mt-0.5">
                                <FaCheck className="text-green-600 text-xs" />
                              </div>
                              <div className="flex-1">
                                <span className="text-sm text-gray-700 font-medium">
                                  {course.name}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <h1 className="flex items-center gap-1 text-gray-600">
                        <span className="text-sec2 font-bold">
                          Total Amount:{" "}
                        </span>
                        {invoice.totalAmount}
                      </h1>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Your registrations are being processed. You'll receive a
                confirmation email shortly.
              </p>
            </div>
          </div>
        )}

        {/* Steps Section */}
        <div className="bg-gray-50 p-6 rounded-lg shadow space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">
            How To Access And Start Learning
          </h2>
          <ol className="space-y-3 list-decimal list-inside text-gray-700">
            <li>
              <span className="font-semibold">Login to Your Account:</span>{" "}
              Visit the portal link provided. Enter your email, and you will
              receive an OTP. Enter the OTP to log in to your portal.
            </li>
            <li>
              <span className="font-semibold">Explore Your Courses:</span> Once
              logged in, you will have access to your enrolled courses, with new
              lectures uploaded weekly.
            </li>
            <li>
              <span className="font-semibold">Watch and Complete Lessons:</span>{" "}
              Make sure to watch at least 90% of each video before clicking
              "Complete & Continue".
            </li>
            <li>
              <span className="font-semibold">MCQ Assessments:</span> After each
              section, you'll take quizzes to assess understanding.
            </li>
            <li>
              <span className="font-semibold">Final Exam:</span> A 50-question
              MCQ exam at the end. Pass it to receive your certificate.
            </li>
            <li>
              <span className="font-semibold">Ask Questions:</span> Use the
              portal's Q&A to connect with instructors.
            </li>
            <li>
              <span className="font-semibold">Earn Your Certificate:</span>{" "}
              Download your digital certificate after passing the final exam.
            </li>
          </ol>

          <p className="text-gray-600 text-sm">
            Need help? Contact us at{" "}
            <button
              onClick={(e) =>
                handleClickie(e, 2, `mailto:${SiteDetails.supportEmail}`)
              }
              className="text-primary font-semibold underline"
            >
              {SiteDetails.supportEmail}
            </button>
          </p>
        </div>
      </div>

      <Copyright />
    </>
  );
};

export default Enrollment;
