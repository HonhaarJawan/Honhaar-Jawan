"use client";
import React, { useMemo, useState, useEffect } from "react";
import {
  FaVideo,
  FaEnvelope,
  FaRedo,
  FaChartBar,
  FaUser,
  FaIdCard,
  FaListOl,
  FaTimesCircle,
  FaAward,
  FaBookOpen,
  FaClock,
  FaLightbulb,
  FaDownload,
} from "react-icons/fa";
import { motion } from "framer-motion";
import FinalStepsModal from "../compo/finalstepvid";
import Copyright from "@/components/primary/Copyright";
import { useRouter } from "next/navigation";
import { ImSpinner } from "react-icons/im";
import { useToast } from "@/components/primary/Toast";
import SiteDetails from "@/Data/SiteData";

export default function TestFailed({ user }) {
  const router = useRouter();
  const { showToast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [loadingBtn, setLoadingBtn] = useState(null);

  // Derived scores (robust to weird input)
  const {
    percentage,
    correctAnswers,
    incorrectAnswers,
    totalQuestions,
    passThreshold,
    shortfall,
  } = useMemo(() => {
    const total = 25; // keep consistent with your test size
    const raw = Number(user?.OnlineTestPercentage ?? 0);
    const pct = Number.isFinite(raw) ? Math.min(100, Math.max(0, raw)) : 0;
    const correct = Math.round((pct * total) / 100);
    const incorrect = Math.max(0, total - correct);
    const pass = 40;
    const need = Math.max(0, pass - pct);
    return {
      percentage: Number(pct.toFixed(2)),
      correctAnswers: correct,
      incorrectAnswers: incorrect,
      totalQuestions: total,
      passThreshold: pass,
      shortfall: Number(need.toFixed(2)),
    };
  }, [user]);

  // Lock body scroll when modal opens
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const supportEmail = `${SiteDetails.supportEmail}`;

  const go = (path, idx) => {
    setLoadingBtn(idx);
    setTimeout(() => router.push(path), 0);
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(supportEmail);
      showToast({ type: "success", message: `Copied ${supportEmail}` });
    } catch (e) {
      showToast({ type: "info", message: supportEmail });
    }
  };

  const progressBarClass =
    percentage >= passThreshold ? "bg-green-500" : "bg-red-500";

  return (
    <>
      <div className="min-h-screen pt-10">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-start gap-6">
              <div className="bg-red-100 p-4 rounded-full" aria-hidden>
                <FaTimesCircle className="text-red-500 text-4xl" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Admission Test Not Passed
                </h1>
                <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1.5 rounded-full text-xs font-medium">
                  <span className="w-2 h-2 bg-red-500 rounded-full" />
                  <span role="status" aria-live="polite">
                    Score: {percentage}% • Passing: {passThreshold}%
                  </span>
                </div>
                <p className="text-gray-600 mt-3 max-w-3xl">
                  This is a temporary setback. Many successful honhaar jawan
                  students passed on a later attempt—you can too.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left column */}
            <div className="lg:w-2/3 space-y-6">
              {/* Message */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  What happens next
                </h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    You can reapply in the next batch (about two months). Use
                    this time to prepare—below are quick actions and tips.
                  </p>
                  <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                    <h3 className="font-semibold text-red-700 mb-2">
                      Quick plan
                    </h3>
                    <ul className="list-disc pl-5 space-y-2 text-sm">
                      <li>
                        <span className="font-medium">Reapply:</span>{" "}
                        applications reopen in ~2 months.
                      </li>
                      <li>
                        <span className="font-medium">Prepare:</span> practice a
                        little every day; focus on weak areas.
                      </li>
                      <li>
                        <span className="font-medium">Ask for help:</span> our
                        team can guide your prep.
                      </li>
                    </ul>
                  </div>
                  <p className="text-sm">
                    Need help?{" "}
                    <button
                      onClick={copyEmail}
                      className="text-blue-600 hover:underline"
                    >
                      {supportEmail}
                    </button>
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsOpen(true)}
                  className="w-full rounded-xl bg-gradient-to-r from-primary to-sec2 text-white p-4 shadow-sm hover:shadow-md transition flex items-center justify-center gap-2"
                >
                  <FaVideo /> <span className="font-medium">Watch guide</span>
                </motion.button>

                <button
                  onClick={() => go("/contact", 1)}
                  className="w-full rounded-xl bg-white border border-gray-300 text-gray-800 p-4 hover:border-primary hover:text-primary transition flex items-center justify-center gap-2"
                >
                  {loadingBtn === 1 ? (
                    <>
                      <ImSpinner className="animate-spin" />
                      <span className="font-medium">Opening…</span>
                    </>
                  ) : (
                    <>
                      <FaEnvelope />{" "}
                      <span className="font-medium">Contact support</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right column */}
            <div className="lg:w-1/3">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-6">
                <div className="bg-gradient-to-r from-primary to-sec2  py-3 px-5">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <FaAward /> Test summary
                  </h2>
                </div>

                <div className="p-5">
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div className="bg-green-50 p-3 rounded-md text-center border border-green-100">
                      <div className="text-2xl font-bold text-primary">
                        {correctAnswers}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Correct</div>
                    </div>
                    <div className="bg-red-50 p-3 rounded-md text-center border border-red-100">
                      <div className="text-2xl font-bold text-red-500">
                        {incorrectAnswers}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Incorrect
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div className="flex items-center gap-2 text-gray-700 text-sm">
                        <FaUser className="text-primary" /> <span>Student</span>
                      </div>
                      <div className="font-medium text-sm">
                        {user?.fullName || "N/A"}
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div className="flex items-center gap-2 text-gray-700 text-sm">
                        <FaIdCard className="text-primary" />{" "}
                        <span>Test ID</span>
                      </div>
                      <div className="font-medium text-sm">
                        {user?.formNo || "N/A"}
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <div className="flex items-center gap-2 text-gray-700 text-sm">
                        <FaListOl className="text-primary" />{" "}
                        <span>Total questions</span>
                      </div>
                      <div className="font-medium text-sm">
                        {totalQuestions}
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-2">
                      <div className="flex items-center gap-2 text-gray-700 text-sm">
                        <FaChartBar className="text-primary" />{" "}
                        <span>Percentage</span>
                      </div>
                      <div className="font-medium text-sm">{percentage}%</div>
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div className="px-5 pb-5">
                  <div className="bg-gray-200 rounded-full h-2" aria-hidden>
                    <div
                      className={`${progressBarClass} h-2 rounded-full transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 mt-2">
                    <span>0%</span>
                    <span>Your score: {percentage}%</span>
                    <span>100%</span>
                  </div>
                  {shortfall > 0 ? (
                    <p className="text-xs text-red-600 mt-2">
                      You need {shortfall}% more to pass.
                    </p>
                  ) : (
                    <p className="text-xs text-green-600 mt-2">
                      You've met the passing threshold.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal */}
        <FinalStepsModal isOpen={isOpen} setIsOpen={setIsOpen} />
      </div>

      {/* Footer */}
      <Copyright />
    </>
  );
}
