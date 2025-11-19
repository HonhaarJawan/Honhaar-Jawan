"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { firestore } from "@/Backend/Firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import Navbar from "@/components/primary/Navbar";
import Copyright from "@/components/primary/Copyright";
import html2canvas from "html2canvas";
import { ImSpinner } from "react-icons/im";
import {
  FaRegIdCard,
  FaCertificate,
  FaFileDownload,
  FaCheck,
} from "react-icons/fa";
import { useToast } from "@/components/primary/Toast";

const honhaarCardPage = () => {
  const { code } = useParams();
  const [honhaar, sethonhaar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bgLoaded, setBgLoaded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const honhaarRef = useRef(null);
  const { showToast } = useToast();

  // Preload honhaar card background
  useEffect(() => {
    const img = new Image();
    img.src = "/Student-Card.avif"; // Use your actual background image path
    img.onload = () => setBgLoaded(true);
    img.onerror = () => setError("Background image failed to load.");
  }, []);

  // Fetch honhaar data
  useEffect(() => {
    if (!code) {
      setError("Verification code not provided.");
      setLoading(false);
      return;
    }

    const fetchhonhaar = async () => {
      try {
        const q = query(
          collection(firestore, "honhaarCardApplications"),
          where("verificationCode", "==", code)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          setError("No honhaar application found with this code.");
        } else {
          const data = snapshot.docs[0].data();
          sethonhaar(data);
        }
      } catch (err) {
        setError("Failed to fetch honhaar data.");
        console.error("Error fetching honhaar:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchhonhaar();
  }, [code]);

  // Generate PNG of the honhaar card
  const generatePNG = async () => {
    if (isGenerating || !bgLoaded || !honhaar) return;
    setIsGenerating(true);

    try {
      const input = honhaarRef.current;
      const canvas = await html2canvas(input, {
        scale: 4,
        useCORS: true,
        backgroundColor: null,
      });

      const imgData = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement("a");
      link.href = imgData;
      link.download = `${honhaar.fullName}-honhaar-Card.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("honhaar card downloaded successfully!", "success");
    } catch (error) {
      setError("Failed to generate image.");
      showToast(
        "Error generating honhaar card. Please try again.",
        "error"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-700">
          <ImSpinner className="animate-spin text-2xl" />
          <span>Loading honhaar student card details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md text-center">
            <FaCheck className="text-red-500 text-4xl mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800">Error</h2>
            <p className="text-gray-600 mt-2">{error}</p>
          </div>
        </div>
        <Copyright />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white shadow-lg p-8 mb-8">
            <div className="flex items-center gap-4 mb-6">
              <FaCertificate className="text-primary text-3xl" />
              <h1 className="text-2xl font-bold text-gray-800">
                honhaar Card Details
              </h1>
            </div>
            <p className="text-gray-600 mb-4">
              Congratulations on your honhaar application! Below is your
              honhaar card for reference. You can download it for future
              use.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Your honhaar Card
              </h2>
              <p className="text-gray-600">
                Download and save for future reference.
              </p>
            </div>

            <div className="relative mb-8">
              {bgLoaded ? (
                <div
                  ref={honhaarRef}
                  className="relative  mx-auto h-[800px] w-full rounded-lg shadow-lg"
                >
                  <img
                    src="/Student-Card.avif"
                    alt="honhaar Card Background"
                    className="absolute inset-0 w-full h-full  rounded-lg"
                  />

                  {/* Overlay user details */}
                </div>
              ) : (
                <div className="flex items-center justify-center bg-gray-200 rounded-lg h-64 max-w-lg mx-auto">
                  <ImSpinner className="animate-spin text-2xl text-gray-500" />
                </div>
              )}
            </div>

            <div className="text-center">
              <button
                onClick={generatePNG}
                disabled={isGenerating || !bgLoaded}
                className={`inline-flex items-center px-6 py-3 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-sec2 transition-all ${
                  isGenerating || !bgLoaded
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {isGenerating ? (
                  <span className="flex items-center gap-2">
                    <ImSpinner className="animate-spin" />
                    Generating...
                  </span>
                ) : (
                  <>
                    <FaFileDownload className="mr-2" />
                    Download honhaar Card
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
      <Copyright />
    </>
  );
};

export default honhaarCardPage;
