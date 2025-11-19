import React, { useEffect, useState, useRef } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
} from "chart.js";

// Register necessary Chart.js components
ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  CategoryScale
);

const TotalRevenueGraphChart = ({ revenueData }) => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });
  const chartRef = useRef(null);

  useEffect(() => {
    if (revenueData && revenueData.length) {
      // Sort data by created_at
      const sortedData = [...revenueData].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );

      // Extract labels (dates) and data (amounts), handling invalid dates
      const labels = sortedData.map((entry) => {
        const date = new Date(entry.created_at);
        return !isNaN(date) ? date.toLocaleDateString() : "Invalid Date";
      });

      const data = sortedData.map((entry) => entry.amount);

      // Create a gradient for the chart background
      const chart = chartRef.current;
      const ctx = chart?.ctx;
      let gradient = null;
      if (ctx) {
        gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, "rgba(75, 192, 192, 0.4)");
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      }

      setChartData({
        labels,
        datasets: [
          {
            label: "Total Revenue",
            data,
            borderColor: "#4bc0c0",
            backgroundColor: gradient || "rgba(75, 192, 192, 0.2)",
            borderWidth: 3,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: "#4bc0c0",
            tension: 0.4, // Smooth curve
            fill: true, // Gradient fill under the line
          },
        ],
      });
    }
  }, [revenueData]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: {
            size: 14,
            family: "'Poppins', sans-serif",
          },
          color: "#4bc0c0",
        },
      },
      tooltip: {
        backgroundColor: "#333",
        titleColor: "#FFF",
        bodyColor: "#FFF",
        cornerRadius: 8,
        callbacks: {
          label: (context) => `Revenue: ${context.raw} PKR`,
        },
      },
    },
    scales: {
      x: {
        stacked: true, // Enable stacking for the X axis
        title: {
          display: true,
          text: "Date",
          font: {
            size: 14,
            family: "'Poppins', sans-serif",
            weight: "bold",
          },
          color: "#333",
        },
        ticks: {
          font: {
            size: 12,
            family: "'Poppins', sans-serif",
          },
          color: "#666",
        },
        grid: {
          color: "rgba(200, 200, 200, 0.2)",
        },
      },
      y: {
        stacked: true, // Enable stacking for the Y axis
        title: {
          display: true,
          text: "Revenue (PKR)",
          font: {
            size: 14,
            family: "'Poppins', sans-serif",
            weight: "bold",
          },
          color: "#333",
        },
        ticks: {
          font: {
            size: 12,
            family: "'Poppins', sans-serif",
          },
          color: "#666",
        },
        beginAtZero: true,
        grid: {
          color: "rgba(200, 200, 200, 0.2)",
        },
      },
    },
  };

  return (
    <div
      style={{
        width: "80%",
        height: "500px",
        margin: "0 auto",
        padding: "8px",
        background: "white",
        borderRadius: "8px",
        display: "flex",
        alignItems: "start",
        flexDirection: "column",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
      }}
    >
      <h1 className=" font-bold text-gray-600 text-xl">Total Revenue</h1>
      <hr className="border-gray-200 my-2 w-full" />
      <Line ref={chartRef} data={chartData} options={options} />
    </div>
  );
};

export default TotalRevenueGraphChart;
