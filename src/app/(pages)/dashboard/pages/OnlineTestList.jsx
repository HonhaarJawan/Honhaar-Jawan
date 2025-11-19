"use client";
import React, { useState } from "react";
import { firestore } from "@/Backend/Firebase";
import { doc, updateDoc } from "firebase/firestore";
import SiteDetails from "@/Data/SiteData";

const OnlineTestList = ({ user }) => {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!agreed) return; // keep same behaviour — button disabled anyway

    setLoading(true);
    try {
      const response = await fetch("/api/pabbly-connect/entry-test-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: user,
          addListId: process.env.NEXT_PUBLIC_PABBLY_ENTRY_TEST_LIST_ID,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to submit");

      if (user?.email) {
        const userRef = doc(firestore, "users", user.email);
        await updateDoc(userRef, { status: 2, updatedAt: new Date() });
      }

      setSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-second p-8 text-center text-white">
          <h1 className="text-3xl font-bold tracking-wide">
            Undertaking & Terms of Service
          </h1>
          <p className="mt-2 text-blue-100 text-sm max-w-2xl mx-auto">
            Please read and agree to the following terms before submitting your
            application for enrollment.
          </p>
        </div>

        {/* Notice */}
        <div className="px-6 py-6 border-b border-gray-100 bg-yellow-50">
          <h3 className="font-bold text-yellow-800 mb-2">Notice Board</h3>
          <p className="text-yellow-700 text-sm leading-relaxed">
            All communications regarding admissions and classes will be sent via
            your registered email. Please ensure the email provided during
            registration is correct for timely updates.
          </p>
        </div>

        {/* Terms Content */}
        <div className="p-8 space-y-8">
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-3">Undertaking</h2>
            <p className="text-gray-700 leading-relaxed">
              The applicant affirms that all information provided is accurate
              and truthful. Providing false or misleading details will lead to
              cancellation of the application and forfeiture of any enrollment
              rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Terms & Conditions
            </h2>
            <p className="text-gray-700 mb-5">
              Please review and acknowledge the following terms carefully before
              proceeding:
            </p>

            <ul className="space-y-4 text-gray-700">
              <li>
                <strong>Rules & Regulations:</strong> All students under{" "}
                {SiteDetails.programName} must adhere to institutional rules.
                Non-compliance may result in disciplinary action.
              </li>
              <li>
                <strong>Certification & Completion:</strong> A minimum overall
                score of 100% is required for certification: 50% LMS Engagement,
                25% Weekly Tests, 25% Final Exam. Application processing fee of{" "}
                <strong>5000 PKR</strong> applies — non-refundable.
              </li>
              <li>
                <strong>Program Duration:</strong> The management reserves full
                rights to terminate any participant without explanation.
              </li>
              <li>
                <strong>Accuracy:</strong> Providing incorrect details will
                result in immediate rejection of the application.
              </li>
              <li>
                <strong>Selection:</strong> Seats are limited and filled on a
                first-come, first-served basis.
              </li>
              <li>
                <strong>Management Decisions:</strong> All administrative
                decisions are final and binding.
              </li>
              <li>
                <strong>Stipend:</strong> No stipend is provided during
                training.
              </li>
              <li>
                <strong>Privacy:</strong> {SiteDetails.programName} ensures full
                protection of personal data per applicable privacy regulations.
              </li>
              <li>
                <strong>Amendments:</strong> Terms may be updated at any time
                without prior notice.
              </li>
            </ul>

            <p className="mt-6 font-semibold text-gray-800">
              By proceeding, you confirm that you have read, understood, and
              agree to these Terms of Service.
            </p>
          </section>

          {/* Agreement Checkbox */}
          <div className="border-t pt-6">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700 text-sm font-semibold">
                I agree to the Terms & Conditions
              </span>
            </label>

            {/* Urdu Declaration */}
            <div className="bg-blue-50 mt-5 rounded-lg p-5 border border-blue-200">
              <h4 className="font-bold text-blue-800 mb-1">
                Agreement Declaration
              </h4>
              <h5 className="font-semibold text-blue-700 mb-2">
                معاہدے کا اعلان
              </h5>
              <p className="text-blue-700 text-sm leading-relaxed">
                I confirm that all the information I've provided is correct and
                I agree to follow all guidelines of the {SiteDetails.programName}{" "}
                program.
              </p>
            </div>
          </div>

          {/* Apply Button */}
          <div className="pt-4">
            <button
              onClick={handleSubmit}
              disabled={loading || !agreed}
              className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition-all duration-200 ${
                agreed && !loading
                  ? "bg-sec2 hover:bg-primary text-white"
                  : "bg-gray-300 text-gray-500"
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </div>
              ) : (
                "Continue"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnlineTestList;
