"use client";

import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      mode: "index" as const,
      intersect: false,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        display: true,
        color: "rgba(200, 200, 200, 0.2)",
      },
      ticks: {
        stepSize: 100,
      },
    },
    x: {
      grid: {
        display: false,
      },
    },
  },
};

export function ActivityChart({ data }: { data: any }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm h-full">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Activity</h3>
      <div className="h-64">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
