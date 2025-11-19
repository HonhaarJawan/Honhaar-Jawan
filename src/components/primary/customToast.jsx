"use client"
import React, { useEffect } from "react";
import { FaCircleInfo } from "react-icons/fa6";
import { HiMiniShieldExclamation } from "react-icons/hi2";
import { IoMdCheckmark } from "react-icons/io";
import { PiShieldWarningFill } from "react-icons/pi";

const CustomToast = ({ message, type = "info", duration = 5000, onClose }) => {
  useEffect(() => {
    // Only set the timer if the toast is visible
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]); // Remove `message` from dependencies to prevent resetting the timer on message change

  return (
    <div className="fixed top-2 right-2 my-2 mr-2 z-[50000] w-full max-w-xs">
      <div
        className={`p-3 text-white ${
          type === "success"
            ? "bg-green-500 bg-opacity-60"
            : type === "error"
            ? "bg-red-500 bg-opacity-60"
            : type === "warning"
            ? "bg-yellow-500 bg-opacity-60"
            : "bg-blue-500 bg-opacity-60"
        }`}
      >
        <div className="flex items-center">
          <div className="mr-2">
            {type === "success" && <IoMdCheckmark size={20} />}
            {type === "error" && <HiMiniShieldExclamation size={20} />}
            {type === "warning" && <PiShieldWarningFill size={20} />}
            {type === "info" && <FaCircleInfo size={20} />}
          </div>
          <span className="font-normal text-sm">{message}</span>
        </div>
      </div>
    </div>
  );
};

export default CustomToast;