// components/compo/Reviews.js
"use client";
import React, { useRef, useState } from "react";
import Slider from "react-slick";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ImSpinner } from "react-icons/im";

const Reviews = () => {
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState("en");
  const router = useRouter();
  const sliderRef = useRef(null);

  const handleClick = (path) => {
    setLoading(true);
    setTimeout(() => router.push(path), 1000);
  };

  const videos = [
    { id: 1, url: "https://player.vimeo.com/video/1026766875?badge=0" },
    { id: 2, url: "https://player.vimeo.com/video/1026766885?badge=0" },
    { id: 3, url: "https://player.vimeo.com/video/1026766894?badge=0" },
    { id: 4, url: "https://player.vimeo.com/video/1026766904?badge=0" },
    { id: 5, url: "https://player.vimeo.com/video/1026766911?badge=0" },
    { id: 6, url: "https://player.vimeo.com/video/1026766925?badge=0" },
    { id: 7, url: "https://player.vimeo.com/video/1026766933?badge=0" },
  ];

  const settings = {
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    centerMode: true,
    centerPadding: "0",
    arrows: false,
  };

  const content = {
    en: {
      title: "honhaar Jawan Event Highlights: Empowering Punjab's Future",
      subtitle:
        "Discover how honhaar Jawan is transforming lives by equipping Punjab's youth with vital freelancing skills.",
      cta: "Join Now",
    },
    ur: {
      title: "honhaar Jawan ایونٹ ہائی لائٹس: پنجاب کا مستقبل با-اختیار",
      subtitle:
        "جانیں کہ honhaar Jawan پنجاب کی نوجوان نسل کو فری لانسنگ مہارتوں سے کیسے با-اختیار بنا رہا ہے۔",
      cta: "ابھی شامل ہوں",
    },
  };

  return (
    <section className="py-16 px-4" style={{ backgroundColor: "#014710" }}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div
          className="text-white"
        >
          <h2 className="text-2xl md:text-4xl font-bold mb-4">
            {content[lang].title}
          </h2>
          <p className="mb-6">{content[lang].subtitle}</p>
          <button
            onClick={() => handleClick("/apply-now")}
            className="inline-flex items-center gap-2 bg-sec2 text-white px-6 py-3 rounded-md font-semibold"
          >
            {loading && <ImSpinner className="animate-spin" />}
            Secure Your Spot
          </button>
        </div>

        <div>
          <Slider {...settings} ref={sliderRef}>
            {videos.map((v) => (
              <div key={v.id} className="px-2">
                <div className="bg-white rounded-xl overflow-hidden shadow-lg">
                  <div className="aspect-video">
                    <iframe
                      src={v.url}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              </div>
            ))}
          </Slider>
          <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={() => sliderRef.current.slickPrev()}
              className="bg-primary text-white p-2 rounded-full"
            >
              ←
            </button>
            <button
              onClick={() => sliderRef.current.slickNext()}
              className="bg-primary text-white p-2 rounded-full"
            >
              →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Reviews;
