"use client";
import React, { useEffect, useState } from "react";
import { TotalSales } from "@/Backend/firebasefunctions"; // Import the enhanced TotalSales function
import SalesPieChart from "./charts/SalesPieChart";

const StatsDashboard = () => {
  const [labels, setLabels] = useState([
    "Successful Payments",
    "Pending Payments",
  ]);
  const [dataValues, setDataValues] = useState([0, 0]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch stats from the TotalSales function
        const salesStats = await TotalSales();

        if (salesStats) {
          setDataValues([salesStats.totalSuccess, salesStats.totalPending]);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-600">Sales Stats</h2>
      <hr className="my-2 border-gray-300" />
      <SalesPieChart labels={labels} dataValues={dataValues} />
    </div>
  );
};

export default StatsDashboard;