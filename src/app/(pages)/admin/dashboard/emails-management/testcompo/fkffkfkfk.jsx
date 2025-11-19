// AutoUserCreator.jsx
"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { courses } from "@/Data/Data";
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  increment,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { firestore, auth } from "@/Backend/Firebase";

const AutoUserCreator = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [userCredentials, setUserCredentials] = useState({
    email: "",
    password: "",
  });

  // Function to generate random data
  const generateRandomData = () => {
    // Helper function to generate random digits of specified length
    const randomDigits = (length = 4) => {
      let result = "";    
      for (let i = 0; i < length; i++) {
        result += Math.floor(Math.random() * 10);
      }
      return result;
    };
    const randomYear = () => 2015 + Math.floor(Math.random() * 8);
    const randomDate = () => {
      const year = 1990 + Math.floor(Math.random() * 25);
      const month = 1 + Math.floor(Math.random() * 12);
      const day = 1 + Math.floor(Math.random() * 28);
      return `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    };

    return {
      fullName: "saeedhaider",
      fatherName: "Haider Ali",
      cnic: `3${randomDigits()}${randomDigits()}${randomDigits()}${randomDigits()}`,
      email: "saeedhaider0000@gmail.com",
      mobile: `03${randomDigits()}${randomDigits()}${randomDigits()}`,
      dob: randomDate(),
      maritalStatus: Math.random() > 0.5 ? "Single" : "Married",
      gender: Math.random() > 0.5 ? "Male" : "Female",
      highestQualification: ["Matric", "Intermediate", "Bachelor", "Master"][
        Math.floor(Math.random() * 4)
      ],
      institute: "University of Punjab",
      fieldOfStudy: "Computer Science",
      yearOfCompletion: randomYear(),
      selectedCourses: [courses[Math.floor(Math.random() * courses.length)]],
      internetAvailability: "Yes",
      currentAddress: "123 Main Street, Lahore",
      city: "Lahore",
      employed: Math.random() > 0.5 ? "Yes" : "No",
      declaration: true,
      applicationApproved: null,
      applicationSubmittedAt: null,
      applicationApprovedAt: null,
      approvalTime: "",
      created_at: null,
      address: "123 Main Street, Lahore",
      applicant: "localPakistani",
      contactNo: `03${randomDigits()}${randomDigits()}${randomDigits()}`,
      country: "Pakistan",
      education: "Bachelor",
      gettoknow: "Social Media",
      province: "Punjab",
      qualification: "Bachelor",
      rollno: `FA${randomDigits()}${randomDigits()}`,
    };
  };

  // Password generator (same as in original file)
  const generatePassword = () => {
    const digits = "0123456789";
    let result = "honhaar";
    for (let i = 0; i < 6; i++) {
      result += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    return result;
  };

  // Function to update total users count
  const updateTotalUsersCount = async () => {
    try {
      const statsRef = doc(firestore, "overallstats", "overallstats");
      await setDoc(
        statsRef,
        {
          totalUsers: increment(1),
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Error updating total users count:", error);
    }
  };

  // Function to send user data to Pabbly Connect
  const sendUserDataToPabbly = async (userData, password) => {
    try {
      // Generate archive date (60 days from now)
      const archiveDate = new Date();
      archiveDate.setDate(archiveDate.getDate() + 60);

      // Format as "Month, Day Year" (e.g., "November, 7 2025")
      const formattedArchiveDate = archiveDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      // Send request to Pabbly Connect
      fetch("/api/pabbly-connect/archive-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: {
            ...userData,
            password,
          },
          archiveDate: formattedArchiveDate,
        }),
      }).catch((error) => {
        console.error("Error sending data to Pabbly:", error);
      });
    } catch (error) {
      console.error("Error in sendUserDataToPabbly:", error);
    }
  };

  // Auto-create user function
  const handleAutoCreateUser = async () => {
    setLoading(true);
    setMessage("Creating user with auto-generated data...");

    try {
      // Generate random form data
      const formData = generateRandomData();

      // Check if email/cnic already exist
      const usersRef = collection(firestore, "users");
      const [emailSnapshot, cnicSnapshot] = await Promise.all([
        getDocs(query(usersRef, where("email", "==", formData.email))),
        getDocs(query(usersRef, where("cnic", "==", formData.cnic))),
      ]);

      if (!emailSnapshot.empty) {
        setMessage("Email already exists. Trying with different data...");
        // Generate new data and try again
        return handleAutoCreateUser();
      }
      if (!cnicSnapshot.empty) {
        setMessage("CNIC already exists. Trying with different data...");
        // Generate new data and try again
        return handleAutoCreateUser();
      }

      // Split fullName safely
      const nameParts = formData.fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

      // Generate random password and form number
      const generatedPassword = generatePassword();
      const formNo = Math.floor(100000 + Math.random() * 900000);

      // Format registration date
      const now = new Date();
      const options = {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      };
      const registrationDate = now.toLocaleDateString("en-US", options);

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        generatedPassword
      );

      // Prepare selected courses
      const selectedCourseObjects = formData.selectedCourses.map((course) => ({
        id: course.id,
        lmsCourseId: course.lmsCourseId,
        name: course.name,
      }));

      // Create user data for Firestore
      const userData = {
        uid: userCredential.user.uid,
        ...formData,
        firstName,
        lastName,
        password: generatedPassword,
        status: 1,
        created_at: serverTimestamp(),
        applicationSubmittedAt: serverTimestamp(),
        applicationApprovedAt: null,
        applicationApproved: false,
        selectedCourses: selectedCourseObjects,
        lastLogin: serverTimestamp(),
        role: "student",
        formNo,
        registrationDate,
      };

      // Clean undefined values
      Object.keys(userData).forEach((key) => {
        if (userData[key] === undefined) {
          userData[key] = null;
        }
      });

      // Save to Firestore
      const userRef = doc(firestore, "users", formData.email);
      await setDoc(userRef, userData);

      // Fire-and-forget: total count update & Pabbly Connect
      updateTotalUsersCount().catch(() => {});
      sendUserDataToPabbly(userData, generatedPassword).catch(() => {});

      // Set user credentials for display
      setUserCredentials({
        email: formData.email,
        password: generatedPassword,
      });

      setMessage("User created successfully!");
    } catch (err) {
      console.error("Auto-creation error:", err);
      setMessage(
        `Error: ${err?.message || "Something went wrong. Please try again."}`
      );
    } finally {
      setLoading(false);
    }
  };

  // Function to open login page in new tab
  const openLoginPage = () => {
    window.open("/login", "_blank");
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
        <button
          onClick={handleAutoCreateUser}
          disabled={loading}
          className={`bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ${
            loading ? "opacity-75 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Creating User..." : "Auto-Create Test User"}
        </button>

        {message && (
          <div className="mt-3 p-2 bg-gray-100 rounded text-sm text-gray-700 max-w-xs">
            {message}
          </div>
        )}

        {userCredentials.email && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <h4 className="font-bold text-blue-800 mb-2">User Credentials:</h4>
            <div className="text-sm">
              <div className="mb-1">
                <span className="font-semibold">Email:</span>
                <span className="ml-2 font-mono text-xs bg-white p-1 rounded">
                  {userCredentials.email}
                </span>
              </div>
              <div className="mb-2">
                <span className="font-semibold">Password:</span>
                <span className="ml-2 font-mono text-xs bg-white p-1 rounded">
                  {userCredentials.password}
                </span>
              </div>
              <button
                onClick={openLoginPage}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded transition-all duration-300"
              >
                Open Login Page
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutoUserCreator;
