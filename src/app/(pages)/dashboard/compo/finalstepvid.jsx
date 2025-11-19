import React, { useEffect } from "react";
import { FaTimes, FaVideo } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

// Video data object
const videoData = {
  title: "How to pay | Honhaar Jawan?",
  videoLink:
    "https://player.vimeo.com/video/1135664506?title=0&amp;byline=0&amp;portrait=0&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479",
};

const FinalStepsModal = ({ isOpen, setIsOpen }) => {
  // Handle click outside the modal
  const handleClickOutside = (event) => {
    if (event.target === event.currentTarget) {
      setIsOpen(false);
    }
  };

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, setIsOpen]);

  return (
    <>
      {/* The modal itself */}
      <AnimatePresence>
        {isOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[1000]"
            style={{ pointerEvents: "auto" }}
            onClick={handleClickOutside}
          >
            <div className="bg-white rounded-b-xl rounded-t-md w-full max-w-3xl max-h-[90vh] overflow-y-hidden">
              {/* Video Section */}
              <div className="">
                <div className="aspect-video w-full rounded-md overflow-hidden bg-gray-100">
                  <div className="flex   justify-self-end p-1 items-center absolute">
                    <button
                      onClick={() => setIsOpen(false)}
                      className="text-sec2 transition-colors"
                    >
                      <FaTimes size={20} />
                    </button>
                  </div>
                  <iframe
                    src={videoData.videoLink}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="mt-4">
                  <h2 className="text-lg font-semibold py-3 bg-sec2 px-2 text-white italic">
                    {videoData.title}
                  </h2>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FinalStepsModal;
