// components/GeneratePSIDButton.jsx
"use client";
import React, { useState } from "react";
import { FaSyncAlt, FaSpinner } from "react-icons/fa";
import { doc, updateDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { firestore } from "@/Backend/Firebase";
import { useToast } from "@/components/primary/Toast";

const GeneratePSIDButton = ({ user, onUpdateSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const generateNewPSID = async () => {
    if (!user.generatedPayProId) {
      showToast(
        "No PSID found to reverse. Please generate a PSID first.",
        "error"
      );
      return;
    }

    setLoading(true);

    try {
      const oldPayProId = user.generatedPayProId?.payProId;
      const selectedCourses = user.generatedPayProId?.selectedCourses || [];

      if (selectedCourses.length === 0) {
        throw new Error("No courses found to generate PSID");
      }

      const userRef = doc(firestore, "users", user.email);
      await updateDoc(userRef, { generatedPayProId: null });

      const websiteId = process.env.NEXT_PUBLIC_WEBSITE_ID || "777";
      const gatewayId = process.env.NEXT_PUBLIC_GATEWAY_ID || "44";
      const randomNumber = Math.floor(Math.random() * 999) + 1;
      const identifier = user.formNo || user.phone || "N/A";
      const invoice = `${websiteId}-${gatewayId}-${identifier}-4500-${randomNumber}-1`;

      const response = await fetch("/api/paypro/create-psid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          fullName: user.fullName,
          invoice,
          courses: selectedCourses,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.payProId) {
        throw new Error(data.error || "Payment request failed");
      }

      const newPayProId = data.payProId;

      const updatedUserData = {
        generatedPayProId: {
          userId: user.uid,
          user_lms_id: user.user_lms_id || user.userId,
          fullName: user.fullName,
          email: user.email,
          mobile: user.mobile,
          formNo: user.formNo,
          payProId: newPayProId,
          selectedCourses,
          invoiceNumber: data.invoiceNumber,
          status: "pending",
          amount: 4500,
          created_at: serverTimestamp(),
        },
      };

      await updateDoc(userRef, updatedUserData);

      await sendReversePaymentEmail(user, oldPayProId, newPayProId);

      // Call the callback function to refresh the user data
      if (onUpdateSuccess) {
        // Fetch the updated user data from Firestore
        const updatedUserDoc = await getDoc(userRef);
        if (updatedUserDoc.exists()) {
          const updatedUser = {
            id: updatedUserDoc.id,
            ...updatedUserDoc.data(),
          };
          onUpdateSuccess(updatedUser);
        }
      }

      showToast(
        "A new PSID has been generated and the user has been notified.",
        "success"
      );
    } catch (error) {
      console.error("Error generating new PSID:", error);
      showToast(error.message || "Failed to generate new PSID", "error");
    } finally {
      setLoading(false);
    }
  };

  const sendReversePaymentEmail = async (user, oldPayProId, newPayProId) => {
    const templateRef = doc(firestore, "email_templates", "reverse_payment");
    const templateSnap = await getDoc(templateRef);

    if (!templateSnap.exists()) {
      throw new Error("Reverse payment email template not found");
    }

    const emailData = {
      to: user.email,
      subject: "Urgent: Action Required – Application Processing Fee Reversed",
      htmlTemplate: templateSnap.data().template,
      placeholders: {
        name: user.fullName,
        oldPayProId,
        newPayProId,
      },
    };

    const response = await fetch(
      process.env.NODE_ENV === "development"
        ? `http://localhost:3000/api/sendMail`
        : process.env.NODE_ENV === "production" &&
            "https://honhaarjawan.pk/api/sendMail",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to send email");
    }
  };

  return (
    <button
      onClick={generateNewPSID}
      disabled={loading}
      className="bg-[#225722] text-white px-4 py-2 rounded-lg hover:opacity-90 transition text-xs font-medium shadow-sm flex items-center gap-1 disabled:opacity-50"
    >
      {loading ? (
        <>
          <FaSpinner className="animate-spin" /> Generating...
        </>
      ) : (
        <>
          <FaSyncAlt /> Reverse Payment
        </>
      )}
    </button>
  );
};

export default GeneratePSIDButton;
