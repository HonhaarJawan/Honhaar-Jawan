import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

// Register the necessary Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const SalesPieChart = ({ labels, dataValues, chartTitle = "Payment Stats" }) => {
  // Define dynamic colors for successful and pending payments
  const colors = labels.map((label) =>
    label.toLowerCase().includes("successful") ? "#28A745" : "#DC3545"
  ); // Green for successful, Red for pending

  const hoverColors = labels.map((label) =>
    label.toLowerCase().includes("successful") ? "#218838" : "#C82333"
  ); // Darker shades for hover

  // Define data for the chart
  const data = {
    labels: labels, // Labels for the pie slices
    datasets: [
      {
        label: chartTitle,
        data: dataValues, // Data values for each slice
        backgroundColor: colors, // Dynamic background colors
        hoverBackgroundColor: hoverColors, // Dynamic hover colors
        hoverOffset: 10,
      },
    ],
  };

  // Chart options
  const options = {
    plugins: {
      legend: {
        position: "top", // Position of the legend
        labels: {
          boxWidth: 20,
          padding: 15,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const value = context.raw;
            const total = context.dataset.data.reduce(
              (acc, val) => acc + val,
              0
            );
            const percentage = ((value / total) * 100).toFixed(2);
            return `${context.label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
    maintainAspectRatio: false,
    responsive: true,
  };

  return (
    <div style={{ width: "400px", margin: "0 auto", height: "400px" }}>
      <Pie data={data} options={options} />
    </div>
  );
};

export default SalesPieChart;