import Link from "next/link";
import React from "react";

const DashboardCard = ({
  title,
  value,
  today,
  yesterday,
  link,
  icon,
  css,
  iconCss,
  loading,
  verifiedUsers,
  unverifiedUsers,
  verifyPrefix,
  unVerifyPrefix,
}) => {
  return (
    <div className={`bg-white p-5 w-full rounded-lg shadow-lg ${css}`}>
      <h3 className="basefont heading-text text-[0.8rem]">{title}</h3>
      <div className="flex items-center my-1 justify-between">
        {/* Show loading spinner if loading is true */}
        {loading ? (
          <div className="animate-pulse text-gray-800">Loading...</div>
        ) : value ? (
          <h2 className="basefont text-xl">{value}</h2>
        ) : (
          <div className="text-gray-400">No Data Available</div>
        )}
        <h6 className="text-[0.65rem] text-gray-600">
          {today !== undefined && `today ${today} / yesterday ${yesterday}`}
        </h6>
      </div>
      {verifiedUsers ? (
        <div className="flex text-[13px] font-medium gap-1 items-center">
          <span className="text-primary">
            {verifyPrefix}{" "}
            <span className="font-bold text-[14px]">{verifiedUsers}</span>
          </span>
          <span className="text-gray-700">/</span>
          <span className="text-gray-500">
            {unVerifyPrefix} {unverifiedUsers}
          </span>
        </div>
      ) : (
        ""
      )}
      <div className="text-[0.9rem] flex justify-between items-end secondfont text-gray-600">
        <Link href={link}>
          <button className="underline">See All</button>
        </Link>
        <span className={`${iconCss}`}>{icon}</span>
      </div>
    </div>
  );
};

export default DashboardCard;
