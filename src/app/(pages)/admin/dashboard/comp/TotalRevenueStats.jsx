import React from "react";
import TotalRevenueGraphChart from "./charts/TotalRevenueGraphChart";

const TotalRevenueStats = ({ data }) => {
  return <TotalRevenueGraphChart revenueData={data} />;
};

export default TotalRevenueStats;