import SiteDetails from "@/Data/SiteData";
import React from "react";

const Copyright = () => {
  return (
    <div className="bg-second py-3.5 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Official Government Seal and Main Info */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <p className="text-white text-sm font-semibold mb-1">
              {SiteDetails.programName} 
            </p>
            <p className="text-white text-xs">
              {SiteDetails.programName} ©{" "}
              {new Date().getFullYear()}. All Rights Reserved. Developed and
              Maintained by {SiteDetails.programName}.
            </p>
          </div>
          {/* Official Links - Updated */}
          <div className="flex flex-wrap justify-center gap-4 text-xs">
            <a
              href="/terms-conditions"
              className="text-slate-300 hover:text-white transition-colors"
            >
              Terms & Conditions
            </a>
            <a
              href="/privacy-policy"
              className="text-slate-300 hover:text-white transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="/refund-policy"
              className="text-slate-300 hover:text-white transition-colors"
            >
              Refund Policy
            </a>
            <a
              href="/contact"
              className="text-slate-300 hover:text-white transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Copyright;
