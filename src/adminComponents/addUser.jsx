// AddUser.jsx
import React, { useState, useEffect, useRef } from "react";
import Notify from "simple-notify";

// Helper to generate random data
const randomString = (length = 8) =>
  Math.random()
    .toString(36)
    .substring(2, 2 + length);

const randomEmail = () => `${randomString(5)}@mailinator.com`;

const randomDate = () => {
  const start = new Date(1980, 0, 1);
  const end = new Date();
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  )
    .toISOString()
    .split("T")[0];
};

const randomGender = () =>
  ["Male", "Female", "Other"][Math.floor(Math.random() * 3)];

const randomYesNo = () => (Math.random() > 0.5 ? "yes" : "no");

const AddUser = ({ onAddUser }) => {
  const [form, setForm] = useState({
    // Personal Information
    firstName: randomString(6),
    lastName: randomString(7),
    email: randomEmail(),
    mobile: Math.floor(10000000000 + Math.random() * 90000000000).toString(),
    dob: randomDate(),
    gender: randomGender(),
    programmingBackground: randomYesNo(),
    hasLaptop: randomYesNo(),

    // Address Information
    presentAddress: randomString(12),
    permanentAddress: randomString(12),

    // Identification
    cnic: Math.floor(1000000000000 + Math.random() * 9000000000000).toString(),

    // Account Credentials
    password: "Pa$$w0rd!",

    // Application Status
    applicationApproved: null,
    applicationSubmittedAt: new Date().toISOString(),
    applicationApprovedAt: null,
    approvalTime: "",

    // System Fields
    uid: randomString(28),
    userId: Math.floor(100000000 + Math.random() * 900000000),
    created_at: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    role: "student",
    status: 1,

    // Additional Fields
    address: "",
    applicant: "localPakistani",
    city: "",
    contactNo: "",
    country: "",
    education: "",
    fatherName: "",
    firstCourse: "",
    fullName: "",
    gettoknow: "",
    institute: "",
    province: "",
    qualification: "",
    rollno: "",
    hasExperience: "",
    instituteName: "",
    instituteType: "",
    markingType: "",
    obtainedFrom: "",
    obtainedMarks: "",
  });

  // Use useRef for the simple-notify instance
  const notifyRef = useRef(null);

  // Initialize simple-notify
  useEffect(() => {
    if (typeof window !== "undefined" && !notifyRef.current) {
      try {
        notifyRef.current = new Notify({
          status: "success",
          title: "Notification",
          text: "Message",
          effect: "slide",
          speed: 300,
          showIcon: true,
          autoclose: true,
          autotimeout: 3000,
          position: "right top",
          gap: 20,
          distance: 20,
        });
      } catch (e) {
        console.error("Failed to initialize Simple-notify:", e);
      }
    }

    return () => {
      if (
        notifyRef.current &&
        typeof notifyRef.current.destroy === "function"
      ) {
        notifyRef.current.destroy();
      }
    };
  }, []);

  // Function to show notifications
  const showNotification = (type, message, duration = 3000) => {
    if (notifyRef.current && typeof notifyRef.current.show === "function") {
      notifyRef.current.show({
        status: type,
        title: type.charAt(0).toUpperCase() + type.slice(1),
        text: message,
        autotimeout: duration,
      });
    } else {
      console.warn(`Notification (${type}): ${message}`);
    }
  };

  // Set fullName from firstName and lastName
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      fullName: `${prev.firstName} ${prev.lastName}`,
    }));
  }, [form.firstName, form.lastName]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onAddUser) {
      onAddUser(form);
      showNotification(
        "success",
        `User "${form.fullName}" added successfully!`,
        3000
      );
    } else {
      showNotification("error", "Add user function not provided.", 5000);
    }

    // Reset form with new random data
    setForm({
      // Personal Information
      firstName: randomString(6),
      lastName: randomString(7),
      email: randomEmail(),
      mobile: Math.floor(10000000000 + Math.random() * 90000000000).toString(),
      dob: randomDate(),
      gender: randomGender(),
      programmingBackground: randomYesNo(),
      hasLaptop: randomYesNo(),

      // Address Information
      presentAddress: randomString(12),
      permanentAddress: randomString(12),

      // Identification
      cnic: Math.floor(
        1000000000000 + Math.random() * 9000000000000
      ).toString(),

      // Account Credentials
      password: "Pa$$w0rd!",

      // Application Status
      applicationApproved: null,
      applicationSubmittedAt: new Date().toISOString(),
      applicationApprovedAt: null,
      approvalTime: "",

      // System Fields
      uid: randomString(28),
      userId: Math.floor(100000000 + Math.random() * 900000000),
      created_at: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      role: "student",
      status: 1,

      // Additional Fields
      address: "",
      applicant: "localPakistani",
      city: "",
      contactNo: "",
      country: "",
      education: "",
      fatherName: "",
      firstCourse: "",
      fullName: "",
      gettoknow: "",
      institute: "",
      province: "",
      qualification: "",
      rollno: "",
      hasExperience: "",
      instituteName: "",
      instituteType: "",
      markingType: "",
      obtainedFrom: "",
      obtainedMarks: "",
    });
  };

  return (
    <div className="p-4">
      <h3 className="text-xl font-semibold mb-4">Add New User</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-medium text-gray-700"
          >
            First Name
          </label>
          <input
            type="text"
            name="firstName"
            id="firstName"
            value={form.firstName}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-medium text-gray-700"
          >
            Last Name
          </label>
          <input
            type="text"
            name="lastName"
            id="lastName"
            value={form.lastName}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <input
            type="email"
            name="email"
            id="email"
            value={form.email}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Add User
        </button>
      </form>
    </div>
  );
};

export default AddUser;
