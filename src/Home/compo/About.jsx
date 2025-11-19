"use client";

import SiteDetails from "@/Data/SiteData";
import Link from "next/link";
import React, { useState, useRef } from "react";
import { ImSpinner } from "react-icons/im";

const About = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [mainVideo, setMainVideo] = useState({
    id: 1,
    title: "Minister of Education - Rana Sikandar Hayat",
    url: "https://player.vimeo.com/video/1134155677?badge=0&autopause=0&player_id=0&app_id=58479",
    description:
      "The Jawan Skills Development Initiative (Honhaar Jawan) is a transformative program dedicated to empowering the youth of Jawan through vocational and technical education.",
  });

  const [playlist, setPlaylist] = useState([
    {
      id: 2,
      title: "About Honhaar Jawan Program",
      url: "https://player.vimeo.com/video/1134154942?badge=0&autopause=0&player_id=0&app_id=58479",
      description:
        "Explore the vision for a tech-empowered Punjab and the future opportunities awaiting learners.",
    },
    {
      id: 3,
      title:
        "Honhaar Jawan | A Government of Punjab-Endorsed Initiative for Youth Empowerment",
      url: "https://player.vimeo.com/video/1134155924?badge=0&autopause=0&player_id=0&app_id=58479",
      description:
        "Discover how Honhaar Jawan equips students with practical IT skills for real-world opportunities.",
    },
    {
      id: 4,
      title: "Why Choose Us: Advancing National Goals with Accountability",
      url: "https://player.vimeo.com/video/1134154913?badge=0&autopause=0&player_id=0&app_id=58479",
      description:
        "Why Choose Us: Advancing National Goals with Accountability",
    },
    {
      id: 5,
      title: "Honhaar Jawan Student Card",
      url: "https://player.vimeo.com/video/1134154966?badge=0&autopause=0&player_id=0&app_id=58479",
      description:
        "Hear inspiring stories from students who transformed their careers through Honhaar Jawan.",
    },
    {
      id: 6,
      title: "Honhaar Jawan Laptop Scheme",
      url: "https://player.vimeo.com/video/1134155018?badge=0&autopause=0&player_id=0&app_id=58479",
      description:
        "Step-by-step guide on applying to the program and starting your learning journey.",
    },
    {
      id: 7,
      title: "Get to know the experts and educators behind the Honhaar Jawan training modules.",
      url: "https://player.vimeo.com/video/1134154977?badge=0&autopause=0&player_id=0&app_id=58479",
      description:
        "Get to know the experts and educators behind the Honhaar Jawan training modules.",
    },
  ]);

  const scrollerRef = useRef(null);

  // Handle swapping main video with selected playlist video
  const handleVideoSelect = (index) => {
    const selectedVideo = playlist[index];

    // Swap main and selected videos
    const newPlaylist = [...playlist];
    newPlaylist[index] = mainVideo;
    setMainVideo(selectedVideo);
    setPlaylist(newPlaylist);
  };

  return (
    <div className="min-h-screen -mt-2 text-white">
      <div className="max-w-7xl mx-auto px-4 pt-12">
        {/* Top Section: text + big video */}
        <div className="flex flex-col lg:flex-row rounded-xl overflow-hidden items-stretch h-auto">
          {/* Left Side */}
          <div className="flex flex-col py-6 px-4 bg-second lg:w-1/3 w-full">
            <div className="text-center mb-1">
              <p className="bg-black/30 rounded-b-lg p-4 border border-gray-700">
                <span className="block text-lg font-semibold text-gray-200 mb-0.5 opacity-90">
                  Under the patronage of
                </span>
                <span className="block text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-yellow-200">
                  Minister for School & Higher Education, Punjab
                </span>
                <span className="block text-lg font-medium text-gray-300 mt-1">
                  Rana Sikandar Hayat
                </span>
              </p>

              <div className="text-sm md:text-base px-4 py-2 inline-block">
                <h1 className="text-2xl md:text-2xl font-bold">
                  Join the Future with <br />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-yellow-200">
                    {SiteDetails.programName}
                  </span>
                </h1>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm leading-relaxed">
                <span className="font-bold">{SiteDetails.programName}</span> is
                a visionary initiative under the patronage of the Honourable
                Minister for School & Higher Education, Honhaar, Mr. Rana
                Sikandar Hayat. It aims to empower the youth with advanced IT
                skills through a structured and inclusive training program. The
                Honhaar Student Card grants eligible participants access to free
                IT training, laptops, solar energy support, education financing,
                international study pathways, and more — all facilitated via a
                transparent and accountable system to ensure equitable and
                high-quality skill development.
              </p>
            </div>
          </div>

          {/* Right Side - Main Video */}
          <div className="lg:w-2/3 w-full  bg-white flex flex-col">
            <div className="relative w-full aspect-video">
              <iframe
                key={mainVideo.id}
                src={mainVideo.url}
                className="w-full h-full "
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title={mainVideo.title}
              />
            </div>
            {/* Video Title - Now properly positioned and dynamic */}
            <div className="bg-sec2 text-white p-2 border-t border-gray-600">
              <h3 className="text-lg font-semibold">{mainVideo.title}</h3>
            </div>
          </div>
        </div>

        {/* Playlist */}
        <div className="mt-8 relative">
          <h2 className="text-xl font-semibold mb-3">Video Playlist</h2>

          {/* Scroll buttons */}
          <button
            onClick={() =>
              scrollerRef.current?.scrollBy({ left: -250, behavior: "smooth" })
            }
            className="absolute left-0 top-1/2 -translate-y-1/2 -ml-6 bg-gray-100 text-gray-900 rounded-full p-2 z-10 transition "
            aria-label="Scroll Left"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
          </button>

          <button
            onClick={() =>
              scrollerRef.current?.scrollBy({ left: 250, behavior: "smooth" })
            }
            className="absolute right-0 top-1/2 -translate-y-1/2 -mr-6 bg-gray-100 text-gray-900 rounded-full p-2 z-10 transition  "
            aria-label="Scroll Right"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </button>

          {/* Scrollable container */}
          <div
            ref={scrollerRef}
            className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-700 scroll-smooth"
          >
            {playlist.map((v, i) => (
              <div
                key={v.id}
                className="relative flex-shrink-0 w-44 sm:w-56 md:w-64 snap-start rounded-lg overflow-hidden hover:scale-[1.02] transition-transform duration-200 bg-gray-800"
              >
                {/* Preview */}
                <iframe
                  src={`${v.url}&muted=1&autoplay=0&controls=0&title=0&byline=0&portrait=0`}
                  className="pointer-events-none w-full h-full aspect-video"
                  loading="lazy"
                  frameBorder="0"
                  title={`${v.title} (preview)`}
                  referrerPolicy="no-referrer"
                />
                {/* Click overlay */}
                <button
                  onClick={() => handleVideoSelect(i)}
                  className="absolute inset-0"
                  aria-label={`Play ${v.title}`}
                  title={v.title}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-2">
                  <div className="text-xs font-medium line-clamp-2">
                    {v.title}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
