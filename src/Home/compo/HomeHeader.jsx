"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Head from "next/head";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import { useRouter } from "next/navigation";
import { FaTimes, FaArrowRight } from "react-icons/fa";
import SiteDetails from "@/Data/SiteData";

const HeroSection = () => {
  const router = useRouter();
  const [showImageModal, setShowImageModal] = useState(true);
  const [showContentModal, setShowContentModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [sliderRef, instanceRef] = useKeenSlider(
    {
      loop: true,
      duration: 800,
      drag: false,
      slides: { perView: 1 },
    },
    [
      (slider) => {
        let timeout;
        let mouseOver = false;
        const clearNextTimeout = () => clearTimeout(timeout);
        const nextTimeout = () => {
          clearTimeout(timeout);
          if (mouseOver) return;
          timeout = setTimeout(() => slider.next(), 5000);
        };
        slider.on("created", () => nextTimeout());
        slider.on("dragStarted", clearNextTimeout);
        slider.on("animationEnded", nextTimeout);
        slider.on("updated", nextTimeout);
      },
    ]
  );

  // Use /public paths
  const slides = [
    { id: 1, src: "/banner/1.avif", alt: "Students learning together" },
    { id: 2, src: "/banner/2.avif", alt: "Graduation ceremony" },
    { id: 3, src: "/banner/3.avif", alt: "Digital learning environment" },
  ];

  useEffect(() => {
    const mobile = window.innerWidth < 768;
    setIsMobile(mobile);
    const handleResize = () => {
      const m = window.innerWidth < 768;
      setIsMobile(m);
      if (m) setShowContentModal(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Body scroll lock for modals
  useEffect(() => {
    document.body.style.overflow =
      showImageModal || showContentModal ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showImageModal, showContentModal]);

  const closeImageModal = useCallback(() => {
    setShowImageModal(false);
    if (!isMobile) setTimeout(() => setShowContentModal(true), 300);
  }, [isMobile]);

  const closeContentModal = useCallback(() => setShowContentModal(false), []);
  const handleNavigation = (path) => router.push(path);

  return (
    <>
      {/* Preload only the FIRST banner */}
      <Head>
        <link
          rel="preload"
          as="image"
          href="/banner/1.webp"
          // optional hint:
          // imagesrcset="/banner/1.webp 1920w"
        />
      </Head>

      <div className="mt-[80px] md:mt-20">
        {/* HERO SLIDER */}
        <section className="w-full relative">
          <div className="w-full h-full relative">
            <div ref={sliderRef} className="keen-slider">
              {slides.map((slide, i) => (
                <div key={slide.id} className="keen-slider__slide">
                  <div className="relative w-full aspect-[16/9]">
                    <img
                      src={slide.src}
                      alt={slide.alt}
                      fill
                      // ONLY first slide preloads; others lazy by default
                      priority={i === 0}
                      loading={i === 0 ? "eager" : "lazy"}
                      fetchPriority={i === 0 ? "high" : "auto"}
                      quality={70}
                      sizes="100vw"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Left 20% click area */}
            <div
              className="absolute left-0 top-0 w-1/5 h-full cursor-pointer z-10"
              onClick={() => instanceRef.current?.prev()}
            />
            {/* Right 20% click area */}
            <div
              className="absolute right-0 top-0 w-1/5 h-full cursor-pointer z-10"
              onClick={() => instanceRef.current?.next()}
            />
          </div>
        </section>

        {/* IMAGE MODAL (opens first) */}
        {showImageModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={closeImageModal}
          >
            <div className="fixed inset-0 bg-black/50" />
            <div
              className="relative max-w-2xl w-full mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-b from-green-900 to-green-700 rounded-t-xl p-4 flex items-center justify-between border-b">
                <div className="flex items-center gap-3">
                  {/* keep <img> for external/unknown domain logos */}
                  <img
                    src={SiteDetails.whitelogo}
                    alt="Logo"
                    className="h-12 w-12"
                    loading="eager"
                  />
                  <h1 className="font-bold text-xl text-white">
                    {SiteDetails.programName}
                  </h1>
                </div>
                <button
                  onClick={closeImageModal}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                >
                  <FaTimes className="text-gray-700 text-sm" />
                </button>
              </div>

              {/* Image */}
              <div className="shadow-2xl border border-yellow-400 bg-white overflow-hidden ">
                <div className="relative w-full h-full">
                  <img  src="/honhaarjawanpopup.avif"
                    alt="Honhaar Jawan Program"
                    loading="eager"
                    fetchPriority="high"
                    quality={70}
                    sizes="100vw" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CONTENT MODAL (desktop-only after image modal) */}
        {showContentModal && !isMobile && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-2 py-10 md:py-2 overflow-y-auto"
            onClick={closeContentModal}
          >
            <div className="fixed inset-0 bg-black/50" />
            <div
              className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl mx-auto overflow-y-auto max-h-[80vh] flex flex-col md:flex-row"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left panel */}
              <div className="md:w-2/5 bg-gradient-to-br from-green-600 to-emerald-700 p-5 flex flex-col justify-between">
                <div className="flex justify-between">
                  <img
                    src={SiteDetails.whitelogo}
                    alt=""
                    className="w-10 h-10"
                    loading="lazy"
                  />
                  <h2 className="text-lg text-white font-bold">
                    {SiteDetails.programName}
                  </h2>
                  <img
                    src="/white-gov-logo.png"
                    alt=""
                    className="w-10 h-10"
                    loading="lazy"
                  />
                </div>

                <div className="flex mt-4 justify-center">
                  <div className="relative w-full h-56 md:h-72">
                    <img
                      src="/Student-Card.avif"
                      alt="Honhaar Student Card"
                      fill
                      loading="lazy"
                      quality={70}
                    />
                  </div>
                </div>

                <div className="text-white text-center">
                  <p className="text-lg font-bold">80,000</p>
                  <p className="text-sm opacity-90">Honhaar Student Cards</p>
                </div>
              </div>

              {/* Right panel */}
              <div className="md:w-3/5 p-6 flex flex-col">
                <div className="mb-6 flex justify-between">
                  <p className="font-semibold text-gray-800 text-lg">
                    Honhaar Student Program
                  </p>
                  <button
                    onClick={closeContentModal}
                    className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-yellow-400 flex items-center justify-center hover:bg-gray-100 shadow-lg border border-gray-200"
                  >
                    <FaTimes className="text-gray-700 text-sm md:text-base" />
                  </button>
                </div>

                <div className="flex-1 space-y-4">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <p className="font-semibold text-orange-800 text-sm">
                      Limited Seats Available
                    </p>
                    <p className="text-orange-700 text-xs mt-1">
                      Enroll now in IT trainings
                    </p>
                  </div>

                  <p className="text-gray-700 text-sm leading-relaxed">
                    80,000 Honhaar Student cards available nationwide for
                    eligible applicants from Punjab, KPK, Sindh, Balochistan &
                    AJK.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="border rounded-lg p-3">
                      <p className="font-semibold text-gray-800 text-xs mb-2">
                        CONTACT
                      </p>
                      <div className="space-y-1 text-xs text-gray-700">
                        <p>Email: {SiteDetails.supportEmail}</p>
                      </div>
                    </div>
                    <div className="border rounded-lg p-3">
                      <p className="font-semibold text-gray-800 text-xs mb-2">
                        INFO
                      </p>
                      <div className="space-y-1 text-xs text-gray-700">
                        <p>Web: {SiteDetails.domain}</p>
                        <p>Mon–Fri, 9:00am–5:00pm</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <p className="text-xs text-gray-500">
                    Terms &amp; eligibility apply
                  </p>
                  <button
                    onClick={() => handleNavigation("/apply")}
                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-semibold text-sm flex items-center gap-2"
                  >
                    Apply Now <FaArrowRight className="text-xs" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default HeroSection;
