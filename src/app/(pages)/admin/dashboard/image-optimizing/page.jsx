"use client";
import React, { useState } from "react";
import ImageOptimizer from "./components/Image-Optimizer";
import BackgroundRemover from "./components/Background-Remover";
import SidebarWrapper from "@/adminComponents/SidebarWrapper";

const AllInOneImages = () => {
  const [activeTab, setActiveTab] = useState("optimizer");

  return (
    <div className="min-h-[100vh] w-full   bg-gray-900">

      {/* Top Navigation Bar */}
      <div className="bg-transparent z-[100] absolute -mt-24  max-w-[400px]">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <nav className="ml-8 flex space-x-4">
                <button
                  onClick={() => setActiveTab("optimizer")}
                  className={`px-6 py-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "optimizer"
                      ? "bg-green-800 text-white"
                      : "text-gray-300 hover:text-white bg-green-200 hover:bg-green-900"
                  }`}
                >
                  Image Optimizer
                </button>
                <button
                  onClick={() => setActiveTab("background-remover")}
                  className={`px-6 py-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "background-remover"
                      ? "bg-green-800 text-white"
                      : "text-gray-600 hover:text-white bg-green-200 hover:bg-green-900"
                  }`}
                >
                  Background Remover
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

       {/* Main Content */}
      <div>
        {activeTab === "optimizer" && <ImageOptimizer />}
        {activeTab === "background-remover" && <BackgroundRemover />}
      </div>
    </div>
  );
};

export default AllInOneImages;
