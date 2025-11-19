"use client";
import React from "react";
import { motion, useAnimationFrame } from "framer-motion";
import SiteDetails from "@/Data/SiteData";

const partnersData = [
  {
    name: "Govt of Punjab",
    logo: "https://ehunar.org/assets/front/images/govtpunjab.png",
    alt: "Government of Punjab Logo",
  },
  {
    name: "PEC",
    logo: "https://ehunar.org/assets/front/images/pec.png",
    alt: "Pakistan Engineering Council (PEC) Logo",
  },
  {
    name: "Univ of Punjab",
    logo: "https://ehunar.org/assets/front/images/logopu.png",
    alt: "University of the Punjab (PU) Logo",
  },
  {
    name: "PHEC",
    logo: "https://ehunar.org/assets/front/images/phec.png",
    alt: "Punjab Higher Education Commission (PHEC) Logo",
  },

];

// Marquee logic using raw animation frame updates
function InfiniteMarquee({ children, speed = 100 }) {
  const containerRef = React.useRef(null);
  const contentRef = React.useRef(null);
  const x = React.useRef(0);

  useAnimationFrame((_, delta) => {
    if (!containerRef.current || !contentRef.current) return;
    const containerWidth = containerRef.current.offsetWidth;
    const contentWidth = contentRef.current.offsetWidth;

    x.current -= (speed * delta) / 500;
    if (-x.current >= contentWidth / 2) x.current = 0;

    contentRef.current.style.transform = `translateX(${x.current}px)`;
  });

  return (
    <div ref={containerRef} className="overflow-hidden w-full">
      <div ref={contentRef} className="flex w-max gap-8">
        {children}
        {children}
      </div>
    </div>
  );
}

const PartnerCard = ({ partner }) => (
  <div className="w-64   shrink-0">
    <div className="bg-white rounded-xl p-6 shadow-2xl border-2 border-second/20 hover:border-second transition-all duration-300 h-52">
      <div className="flex flex-col items-center">
        <div className="w-32 h-32 mb-4 rounded-full bg-second/10 p-4 flex items-center justify-center">
          <img
            src={partner.logo}
            alt={partner.alt}
            className="w-full h-full object-contain grayscale hover:grayscale-0 transition-all"
          />
        </div>
        <h3 className="text-center text-lg font-bold text-primary">
          {partner.name}
        </h3>
      </div>
    </div>
  </div>
);

const Partners = () => {
  return (
    <section className="py-16 px-4 bg-primary relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            <span className="block text-second font-serif mb-2">Official</span>
            Government Partnerships
          </h2>
          <div className="w-32 h-1 bg-second mx-auto mb-6 rounded-full" />
          <p className="text-lg text-white/90 max-w-2xl mx-auto font-medium">
            Our platform is recognized by leading government organizations,
            helping to make digital education accessible and reliable for all
            citizens.
          </p>
        </div>

        {/* Infinite Marquee */}
        <InfiniteMarquee speed={40}>
          {partnersData.map((partner, index) => (
            <PartnerCard key={`${partner.name}-${index}`} partner={partner} />
          ))}
        </InfiniteMarquee>

        {/* Certification */}
        <div className="mt-16 text-center">
          <div className="inline-flex flex-col items-center bg-second/70 px-8 py-6 rounded-2xl backdrop-blur-sm">
            <div className="bg-second p-4 rounded-full mb-4 shadow-lg">
              <svg
                className="w-12 h-12 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <p className="text-sm font-bold text-lime-300 uppercase tracking-wider">
              Government Endorsed
            </p>
            <p className="text-warn font-bold mt-2 text-lg">
              {SiteDetails.programName}  is officially recognized and certified by
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Partners;
