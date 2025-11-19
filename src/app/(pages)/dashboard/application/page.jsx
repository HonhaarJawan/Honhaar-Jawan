"use client";
import { firestore } from "@/Backend/Firebase";
import CustomDropdown from "@/components/CustomDropdown";
import InputField from "@/components/inputs/InputField";
import Header from "@/components/primary/Header";
import Navbar from "@/components/primary/Navbar";
import useAuthStore from "@/store/useAuthStore";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "@/components/primary/Footer";
import { useRouter } from "next/navigation";
import { courses } from "@/Data/Data";
import { FiBook } from "react-icons/fi";
import { registerUserInNewListAndRemoveFromOld } from "@/services/mailerUtils";
import { FaCheck } from "react-icons/fa";

const SubmitAdmissionApplication = () => {
  const { user, setUser } = useAuthStore();
  const router = useRouter();
  const [isSubmitted, setIsSubmitted] = useState(false);

  // If user.status >= 2 means already applied
  let alreadyApplied = false;
  setTimeout(() => {
    alreadyApplied = user?.status >= 2;
  }, 0);

  const [loading, setLoading] = useState(false);

  // Admission form data
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    cnic: user?.cnic || "",
    phone: user?.phoneNo || "",
    maritalStatus: "Single",
    gender: user?.gender || "Male",
    highestqualification: "",
    university_or_institute_name: "",
    fieldstudy: "Computer Science",
    have_a_device: true,
    have_a_internet_connection: true,
    permanentaddress: "",
    currentaddress: "",
    city: "Lahore",
    areyou_employed: "",
    job_title: "",
    organization_name: "",
    agree_with_terms_and_form_submission: false, // Renamed to match the condition
    selectedCourses: [],
  });

  const [isCoursesOpen, setIsCoursesOpen] = useState(false);

  // Toggle the course selection modal
  const handleToggleCourses = () => {
    setIsCoursesOpen((prev) => !prev);
  };

  // Handle course selection changes (max 3)
  const handleCoursesCheckboxChange = (courseValue) => {
    setFormData((prevData) => {
      const alreadySelected = prevData.selectedCourses.includes(courseValue);
      let updatedCourses;
      if (alreadySelected) {
        updatedCourses = prevData.selectedCourses.filter(
          (val) => val !== courseValue
        );
      } else {
        // Add only if we have less than 3
        if (prevData.selectedCourses.length >= 3) return prevData;
        updatedCourses = [...prevData.selectedCourses, courseValue];
      }

      return {
        ...prevData,
        selectedCourses: updatedCourses,
      };
    });
  };

  // Standard input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Checkbox changes
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  // Dropdown changes
  const handleDropdownChange = (name, selectedOption) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: selectedOption.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.selectedCourses.length === 0) {
      return alert("Please select at least one course...");
    }
    if (!formData.agree_with_terms_and_form_submission) {
      return alert("Please agree to the terms and conditions...");
    }

    setLoading(true);

    try {
      // Immediately redirect to dashboard

      // 1. Get user doc
      const usersRef = collection(firestore, "users");
      const q = query(usersRef, where("email", "==", user?.email));
      const userSnapshot = await getDocs(q);
      if (userSnapshot.empty) {
        console.error("User not found");
        return;
      }

      // 3. Update user doc
      const userDoc = userSnapshot.docs[0];
      const FNL = {
        status: 2,
        isTestPased: false,
        applicationData: { ...formData },
        selectedCourses: formData.selectedCourses,
      };
      const FNLLocal = {
        ...user,
        status: 2,
        isTestPased: false,
        applicationData: { ...formData },
        selectedCourses: formData.selectedCourses,
      };
      await updateDoc(userDoc.ref, FNL);
      setUser(FNLLocal);

      // 3) Register user in a new mailing list (and remove from old)
      const newListUid =
        process.env.NEXT_PUBLIC_EMAILING_ENTRY_TEST_REMINDER_LISTUID;
      const apiToken = process.env.NEXT_PUBLIC_EMAILING_APITOKEN;

      const mailerResult = await registerUserInNewListAndRemoveFromOld({
        email: FNLLocal.email,
        firstName: FNLLocal.firstName,
        lastName: FNLLocal.lastName,
        oldSubscriberUid: FNLLocal.subscriberId,
        newListUid,
        apiToken,
      });
      if (mailerResult.status === "success" && mailerResult.newSubscriberUid) {
        console.log(`Updating Firestore with new subscriber ID`);
        await updateDoc(userDoc.ref, {
          subscriberId: mailerResult.newSubscriberUid,
          lastUpdated: serverTimestamp(),
        });
      }
      router.push("/dashboard");
    } catch (error) {
      console.error("Error submitting application:", error);
    } finally {
      setLoading(false);
    }
  };

  // If user.status >= 2 => Already applied
  if (alreadyApplied && !isSubmitted) {
    return (
      <div className="min-h-screen center-flex flex-col gap-4">
        <h2 className="text-2xl font-semibold">
          Application Already Submitted
        </h2>
        <p>You have already submitted an admission application.</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="btn btn-md btn-primary"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <>
      <Header />
      <Navbar />
      <div className="w-full center-flex py-16 overflow-hidden relative">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-4xl center-flex flex-col text-center px-3"
        >
          <div className="w-full center-flex flex-col gap-1 mb-6">
            <h2 className="text-3xl font-semibold text-zinc-800">
              Submit Admission Application
            </h2>
            <p className="text-lg text-gray-600 mt-2">
              Welcome to Digi Naujwan! To begin your journey, please complete
              your admission application to access our digital courses.
            </p>
            <p className="text-lg text-gray-600 mt-2">
              Digi Naujwan کے کورسز میں شامل ہونے کے لیے درخواست فارم کو مکمل
              کریں اور ڈیجیٹل مہارتوں میں بہتری لائیں۔
            </p>
          </div>

          {/* Personal Information */}
          <div className="w-full flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
              <InputField
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
            <InputField
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="CNIC"
                name="cnic"
                value={formData.cnic}
                onChange={handleChange}
                required
              />
              <InputField
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
            <div className="w-full grid grid-cols-3 gap-4">
              <CustomDropdown
                label="Field of Study"
                options={[
                  { value: "Engineering", label: "Engineering" },
                  { value: "Business", label: "Business" },
                  { value: "Arts", label: "Arts" },
                  { value: "Science", label: "Science" },
                  { value: "Computer Science", label: "Computer Science" },
                  { value: "Medicine", label: "Medicine" },
                  { value: "Design", label: "Design" },
                  { value: "Law", label: "Law" },
                  { value: "Social Sciences", label: "Social Sciences" },
                  { value: "Humanities", label: "Humanities" },
                  { value: "Education", label: "Education" },
                  { value: "Other", label: "Other" },
                ]}
                selected={{
                  value: formData.fieldstudy,
                  label: formData.fieldstudy,
                }}
                onChange={(selectedOption) =>
                  handleDropdownChange("fieldstudy", selectedOption)
                }
                placeholder="Select Field of Study"
                className="w-full"
              />
              <CustomDropdown
                label="Marital Status"
                options={[
                  { value: "Single", label: "Single" },
                  { value: "Married", label: "Married" },
                ]}
                selected={{
                  value: formData.maritalStatus,
                  label: formData.maritalStatus,
                }}
                onChange={(selectedOption) =>
                  handleDropdownChange("maritalStatus", selectedOption)
                }
                placeholder="Marital Status"
                className="w-full"
              />
              <CustomDropdown
                label="Gender"
                options={[
                  { value: "Male", label: "Male" },
                  { value: "Female", label: "Female" },
                  { value: "Other", label: "Other" },
                ]}
                selected={{
                  value: formData.gender,
                  label: formData.gender,
                }}
                onChange={(selectedOption) =>
                  handleDropdownChange("gender", selectedOption)
                }
                placeholder="Choose Gender"
                className="w-full"
              />
            </div>
          </div>

          {/* Educational Information */}
          <div className="w-full flex flex-col gap-4 mt-8">
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Highest Qualification"
                name="highestqualification"
                value={formData.highestqualification}
                onChange={handleChange}
                required
              />
              <InputField
                label="University/Institute Name"
                name="university_or_institute_name"
                value={formData.university_or_institute_name}
                onChange={handleChange}
                required
              />
            </div>

            {/* Courses Selection Preview */}
            <div className="between-flex gap-2 border-2 border-zinc-400 rounded-xl">
              {formData.selectedCourses.length > 0 ? (
                <div className="flex flex-col items-start gap-1 p-5">
                  {courses
                    .filter((c) => formData.selectedCourses.includes(c.id))
                    .map((single, idx) => (
                      <div key={single.id} className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-second text-white rounded-md text-sm center-flex">
                          {idx + 1}
                        </div>
                        <p className="text-sm md:text-base text-zinc-700">
                          {single.name}
                        </p>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="flex flex-col items-start gap-4 px-5 py-2.5">
                  {/* Title Section */}
                  <div className="flex flex-col items-start gap-1">
                    <h1 className="text-sm md:text-base text-zinc-700 font-medium flex items-center gap-2">
                      <FiBook className="w-8 h-8 text-primary" />{" "}
                      {/* Icon for Courses */}
                      Select Your Preferred Courses
                    </h1>

                    <p className="text-xs md:text-sm text-zinc-600">
                      Choose your preferred courses based on your goals.
                    </p>
                    <p className="text-sm md:text-base font-semibold text-zinc-600 mt-2">
                      براہ کرم اپنے پسندیدہ کورسز منتخب کریں۔
                    </p>
                  </div>
                </div>
              )}
              <div
                onClick={handleToggleCourses}
                className="flex flex-col items-end gap-2 border-l-2 border-zinc-400 p-5 cursor-pointer"
              >
                <p className="text-sm text-zinc-500 mt-1">
                  {formData.selectedCourses.length}/3 courses selected
                </p>
                <button type="button" className="btn btn-md btn-primary">
                  Select Courses
                </button>
              </div>
            </div>
          </div>

          {/* Device & Internet */}
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="border-2 border-zinc-400 rounded-xl py-2.5 px-4 center-flex gap-2 text-sm md:text-base">
              <input
                name="have_a_device"
                checked={formData.have_a_device}
                onChange={handleCheckboxChange}
                type="checkbox"
                className="w-6 h-6 checkbox checkbox-bg-primary"
              />
              <label htmlFor="have_a_device">
                Do You Have a Reliable Device?
              </label>
            </div>
            <div className="border-2 border-zinc-400 rounded-xl py-2.5 px-4 center-flex gap-2 text-sm md:text-base">
              <input
                name="have_a_internet_connection"
                checked={formData.have_a_internet_connection}
                onChange={handleCheckboxChange}
                type="checkbox"
                className="w-6 h-6 checkbox checkbox-bg-primary"
              />
              <label htmlFor="have_a_internet_connection">
                Do You Have a Reliable Internet Connection?
              </label>
            </div>
          </div>

          {/* Address Info */}
          <div className="w-full flex flex-col gap-4 mt-8">
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Permanent Address"
                name="permanentaddress"
                value={formData.permanentaddress}
                onChange={handleChange}
                required
              />
              <InputField
                label="Current Address"
                name="currentaddress"
                value={formData.currentaddress}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <CustomDropdown
                label="Select Your City"
                options={[
                  { value: "Karachi", label: "Karachi" },
                  { value: "Lahore", label: "Lahore" },
                  { value: "Islamabad", label: "Islamabad" },
                  { value: "Rawalpindi", label: "Rawalpindi" },
                  { value: "Peshawar", label: "Peshawar" },
                  { value: "Quetta", label: "Quetta" },
                  { value: "Multan", label: "Multan" },
                  { value: "Faisalabad", label: "Faisalabad" },
                  { value: "Sialkot", label: "Sialkot" },
                  { value: "Gujranwala", label: "Gujranwala" },
                  { value: "Bahawalpur", label: "Bahawalpur" },
                  { value: "Sukkur", label: "Sukkur" },
                  { value: "Muzaffarabad", label: "Muzaffarabad" },
                  { value: "Gilgit", label: "Gilgit" },
                  { value: "Mardan", label: "Mardan" },
                  { value: "Hyderabad", label: "Hyderabad" },
                  { value: "Chiniot", label: "Chiniot" },
                  { value: "Dera Ghazi Khan", label: "Dera Ghazi Khan" },
                  { value: "Mirpur Khas", label: "Mirpur Khas" },
                  { value: "Larkana", label: "Larkana" },
                ]}
                selected={{
                  value: formData.city,
                  label: formData.city,
                }}
                onChange={(selectedOption) =>
                  handleDropdownChange("city", selectedOption)
                }
                className="w-full"
              />
              <CustomDropdown
                label="Are you employed?"
                options={[
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                ]}
                selected={{
                  value: formData.areyou_employed,
                  label: formData.areyou_employed || "Select employment status",
                }}
                onChange={(selectedOption) =>
                  handleDropdownChange("areyou_employed", selectedOption)
                }
                className="w-full"
              />
            </div>
          </div>

          {/* Employment Information */}
          <div className="w-full max-w-xl mt-8">
            {formData.areyou_employed === "yes" && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <InputField
                  label="Job Title"
                  name="job_title"
                  value={formData.job_title}
                  onChange={handleChange}
                  required
                />
                <InputField
                  label="Organization Name"
                  name="organization_name"
                  value={formData.organization_name}
                  onChange={handleChange}
                  required
                />
              </div>
            )}
          </div>

          {/* Terms & Conditions */}
          <div className="mt-5 w-full max-w-md">
            <div className="center-flex gap-2 border border-second rounded-xl p-3">
              <input
                type="checkbox"
                id="agree_with_terms_and_form_submission"
                name="agree_with_terms_and_form_submission"
                checked={formData.agree_with_terms_and_form_submission}
                onChange={handleCheckboxChange}
                required
                className="checkbox w-5 h-5 checkbox-bg-primary"
              />
              <label
                htmlFor="agree_with_terms_and_form_submission"
                className="text-sm md:text-base"
              >
                I agree with the Terms and Conditions
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" className="btn btn-md btn-primary mt-8">
            {loading ? "Submitting..." : "Submit Application"}
          </button>
        </form>

        {loading && (
          <div className="absolute z-50 top-0 w-full h-full bg-white/60 flex items-center justify-center">
            <div className="text-center">
              <p className="text-xl font-semibold">Please wait...</p>
            </div>
          </div>
        )}
      </div>
      <Footer />

      {/* Courses Modal */}
      <AnimatePresence>
        {isCoursesOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={handleToggleCourses}
          >
            <div
              className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-primary to-second p-6">
                <div
                  className="text-center"
                >
                  <h2 className="text-2xl font-bold text-white">
                    Select Your Courses
                  </h2>
                  <p className="text-white/90 mt-2">
                    Choose up to 3 courses to enroll in
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={handleToggleCourses}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Close modal"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              {/* Courses List */}
              <div
                className="p-6 overflow-y-auto"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {courses.map((course, idx) => {
                    const isSelected = formData.selectedCourses.includes(
                      course.id
                    );
                    const isDisabled =
                      formData.selectedCourses.length >= 3 && !isSelected;

                    return (
                      <div
                        key={course.id}
                        whileHover={
                          !isDisabled
                            ? {
                                y: -2,
                                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                              }
                            : {}
                        }
                        className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${
                          isSelected
                            ? "border-primary bg-primary/10"
                            : "border-gray-200 hover:border-primary/50"
                        } ${
                          isDisabled
                            ? "opacity-60 cursor-not-allowed grayscale-[30%]"
                            : ""
                        }`}
                        onClick={() =>
                          !isDisabled && handleCoursesCheckboxChange(course.id)
                        }
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-1 checkbox w-6 h-6 checkbox-bg-primary center-flex ${
                              isSelected
                                ? "bg-primary border-primary"
                                : "bg-white border-gray-300"
                            }`}
                          >
                            {isSelected && <FaCheck className="text-white" />}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">
                              {course.name}
                            </h3>
                            {course.description && (
                              <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                                {course.description}
                              </p>
                            )}
                          </div>
                        </div>
                        {isDisabled && (
                          <div className="absolute inset-0 bg-white/50 rounded-xl" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer with Action Buttons */}
              <div
                className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end gap-3"
              >
                <button
                  onClick={handleToggleCourses}
                  className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors shadow-sm"
                  disabled={formData.selectedCourses.length === 0}
                >
                  Save Selection
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SubmitAdmissionApplication;
