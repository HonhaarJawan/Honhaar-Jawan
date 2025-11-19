"use client";
import React from "react";
import Link from "next/link";
import { FaCertificate, FaAward, FaShieldAlt, FaFileAlt } from "react-icons/fa";

const PageInfo = ({
  title = "",
  subtitle = "",
  description = "",
  image,
  buttonText,
  buttonLink = "/",
  urduLine,
  route,
  showCertificateIcons = false, // New prop to show certificate-themed icons
}) => {
  return (
    <section className="w-full bg-transparent">
      <div className="w-full bg-second2 px-6 py-20 mt-[75px] relative overflow-hidden">
        {/* Dotted pattern overlay */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle at 25% 25%, white 2px, transparent 2px), radial-gradient(circle at 75% 75%, white 2px, transparent 2px)",
            backgroundSize: "50px 50px"
          }}
        ></div>
        
       
        
        <div className="w-full center-flex gap-6 relative z-10">
          <div className="flex flex-col items-start text-center gap-6">
            <div className="max-w-4xl  flex flex-col items-start">
              {/* Main icon (conditional) */}
              {showCertificateIcons && (
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                    <FaCertificate className="text-6xl text-white" />
                  </div>
                </div>
              )}
              
              <h1 className="text-3xl sm:text-4xl font-black text-white mb-4 leading-tight">
                {title}
              </h1>
              
              {/* Urdu line (if provided) */}
              {urduLine && (
                <p className="text-white/70 text-md mb-4 italic">
                  {urduLine}
                </p>
              )}
              
              {/* Button (optional) */}
              {buttonText && (
                <div className="flex flex-wrap justify-center gap-4">
                  <Link
                    href={buttonLink}
                    className="px-8 py-4 bg-white text-primary text-sm font-bold rounded-2xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    {buttonText}
                  </Link>
                  <Link
                    href="/referralearn"
                    className="px-8 py-4 border-2 border-white text-white text-sm font-bold rounded-2xl hover:bg-white/10 transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
                  >
                    Learn & Earn
                  </Link>
                </div>
              )}
            </div>
            
            {/* Image Section (optional) */}
            {image && (
              <div className="w-full lg:w-2/3">
                <div 
                  className="relative rounded-3xl overflow-hidden shadow-2xl aspect-video border border-white/20"
                  style={{
                    clipPath: "polygon(0 0, calc(100% - 30px) 0, 100% 30px, 100% 100%, 30px 100%, 0 calc(100% - 30px))"
                  }}
                >
                  <img
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Route/Breadcrumb Section */}
        {route && (
          <div className="w-full pt-6 mt-8 border-t border-white/20 text-center relative z-10">
            <p className="text-white/90 text-sm md:text-base font-medium">{route}</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default PageInfo;