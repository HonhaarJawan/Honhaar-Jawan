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
  FaUserGraduate,
  FaUniversity,
  FaCalendarAlt,
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-gray-600">
          <ImSpinner className="animate-spin text-4xl text-primary" />
          <span className="font-medium">Loading student details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCheck className="text-red-500 text-2xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Unable to Load</h2>
            <p className="text-gray-500 mb-6">{error}</p>
            <a href="/" className="text-primary hover:underline font-medium">Return Home</a>
          </div>
        </div>
        <Copyright />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-28 pb-16">
        <div className=" mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header Section */}
          <div className="mb-10 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Student Verification Portal
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Verify student credentials and download the official Honhaar identification card.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Student Details */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-primary/5 p-6 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <FaUserGraduate className="text-primary text-2xl" />
                    <h2 className="text-xl font-bold text-gray-800">Student Profile</h2>
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Full Name</label>
                    <p className="text-lg font-medium text-gray-900">{honhaar.fullName}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">CNIC</label>
                      <p className="text-gray-700 font-mono">{honhaar.cnic}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Status</span>
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full flex items-center gap-1">
                        <FaCheck size={12} /> Verified
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                <h3 className="font-semibold text-blue-900 mb-2">Important Note</h3>
                <p className="text-sm text-blue-800 leading-relaxed">
                  This digital card serves as a valid proof of identity for the Honhaar program. 
                  Please ensure the details match your official documents.
                </p>
              </div>
            </div>

            {/* Right Column: Card Preview & Action */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <FaRegIdCard className="text-primary" />
                    Card Preview
                  </h2>
                  <button
                    onClick={generatePNG}
                    disabled={isGenerating || !bgLoaded}
                    className={`hidden sm:flex items-center px-5 py-2.5 bg-primary text-white font-medium rounded-lg shadow-md hover:bg-sec2 transition-all active:scale-95 ${
                      isGenerating || !bgLoaded ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {isGenerating ? (
                      <span className="flex items-center gap-2">
                        <ImSpinner className="animate-spin" /> Generating...
                      </span>
                    ) : (
                      <>
                        <FaFileDownload className="mr-2" /> Download PNG
                      </>
                    )}
                  </button>
                </div>

                <div className="relative w-full flex justify-center bg-gray-50 rounded-xl  border border-dashed border-gray-300 mb-6">
                  {bgLoaded ? (
                    <div
                      ref={honhaarRef}
                      className="relative h-[600px] w-full shadow-2xl rounded-lg overflow-hidden transform transition-transform hover:scale-[1.01]"
                    >
                      <img
                        src="/Student-Card.avif"
                        alt="Honhaar Card Background"
                        className="absolute inset-0 w-full h-full "
                      />
                      
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[500px] w-full text-gray-400">
                      <ImSpinner className="animate-spin text-3xl mb-3" />
                      <p>Loading card template...</p>
                    </div>
                  )}
                </div>

                {/* Mobile Download Button */}
                <button
                  onClick={generatePNG}
                  disabled={isGenerating || !bgLoaded}
                  className={`w-full sm:hidden flex justify-center items-center px-6 py-3 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-sec2 transition-all ${
                    isGenerating || !bgLoaded ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isGenerating ? (
                    <span className="flex items-center gap-2">
                      <ImSpinner className="animate-spin" /> Generating...
                    </span>
                  ) : (
                    <>
                      <FaFileDownload className="mr-2" /> Download Card
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Copyright />
    </>
  );
};

export default honhaarCardPage;
