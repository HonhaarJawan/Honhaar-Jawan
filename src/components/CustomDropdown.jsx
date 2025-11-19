"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown } from "react-icons/fi";

const CustomDropdown = ({
  options,
  selected,
  onChange,
  placeholder = "Select an option",
  className = "",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      <button
        type="button"
        className={`flex items-center justify-between w-full p-4 text-left border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary transition ${
          disabled ? "bg-gray-100 cursor-not-allowed opacity-75" : "bg-white"
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span
          className={`truncate ${selected ? "text-gray-800" : "text-gray-400"}`}
        >
          {selected ? selected.label : placeholder}
        </span>
        <FiChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
            isOpen ? "transform rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            className="absolute z-10 w-full mt-1 overflow-auto bg-white border border-gray-200 rounded-md shadow-lg max-h-60 focus:outline-none"
          >
            {options.map((option) => (
              <motion.li
                key={option.id} // IMPORTANT: Added unique key here
                whileHover={{ backgroundColor: "#f0f7ff" }}
                className={`px-4 py-2 cursor-pointer select-none ${
                  selected?.id === option.id
                    ? "bg-primary text-white"
                    : "text-gray-700 hover:bg-blue-50"
                }`}
                onClick={() => handleSelect(option)}
              >
                {option.label}
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomDropdown;
