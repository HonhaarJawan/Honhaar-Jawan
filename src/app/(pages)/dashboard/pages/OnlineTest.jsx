"use client";
import React, { useState } from "react";
import {
  FaArrowRight,
  FaBook,
  FaCheck,
  FaClock,
  FaFileAlt,
  FaInfoCircle,
  FaUser,
  FaGraduationCap,
  FaTrophy,
  FaXbox,
} from "react-icons/fa";
import Navbar from "@/components/primary/Navbar";
import { questions } from "@/Data/Questions";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { firestore } from "@/Backend/Firebase";
import useAuthStore from "@/store/useAuthStore";
import Cookies from "js-cookie";
import Copyright from "@/components/primary/Copyright";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ImSpinner } from "react-icons/im";
import { FaSquareXmark } from "react-icons/fa6";
import SiteDetails from "@/Data/SiteData";

const OnlineTest = () => {
  const [testStarted, setTestStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [testCompleted, setTestCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showIncorrect, setShowIncorrect] = useState(false);
  const [loading, setLoading] = useState(null);
  const router = useRouter();
  const { user, updateUser } = useAuthStore((state) => state);

  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const startTest = () => {
    const questionsWithShuffledOptions = shuffleArray(questions).map((q) => ({
      ...q,
      shuffledOptions: shuffleArray(q.options),
    }));

    setShuffledQuestions(questionsWithShuffledOptions);
    setTestStarted(true);
    setUserAnswers(Array(questionsWithShuffledOptions.length).fill(null));
  };

  const handleOptionSelect = (option) => {
    if (!isAnswerChecked) {
      setSelectedOption(option);
    }
  };

  const handleCheckAnswer = () => {
    if (!selectedOption) return;

    const currentQuestion = shuffledQuestions[currentQuestionIndex];
    const correct = selectedOption === currentQuestion.correct;

    setIsCorrect(correct);
    setIsAnswerChecked(true);

    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = correct;
    setUserAnswers(newAnswers);

    // Show celebration for correct answers
    if (correct) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 1500);
    } else {
      // Show incorrect popup for wrong answers
      setShowIncorrect(true);
      setTimeout(() => setShowIncorrect(false), 1500);
    }
  };

  const replacePlaceholders = (template, placeholders) => {
    if (!template) return "";
    const data =
      typeof placeholders === "object" && placeholders !== null
        ? placeholders
        : {};
    return template.replace(/\{([^}]*)\}|\${(.*?)}/g, (match, key1, key2) => {
      const key = key1 ? key1.trim() : key2.trim();
      return data[key] || "";
    });
  };

  const SendFailed_or_Pass_email_via_Pabbly = async (percentage, user) => {
    try {
      console.log(percentage);
      const testMarks = `${percentage.toFixed(1)}%`;
      const testpass = doc(firestore, "email_templates", "test_passed");
      const testfail = doc(firestore, "email_templates", "test_failed");
      const passedSnap = await getDoc(testpass);
      const failedSnap = await getDoc(testfail);

      // Determine which template and subject to use based on percentage
      const templateData =
        percentage >= 40
          ? passedSnap.data().template
          : failedSnap.data().template;

      const template = replacePlaceholders(templateData, {
        testMarks: percentage,
      });

      const addListId =
        percentage >= 40
          ? process.env.NEXT_PUBLIC_PABBLY_FEE_REMINDER_LIST_ID
          : process.env.NEXT_PUBLIC_PABBLY_ALL_USERS_LIST_ID;
      const removeListId = process.env.NEXT_PUBLIC_PABBLY_ENTRY_TEST_LIST_ID;
      const subject =
        percentage >= 40
          ? "Congratulations! You've Passed the Honhaar Jawan Admission Test"
          : "Honhaar Jawan Admission Test Result – Unsuccessful Attempt";

      // Step 1: Send all data (for email and list management) to Pabbly
      console.log("Sending data to Pabbly for email and list management...");
      const pabblyResponse = await fetch("/api/pabbly-connect/test-fail-pass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // --- Data for List Management ---
          user: user,
          addListId: addListId,
          removeListId: removeListId,
          subject: subject,
          htmlTemplate: template,
          testMarks: testMarks,
        }),
      });

      if (!pabblyResponse.ok) {
        // Optional: Get more error details from the response body
        const errorBody = await pabblyResponse.text();
        throw new Error(
          `Pabbly API request failed: ${pabblyResponse.status} ${errorBody}`
        );
      }

      console.log("Successfully sent data to Pabbly.");
    } catch (error) {
      console.error("Failed to process with Pabbly:", error);
    }
  };

  const updateUserTestResult = async (percentage) => {
    if (!user) return;

    try {
      const userRef = doc(firestore, "users", user.email);
      await updateDoc(userRef, {
        OnlineTestPercentage: percentage,
        status: percentage >= 40 ? 4 : 3,
      });

      updateUser({ OnlineTestPercentage: percentage });
      Cookies.set(
        "userlogged",
        JSON.stringify({ ...user, OnlineTestPercentage: percentage }),
        {
          expires: 7,
          path: "/",
        }
      );
    } catch (error) {
      console.error("Error updating user document: ", error);
      throw error;
    }
  };

  const handleContinue = async () => {
    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerChecked(false);
      setIsCorrect(null);
    } else {
      const correctAnswers = userAnswers.filter(Boolean).length;
      const percentage = (correctAnswers / shuffledQuestions.length) * 100;

      setScore(percentage);

      setUpdating(true);
      try {
        await updateUserTestResult(percentage);
        await SendFailed_or_Pass_email_via_Pabbly(percentage, user);

        setTestCompleted(true);
      } catch (error) {
        console.error("Error completing test:", error);
        setUpdateError(error.message);
      } finally {
        setUpdating(false);
      }
    }
  };

  if (updating) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-primary/10 to-second/10">
        <Navbar />
        <div className="flex flex-1 justify-center items-center">
          <div className="text-center bg-white p-8 rounded-xl shadow-lg">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-700 text-lg font-semibold">
              Processing your results...
            </p>
            <p className="text-gray-500 mt-2">This may take a few moments</p>
          </div>
        </div>
      </div>
    );
  }

  if (updateError) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-primary/10 to-second/10">
        <Navbar />
        <div className="flex flex-1 justify-center items-center px-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-5 rounded-lg max-w-md w-full">
            <h3 className="font-bold mb-3 text-lg">Error Processing Results</h3>
            <p className="mb-4">{updateError}</p>
            <button
              onClick={() => {
                const percentage =
                  (userAnswers.filter(Boolean).length /
                    shuffledQuestions.length) *
                  100;
                handleContinue();
              }}
              className="w-full group relative overflow-hidden rounded-lg bg-primary text-white p-4 shadow-md hover:bg-second transform hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="flex flex-col items-center">
                <span className="font-medium text-white">Retry</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (testCompleted) {
    return null;
  }

  return (
    <>
      <Navbar />

      <div className="flex flex-col pt-5 w-full min-h-screen bg-gradient-to-br from-primary/10 to-second/10">
        <AnimatePresence>
          {showCelebration && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="text-6xl mx-auto text-yellow-500 mb-4"
                >
                  ✨
                </motion.div>
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-2xl font-bold text-primary bg-white/90 px-4 py-2 rounded-full"
                >
                  Correct! Well done!
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showIncorrect && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className=""
                >
                  <FaSquareXmark className=" mx-auto text-6xl" />
                </motion.div>
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-2xl font-bold text-primary bg-white/90 px-4 py-2 rounded-full"
                >
                  Incorrect Answer!
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 max-w-7xl w-full mx-auto px-6">
          {!testStarted ? (
            <div className="w-full">
              {/* Header Section */}
              <div className="bg-second text-white p-8 rounded-xl shadow-lg mb-10 relative overflow-hidden">
                <div className="absolute top-4 right-4 opacity-20">
                  <FaGraduationCap size={120} />
                </div>
                <div className="absolute bottom-4 left-4 opacity-20">
                  <FaTrophy size={100} />
                </div>
                <h1 className="text-4xl font-bold mb-4 relative z-10">
                  Honhaar Jawan Admission Test
                </h1>
                <p className="text-lg mb-6 relative z-10">
                  Take the first step towards your future career with{" "}
                  {SiteDetails.programName}
                </p>
              </div>

              {/* Progress Steps */}
              <div className="flex flex-col md:flex-row gap-6 mb-12">
                <div className="bg-white rounded-xl p-6 shadow-lg flex-1 flex items-center justify-between border-l-4 border-green-500">
                  <div className="flex items-center gap-4">
                    <div className="bg-green-100 p-3 rounded-full">
                      <FaUser className="text-green-600 text-xl" />
                    </div>
                    <div>
                      <h3 className="font-bold text-green-700">
                        Step 1: Complete
                      </h3>
                      <p className="text-green-600 text-sm">Student Signup</p>
                    </div>
                  </div>
                  <div className="bg-green-500 text-white p-2 rounded-full">
                    <FaCheck className="text-sm" />
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-lg flex-1 flex items-center justify-between border-l-4 border-second">
                  <div className="flex items-center gap-4">
                    <div className="bg-second/20 p-3 rounded-full">
                      <FaBook className="text-second text-xl" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">
                        Step 2: Current
                      </h3>
                      <p className="text-gray-600 text-sm">Admissions Test</p>
                    </div>
                  </div>
                  <div className="bg-second text-white p-2 rounded-full">
                    <FaClock className="text-sm" />
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-lg flex-1 flex items-center justify-between border-l-4 border-gray-300">
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-200 p-3 rounded-full">
                      <FaFileAlt className="text-gray-500 text-xl" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-500">
                        Step 3: Upcoming
                      </h3>
                      <p className="text-gray-400 text-sm">
                        Enrollment Confirmation
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-300 text-gray-600 p-2 rounded-full">
                    <span className="text-sm">3</span>
                  </div>
                </div>
              </div>

              {/* Test Introduction */}
              <div className="bg-white rounded-xl shadow-lg p-8 mb-8 relative overflow-hidden">
                <div className="relative z-10">
                  <h1 className="text-3xl font-bold text-gray-800 mb-4">
                    Start Your{" "}
                    <span className="text-primary">Admission Test!</span>
                  </h1>
                  <p className="text-gray-600 mb-6 text-lg">
                    Thank you for signing up! Now, proceed to attempt your
                    admission test and take the next step towards securing your
                    place in our program. Please make sure to read the test
                    instructions carefully before you begin.
                  </p>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                    <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2 text-lg">
                      <FaInfoCircle /> Important Instructions
                    </h3>
                    <ul className="text-blue-700 text-sm list-disc pl-5 space-y-2">
                      <li>
                        This test consists of {questions.length} multiple-choice
                        questions
                      </li>
                      <li>
                        You need to score at least 40% to pass the admission
                        test
                      </li>
                      <li>Take your time and read each question carefully</li>
                      <li>
                        You cannot go back to previous questions once answered
                      </li>
                      <li>Each question has only one correct answer</li>
                    </ul>
                  </div>

                  <button
                    onClick={startTest}
                    className="px-8 py-4 group relative overflow-hidden rounded-lg bg-second text-white p-4 shadow-md hover:bg-second transform hover:-translate-y-0.5 transition-all duration-300 font-semibold flex items-center gap-2 text-lg mx-auto"
                  >
                    <div className="flex flex-col items-center">
                      <span className="font-medium flex items-center gap-2 text-white">
                        <FaArrowRight /> Start Admission Test
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full">
              {/* Test Header */}
              <div className="bg-second text-white rounded-xl p-6 mb-6 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>

                <div className="relative z-10">
                  <h1 className="text-2xl font-bold mb-2">
                    {SiteDetails.programName} Admission Test
                  </h1>
                  <div className="bg-white/20 p-4 rounded-lg">
                    <p className="text-sm">
                      Select the correct option and click "Check" to verify your
                      answer. Once checked, click "Continue" to proceed to the
                      next question.
                    </p>
                  </div>
                </div>
              </div>

              {/* Question Card */}
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 bg-primary text-white px-2 py-1 rounded-full text-xs font-bold z-10">
                  Online Test
                </div>

                <div className="relative z-10 mt-4">
                  <div className="flex items-center gap-2 text-second mb-4">
                    <span className="bg-second/10 px-3 py-1 rounded-full text-sm font-medium">
                      Question {currentQuestionIndex + 1}
                    </span>
                  </div>

                  <h2 className="text-xl font-semibold text-gray-800 mb-6">
                    {shuffledQuestions[currentQuestionIndex]?.question}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                    {shuffledQuestions[
                      currentQuestionIndex
                    ]?.shuffledOptions.map((option, index) => (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`p-4 rounded-xl border-2 transition-all text-left flex items-start gap-3 ${
                          selectedOption === option
                            ? "bg-primary text-white border-primary shadow-lg"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:border-second"
                        }`}
                        onClick={() => handleOptionSelect(option)}
                      >
                        <span
                          className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                            selectedOption === option
                              ? "bg-white/20 text-white"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span>{option}</span>
                      </motion.button>
                    ))}
                  </div>

                  {/* Feedback */}
                  {isAnswerChecked && (
                    <AnimatePresence>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-xl text-center font-semibold mb-6 ${
                          isCorrect
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : "bg-red-100 text-red-700 border border-red-200"
                        }`}
                      >
                        {isCorrect ? (
                          <div className="flex items-center justify-center gap-2">
                            <FaCheck className="text-green-600" />
                            <span>Correct! Well done.</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <span>Incorrect. The right answer is: </span>
                            <span className="font-bold">
                              {shuffledQuestions[currentQuestionIndex]?.correct}
                            </span>
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end">
                    {selectedOption && (
                      <button
                        onClick={
                          isAnswerChecked ? handleContinue : handleCheckAnswer
                        }
                        className="px-8 py-3 group relative overflow-hidden rounded-lg bg-second text-white p-4 shadow-md hover:bg-second transform hover:-translate-y-0.5 transition-all duration-300 font-semibold flex items-center gap-2"
                      >
                        <div className="flex flex-col items-center">
                          {isAnswerChecked ? (
                            <span className="font-medium flex items-center gap-2 text-white">
                              Continue <FaArrowRight />
                            </span>
                          ) : (
                            <span className="font-medium text-white">
                              Check Answer
                            </span>
                          )}
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      <Copyright />
    </>
  );
};

export default OnlineTest;
