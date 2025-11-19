import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaImage, FaTimes } from "react-icons/fa";

const PayproPaymentImages = ({ isDownloadButton, user }) => {
  const [selectedBank, setSelectedBank] = useState(null);
  const [animateModal, setAnimateModal] = useState(false);

  const bankImages = [
    {
      id: 1,
      bankName: "JazzCash",
      thumbnail: "/Baller/payment-jazzcash.avif",
      imagePrefix: "jazzcash",
      imageCount: 6,
    },
    {
      id: 2,
      bankName: "Easypaisa",
      thumbnail: "/Baller/payment-easypaisa.avif",
      imagePrefix: "easypaisa",
      imageCount: 6,
    },
    {
      id: 3,
      bankName: "Meezan Bank Old App",
      thumbnail: "/Baller/payment-meezanbank.avif",
      imagePrefix: "meezanbank",
      imageCount: 6,
    },
    {
      id: 4,
      bankName: "HBL",
      thumbnail: "/Baller/payment-hbl.avif",
      imagePrefix: "hbl",
      imageCount: 6, // 6 hbl + 5 HBL 1
    },
    // {
    //   id: 5,
    //   bankName: "Askari Bank",
    //   thumbnail: "/Baller/payment-askaribank.avif",
    //   imagePrefix: "askari",
    //   imageCount: 0, // No images available
    // },
    {
      id: 6,
      bankName: "Bank Alfalah",
      thumbnail: "/Baller/payment-alfalahbank.avif",
      imagePrefix: "alflah",
      imageCount: 8,
    },
    {
      id: 7,
      bankName: "Faysal Bank",
      thumbnail: "/Baller/faysal.png",
      imagePrefix: "faysalbank",
      imageCount: 7,
    },
    // {
    //   id: 8,
    //   bankName: "Allied Bank",
    //   thumbnail: "/Baller/payment-alliedbank.avif",
    //   imagePrefix: "allied",
    //   imageCount: 0, // No images available
    // },
    // {
    //   id: 9,
    //   bankName: "JS Bank",
    //   thumbnail: "/Baller/jsbank.avif",
    //   imagePrefix: "jsbank",
    //   imageCount: 0, // No images available
    // },
    // {
    //   id: 10,
    //   bankName: "Silk Bank",
    //   thumbnail: "/Baller/skillsBank.avif",
    //   imagePrefix: "silk",
    //   imageCount: 0, // No images available
    // },
    // {
    //   id: 11,
    //   bankName: "SC Bank",
    //   thumbnail: "/Baller/ScBank.avif",
    //   imagePrefix: "scbank",
    //   imageCount: 0, // No images available
    // },
    // {
    //   id: 12,
    //   bankName: "Summit Bank",
    //   thumbnail: "/Baller/SummitBank.avif",
    //   imagePrefix: "summit",
    //   imageCount: 0, // No images available
    // },
    {
      id: 13,
      bankName: "UBL",
      thumbnail: "/Baller/ubl.avif",
      imagePrefix: "ubl",
      imageCount: 9,
    },
    // {
    //   id: 14,
    //   bankName: "MCB",
    //   thumbnail: "/Baller/MCB.avif",
    //   imagePrefix: "mcb",
    //   imageCount: 0, // No images available
    // },
    // {
    //   id: 15,
    //   bankName: "Bank Islami",
    //   thumbnail: "/Baller/bankislami.avif",
    //   imagePrefix: "bankislami",
    //   imageCount: 0, // No images available
    // },
  ];

  const handleBankClick = (bank) => {
    setSelectedBank(bank);
    document.body.style.overflow = "hidden";
    setTimeout(() => setAnimateModal(true), 10);
  };

  const closeModal = () => {
    setAnimateModal(false);
    setTimeout(() => {
      setSelectedBank(null);
      document.body.style.overflow = "auto";
    }, 300);
  };

  // Function to get the correct image path based on the bank
  const getImagePath = (bank, index) => {
    // Default pattern for other banks
    return `/ppsc/${bank.imagePrefix}${index + 1}.avif`;
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-blue-100 rounded-full px-4 py-2 mb-3">
          <span className="text-sm font-semibold text-blue-700">
            Step-by-Step Image Guides
          </span>
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          Select Your Bank
        </h3>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Click on your bank to view detailed payment instructions with
          screenshots
        </p>
      </div>

      {/* Bank Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {bankImages.map((bank) => (
          <div
            key={bank.id}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            className="group bg-white rounded-2xl shadow-md hover:shadow-xl flex items-center transition-all duration-300 cursor-pointer border border-gray-200 overflow-hidden"
            onClick={() => handleBankClick(bank)}
          >
            <div className="flex flex-col items-center p-4">
              <div className="flex gap-3 w-full items-center">
                <div className="w-12 h-12">
                  <img src={bank.thumbnail} className="" alt={bank.bankName} />
                </div>

                <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors duration-300">
                  {bank.bankName}
                </p>
              </div>
              <div className="mt-2 lg:hidden transition-opacity duration-300">
                <div className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                  <FaImage className="text-xs" />
                  <span>View Guide</span>
                </div>
              </div>
              <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                  <FaImage className="text-xs" />
                  <span>View Guide</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Modal */}
      <AnimatePresence>
        {selectedBank && (
          <div
            onClick={closeModal}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            style={{ top: 0, left: 0, right: 0, bottom: 0 }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FaImage className="text-blue-600 text-lg" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      Payment Guide - {selectedBank.bankName}
                    </h2>
                    <p className="text-gray-600 text-sm">
                      Step-by-step payment instructions with screenshots
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-200 text-gray-500 hover:text-gray-700"
                >
                  <FaTimes className="text-lg" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto">
                {/* Images Section */}
                <div className="p-6 bg-white">
                  {selectedBank.imageCount > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <FaImage className="text-green-600 text-sm" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">
                          Payment Screenshots
                        </h3>
                      </div>

                      <div className="space-y-4">
                        {Array.from({ length: selectedBank.imageCount }).map(
                          (_, index) => (
                            <div
                              key={index}
                              className="flex flex-col items-center"
                            >
                              <div className="bg-gray-100 rounded-lg p-2 border border-gray-200 w-full max-w-md">
                                <img
                                  src={getImagePath(selectedBank, index)}
                                  alt={`${selectedBank.bankName} Step ${
                                    index + 1
                                  }`}
                                  className="w-full rounded-md shadow-md"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src =
                                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect fill='%23f0f0f0' width='300' height='200'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='16' dy='.3em' text-anchor='middle' x='150' y='100'%3EImage not available%3C/text%3E%3C/svg%3E";
                                  }}
                                />
                                <p className="text-center text-sm text-gray-600 mt-2">
                                  Step {index + 1}
                                </p>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                      <FaImage className="text-4xl text-gray-400 mb-4" />
                      <p className="text-gray-600 font-medium">
                        Images not available
                      </p>
                      <p className="text-gray-500 text-sm mt-1">
                        Screenshots for {selectedBank.bankName} are currently
                        missing
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    Need help? Contact our support team
                  </p>
                  <button
                    onClick={closeModal}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
                  >
                    Close Guide
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PayproPaymentImages;
