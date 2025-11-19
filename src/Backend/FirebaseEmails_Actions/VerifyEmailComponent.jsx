"use client";

import { useEffect, useState } from "react";
import {
  doc,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { checkActionCode } from "firebase/auth";
import { firestore, auth } from "@/Backend/Firebase";
import axios from "axios";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ImSpinner10 } from "react-icons/im";
import useAuthStore from "@/store/useAuthStore";

const ACELLE_API_BASE_URL = "https://mailer2.ansolutions.pk/api/v1";
const ACELLE_API_TOKEN = process.env.NEXT_PUBLIC_EMAILING_APITOKEN;
const ACELLE_LIST_UID = process.env.NEXT_PUBLIC_EMAILING_PROFILE_REMINDER_LISTUID;

// Create API client instances outside component
const thinkificApi = axios.create({
  headers: {
    "X-Auth-API-Key": process.env.NEXT_PUBLIC_THINKIFIC_API_KEY,
    "X-Auth-Subdomain": process.env.NEXT_PUBLIC_THINKIFIC_SUBDOMAIN,
    "Content-Type": "application/json",
  },
});

const acelleApi = axios.create({
  headers: {
    Authorization: `Bearer ${ACELLE_API_TOKEN}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const VerifyEmailComponent = ({ mode, oobCode }) => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoize verification function to prevent recreating on every render
  useEffect(() => {
    // Early return for invalid conditions
    if (mode !== "verifyEmail" || !oobCode) {
      router.push("/");
      return;
    }

    // If user is already verified in our state, redirect
    if (user?.isEmailVerified) {
      router.push("/dashboard");
      return;
    }

    const verifyEmail = async () => {
      try {
        // 1. Decode action code to get email (keep this as first step for security)
        const actionCodeInfo = await checkActionCode(auth, oobCode);
        const userEmail = actionCodeInfo?.data?.email;
        
        if (!userEmail) {
          throw new Error("Invalid verification link");
        }

        // 2. Find or create user document in a single operation
        const usersRef = collection(firestore, "users");
        const q = query(usersRef, where("email", "==", userEmail));
        const querySnapshot = await getDocs(q);
        
        let userDocRef;
        let userData;
        
        if (querySnapshot.empty) {
          // User doesn't exist yet - this is unusual for email verification
          // but handle gracefully
          userDocRef = doc(usersRef);
          userData = {
            email: userEmail,
            createdAt: new Date().toISOString(),
          };
        } else {
          // Get existing user data
          userDocRef = querySnapshot.docs[0].ref;
          userData = querySnapshot.docs[0].data();
        }

        // Validate user data has required fields
        const { email, password, firstName, lastName } = userData;
        if (!email || !password || !firstName || !lastName) {
          throw new Error("User profile is incomplete. Please complete registration first.");
        }

        // 3. Process Thinkific and Acelle in parallel for speed
        const [thinkificUserId, acelleSubscriberId] = await Promise.all([
          getOrCreateThinkificUser(email, password, firstName, lastName),
          getOrCreateAcelleSubscriber(email, firstName, lastName, userData.subscriberId)
        ]);

        // 4. Update user document with all new data in a single write
        const updatedUserData = {
          ...userData,
          userId: thinkificUserId,
          subscriberId: acelleSubscriberId,
          isEmailVerified: true,
          status: 1,
          lastUpdated: new Date().toISOString(),
        };

        // Update Firestore and send confirmation email in parallel
        await Promise.all([
          setDoc(userDocRef, updatedUserData, { merge: true }),
          sendVerificationConfirmationEmail(email)
        ]);

        // Update local state and redirect
        setUser(updatedUserData);
        router.push("/dashboard");
      } catch (err) {
        console.error("Verification error:", err);
        setError(err.message || "Verification failed");
        // Wait a moment before redirecting on error
        setTimeout(() => router.push("/"), 3000);
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [mode, oobCode, router, user, setUser]);

  // Helper function to get or create Thinkific user
  async function getOrCreateThinkificUser(email, password, firstName, lastName) {
    try {
      // Try to create the user first
      const createResponse = await thinkificApi.post(
        "https://api.thinkific.com/api/public/v1/users",
        {
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`,
        }
      );
      console.log(createResponse)
      return createResponse.data.id;
    } catch (error) {
      // If user exists (422), fetch the existing user
      if (error.response?.status === 422) {
        const checkUserUrl = `https://api.thinkific.com/api/public/v1/users?query[email]=${encodeURIComponent(email)}`;
        const checkUserResponse = await thinkificApi.get(checkUserUrl);
        
        if (checkUserResponse.data.items?.length > 0) {
          return checkUserResponse.data.items[0].id;
        }
      }
      throw new Error(`Thinkific error: ${error.response?.data?.message || error.message}`);
    }
  }

  // Helper function to get or create Acelle subscriber
  async function getOrCreateAcelleSubscriber(email, firstName, lastName, existingId) {
    // If we already have a subscriber ID, no need to recreate
    if (existingId) return existingId;
    
    try {
      // Try to create new subscriber
      const response = await acelleApi.post(`${ACELLE_API_BASE_URL}/subscribers`, {
        list_uid: ACELLE_LIST_UID,
        EMAIL: email,
        FIRST_NAME: firstName,
        LAST_NAME: lastName,
        status: "subscribed",
      });
      return response.data.subscriber_id;
    } catch (error) {
      // If creation fails, try to fetch existing subscriber
      try {
        const existingResponse = await axios.get(
          `${ACELLE_API_BASE_URL}/subscribers/email/${encodeURIComponent(email)}`,
          { params: { api_token: ACELLE_API_TOKEN } }
        );
        
        const existingSubscriber = existingResponse.data.subscribers.find(
          (sub) => sub.list_uid === ACELLE_LIST_UID
        );
        
        if (existingSubscriber) {
          return existingSubscriber.id;
        }
      } catch (fetchError) {
        console.error("Failed to fetch Acelle subscriber:", fetchError);
      }
      
      // Non-critical error, return null but don't block verification
      return null;
    }
  }

  // Helper function to send confirmation email
  async function sendVerificationConfirmationEmail(email) {
    try {
      // Fetch template only once
      const docRef = doc(firestore, "email_templates", 'email-verified');
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        console.error("Email template not found");
        return;
      }
      
      const { template } = docSnap.data();
      
      // Send email
      await axios.post("https://honhaarjawan.pk/api/sendMail", {
        to: email,
        subject: "Email Verified Successfully!",
        placeholders: {
          fullName: `${firstName} ${lastName}`,
          email: email,
        },
        htmlTemplate: template,
      });
    } catch (error) {
      // Log error but don't block verification process
      console.error("Failed to send confirmation email:", error);
    }
  }

  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen bg-gray-100"
      >
        <div className="text-center">
          <ImSpinner10 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="mt-4 text-lg font-medium text-gray-700">
            Please wait, verifying your email...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex items-center justify-center min-h-screen bg-gray-100"
      >
        <div className="text-center bg-white p-6 rounded-lg shadow-md max-w-md">
          <div className="text-red-500 text-5xl mb-4">!</div>
          <h2 className="text-xl font-semibold mb-2">Verification Failed</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-gray-500 text-sm">Redirecting you to home page...</p>
        </div>
      </div>
    );
  }

  // No need to render anything if verification succeeded (will redirect)
  return null;
};

export default VerifyEmailComponent;