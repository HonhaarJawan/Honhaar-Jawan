"use client";

import { useEffect, useState } from "react";
import { getAuth, sendEmailVerification } from "firebase/auth";
import { firestore, auth } from "@/Backend/Firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import Link from "next/link";
import useAuthStore from "@/store/useAuthStore";
import Navbar from "@/components/primary/Navbar";
import Header from "@/components/primary/Header";
import { FiMail, FiCheckCircle, FiClock, FiAlertCircle, FiArrowRight } from "react-icons/fi";

// Cooldown durations in milliseconds
const EMAIL_RESEND_COOLDOWN = 60000; // 1 minute
const VERIFICATION_CHECK_COOLDOWN = 15000; // 15 seconds

const VerifyEmailComponent = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [emailSent, setEmailSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [checkCooldown, setCheckCooldown] = useState(0);
  const { user, setUser } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1); // For multi-step guidance

  useEffect(() => {
    if (!user?.email) return;

    // Set up real-time listener for user document
    const usersRef = collection(firestore, 'users');
    const userQuery = query(usersRef, where('email', '==', user.email));
    
    const unsubscribe = onSnapshot(userQuery, (querySnapshot) => {
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        if (userData.isEmailVerified) {
          handleVerificationSuccess(userData);
        }
      }
    });

    // Initial check
    checkVerificationStatus();

    const resendTimer = setInterval(() => {
      if (resendCooldown > 0) {
        setResendCooldown((prev) => prev - 1);
      }
    }, 0);

    const checkTimer = setInterval(() => {
      if (checkCooldown > 0) {
        setCheckCooldown((prev) => prev - 1);
      }
    }, 0);

    return () => {
      unsubscribe();
      clearInterval(resendTimer);
      clearInterval(checkTimer);
    };
  }, [user?.email, resendCooldown, checkCooldown]);

  const handleVerificationSuccess = (userData) => {
    setUser({ ...userData, emailVerified: true });
    setIsVerified(true);
    setCurrentStep(4); // Move to verified step
  };

  const checkVerificationStatus = async () => {
    try {
      await auth.currentUser?.reload(); // Refresh auth state
      const authVerified = auth.currentUser?.emailVerified;
      
      if (authVerified) {
        handleVerificationSuccess(user);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Verification check error:", err);
      setError("Failed to check verification status. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const sendVerificationEmail = async () => {
    if (resendCooldown > 0) return;
    
    setLoading(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setEmailSent(true);
      setResendCooldown(EMAIL_RESEND_COOLDOWN / 1000);
      setError(null);
      setCurrentStep(2); // Move to next step in guidance
    } catch (err) {
      console.error("Email send error:", err);
      setError(err.message || "Error sending verification email.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    if (checkCooldown > 0) return;
    setLoading(true);
    setCheckCooldown(VERIFICATION_CHECK_COOLDOWN / 1000);
    await checkVerificationStatus();
    setLoading(false);
  };

  // Steps for user guidance
  const steps = [
    {
      id: 1,
      title: "Send verification email",
      description: "We'll send a link to your email address to verify your account.",
      icon: <FiMail size={24} />,
      completed: emailSent
    },
    {
      id: 2,
      title: "Check your inbox",
      description: "Look for an email from us with the subject 'Verify your email address'.",
      icon: <FiMail size={24} />,
      completed: false
    },
    {
      id: 3,
      title: "Click the verification link",
      description: "The link will automatically verify your email when clicked.",
      icon: <FiCheckCircle size={24} />,
      completed: false
    },
    {
      id: 4,
      title: "You're all set!",
      description: "Your email has been verified successfully.",
      icon: <FiCheckCircle size={24} />,
      completed: isVerified
    }
  ];

  return (
    <>
      <Header />
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
            <div className="flex flex-col items-center">
              <div className="animate-spin h-16 w-16 border-4 border-t-transparent border-primary rounded-full mb-4"></div>
              <p className="text-gray-700">Processing your request...</p>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto bg-white border-2 border-primary/50 rounded-2xl overflow-hidden p-8">
            <div className="text-center mb-10">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                {isVerified ? (
                  <FiCheckCircle className="h-8 w-8 text-green-600" />
                ) : (
                  <FiMail className="h-8 w-8 text-primary" />
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {isVerified ? "Email Verified Successfully!" : "Verify Your Email Address"}
              </h1>
              <p className="text-lg text-gray-600">
                {isVerified 
                  ? "Thank you for verifying your email. You now have full access to your account." 
                  : `We've sent an email to ${user?.email || 'your email'}. Please verify to continue.`}
              </p>
            </div>

            {!isVerified && (
              <>
                {/* Progress steps */}
                <div className="mb-10">
                  <div className="flex items-center justify-between mb-6">
                    {steps.map((step, index) => (
                      <div key={step.id} className="flex flex-col items-center relative" style={{ width: `${100/steps.length}%` }}>
                        <div className={`flex items-center justify-center w-10 h-10 z-50 rounded-full ${currentStep >= step.id ? 'bg-second text-white' : 'border-2 border-second bg-white text-gray-600'} ${step.completed ? 'bg-success' : ''}`}>
                          {step.completed ? <FiCheckCircle size={18} /> : step.icon}
                        </div>
                        <div className="mt-2 text-center">
                          <p className={`text-xs md:text-sm font-medium ${currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'}`}>{step.title}</p>
                        </div>
                        <div className={`absolute top-5 h-1 rounded-full w-full ${index < steps.length - 1 ? 'block' : 'hidden'} ${currentStep > step.id ? 'bg-primary' : 'bg-gray-200'}`} style={{ left: '50%' }}></div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h1 className="font-semibold text-second mb-2">{steps[currentStep-1].title}</h1>
                    <p className="text-primary">{steps[currentStep-1].description}</p>
                  </div>
                </div>

                {/* Help section */}
                <div className="mb-8 bg-gray-50 p-5 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                    <FiAlertCircle className="mr-2 text-yellow-500" /> Need help?
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Can't find the email? Check your spam or junk folder</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Make sure you entered the correct email address</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Verification links expire after 24 hours</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Still having trouble? <Link href="/contact" className="text-primary hover:underline">Contact support</Link></span>
                    </li>
                  </ul>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={sendVerificationEmail}
                    className={`flex-1 btn btn-lg ${resendCooldown > 0 ? 'btn-second' : 'btn-primary'} flex items-center justify-center`}
                    disabled={resendCooldown > 0}
                  >
                    {resendCooldown > 0 ? (
                      <>
                        <FiClock className="mr-2" />
                        Resend in {resendCooldown}s
                      </>
                    ) : (
                      <>
                        <FiMail className="mr-2" />
                        {emailSent ? 'Resend Email' : 'Send Verification Email'}
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleCheckVerification}
                    className={`flex-1 btn btn-lg ${checkCooldown > 0 ? 'btn-second' : 'btn-primary'} flex items-center justify-center`}
                    disabled={checkCooldown > 0}
                  >
                    {checkCooldown > 0 ? (
                      <>
                        <FiClock className="mr-2" />
                        Check in {checkCooldown}s
                      </>
                    ) : (
                      <>
                        <FiCheckCircle className="mr-2" />
                        Check Verification
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {isVerified && (
              <div className="text-center">
                <div className="mb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                    <FiCheckCircle className="h-10 w-10 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">You're All Set!</h2>
                  <p className="text-gray-600 mb-6">Your email has been successfully verified.</p>
                  <Link href="/dashboard">
                    <button className="btn btn-lg btn-success flex items-center mx-auto">
                      Go to Dashboard <FiArrowRight className="ml-2" />
                    </button>
                  </Link>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg max-w-md mx-auto">
                  <h3 className="font-medium text-green-800 mb-2">Next Steps:</h3>
                  <ul className="text-left text-green-700 space-y-2">
                    <li className="flex items-start">
                      <FiCheckCircle className="w-4 h-4 mt-1 mr-2 flex-shrink-0" />
                      <span>Step 1: Access your dashboard to view your application status</span>
                    </li>
                    <li className="flex items-start">
                      <FiCheckCircle className="w-4 h-4 mt-1 mr-2 flex-shrink-0" />
                      <span>Step 2: Complete your personal information and upload required documents</span>
                    </li>
                    <li className="flex items-start">
                      <FiCheckCircle className="w-4 h-4 mt-1 mr-2 flex-shrink-0" />
                      <span>Step 3: Take the online admission test, pay the application fee if you pass, and complete enrollment</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-6 bg-red-50 p-4 rounded-lg">
                <p className="text-red-700 flex items-center">
                  <FiAlertCircle className="mr-2" /> {error}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default VerifyEmailComponent;