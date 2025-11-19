"use client";
import React, { useEffect, useRef, useState } from "react";
import { FaArrowLeft, FaDownload, FaPrint } from "react-icons/fa";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import Link from "next/link";
import useAuthStore from "@/store/useAuthStore";
import { courses } from "@/Data/Data";
import SiteDetails from "@/Data/SiteData";

const ChallanPageGov2 = ({ type }) => {
  const [allCourses, setAllCourses] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const challanRef = useRef(null);
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <div>Loading...</div>;
  }

  useEffect(() => {
    const printChallan = async () => {
      setIsPrinting(true);
      try {
        const cardsContainer =
          challanRef.current?.querySelector(".cards-container");
        if (!cardsContainer) {
          console.error("Cards container not found");
          return;
        }

        const printContainer = document.createElement("div");
        printContainer.style.padding = "20px";
        printContainer.style.backgroundColor = "#fff";
        printContainer.appendChild(cardsContainer.cloneNode(true));

        const style = document.createElement("style");
        style.innerHTML = `
          @media print {
            body * {
              visibility: hidden;
            }
            .print-container, .print-container * {
              visibility: visible;
            }
            .print-container {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 0px;
            }
            .cards-container {
              display: flex !important;
              gap: 20px !important;
            }
            .cards-container > div {
              flex: 1 !important;
              page-break-inside: avoid;
            }
          }
        `;

        printContainer.classList.add("print-container");
        printContainer.appendChild(style);

        document.body.appendChild(printContainer);

        await new Promise((resolve) => setTimeout(resolve, 500));

        window.print();

        setTimeout(() => {
          document.body.removeChild(printContainer);
        }, 0);
      } catch (error) {
        console.error("Error printing challan:", error);
      } finally {
        setIsPrinting(false);
      }
    };

    printChallan();
  }, []);

  useEffect(() => {
    if (!user || !courses) {
      setAllCourses([]);
      return;
    }

    try {
      const courseIdsSet = new Set(courses.map((course) => course.id));

      let selectedCourseIds = [];
      if (type === "initial") {
        selectedCourseIds = Array.isArray(user.selectedCourses)
          ? user.selectedCourses.filter((id) => courseIdsSet.has(id))
          : [];
      } else {
        return;
      }

      const selectedCourses = selectedCourseIds
        .map((id) => {
          const course = courses.find((c) => c.id === id);
          return course
            ? {
                id: course.id,
                name: course.name,
                amount: 3000,
              }
            : null;
        })
        .filter(Boolean);

      setAllCourses(selectedCourses);
    } catch (error) {
      console.error("Error processing courses:", error);
      setAllCourses([]);
    }
  }, [type, user, courses]);

  const downloadChallanAsPDF = async () => {
    setIsDownloading(true);
    try {
      const pdfContainer = document.createElement("div");
      pdfContainer.style.display = "flex";
      pdfContainer.style.flexDirection = "column";
      pdfContainer.style.gap = "20px";
      pdfContainer.style.padding = "20px";
      pdfContainer.style.backgroundColor = "#fff";
      pdfContainer.style.width = "100%";

      const cardsContainer =
        challanRef.current?.querySelector(".cards-container");
      if (!cardsContainer) {
        console.error("Cards container not found for PDF");
        return;
      }

      cardsContainer.style.width = "100%";
      cardsContainer.style.display = "flex";
      cardsContainer.style.gap = "20px";

      Array.from(cardsContainer.children).forEach((card) => {
        card.style.width = "";
        card.style.flex = "1";
        card.style.minHeight = "0";
      });

      pdfContainer.appendChild(cardsContainer.cloneNode(true));

      pdfContainer.style.position = "absolute";
      pdfContainer.style.left = "-9999px";
      document.body.appendChild(pdfContainer);

      const canvas = await html2canvas(pdfContainer, {
        scale: 3,
        logging: false,
        useCORS: true,
        height: pdfContainer.scrollHeight + 100,
        windowHeight: pdfContainer.scrollHeight + 100,
      });

      document.body.removeChild(pdfContainer);

      const pdfWidth = 297;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: pdfHeight > pdfWidth ? "p" : "l",
        unit: "mm",
        format: [pdfWidth, pdfHeight],
        compress: true,
      });

      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("digiNaujawan.pk_bankChallan.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    try {
      if (timestamp && typeof timestamp.toDate === "function") {
        const date = timestamp.toDate();
        const utcPlus5Date = new Date(date.getTime() + 5 * 60 * 60 * 1000);
        return utcPlus5Date.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
      }
      return "Invalid Date";
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "Invalid Date";
    }
  };

  const ChallanCopy = ({ title = "Bank Invoice" }) => {
    // Calculate total amount from courses
    const applicationFee = 5000;
    const courseTotal = allCourses.reduce(
      (sum, course) => sum + course.amount,
      0
    );
    const totalAmount = applicationFee + courseTotal;

    return (
      <div className="w-[20rem] lg:w-[31rem] bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-700 to-green-900 text-white p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <img src="/1Link.jpg" alt="logo" className="h-10" />
              <img src={SiteDetails.whitelogo} alt="logo" className="h-12" />
            </div>
            <div className="text-right">
              <h1 className="text-xl font-bold uppercase tracking-wide">
                {title}
              </h1>
              <p className="text-xs opacity-90">OFFICIAL DOCUMENT</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* Title and Invoice Number */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-green-800 uppercase tracking-wide">
              Bank Challan
            </h1>
            <div className="mt-3 inline-block bg-green-50 rounded-lg px-4 py-2">
              <span className="text-sm font-medium text-gray-700">
                1BILL No.{" "}
              </span>
              <span className="text-md font-medium  bold text-green-800 ml-2">
                {user?.generatedPayProId?.consumerNumber}
              </span>
            </div>
          </div>

          {/* Student Information */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 border-l-4 border-green-700">
            <h2 className="text-lg font-bold text-green-800 mb-3 flex items-center">
              <span className="bg-green-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">
                1
              </span>
              Student Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Name
                </p>
                <p className="text-base font-semibold text-gray-900">
                  {user?.fullName || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  C.N.I.C
                </p>
                <p className="text-base font-semibold text-gray-900">
                  {user?.cnic || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Issue Date
                </p>
                <p className="text-base font-semibold text-gray-900">
                  {formatTimestamp(user?.generatedPayProId?.created_at)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Due Date
                </p>
                <p className="text-base font-semibold text-gray-900">
                  {user?.generatedPayProId?.created_at
                    .toDate()
                    .toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                </p>
              </div>
            </div>
          </div>

          {/* Fee Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 border-l-4 border-green-700">
            <h2 className="text-lg font-bold text-green-800 mb-3 flex items-center">
              <span className="bg-green-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">
                2
              </span>
              Fee Details
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-green-100">
                    <th className="border border-green-800 p-2 text-sm text-left font-bold text-green-800">
                      Course Title
                    </th>
                    <th className="border border-green-800 p-2 text-sm font-bold text-green-800 text-center">
                      Amount (PKR)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {allCourses.map((course, index) => (
                    <tr key={index}>
                      <td className="border border-green-800 p-2 text-sm text-gray-800">
                        {course.name}
                      </td>
                      <td className="border border-green-800 p-2 text-sm text-gray-800 text-center">
                        {course.amount}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td className="border border-green-800 p-2 text-sm text-gray-800 font-medium">
                      Application Processing Fee
                    </td>
                    <td className="border border-green-800 p-2 text-sm text-gray-800 text-center">
                      {applicationFee}
                    </td>
                  </tr>
                  <tr className="bg-green-100">
                    <td className="border border-green-800 p-2 text-sm font-bold text-green-800">
                      Total Payable Amount
                    </td>
                    <td className="border border-green-800 p-2 text-lg font-bold text-green-800 text-center">
                      {totalAmount} PKR
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Bank Information */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 border-l-4 border-green-700">
            <h2 className="text-lg font-bold text-green-800 mb-3 flex items-center">
              <span className="bg-green-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">
                3
              </span>
              Bank Information
            </h2>
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Teller Signature & Bank Stamp
              </p>
              <div className="border-b-2 border-dashed border-gray-400 h-12"></div>
            </div>
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Instructions:</span> Pay your
                challan before the due date at any of the listed banks. For any
                queries, you can email us at {SiteDetails.programName}.
              </p>
            </div>
          </div>

          {/* Bank Logos */}
          <div className="mb-4">
            <div className="grid grid-cols-7 gap-2 justify-items-center">
              <img
                src="/Baller/payment-meezanbank.avif"
                className="w-12 h-12"
                alt="Meezan Bank"
              />
              <img
                src="/Baller/payment-alliedbank.avif"
                className="w-12 h-12"
                alt="Allied Bank"
              />
              <img
                src="/Baller/MCB.avif"
                className="w-12 h-12"
                alt="MCB Bank"
              />
              <img
                src="/Baller/payment-hbl.avif"
                className="w-12 h-12"
                alt="HBL Bank"
              />
              <img
                src="/Baller/jsBank.avif"
                className="w-12 h-12"
                alt="JS Bank"
              />
              <img
                src="/Baller/ScBank.avif"
                className="w-12 h-12"
                alt="Standard Chartered"
              />
              <img
                src="/Baller/ubl.avif"
                className="w-12 h-12"
                alt="UBL Bank"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-green-700 to-green-900 text-white p-3 text-center">
          <p className="text-sm font-medium">
            Official Document - Valid Only With Bank Stamp
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 ">
      <div className="">
        <div className="flex justify-center w-full mx-auto px-2 pt-4 items-center mb-6">
          <Link
            className="px-5 py-2 rounded-md bg-sec2 hover:bg-primary text-white font-medium transition-colors duration-200 flex items-center gap-2 shadow-md"
            href={"/dashboard"}
          >
            <FaArrowLeft />
            Back to Dashboard
          </Link>
          <div className="flex ml-3">
            <button
              onClick={() => window.print()}
              disabled={isPrinting}
              className="px-12 py-2 rounded-md bg-sec2 hover:bg-primary text-white font-medium transition-colors duration-200 flex items-center gap-2 shadow-md disabled:opacity-70"
            >
              <FaPrint />
              {isPrinting ? "Printing..." : "Print"}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-0.5" ref={challanRef}>
          <div className="overflow-x-auto">
            <div className="flex flex-nowrap gap-4 pb-4 min-w-max cards-container">
              <div className="flex-shrink-0">
                <ChallanCopy title="Bank Copy" />
              </div>
              <div className="flex-shrink-0">
                <ChallanCopy title="Depositor's Copy" />
              </div>
              <div className="flex-shrink-0">
                <ChallanCopy title="Institute's Copy" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallanPageGov2;
