"use client";
import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import html2canvas from "html2canvas";
import { QRCodeCanvas } from "qrcode.react";
import { TbFileDownload } from "react-icons/tb";
import { firestore } from "@/Backend/Firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import Navbar from "@/components/primary/Navbar";
import { FaAward } from "react-icons/fa6";
import {
  FaCheck,
  FaDownload,
  FaExclamation,
  FaFile,
  FaFileAlt,
  FaShippingFast,
  FaSpinner,
  FaRegCopy,
  FaUniversity,
  FaLandmark,
  FaStamp,
} from "react-icons/fa";
import PayproPaymentVideos from "../dashboard/compo/PayproPaymentVideos/PaymentVideos";
import Copyright from "@/components/primary/Copyright";
import PageInfo from "@/components/PageInfo";
import { ImSpinner } from "react-icons/im";
import { useToast } from "@/components/primary/Toast";
import SiteDetails from "@/Data/SiteData";
import Image from "next/image"; // Import Next.js Image component

function formatReadableDate(isoString) {
  if (!isoString || typeof isoString !== "string") return "Invalid Date";

  const dateObj = new Date(isoString);
  if (isNaN(dateObj.getTime())) return "Invalid Date";

  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Component to handle the content that uses useSearchParams
const CertificateVerificationContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const certificateRef = useRef(null);
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [certificate, setCertificate] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // PSID Generation states
  const [isPSIDGenerating, setIsPSIDGenerating] = useState(false);
  const [consumerNumber, setConsumerNumber] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [showTickMark, setShowTickMark] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceStatus, setInvoiceStatus] = useState(null);

  // Get URL parameters
  const verificationIdParam = searchParams.get("verificationId");
  const fullNameParam = searchParams.get("fullName");
  const courseNameParam = searchParams.get("courseName");
  const completedAtParam = searchParams.get("completedAt");
  const emailParam = searchParams.get("email");
  const cnicParam = searchParams.get("cnic");

  // Listen for Consumer Number updates
  useEffect(() => {
    if (!verificationIdParam) {
      setFetching(false);
      return;
    }

    const docRef = doc(firestore, "certificates", verificationIdParam);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const currentConsumerNumber = data?.generatedPayProId?.consumerNumber;
          if (currentConsumerNumber !== consumerNumber) {
            setConsumerNumber(currentConsumerNumber);
          }
        } else {
          setConsumerNumber(null);
        }
        setFetching(false);
      },
      (error) => {
        console.error("Error fetching Consumer Number:", error);
        setFetching(false);
      }
    );

    return () => unsubscribe();
  }, [verificationIdParam, consumerNumber]);

  // Fetch certificate data
  useEffect(() => {
    const fetchCertificate = async () => {
      if (!verificationIdParam) {
        setError("Verification ID not provided.");
        setLoading(false);
        return;
      }

      try {
        const q = query(
          collection(firestore, "certificates"),
          where("verificationId", "==", verificationIdParam)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError("Certificate not found.");
          setLoading(false);
          return;
        }

        let certData = {};
        querySnapshot.forEach((doc) => {
          certData = { id: doc.id, ...doc.data() };
        });

        setCertificate(certData);
        setLoading(false);
      } catch (err) {
        setError("An error occurred while fetching certificate data.");
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [verificationIdParam]);

  // Function to generate PSID for certificate hardcopy request
  const generateCertificatePSID = useCallback(async () => {
    setIsPSIDGenerating(true);
    setApiError(null);

    const websiteId = process.env.NEXT_PUBLIC_WEBSITE_ID || "777";
    const gatewayId = process.env.NEXT_PUBLIC_GATEWAY_ID || "283";
    const randomNumber = Math.floor(Math.random() * 999) + 1;
    const identifier = cnicParam || emailParam || "N/A";
    const invoice = `${websiteId}-${gatewayId}-${identifier}-2500-${randomNumber}-3`;

    try {
      if (!certificate) {
        throw new Error("Certificate data not available");
      }

      const response = await fetch("/api/certificate-psid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationId: verificationIdParam,
          email: emailParam || certificate?.email,
          fullName: fullNameParam || certificate?.fullName,
          totalFee: 2500,
          invoice,
          courseName: courseNameParam || certificate?.name,
          completedAt: completedAtParam || certificate?.completedAt,
          cnic: cnicParam || certificate?.cnic,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.consumerNumber) {
        throw new Error(data.error || "Payment request failed");
      }

      const paymentRecord = {
        verificationId: verificationIdParam,
        email: emailParam || certificate?.email,
        fullName: fullNameParam || certificate?.fullName,
        courseName: courseNameParam || certificate?.name,
        completedAt: completedAtParam || certificate?.completedAt,
        cnic: cnicParam || certificate?.cnic,
        consumerNumber: data.consumerNumber,
        invoiceNumber: data.invoiceNumber,
        status: "unpaid",
        amount: 2500,
        created_at: serverTimestamp(),
      };

      // Update the certificate document with the generated Consumer Number
      const certRef = doc(firestore, "certificates", verificationIdParam);
      await updateDoc(certRef, {
        status: "unpaid",
        generatedPayProId: paymentRecord,
      });

      setConsumerNumber(data.consumerNumber);
      showToast(
        "Your PSID/Consumer Number has been generated successfully.",
        "success"
      );

      return data.consumerNumber;
    } catch (error) {
      setApiError(error.message);
      showToast(
        error.message || "An error occurred while generating PSID.",
        "error"
      );
      throw error;
    } finally {
      setIsPSIDGenerating(false);
    }
  }, [
    certificate,
    verificationIdParam,
    fullNameParam,
    courseNameParam,
    completedAtParam,
    emailParam,
    cnicParam,
    showToast,
  ]);

  // Check invoice status function
const checkInvoiceStatus = useCallback(async () => {
  setInvoiceLoading(true);

  try {
    const response = await fetch("/api/certificate-check-psid-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoiceNumber: certificate?.generatedPayProId?.invoiceNumber,
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
        const certRef = doc(firestore, "certificates", verificationIdParam);
        await updateDoc(certRef, {
          status: "paid",
          paidAt: new Date().toISOString(),
        });

        showToast(
          "Your certificate fee has been processed successfully. Certificate will be dispatched soon!",
          "success"
        );
      } else if (orderStatus === "pending") {
        // For pending status, show message but don't update user status
        showToast("Your payment is pending.", "warning");
      } else if (orderStatus === "unpaid") {
        showToast(
          "Please complete the payment for your certificate or contact our helpline for assistance.",
          "warning"
        );
      } else {
        showToast(
          "We are unable to retrieve the status for the provided PSID. Please contact our helpline for assistance.",
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
}, [certificate, verificationIdParam, showToast]);
  const handleCopyConsumerNumber = () => {
    navigator.clipboard.writeText(`${consumerNumber}`);
    setShowTickMark(true);
    setTimeout(() => setShowTickMark(false), 5000);
    showToast("Consumer Number copied to clipboard!", "info");
  };

  const generatePNG = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      const input = certificateRef.current;
      const canvas = await html2canvas(input, {
        scale: 4,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: null,
      });

      const imgData = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement("a");
      link.href = imgData;
      link.download = `Certificate-${
        certificate?.fullName || "Certificate"
      }.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("eCertificate downloaded successfully!", "success");
    } catch (error) {
      showToast("Error generating PNG. Please try again.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const showCertificatePreview = () => {
    setShowPreview(true);
  };

  // Safely get fullName with null check
  const fullName = certificate?.fullName || "";

  if (showPreview) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white shadow-md rounded-sm border border-gray-300 p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-800 p-2 rounded-sm">
                <FaStamp className="text-white text-xl" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">
                OFFICIAL CERTIFICATE PREVIEW
              </h1>
            </div>

            <div className="border-2 border-gray-400 p-2 bg-white">
              <div
                ref={certificateRef}
                className="relative w-full mx-auto aspect-[297/210]"
              >
                {/* Background Image - Simple direct rendering */}
                <div className="absolute inset-0 w-full h-full">
                  <img
                    src="/certificate.webp"
                    alt="Certificate Background"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error("Image failed to load");
                      // Fallback to a solid color if image fails
                      e.target.style.display = "none";
                      e.target.parentElement.style.background =
                        "linear-gradient(to right, #f0f0f0, #e0e0e0)";
                    }}
                  />
                </div>

                <div className="absolute top-[38%] text-gray-500 tracking-widest left-0 right-0 text-center">
                  <h2
                    className="text-lg font-black"
                    style={{ fontFamily: "Times New Roman, serif" }}
                  >
                    {fullName || "Loading..."}
                  </h2>
                </div>

                <div className="absolute top-[65.8%] left-0 right-0 text-center max-w-md mx-auto">
                  <p
                    className="text-xs"
                    style={{ fontFamily: "Times New Roman, serif" }}
                  >
                    <span className="font-bold text-gray-800 text-xs">
                      {certificate?.courseName ||
                        certificate?.name ||
                        "Loading..."}{" "}
                      Course
                    </span>
                    .
                  </p>
                </div>
                <div className="absolute top-[45.5%] left-0 right-0 text-center max-w-md mx-auto">
                  <p
                    className="text-xs"
                    style={{ fontFamily: "Times New Roman, serif" }}
                  >
                    in recognition of her/his hard work in attending and
                    dedication in completing of{" "}
                    <span className="font-bold text-gray-800 text-xs">
                      {certificate?.courseName ||
                        certificate?.name ||
                        "Loading..."}{" "}
                      Course
                    </span>
                    <br />
                    <span className="font-medium text-gray-600">
                      on {formatReadableDate(certificate?.issuedAt || "")}
                    </span>
                    .
                  </p>
                </div>

                <div className="absolute top-[58.5%] left-0 right-0 text-center">
                  <p
                    className="text-xs font-semibold"
                    style={{ fontFamily: "Times New Roman, serif" }}
                  >
                    <span className="text-gray-600 tracking-wide">
                      Certificate Verification ID:
                    </span>{" "}
                    {certificate?.verificationId || "Loading..."}
                  </p>
                </div>
                <div className="absolute top-[78.5%] text-gray-600 right-[35%] left-0 text-center">
                  <p
                    className="text-xs font-semibold"
                    style={{ fontFamily: "Times New Roman, serif" }}
                  >
                    {formatReadableDate(certificate?.issuedAt || "")}
                  </p>
                </div>
              </div>
            </div>

            {/* Download Button */}
            <div className="mt-6 text-center">
              <button
                onClick={generatePNG}
                disabled={isGenerating}
                className={`group relative overflow-hidden bg-blue-800 text-white py-2 px-6 rounded-sm flex items-center gap-2 text-lg mx-auto border border-blue-900 transform hover:-translate-y-0.5 transition-all duration-300 ${
                  isGenerating
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-blue-900"
                }`}
              >
                {isGenerating ? (
                  <div className="flex items-center gap-2">
                    <ImSpinner className="animate-spin" />
                    <span>Generating...</span>
                  </div>
                ) : (
                  <>Download Official Certificate</>
                )}
              </button>

              <button
                onClick={() => setShowPreview(false)}
                className="mt-4 text-blue-800 hover:underline flex items-center gap-2 mx-auto"
              >
                ← Return to Verification Portal
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="container mx-auto max-w-7xl px-4 py-24">
        {/* Congratulations Section */}
        <div className="bg-white shadow-md rounded-sm border border-gray-300 p-6 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-primary/75 p-3 rounded-sm">
              <FaAward className="text-white text-2xl" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              CERTIFICATE VERIFICATION SUCCESSFUL
            </h1>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <FaDownload className="text-primary" />
              <p className="text-gray-700">
                You are eligible to download your e-certification at no cost.
                Click the button below to obtain your digital certification
                immediately.
              </p>
            </div>
            <button
              onClick={showCertificatePreview}
              className="group relative overflow-hidden bg-primary text-white py-2 px-6 rounded-sm flex items-center gap-2 hover:bg-second transition-all transform hover:-translate-y-0.5 transition-all duration-300"
            >
              <TbFileDownload /> Download e-Certification
            </button>
          </div>

          <div className="border-t border-gray-300 pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className=" p-2 rounded-sm">
                <FaFileAlt className="text-primary" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                APPLY FOR OFFICIAL STAMPED HARDCOPY CERTIFICATE
              </h2>
            </div>

            <div className="flex items-start gap-3 mb-4 bg-yellow-50 p-4 border border-yellow-200">
              <p className="text-gray-700">
                Obtain your government-recognized certificate with official
                stamp and seal, delivered to your address. Follow the procedure
                below to apply. Upon successful payment, your certificate will
                be processed and delivered within 14 business days.
              </p>
            </div>
          </div>
        </div>

        {/* Hardcopy Certificate Section */}
        <div className="bg-white shadow-md rounded-sm border border-gray-300 p-6 mb-8">
          <div className="flex items-center gap-3 mb-6 border-b border-gray-300 pb-4">
            <div className="bg-green-700 p-2 rounded-sm">
              <FaCheck className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              OFFICIAL CERTIFICATE REQUEST PROCESS
            </h2>
          </div>

          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              <span className="font-bold text-gray-900">Honhaar Jawan</span>{" "}
              facilitates the application process for your officially stamped
              certificate. Submit the one-time fee of 2500 PKR through any
              authorized bank or online banking application to receive your
              certificate via registered post within 14 business days.
            </p>

            <div className="bg-gray-50 p-4 border border-gray-300 mb-4">
              <h3 className="font-bold text-gray-800 mb-2">PROCEDURE:</h3>
              <ol className="list-decimal pl-5 space-y-2 text-gray-700">
                <li>
                  <span className="font-bold">
                    Generate Your PSID/Consumer Number:
                  </span>{" "}
                  Use the form below to generate your unique identification
                  number for payment processing.
                </li>
                <li>
                  <span className="font-bold">Select Payment Method:</span>{" "}
                  Submit payment through mobile banking applications, internet
                  banking, or authorized bank branches.
                </li>
                <li>
                  <span className="font-bold">Confirmation:</span> Upon
                  successful transaction, your certificate will be processed for
                  dispatch.
                </li>
                <li>
                  <span className="font-bold">Delivery:</span> Your
                  government-recognized, officially stamped certificate will be
                  delivered through approved courier service within 14 business
                  days of payment verification.
                </li>
              </ol>
            </div>

            <div className="bg-blue-50 p-4 border border-blue-200">
              <div className="flex items-start gap-2">
                <div className="bg-black p-0.5 rounded-full mt-1">
                  <FaExclamation className="text-white text-xs" />
                </div>
                <p className="text-gray-600">
                  <span className="font-bold">Note:</span> This is a one-time
                  processing and delivery fee. This amount covers all
                  administrative, verification, and delivery charges.
                </p>
              </div>
            </div>
          </div>

          {/* PSID Generation */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-300 pb-2">
              GENERATE PSID
            </h3>

            <div className="flex flex-col md:flex-row items-center">
              <button
                onClick={!consumerNumber ? generateCertificatePSID : undefined}
                disabled={isPSIDGenerating || consumerNumber}
                className={`group relative overflow-hidden bg-primary text-white font-medium px-6 py-2 rounded-sm flex items-center gap-2 whitespace-nowrap border transition-all duration-300 ${
                  consumerNumber
                    ? "opacity-80 cursor-default"
                    : "hover:bg-second"
                } ${isPSIDGenerating ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {isPSIDGenerating ? (
                  <>
                    <ImSpinner className="animate-spin" />
                    <span>Generating Reference</span>
                  </>
                ) : (
                  <>
                    <FaFileAlt />
                    <span>
                      {consumerNumber
                        ? "PSID/Consumer Number"
                        : "Generate Reference Number"}
                    </span>
                  </>
                )}
              </button>

              {fetching ? (
                <div className="flex items-center justify-center bg-gray-100 px-4 py-2 rounded-sm text-gray-700 border border-gray-400 w-full">
                  <ImSpinner className="animate-spin mr-2" />
                  Loading Reference Number...
                </div>
              ) : (
                consumerNumber && (
                  <div className="flex flex-col md:flex-row items-center gap-2 w-full">
                    <div className="relative flex-grow">
                      <div className="bg-gray-100 px-4 py-2 rounded-sm flex items-center justify-between w-full border border-gray-300">
                        <span className="text-gray-800 font-mono">
                          {consumerNumber}
                        </span>
                        <button
                          onClick={handleCopyConsumerNumber}
                          className="p-1 text-gray-600 hover:text-blue-800 transition-colors"
                          title="Copy to clipboard"
                        >
                          <FaRegCopy />
                        </button>
                      </div>
                      {showTickMark && (
                        <div className="absolute -bottom-6 left-0 text-sm text-green-700">
                          Copied to clipboard!
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>

            {apiError && (
              <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-sm text-center border border-red-300">
                Error: {apiError}
              </div>
            )}
          </div>

          {/* Payment Instructions */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-300 pb-2">
              PAYMENT INSTRUCTIONS
            </h3>
            <PayproPaymentVideos />
          </div>

          {/* Payment Status Check */}
          {consumerNumber && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-300 pb-2">
                VERIFY PAYMENT STATUS
              </h3>
              <div className="text-center">
                <button
                  onClick={checkInvoiceStatus}
                  disabled={invoiceLoading}
                  className={`group relative overflow-hidden bg-primary text-white py-2 px-6 rounded-sm transition-colors font-bold border hover:bg-second transform hover:-translate-y-0.5 transition-all duration-300 ${
                    invoiceLoading
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-blue-900"
                  }`}
                >
                  {invoiceLoading ? (
                    <span className="flex items-center justify-center">
                      <ImSpinner className="animate-spin mr-2" />
                      Verifying Status...
                    </span>
                  ) : (
                    "Check Payment Verification Status"
                  )}
                </button>

                {invoiceStatus && (
                  <div
                    className={`mt-4 p-3 rounded-sm text-center font-medium border ${
                      invoiceStatus === "PAID"
                        ? "bg-green-100 text-green-800 border-green-300"
                        : invoiceStatus === "UNPAID"
                          ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                          : "bg-red-100 text-red-800 border-red-300"
                    }`}
                  >
                    Transaction Status: {invoiceStatus}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Important Notice */}
          <div className="bg-yellow-50 p-4 border border-yellow-300 rounded-sm">
            <div className="flex items-start gap-2">
              <div className="bg-blue-800 p-1 rounded-full mt-1">
                <FaExclamation className="text-white text-xs" />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 mb-2">
                  IMPORTANT NOTICE
                </h4>
                <p className="text-gray-700 text-sm">
                  After submitting your certificate fee, no further action is
                  required from your end. Please allow up to 30 minutes for
                  transaction processing. You will receive a confirmation
                  notification upon successful processing. If you do not receive
                  confirmation within 30 minutes, please check your application
                  status in your account dashboard. For unresolved issues,
                  contact our support desk at {SiteDetails.supportEmail} during
                  official working hours (9:00 AM to 5:00 PM, Monday to Friday).
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Copyright />
    </div>
  );
};

// Main component with Suspense boundary
const CertificateVerification = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="flex items-center gap-2 text-gray-700">
            <ImSpinner className="animate-spin text-2xl" />
            <span>Loading Certificate Verification...</span>
          </div>
        </div>
      }
    >
      <CertificateVerificationContent />
    </Suspense>
  );
};

export default CertificateVerification;
