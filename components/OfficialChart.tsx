"use client";

import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartEvent,
  ActiveElement
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

interface RoleCount {
  role: string;
  total: number;
  color?: string;
}

interface OfficialChartProps {
  roleCounts?: RoleCount[];
  onOfficialClick?: (role: string) => void;
  // Fallback support for older props if needed
  onFilterChange?: (role: string) => void;
}

const OFFICIAL_MAPPING: Record<string, string> = {
  Walikota: "#87CEEB",
  "Wakil Walikota": "#FFD700",
  Sekda: "#964B00",
  "Pejabat Lainnya": "#64748b",
};

function useDarkMode() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDark = () => document.documentElement.classList.contains("dark");
    setIsDark(checkDark());

    const observer = new MutationObserver(() => {
      setIsDark(checkDark());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return isDark;
}

export default function OfficialChart({
  roleCounts = [],
  onOfficialClick,
  onFilterChange,
}: OfficialChartProps) {
  const isDark = useDarkMode();
  const borderColor = isDark ? "#1e293b" : "#ffffff";

  // Filter out zero totals if you don't want them to show, or keep them
  // The original mapping in getDashboardSummary uses "Walikota", "Wakil Walikota", "Sekda", "Pejabat Lainnya"
  const labels = roleCounts.map(item => item.role);
  const dataValues = roleCounts.map(item => item.total);
  const bgColors = roleCounts.map(item => item.color || OFFICIAL_MAPPING[item.role] || "#64748b");

  const data = {
    labels,
    datasets: [
      {
        data: dataValues,
        backgroundColor: bgColors,
        borderColor: borderColor,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "60%",
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: isDark ? "#cbd5e1" : "#475569",
          padding: 20,
          font: {
            size: 12,
            family: "'Inter', 'Roboto', sans-serif"
          }
        },
      },
      datalabels: {
        color: "#fff",
        font: {
          weight: "bold" as const,
          size: 14
        },
        formatter: (value: number) => {
          return value > 0 ? value : "";
        },
      },
      tooltip: {
        backgroundColor: isDark ? "#1e293b" : "#ffffff",
        titleColor: isDark ? "#ffffff" : "#1e293b",
        bodyColor: isDark ? "#cbd5e1" : "#475569",
        borderColor: isDark ? "#334155" : "#e2e8f0",
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: function (context: any) {
            const value = context.parsed;
            const total = context.dataset.data.reduce(
              (a: number, b: number) => a + b,
              0
            );
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return ` ${context.label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
    onClick: (event: ChartEvent, elements: ActiveElement[]) => {
      if (elements && elements.length > 0) {
        const index = elements[0].index;
        const clickedLabel = labels[index];
        if (onOfficialClick) onOfficialClick(clickedLabel);
        if (onFilterChange) onFilterChange(clickedLabel);
      }
    },
  };

  const totalBerita = dataValues.reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-300 dark:border-slate-700 p-4 sm:p-5 space-y-4 flex flex-col w-full h-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
        <h3 className="text-lg sm:text-xl font-bold flex items-center gap-3 text-slate-800 dark:text-white">
          <i className="fas fa-users text-blue-500 text-xl sm:text-2xl"></i>
          Statistik Pejabat
        </h3>
      </div>
      
      <div className="relative w-full h-[300px] flex items-center justify-center">
        {totalBerita > 0 ? (
          <Doughnut data={data} options={options} />
        ) : (
          <div className="text-slate-500 dark:text-slate-400 text-center">
            Tidak ada data pejabat untuk ditampilkan
          </div>
        )}
      </div>
    </div>
  );
}
