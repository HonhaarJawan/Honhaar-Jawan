"use client";
import { firestore } from "@/Backend/Firebase";
import { useToast } from "@/components/primary/Toast";
import React, { useState, useEffect } from "react";
import {
  FaEnvelope,
  FaFacebook,
  FaInstagram,
  FaMapMarkerAlt,
  FaPaperPlane,
  FaPencilAlt,
  FaPhoneAlt,
  FaUser,
  FaInfoCircle,
  FaFacebookF,
  FaYoutube,
} from "react-icons/fa";
import { ImYoutube, ImSpinner } from "react-icons/im";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import SiteDetails from "@/Data/SiteData";
import { FaX } from "react-icons/fa6";
const Client = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [cooldownEndTime, setCooldownEndTime] = useState(0);
  const [remainingCooldown, setRemainingCooldown] = useState(0);
  const [loading, setLoading] = useState(null);
  const router = useRouter();
  const { showToast } = useToast();

  // Contact Request Handler Functions
  const generateUniqueId = () => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `contact_${timestamp}_${randomStr}`;
  };

  const validateFormData = (formData) => {
    const errors = [];
    if (!formData.name || formData.name.trim().length < 2) {
      errors.push("Full name must be at least 2 characters long");
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push("Please provide a valid email address");
    }
    if (!formData.subject || formData.subject.trim().length < 5) {
      errors.push("Subject must be at least 5 characters long");
    }
    if (!formData.message || formData.message.trim().length < 10) {
      errors.push("Message must be at least 10 characters long");
    }
    return errors;
  };

  const processContactRequest = async (formData) => {
    const requestId = generateUniqueId();
    try {
      const templateRef = doc(firestore, "email_templates", "test_contact");
      const templateSnap = await getDoc(templateRef);
      if (!templateSnap.exists()) {
        throw new Error("Email template 'test_contact' not found");
      }

      const emailData = {
        to: [
          "saeedhaider0000@gmail.com",
          `${SiteDetails.supportEmail}`,
          "54587dfdd@gmail.com",
        ],
        subject: `${formData.name} has submitted a Query From Contact Form`,
        htmlTemplate: templateSnap.data().template,
        placeholders: {
          fullName: formData.name,
          emailAddress: formData.email,
          phoneNumber: formData.phone,
          subject: formData.subject,
          message: formData.message,
        },
      };

      const emailResponse = await fetch(`/api/sendMail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailData),
      });

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json();
        throw new Error(errorData.message || "Email sending failed");
      }

      const contactRequestData = {
        requestId: requestId,
        fullName: formData.name,
        emailAddress: formData.email,
        phoneNumber: formData.phone || null,
        subject: formData.subject,
        message: formData.message,
        submittedAt: serverTimestamp(),
        status: "new",
        emailSent: true,
        emailSentAt: serverTimestamp(),
        processed: false,
      };

      await addDoc(collection(firestore, "email_queries"), contactRequestData);
      showToast(
        "Message sent successfully! We'll get back to you soon.",
        "success"
      );
      return { success: true, requestId: requestId };
    } catch (error) {
      console.error("Contact request processing failed:", error);
      try {
        const failedRequestData = {
          requestId: requestId,
          fullName: formData.name,
          emailAddress: formData.email,
          phoneNumber: formData.phone || null,
          subject: formData.subject,
          message: formData.message,
          submittedAt: serverTimestamp(),
          status: "failed",
          emailSent: false,
          errorMessage: error.message,
          processed: false,
        };
        await addDoc(collection(firestore, "email_queries"), failedRequestData);
      } catch (dbError) {
        console.error("Failed to store failed request:", dbError);
      }
      showToast(
        "Failed to send message. Please try again or contact us directly.",
        "error"
      );
      return { success: false, error: error.message, requestId: requestId };
    }
  };

  const handleContactSubmission = async (
    formData,
    setIsLoading,
    setCooldownEndTime
  ) => {
    const validationErrors = validateFormData(formData);
    if (validationErrors.length > 0) {
      showToast(`Validation Error: ${validationErrors[0]}`, "error");
      return false;
    }

    setIsLoading(true);
    try {
      const result = await processContactRequest(formData);
      if (result.success) {
        setCooldownEndTime(Date.now() + 60000);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Unexpected error:", error);
      showToast("An unexpected error occurred. Please try again.", "error");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let intervalId;
    const now = Date.now();
    if (now < cooldownEndTime) {
      setRemainingCooldown(Math.ceil((cooldownEndTime - now) / 1000));
      intervalId = setInterval(() => {
        const remaining = Math.ceil((cooldownEndTime - Date.now()) / 1000);
        if (remaining > 0) {
          setRemainingCooldown(remaining);
        } else {
          setRemainingCooldown(0);
          setCooldownEndTime(0);
          clearInterval(intervalId);
        }
      }, 0);
    } else {
      setRemainingCooldown(0);
    }
    return () => clearInterval(intervalId);
  }, [cooldownEndTime]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Date.now() < cooldownEndTime) return;

    const success = await handleContactSubmission(
      formData,
      setIsLoading,
      setCooldownEndTime
    );

    if (success) {
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    }
  };

  const isCoolingDown = remainingCooldown > 0;

  return (
    <>
      {/* Important Notice - Government Style */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-blue-50 border-l-4 border-second p-6 rounded-r-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-second"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Honhaar Support Information
              </h3>
              <div className="text-gray-700 space-y-2">
                <p>
                  For official Honhaar inquiries, support requests, or feedback,
                  please use this portal. Our dedicated team ensures timely
                  responses to all citizen queries.
                </p>
                <p className="font-medium">
                  All communications are handled with strict confidentiality as
                  per Honhaar Data protection policies.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="min-h-screen w-full py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Form - 2/3 width */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                {/* Government-style form header */}
                <div className="bg-primary px-6 py-4 border-b border-primary/20">
                  <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Official Contact Form
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">
                    Complete all required fields to submit your Honhaar inquiry
                  </p>
                </div>

                <div className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Information Section */}
                    <div className="border-b border-gray-200 pb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-second"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        Personal Information
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            name="name"
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-second focus:border-second transition-colors"
                            placeholder="Enter your full name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            name="email"
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-second focus:border-second transition-colors"
                            placeholder="Enter your email address"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-second focus:border-second transition-colors"
                            placeholder="e.g. 03001234567"
                            value={formData.phone}
                            onChange={handleChange}
                            disabled={isLoading}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Subject *
                          </label>
                          <input
                            type="text"
                            name="subject"
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-second focus:border-second transition-colors"
                            placeholder="What is your inquiry about?"
                            value={formData.subject}
                            onChange={handleChange}
                            required
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Message Section */}
                    <div className="border-b border-gray-200 pb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-second"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                          />
                        </svg>
                        Your Message
                      </h3>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Detailed Message *
                        </label>
                        <textarea
                          name="message"
                          rows="6"
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-second focus:border-second transition-colors"
                          placeholder="Please provide detailed information about your inquiry, question, or feedback..."
                          value={formData.message}
                          onChange={handleChange}
                          required
                          disabled={isLoading}
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          Please be as detailed as possible to help us address
                          your inquiry effectively.
                        </p>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={isLoading || isCoolingDown}
                        className="w-full bg-second hover:bg-second/90 text-white font-semibold py-3 px-6 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-second focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <ImSpinner className="animate-spin" />
                            Sending Message...
                          </>
                        ) : isCoolingDown ? (
                          <>
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Please wait {remainingCooldown}s
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Submit Honhaar Inquiry
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Contact Information - 1/3 width */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden sticky top-8">
                {/* Government-style contact header */}
                <div className="bg-primary px-6 py-4 border-b border-primary/20">
                  <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    Honhaar Jawan Contact Details
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">
                    Official communication channels
                  </p>
                </div>

                <div className="p-6 space-y-6">
                  {/* Contact Information */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex-shrink-0 p-2 bg-second rounded-lg">
                        <FaPhoneAlt className="text-white text-sm" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Helpline
                        </h3>
                        <a className="text-second hover:underline font-medium">
                          {SiteDetails.phoneNumber}
                        </a>
                        <p className="text-sm text-gray-600 mt-1">
                          Mon-Fri, 9:00 AM - 5:00 PM
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex-shrink-0 p-2 bg-second rounded-lg">
                        <FaEnvelope className="text-white text-sm" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Email Support
                        </h3>
                        <a
                          href={`mailto:${SiteDetails.supportEmail}`}
                          className="text-second hover:underline font-medium"
                        >
                          {SiteDetails.supportEmail}
                        </a>
                        <p className="text-sm text-gray-600 mt-1">
                          24/7 Email Support
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Social Media */}
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="font-semibold text-gray-900 mb-4 text-center">
                      Follow Honhaar Updates
                    </h4>
                    <div className="justify-center flex items-center">
                      <div className="flex items-center justify-center  md:justify-start gap-2 mb-4">
                        <a
                          href="https://www.facebook.com/share/1DWTSyxfEA/?mibextid=wwXIfr"
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Facebook"
                          className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-yellow-500 bg-primary text-white transition-colors text-sm"
                        >
                          <FaFacebookF />
                        </a>
                        <a
                          href="https://x.com/honhaarjawan"
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Twitter / X"
                          className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-yellow-500 bg-primary text-white transition-colors text-sm"
                        >
                          <FaX />
                        </a>
                        <a
                          href="https://www.instagram.com/honhaarjawan/"
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Instagram"
                          className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-yellow-500 bg-primary text-white transition-colors text-sm"
                        >
                          <FaInstagram />
                        </a>
                        <a
                          href="https://www.youtube.com/channel/UCeqwiejxxw5K9i1i-Ebmiyw"
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="YouTube"
                          className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-yellow-500 bg-primary text-white transition-colors text-sm"
                        >
                          <FaYoutube />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Map */}
                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Honhaar Office Location
                    </h4>
                    <div className="rounded-lg overflow-hidden border border-gray-200">
                      <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3401.111108257088!2d74.32018331515053!3d31.52037098136997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x391904f128e4612d%3A0x8c42a8df8a2f4c33!2sPunjab%20Skills%20Development%20Initiative!5e0!3m2!1sen!2s!4v1678886543210!5m2!1sen!2s"
                        width="100%"
                        height="200"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      ></iframe>
                    </div>
                    <p className="text-sm text-gray-600 mt-2 text-center">
                      123 Skills Avenue, Tech City, Punjab
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Client;
