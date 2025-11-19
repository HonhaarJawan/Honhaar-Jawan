"use client"; // Remove the import keyword, it should be just this
import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

let showToastFunction = () => {};

let idCounter = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback(
    (message, type = "success", duration = 5000) => {
      const id = idCounter++;
      const toastDuration = duration || 5000;
      setToasts((prev) => [
        ...prev,
        { id, message, type, duration: toastDuration },
      ]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, toastDuration);
    },
    []
  );

  showToastFunction = showToast;

  return (
    <>
      {children}
      <div className="fixed top-4 right-4 flex flex-col gap-3 w-[320px] z-50">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              initial={{ x: 200 }}
              animate={{ x: 0 }}
              exit={{ x: 200 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              key={toast.id}
              className={`relative px-5 py-4 rounded-lg shadow-lg text-sm font-medium text-white overflow-hidden ${
                toast.type === "success"
                  ? "bg-gradient-to-r from-green-600 to-green-700"
                  : toast.type === "error"
                  ? "bg-gradient-to-r from-red-600 to-red-700"
                  : "bg-gradient-to-r from-blue-600 to-blue-700"
              }`}
            >
              {/* Subtle overlay for depth */}
              <div className="absolute inset-0 bg-black/10 pointer-events-none" />
              <div className="relative flex items-center gap-3">
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {toast.type === "success" ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : toast.type === "error" ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  )}
                </div>
                {/* Message */}
                <span className="flex-1">{toast.message}</span>
              </div>
              {/* Progress Bar */}
              <motion.div
                className="absolute bottom-0 left-0 h-1 bg-yellow-500"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: toast.duration / 1000, ease: "linear" }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
};

export const useToast = () => ({ showToast: showToastFunction });
