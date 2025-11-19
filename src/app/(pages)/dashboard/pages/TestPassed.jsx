"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  FaCheckCircle,
  FaCircle,
  FaEdit,
  FaFileAlt,
  FaVideo,
  FaSpinner,
  FaRegCopy,
  FaInfoCircle,
  FaDownload,
  FaAward,
  FaUser,
  FaIdCard,
  FaListOl,
  FaChartBar,
  FaCalendarAlt,
  FaCheck,
} from "react-icons/fa";
import { useToast } from "@/components/primary/Toast";
import axios from "axios";
import { courses as allCourses } from "@/Data/Data";
import FinalStepsModal from "../compo/finalstepvid";
import {
  doc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { firestore } from "@/Backend/Firebase";
import EditCourses from "@/app/(pages)/dashboard/compo/EditCourses";
import { FaSquareCheck } from "react-icons/fa6";
import { motion, AnimatePresence } from "framer-motion";
import PayproPaymentVideos from "../compo/PayproPaymentVideos/PaymentVideos";
import { useRouter } from "next/navigation";
import { ImSpinner } from "react-icons/im";
import SiteDetails from "@/Data/SiteData";
import Copyright from "@/components/primary/Copyright";

const Testpassed = ({ user }) => {
  const router = useRouter();
  const { showToast } = useToast();
  // State declarations
  const [finalStepsModalOpen, setFinalStepsModalOpen] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPSIDGenerating, setIsPSIDGenerating] = useState(false);
  const [generatedPayProId, setGeneratedPayProId] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [showTickMark, setShowTickMark] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceStatus, setInvoiceStatus] = useState(null);
  const [isChallanGenerating, setIsChallanGenerating] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(null);

  // State for active tab
  const [activeTab, setActiveTab] = useState("online"); // "online" or "challan"

  // Use object-based formData instead of array
  const [formData, setFormData] = useState({
    course1: "",
    course2: "",
    course3: "",
  });

  const handleClickie = (e, index, path) => {
    e.preventDefault();
    setButtonLoading(index);
    setTimeout(() => {
      router.push(path);
    }, 0);
  };

  useEffect(() => {
    if (!user?.email) {
      setFetching(false);
      return;
    }

    const docRef = doc(firestore, "users", user.email);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const currentGeneratedPayProId = data?.generatedPayProId;
          if (currentGeneratedPayProId !== generatedPayProId) {
            setGeneratedPayProId(currentGeneratedPayProId);
          }
        } else {
          setGeneratedPayProId(null);
        }
        setFetching(false);
      },
      (error) => {
        console.error("Error fetching PayPro ID:", error);
        setFetching(false);
      }
    );

    return () => unsubscribe();
  }, [user?.email, generatedPayProId]);

  useEffect(() => {
    if (user?.selectedCourses) {
      const newFormData = {
        course1: user.selectedCourses[0]?.name || "",
        course2: user.selectedCourses[1]?.name || "",
        course3: user.selectedCourses[2]?.name || "",
      };
      setFormData(newFormData);
    }
  }, [user]);

  // Update Firestore with new course selections
  const handleSaveChanges = async (updatedFormData) => {
    setIsUpdating(true);
    try {
      const newCourses = [
        updatedFormData.course1,
        updatedFormData.course2,
        updatedFormData.course3,
      ]
        .filter(Boolean)
        .map((title) => {
          const course = allCourses.find((c) => c.name === title);
          return course
            ? {
                id: course.id,
                name: course.name,
                lmsCourseId: course.lmsCourseId,
              }
            : null;
        })
        .filter(Boolean);

      await updateDoc(doc(firestore, "users", user.email), {
        selectedCourses: newCourses,
      });

      setFormData(updatedFormData);
      setIsEditModalOpen(false);
      showToast("Courses updated successfully!", "success");
    } catch (error) {
      console.error("Error saving courses:", error);
      showToast("Error updating courses", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  // Frontend checkInvoiceStatus function
  const checkInvoiceStatus = useCallback(async () => {
    setInvoiceLoading(true);

    try {
      const response = await fetch("/api/swich/check-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNumber: generatedPayProId?.invoiceNumber,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // The actual transaction status is nested inside result.data.transaction.transactionStatus
        const transactionStatus =
          result.data?.transaction?.transactionStatus || "unknown";

        // Normalize status to lowercase for case-insensitive comparison
        const orderStatus = transactionStatus.toLowerCase();
        setInvoiceStatus(orderStatus.toUpperCase()); // Keep uppercase for display if needed

        // Only update user status if payment is truly successful
        if (orderStatus === "success") {
          const userRef = doc(firestore, "users", user.email);
          await updateDoc(userRef, {
            status: 5,
          });

          showToast(
            "Your application fee has been processed successfully. Admission confirmed!",
            "success"
          );
        } else if (orderStatus === "pending") {
          // For pending status, show message but don't update user status
          showToast("Your payment is .", "error");
        } else if (orderStatus === "unpaid") {
          showToast(
            "Please complete the payment for your Consumer Number or contact our helpline for assistance.",
            "error"
          );
        } else {
          showToast(
            "We are unable to retrieve the status for the provided Consumer Number. Please contact our helpline for assistance.",
            "error"
          );
        }
      } else {
        showToast(result.error || "Failed to check invoice status", "error");
      }
    } catch (error) {
      console.error("Error checking invoice status:", error);
      showToast(
        "Failed to connect to the server. Please try again later.",
        "error"
      );
    } finally {
      setTimeout(() => {
        setInvoiceLoading(false);
        setInvoiceStatus(null);
      }, 2000);
    }
  }, [generatedPayProId, user, showToast]);

  // Function to generate PSID
  const generatePSID = useCallback(
    async (isChallan = false) => {
      setLoading(true);
      setIsPSIDGenerating(true);
      setApiError(null);

      const websiteId = process.env.NEXT_PUBLIC_WEBSITE_ID || "777";
      const gatewayId = process.env.NEXT_PUBLIC_GATEWAY_ID || "283";
      const randomNumber = Math.floor(Math.random() * 999) + 1;
      const identifier = user.formNo || user.phone || "N/A";
      const invoice = `${websiteId}-${gatewayId}-${identifier}-5000-${randomNumber}-1`;

      try {
        if (
          !Array.isArray(user.selectedCourses) ||
          user.selectedCourses.length === 0
        ) {
          throw new Error("Please select at least one course");
        }

        // Deduplicate and validate selectedCourses
        const courseIds = new Set();
        const selectedCourses = user.selectedCourses
          .filter((course) => {
            const isValid =
              course && course.id && course.name && course.lmsCourseId;
            if (isValid && !courseIds.has(course.id)) {
              courseIds.add(course.id);
              return true;
            }
            return false;
          })
          .map((course) => ({
            lmsCourseId: course.lmsCourseId,
            name: course.name,
            courseId: course.id,
          }));

        if (selectedCourses.length === 0) {
          throw new Error("No valid courses selected");
        }

        const safeUser = {
          userId: user.uid || "notfound",
          email: user.email || "notfound",
          fullName: user.fullName || "",
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          mobile: user.mobile || "nomobile",
          password: user.password || "nonopassword",
          formNo: user.formNo || "noformno",
          user_lms_id: user.user_lms_id || user.userId || "nouserid",
        };

        // Use the new endpoint
        const response = await fetch("/api/swich/generate-psid", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid: safeUser.userId,
            email: safeUser.email,
            fullName: safeUser.fullName,
            totalFee: 5000,
            invoice,
            selectedCourses: selectedCourses,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error("API Error:", data);
          throw new Error(
            data.error || data.details || "Payment request failed"
          );
        }

        if (!data.consumerNumber) {
          console.error("Missing consumerNumber in response:", data);
          throw new Error("Invalid response from payment API");
        }

        const paymentRecord = {
          userId: safeUser.userId,
          user_lms_id: safeUser.user_lms_id,
          fullName:
            `${safeUser.firstName} ${safeUser.lastName}` ||
            `${safeUser.fullName}`,
          email: safeUser.email,
          password: safeUser.password,
          mobile: safeUser.mobile,
          formNo: safeUser.formNo,
          consumerNumber: data.consumerNumber,
          selectedCourses,
          invoiceNumber: data.invoiceNumber || invoice,
          status: "pending",
          amount: 5000,
          created_at: serverTimestamp(),
          challanGenerated: isChallan,
        };

        const userRef = doc(firestore, "users", safeUser.email);
        await updateDoc(userRef, {
          generatedPayProId: {
            ...paymentRecord,
            selectedCourses,
          },
        });

        setGeneratedPayProId(paymentRecord);
        showToast(
          "Your PSID/Consumer Number has been generated successfully.",
          "success"
        );
        return data.consumerNumber;
      } catch (error) {
        console.error("Error in generatePSID:", error);
        setApiError(error.message);
        showToast(
          error.message || "An error occurred while generating PSID.",
          "error"
        );
        throw error;
      } finally {
        setLoading(false);
        setIsPSIDGenerating(false);
      }
    },
    [user, showToast]
  );

  const handleCopyPayProId = () => {
    navigator.clipboard.writeText(generatedPayProId?.consumerNumber);
    setShowTickMark(true);
    showToast("Consumer Number copied to clipboard!", "success");
    setTimeout(() => setShowTickMark(false), 5000);
  };

  // Handle bank challan download - UPDATED LOGIC
  const handleDownloadChallan = async () => {
    setIsChallanGenerating(true);
    try {
      // Check if there's already a generated PayPro ID
      if (generatedPayProId?.consumerNumber) {
        // If PayPro ID exists but wasn't generated for challan, update it to mark as challan
        if (!generatedPayProId.challanGenerated) {
          const userRef = doc(firestore, "users", user.email);
          await updateDoc(userRef, {
            "generatedPayProId.challanGenerated": true,
          });

          // Update local state
          setGeneratedPayProId((prev) => ({
            ...prev,
            challanGenerated: true,
          }));
        }

        // Redirect to bank challan page with existing PSID
        router.push(
          `/dashboard/bank-challan?psid=${generatedPayProId.consumerNumber}`
        );
        return;
      }

      // If no PayPro ID exists, generate a new one specifically for challan
      const newPayProId = await generatePSID(true);

      // Fake loading animation for better UX
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Redirect to bank challan page with new PSID
      router.push(`/dashboard/bank-challan?psid=${newPayProId}`);
    } catch (error) {
      console.error("Error generating challan:", error);
      showToast("Error generating bank challan", "error");
    } finally {
      setIsChallanGenerating(false);
    }
  };

  // Due date calculation (single effect)
  useEffect(() => {
    if (!user?.applicationSubmittedAt) return;

    const createdAt = user.applicationSubmittedAt;
    const submittedDate = createdAt.toDate ? createdAt.toDate() : createdAt;
    const now = new Date();

    const normalizeDate = (date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    const subDate = normalizeDate(submittedDate);
    const nowDate = normalizeDate(now);
    const timeDiff = nowDate.getTime() - subDate.getTime();
    const dayDiff = Math.floor(timeDiff / (1000 * 3600 * 24));

    let newDueDate = new Date(subDate);

    if (dayDiff <= 3) {
      newDueDate.setDate(subDate.getDate() + 3);
    } else if (dayDiff <= 5) {
      newDueDate.setDate(subDate.getDate() + 5);
    } else {
      newDueDate = new Date();
      newDueDate.setDate(newDueDate.getDate() + 1);
    }

    const timeRemaining = newDueDate.getTime() - nowDate.getTime();
    const daysLeft = Math.ceil(timeRemaining / (1000 * 3600 * 24));
    setDaysRemaining(daysLeft > 0 ? daysLeft : 0);

    setDueDate(
      newDueDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
  }, [user]);

  // Get filtered courses for EditCourses
  const getFilteredCourses = allCourses;

  const [isOpen, setIsOpen] = useState(false);

  // Lock body scroll when modal is open
  React.useEffect(() => {
    if (isOpen || isEditModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen, isEditModalOpen]);

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-second border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-start gap-6">
              <div className="bg-green-100 p-4 rounded-full" aria-hidden>
                <FaCheckCircle className="text-green-500 text-4xl" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-2">
                  Congratulations, You Passed the Admission Test!
                </h1>
                <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-xs font-medium">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  <span role="status" aria-live="polite">
                    Score: {user?.OnlineTestPercentage?.toFixed(2) || 0}% •
                    Status: Passed
                  </span>
                </div>
                <p className="text-white mt-3 max-w-3xl">
                  Welcome to the {SiteDetails.programName}, a initiative
                  supported by the Government of Punjab.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left column */}
            <div className="lg:w-2/3 space-y-6">
              {/* Congratulations Message */}
              <div className="bg-green-50 border border-green-200 rounded-xl ">
                <div className="items-center gap-3">
                  <div className="p-3 bg-second  flex items-start  gap-3 py-3 rounded-t-2xl px-4">
                    <FaCheckCircle className="text-white text-xl shrink-0 mt-0.5" />
                    <h2 className="text-lg font-semibold text-white mb-2">
                      Congratulations on passing the admission test!
                    </h2>
                  </div>
                  <div className="p-6">
                    <p className="text-green-700 mb-3">
                      <strong>Dear {user.fullName}</strong>, <br /> We are
                      delighted to inform you that you have successfully passed
                      the <strong>Honhaar Jawan Admission Test.</strong> You are
                      now one step closer to acquiring world-class technical and
                      vocational skills through the{" "}
                      <strong>Honhaar Jawan Initiative.</strong> Once the
                      application processing fee is paid, your application will
                      be automatically submitted for review.{" "}
                      <strong>Please note!</strong>, all courses are completely
                      free, but the application processing fee is required to
                      complete your application. If your admission is not
                      approved, the application processing{" "}
                      <strong>fee will be refunded</strong>.
                    </p>

                    <div className="w-full p-4 my-4 bg-green-500 border-l-4 border-primary rounded-md">
                      <div className="flex items-start gap-3">
                        <svg
                          className="w-6 h-6 text-white mt-0.5 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l6.518 11.592A1.75 1.75 0 0116.518 17H3.482a1.75 1.75 0 01-1.742-2.309L8.257 3.1zM11 14a1 1 0 10-2 0 1 1 0 002 0zm-.25-2.75a.75.75 0 01-1.5 0V8a.75.75 0 011.5 0v3.25z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <div>
                          <h2 className="text-lg font-semibold text-white">
                            Important Note:
                          </h2>
                          <p className="text-sm text-white mt-1 leading-relaxed">
                            All courses are 100% free, whether you choose one
                            course or up to three courses. However, a minor
                            application processing fee of 5,000 PKR is required.
                            Please note that the application processing fee
                            remains the same regardless of whether you select
                            one course or three courses.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Deadline */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FaCalendarAlt className="text-yellow-600" /> Application
                  Processing Fee Deadline
                </h3>
                <p className="text-gray-600 mb-2 text-sm">
                  Last Date to pay Application Processing Fee:
                </p>
                <p className="text-xl font-bold text-yellow-700">{dueDate}</p>
                <p className="mt-3 text-green-700 text-sm">
                  Scroll down and secure your enrollment now by confirming your
                  admission seat before the admission deadline. Failure to
                  confirm before the deadline will result in automatic
                  cancellation of your application. Upon confirmation, your
                  enrollment will be reserved, and details of your classes,
                  along with your learning credentials, will be shared promptly.
                </p>
              </div>

              {/* Video Guide Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <FaVideo className="text-primary" /> Final Step: Video
                      Guide
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Watch this video for detailed instructions on completing
                      the final step of your enrollment after passing the
                      admission test.
                    </p>
                  </div>
                  <div className="lg:w-64">
                    <button
                      className="w-full group relative overflow-hidden rounded-lg bg-primary text-white p-4 shadow-md hover:bg-second transform hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 justify-center"
                      onClick={() => setIsOpen(true)}
                    >
                      <FaVideo className="shrink-0" />
                      <span className="font-medium">Watch Video</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Selected Study Programs */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-second py-3 px-5">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <FaSquareCheck /> Selected Study Programs
                  </h2>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 mb-4 text-sm">
                    To edit your courses, click 'Edit.' To skip a course, select
                    'None' in the optional courses. To add a course, choose from
                    the available options. You can enroll in up to 3 courses at
                    once.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[500px]">
                      <thead>
                        <tr className="bg-gray-100 border-b">
                          <th className="text-left py-3 px-4 text-gray-600 font-medium">
                            Form #
                          </th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium border-l border-gray-200">
                            Applied Courses
                          </th>
                          <th className="text-left py-3 px-4 text-gray-600 font-medium border-l border-gray-200">
                            Edit Courses
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 text-gray-700 font-medium">
                            {user?.formNo || "N/A"}
                          </td>
                          <td className="py-3 px-4 border-l border-gray-200">
                            {user?.selectedCourses?.length > 0 ? (
                              <ul className="list-disc pl-5 space-y-1 text-gray-600 text-sm">
                                {user.selectedCourses
                                  .filter(
                                    (course) =>
                                      (course && course.name) || course.name
                                  )
                                  .map((course, index) => (
                                    <li key={index}>{course.name}</li>
                                  ))}
                              </ul>
                            ) : (
                              <p className="text-gray-500">
                                No courses selected
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-4 border-l border-gray-200">
                            <button
                              onClick={() => setIsEditModalOpen(true)}
                              className="group relative overflow-hidden rounded-lg bg-primary text-white p-4 shadow-md hover:bg-second transform hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
                            >
                              <div className="flex flex-col items-center">
                                <span className="font-medium flex items-center gap-1 text-white">
                                  <FaEdit /> Edit
                                </span>
                              </div>
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="lg:w-1/3">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-28">
                <div className="bg-second py-3 px-5">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <FaAward /> Student Result Card
                  </h2>
                </div>

                <div className="p-5">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div className="flex items-center gap-2 text-gray-700 text-sm">
                        <FaUser className="text-primary" />{" "}
                        <span>Student Name</span>
                      </div>
                      <div className="font-medium text-sm">
                        {user?.fullName || "N/A"}
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div className="flex items-center gap-2 text-gray-700 text-sm">
                        <FaIdCard className="text-primary" />{" "}
                        <span>Test ID</span>
                      </div>
                      <div className="font-medium text-sm">
                        {user?.formNo || "N/A"}
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div className="flex items-center gap-2 text-gray-700 text-sm">
                        <FaListOl className="text-primary" />{" "}
                        <span>Total MCQs</span>
                      </div>
                      <div className="font-medium text-sm">25</div>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div className="flex items-center gap-2 text-gray-700 text-sm">
                        <FaAward className="text-primary" />{" "}
                        <span>Marks Obtained</span>
                      </div>
                      <div className="font-medium text-sm">
                        {user?.OnlineTestPercentage
                          ? `${user.OnlineTestPercentage.toFixed(2)}%`
                          : "N/A"}
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-2">
                      <div className="flex items-center gap-2 text-gray-700 text-sm">
                        <span className="text-primary">Status</span>
                      </div>
                      <div className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        Passed
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="px-5 pb-5">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${user?.OnlineTestPercentage || 0}%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 mt-2">
                    <span>0%</span>
                    <span>
                      Your score: {user?.OnlineTestPercentage?.toFixed(2) || 0}%
                    </span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full max-w-7xl my-4 bg-yellow-50 border-l-4 border-yellow-400 p-5 rounded-md">
            <style jsx>{`
              @keyframes rotate3d {
                0% {
                  transform: perspective(1200px) rotateY(-10deg) rotateX(5deg);
                }
                50% {
                  transform: perspective(1200px) rotateY(10deg) rotateX(-5deg);
                }
                100% {
                  transform: perspective(1200px) rotateY(-10deg) rotateX(5deg);
                }
              }

              .card-3d-rotate {
                animation: rotate3d 8s ease-in-out infinite;
                transform-style: preserve-3d;
                transition: transform 0.3s ease;
              }
            `}</style>

            <div className="flex flex-col lg:flex-row items-start gap-3">
              {/* Honhaar Card Visual */}
              <div className="flex flex-col mx-auto items-center">
                <div className="card-3d-rotate mb-6">
                  <img
                    src="/Student-Card.avif"
                    className="rounded-2xl border border-white shadow-2xl w-full"
                    alt={`${SiteDetails.studentCard} Display`}
                  />
                </div>
              </div>
              <div className="">
                <h2 className="text-lg font-semibold text-yellow-800">
                  Important Eligibility Notice
                </h2>
                <p className="text-sm text-yellow-700 mt-2 leading-relaxed">
                  The <strong>Honhaar Student Card</strong> is issued only to
                  participants who have successfully completed the full
                  admission process and achieved{" "}
                  <strong> 100% completion</strong> in their enrolled course.
                  <strong>{SiteDetails.programName}</strong> initiative. Only
                  candidates who have achieved{" "}
                  <strong>100% course completion</strong>, including attendance,
                  assignments, practical assessments, and final evaluations, are
                  eligible for card issuance.
                </p>
                <p className="text-sm text-yellow-700 mt-3 leading-relaxed">
                  Applicants with pending modules, incomplete verification, or
                  unresolved documentation will <strong>not</strong> qualify for
                  the Honhaar Student Card until all academic and administrative
                  requirements have been fulfilled. The verification process
                  ensures that every recipient represents the standards of
                  excellence, discipline, and digital competency upheld by the
                  Government of Punjab.
                </p>
                <p className="text-sm text-yellow-700 mt-3 leading-relaxed italic">
                  Please review your course completion status and ensure that
                  all relevant records are updated before submitting your
                  application. Incomplete or inaccurate information may result
                  in delays or rejection.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Section */}
      <div className="bg-second py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">
              Confirm Your Enrollment
            </h2>
            <p className="text-white max-w-3xl mx-auto">
              Secure your seat by confirming your enrollment before the
              deadline. Failure to confirm will result in automatic cancellation
              of your application.
            </p>
          </div>
          <div className="flex mx-auto max-w-xs mb-4 gap-2">
            <button
              className={`flex-1 py-4 px-6 rounded-xl text-center font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === "online"
                  ? "text-white bg-green-500 "
                  : "text-primary bg-white"
              }`}
              onClick={() => setActiveTab("online")}
            >
              {activeTab === "online" && <FaCheck className="text-green-300" />}
              Pay Online
            </button>
            <button
              className={` py-4 px-6 rounded-xl text-center font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === "challan"
                  ? "text-white bg-green-500 "
                  : "text-primary bg-white"
              }`}
              onClick={() => setActiveTab("challan")}
            >
              {activeTab === "challan" && (
                <FaCheck className="text-green-300" />
              )}
              Bank Challan
            </button>
          </div>
          {/* Payment Tabs */}
          <div className="bg-white rounded-2xl overflow-hidden">
            {/* Tab Content */}
            <div className="p-6">
              {activeTab === "online" && (
                <div className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">
                      Payment Instructions:
                    </h3>
                    <p className="text-gray-700">
                      To complete your payment, first click on the "Generate
                      Consumer Number" button to create your unique Consumer
                      Number. Once generated, copy your Consumer Number as
                      you'll need it to complete the payment process. Next,
                      select your bank from the options shown below and follow
                      the step-by-step screenshot guide that appears to help you
                      complete your payment. If you have any questions, contact
                      our support team at{" "}
                      <a
                        href={`mailto:${SiteDetails.supportEmail}`}
                        className="text-primary hover:underline"
                      >
                        {SiteDetails.supportEmail}
                      </a>
                      .
                    </p>
                  </div>

                  {/* Payment steps and Consumer Number generation */}
                  <div className="space-y-4 ">
                    <div className="flex flex-col sm:flex-row justify-center">
                      <div className="relative w-full sm:w-auto">
                        <button
                          onClick={
                            !generatedPayProId?.consumerNumber
                              ? () => generatePSID(false)
                              : undefined
                          }
                          className={`group relative overflow-hidden rounded-lg lg:rounded-r-none bg-primary text-white p-4 shadow-md hover:bg-second transform hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center w-full sm:w-auto ${
                            generatedPayProId?.consumerNumber
                              ? "cursor-default pointer-events-none opacity-80"
                              : ""
                          }`}
                        >
                          <div className="flex flex-col items-center">
                            {isPSIDGenerating ? (
                              <div className="flex items-center gap-2">
                                <ImSpinner className="animate-spin" size={20} />
                                <span className="font-medium text-white">
                                  Generating Consumer Number
                                </span>
                              </div>
                            ) : (
                              <span className="font-medium flex items-center gap-1 text-white">
                                <FaFileAlt className="mr-2" />
                                {generatedPayProId?.consumerNumber
                                  ? "Generated Consumer Number"
                                  : "Generate Consumer Number"}
                              </span>
                            )}
                          </div>{" "}
                        </button>
                      </div>

                      {fetching ? (
                        <div className="flex items-center justify-center bg-gray-100 px-4 py-3 mt-2 sm:mt-0 sm:ml-0 w-full sm:w-auto rounded-lg sm:rounded-none sm:border-l-0 sm:border-y sm:border-gray-300">
                          Loading Consumer Number...
                        </div>
                      ) : (
                        generatedPayProId?.consumerNumber && (
                          <div className="flex sm:flex-row flex-col w-full sm:w-auto mt-2 sm:mt-0">
                            <div className="bg-gray-100 flex items-center px-4 py-3 border border-gray-300 rounded-t-lg sm:rounded-t-none  sm:border-l-0 sm:border-y sm:border-gray-300">
                              <span className="text-gray-800 text-center flex w-full sm:text-left">
                                {generatedPayProId.consumerNumber}
                              </span>
                            </div>
                            <button
                              onClick={handleCopyPayProId}
                              className="px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-b-lg sm:rounded-b-none sm:rounded-r-lg sm:border-t-0 sm:border-l-0 flex items-center justify-center hover:bg-gray-200"
                            >
                              <FaRegCopy />
                            </button>
                          </div>
                        )
                      )}
                    </div>

                    {generatedPayProId?.consumerNumber && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start">
                          <FaInfoCircle className="text-green-600 mr-3 mt-0.5 shrink-0" />
                          <div className="text-green-700 text-sm">
                            <p className="font-semibold mb-2">Note:</p>
                            <p>
                              After paying your {SiteDetails.programName}{" "}
                              application processing fee, no further action is
                              required. Please allow up to 30 minutes for
                              processing, during which you should receive a
                              confirmation email. If you have already paid your
                              Consumer Number, please click the "Check Status"
                              button to verify your payment. If you've completed
                              the payment but haven't received a confirmation
                              yet, you can also use the "Check Status" button to
                              recheck. If the issue persists, please contact our
                              support team at{" "}
                              <a
                                href={`mailto:${SiteDetails.supportEmail}`}
                                className="text-primary hover:underline"
                              >
                                {SiteDetails.supportEmail}
                              </a>
                              .
                            </p>
                            {!generatedPayProId?.challanGenerated && (
                              <button
                                onClick={checkInvoiceStatus}
                                disabled={invoiceLoading}
                                className={`mt-3 text-sm flex gap-2 py-2 px-3 rounded-md ${
                                  invoiceLoading
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-green-600 hover:bg-green-700"
                                } text-white items-center transition-colors`}
                              >
                                {invoiceLoading ? (
                                  <>
                                    <FaSpinner className="animate-spin" />
                                    Checking Status
                                  </>
                                ) : (
                                  <>
                                    <FaCheckCircle />
                                    Check Status
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <PayproPaymentVideos />
                  </div>
                </div>
              )}

              {activeTab === "challan" && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Payment Instructions:
                  </h3>
                  <h1>
                    To pay your application processing fee through the Bank
                    Challan option, simply download the Bank Challan below and
                    print it. Deposit the application processing fee at any bank
                    mentioned in the challan. Once paid, click the "Check
                    Challan Status" button below to verify your payment. After
                    verification, your admission will be confirmed, and you'll
                    receive details about your classes and access to the
                    Learning Portal.
                  </h1>

                  <button
                    onClick={handleDownloadChallan}
                    disabled={isChallanGenerating}
                    className={`group relative overflow-hidden rounded-lg bg-primary text-white p-4 shadow-md hover:bg-second transform hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 ${
                      isChallanGenerating ? "cursor-not-allowed" : ""
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      {isChallanGenerating ? (
                        <div className="flex items-center gap-2">
                          <ImSpinner className="animate-spin" size={20} />
                          <span className="font-medium text-white">
                            {generatedPayProId?.consumerNumber
                              ? "Preparing Challan..."
                              : "Generating Challan..."}
                          </span>
                        </div>
                      ) : (
                        <span className="font-medium flex items-center gap-1 text-white">
                          <FaDownload />
                          {generatedPayProId?.consumerNumber
                            ? "Download Bank Challan"
                            : "Generate & Download Bank Challan"}
                        </span>
                      )}
                    </div>
                  </button>

                  {generatedPayProId?.consumerNumber && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start">
                        <FaInfoCircle className="text-green-600 mr-3 mt-0.5 shrink-0" />
                        <div className="text-green-700 text-sm">
                          <p className="font-semibold mb-2">Note:</p>
                          <p>
                            After paying your Honhaar Jawan application
                            processing fee via Bank Challan, no further action
                            is required. Please allow up to 30 minutes for
                            processing, during which you should receive a
                            confirmation email. If you have already made the
                            payment, please click the "Check Status" button to
                            verify your payment. If you've paid but haven't
                            received a confirmation yet, you can also use the
                            "Check Status" button to recheck. If the issue
                            persists, please contact our support team at{" "}
                            <a
                              href="mailto:info.department@honhaarjawan.pk"
                              className="text-primary hover:underline"
                            >
                              info.department@honhaarjawan.pk
                            </a>
                            .
                          </p>
                          <button
                            onClick={checkInvoiceStatus}
                            disabled={invoiceLoading}
                            className={`mt-3 text-sm flex gap-2 py-2 px-3 rounded-md ${
                              invoiceLoading
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-green-600 hover:bg-green-700"
                            } text-white items-center transition-colors`}
                          >
                            {invoiceLoading ? (
                              <>
                                <FaSpinner className="animate-spin" />
                                Checking Status
                              </>
                            ) : (
                              <>
                                <FaCheckCircle />
                                Check Status
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto text-center bg-white rounded-xl my-10 p-2 max-w-7xl">
        <h2 className="text-2xl font-bold mb-4">Need Help?</h2>
        <p className="text-primary max-w-2xl mx-auto leading-relaxed">
          If you're experiencing any issues or need assistance with your{" "}
          <span className="font-semibold">{SiteDetails.programName}</span>{" "}
          application or payment process, our support team is here to help.
          Don't hesitate to reach out — we'll make sure your issue is resolved
          as quickly as possible.
        </p>
        <div className="mt-6">
          <a
            href={`mailto:${SiteDetails.supportEmail}`}
            className="inline-block bg-yellow-500 text-white font-semibold px-6 py-3 rounded-lg shadow hover:bg-primary transition-colors duration-200"
          >
            Contact Support
          </a>
        </div>
      </div>
      <Copyright />
      {/* Modals */}
      <FinalStepsModal isOpen={isOpen} setIsOpen={setIsOpen} />

      {isEditModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Edit Your Courses</h2>
              <EditCourses
                initialFormData={formData}
                onSave={handleSaveChanges}
                onCancel={() => setIsEditModalOpen(false)}
                isUpdating={isUpdating}
                filteredCourses={getFilteredCourses}
                userEmail={user.email}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Testpassed;
