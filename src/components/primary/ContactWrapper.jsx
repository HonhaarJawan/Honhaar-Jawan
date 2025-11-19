"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Mail, X, Send, User, MessageCircle, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { firestore } from "@/Backend/Firebase";
import { useToast } from "@/components/primary/Toast";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import SiteDetails from "@/Data/SiteData";
import { usePathname } from "next/navigation";
import { FaWhatsapp } from "react-icons/fa";

const ContactModal = () => {
  const pathname = usePathname();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("email");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [cooldownEndTime, setCooldownEndTime] = useState(0);
  const [remainingCooldown, setRemainingCooldown] = useState(0);
  const { showToast } = useToast();

  // Synchronous route check (covers /admin and /admin/anything)
  const isAdminRoute = useMemo(
    () => pathname === "/admin" || pathname.startsWith("/admin/"),
    [pathname]
  );

  // Cooldown timer effect (no work on admin routes)
  useEffect(() => {
    if (isAdminRoute) return;

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
      }, 1000); // tick every second
    } else {
      setRemainingCooldown(0);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [cooldownEndTime, isAdminRoute]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Email sending helpers
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
        to: ["saeedhaider0000@gmail.com", `${SiteDetails.supportEmail}`],
        subject: `New Contact Request from ${formData.name}`,
        htmlTemplate: templateSnap.data().template,
        placeholders: {
          fullName: formData.name,
          emailAddress: formData.email,
          phoneNumber: "",
          subject: "Contact Form Submission",
          message: formData.message,
        },
      };

      const emailResponse = await fetch(
        process.env.NODE_ENV === "development"
          ? `http://localhost:3000/sendMail`
          : process.env.NODE_ENV === "production" &&
              "https://honhaarjawan.pk/sendMail",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(emailData),
        }
      );

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json();
        throw new Error(errorData.message || "Email sending failed");
      }

      const contactRequestData = {
        requestId: requestId,
        fullName: formData.name,
        emailAddress: formData.email,
        phoneNumber: "",
        subject: "Contact Form Submission",
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
          phoneNumber: "",
          subject: "Contact Form Submission",
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

  const handleContactSubmission = async (formData) => {
    const validationErrors = validateFormData(formData);
    if (validationErrors.length > 0) {
      showToast(`Validation Error: ${validationErrors[0]}`, "error");
      return false;
    }

    setIsLoading(true);
    try {
      const result = await processContactRequest(formData);
      if (result.success) {
        setCooldownEndTime(Date.now() + 60000); // 1 minute cooldown
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if in cooldown period
    if (Date.now() < cooldownEndTime) return;

    const success = await handleContactSubmission(formData);

    if (success) {
      setFormData({ name: "", email: "", message: "" });
      setIsModalOpen(false);
    }
  };

  const isCoolingDown = remainingCooldown > 0;

  // Hide entirely on admin routes (no flicker)
  if (isAdminRoute) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsModalOpen(true)}
        className="relative p-4 rounded-full bg-second animate-glow text-white shadow-lg hover:shadow-xl transition-all duration-300"
        disabled={isLoading}
      >
        <Mail className="w-6 h-6" />
        {/* Pulse Effect - Only when modal is closed */}
        {!isModalOpen && (
          <motion.span
            className="absolute inset-0 rounded-full bg-second2 opacity-70"
            transition={{ repeat: Infinity, duration: 2 }}
          />
        )}
      </motion.button>

      {/* Modal Backdrop */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 "
              onClick={() => !isLoading && setIsModalOpen(false)}
            />

            {/* Modal */}
            <motion.div className="absolute bottom-20 right-0 w-80 bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
              {/* Header */}
              <div className="bg-second p-4 text-white">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold">Contact Us</h2>
                  <button
                    onClick={() => !isLoading && setIsModalOpen(false)}
                    className="p-1 rounded-full hover:bg-white/20 transition-colors"
                    disabled={isLoading}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Tab Selector */}
                <div className="flex bg-white/20 rounded-lg">
                  <button
                    onClick={() => setActiveTab("email")}
                    className={`flex-1 flex items-center  rounded-l-xl justify-center py-2 text-sm font-medium transition-colors ${
                      activeTab === "email"
                        ? "bg-white text-primary"
                        : "bg-primary text-yellow-500"
                    }`}
                    disabled={isLoading}
                  >
                    <Mail className="w-4 h-4 mr-1" />
                    Email
                  </button>
                  <button
                    onClick={() => setActiveTab("contact")}
                    className={`flex-1 flex items-center  rounded-r-xl justify-center py-2 text-sm font-medium transition-colors ${
                      activeTab === "contact"
                        ? "bg-white text-black"
                        : "bg-primary text-yellow-500"
                    }`}
                    disabled={isLoading}
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Contact Info
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                {activeTab === "email" ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-second focus:border-transparent"
                          placeholder="Your name"
                          required
                          disabled={isLoading || isCoolingDown}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Email
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-second focus:border-transparent"
                          placeholder="your.email@example.com"
                          required
                          disabled={isLoading || isCoolingDown}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="message"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Message
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 pt-3 flex items-start pointer-events-none">
                          <MessageCircle className="h-5 w-5 text-gray-400" />
                        </div>
                        <textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-second focus:border-transparent"
                          placeholder="How can we help you?"
                          required
                          disabled={isLoading || isCoolingDown}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className={`w-full bg-second text-white py-2 px-4 rounded-md hover:from-primary hover:to-second transition-all flex items-center justify-center ${
                        isLoading || isCoolingDown
                          ? "opacity-75 cursor-not-allowed"
                          : ""
                      }`}
                      disabled={isLoading || isCoolingDown}
                    >
                      {isLoading ? (
                        <span className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Sending...
                        </span>
                      ) : isCoolingDown ? (
                        <span>Wait {remainingCooldown}s</span>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-4 py-2">
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <Mail className="w-5 h-5 text-second mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Email
                        </p>
                        <a
                          href={`mailto:${SiteDetails.supportEmail}`}
                          className="text-second hover:underline"
                        >
                          {SiteDetails.supportEmail}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <Phone className="w-5 h-5 text-second mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          UAN Helpline
                        </p>
                        <a
                          href={`mailto:${SiteDetails.supportEmail}`}
                          className="text-second hover:underline"
                        >
                          {SiteDetails.phoneNumber}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <FaWhatsapp className="w-5 h-5 text-second mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          WhatsApp Number
                        </p>
                        <a
                          href={`mailto:${SiteDetails.supportEmail}`}
                          className="text-second hover:underline"
                        >
                          {SiteDetails.whatsAppNumber}
                        </a>
                      </div>
                    </div>
                    <div className="text-center mt-6">
                      <p className="text-sm text-gray-500">
                        We typically respond to emails within 24 hours
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ContactModal;
