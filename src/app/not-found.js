"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiHome, FiArrowLeft } from "react-icons/fi";
import { useRouter } from "next/navigation";

const NotFound = () => {
  const [countdown, setCountdown] = useState(5);
  const router = useRouter();

  useEffect(() => {
    if (countdown === 0) {
      router.back();
      return;
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-md w-full"
      >
        {/* 404 Number */}
        <motion.div
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="mb-8"
        >
          <h1 className="text-9xl font-bold text-second">404</h1>
        </motion.div>

        {/* Message */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Page Not Found
          </h2>
          <p className="text-gray-600">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Countdown */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 bg-second rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">{countdown}</span>
            </div>
            <p className="text-gray-600">
              Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.back()}
            className="flex items-center justify-center gap-2 px-6 py-3 border border-second text-second rounded-lg font-medium hover:bg-second/5 transition-colors"
          >
            <FiArrowLeft className="text-lg" />
            Go Back
          </motion.button>
        </div>
      </motion.div>

      {/* Decorative Elements */}
      <div className="absolute bottom-8 text-center">
        <p className="text-gray-500 text-sm">
          Need help?{" "}
          <a 
            href="/contact" 
            className="text-second hover:underline font-medium"
          >
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
};

export default NotFound;