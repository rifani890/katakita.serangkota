"use client";

import { useEffect, useRef } from "react";
import type { OfficialCountItem } from "@/types";
import { initChart } from "@/lib/chart";
import { getOfficialRolePriority } from "@/lib/utils";
import { useTheme } from "@/lib/useTheme";

interface OfficialChartProps {
  roleCounts: OfficialCountItem[];
  onOfficialClick: (roleName: string) => void;
}

export default function OfficialChart({
  roleCounts,
  onOfficialClick,
}: OfficialChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);

  const { isDark: themeIsDark } = useTheme();

  useEffect(() => {
    if (roleCounts.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const isDark = themeIsDark;
    const textColor = isDark ? "#cbd5e1" : "#475569";
    const orderedCounts = [...roleCounts].sort(
      (a, b) =>
        (a.priority || getOfficialRolePriority(a.role)) -
        (b.priority || getOfficialRolePriority(b.role))
    );
    const labels = orderedCounts.map((item) => item.role);
    const colors = orderedCounts.map((item) => item.color || "#64748b");
    const totals = orderedCounts.map((item) => item.total);

    async function renderChart() {
      const Chart = await initChart();

      if (chartRef.current) chartRef.current.destroy();

      chartRef.current = new Chart(canvas, {
        type: "doughnut",
        data: {
          labels,
          datasets: [
            {
              data: totals,
              backgroundColor: colors,
              borderWidth: 2,
              borderColor: isDark ? "#1e293b" : "#fff",
              hoverOffset: 15,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: 16 },
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                color: textColor,
                font: { family: "Poppins", size: 10 },
                boxWidth: 10,
                padding: 10,
              },
            },
            datalabels: {
              color: "#ffffff",
              font: { weight: "900", family: "Poppins", size: 12 },
              formatter: (value: number) => (value > 0 ? value : ""),
            },
            tooltip: {
              backgroundColor: "#1e293b",
              titleFont: { family: "Poppins" },
              bodyFont: { family: "Poppins", weight: "bold", size: 14 },
              padding: 12,
              cornerRadius: 8,
              displayColors: false,
              callbacks: {
                title: () => "",
                label: (context: { raw: number; dataset: { data: number[] } }) => {
                  const value = context.raw || 0;
                  const sum = context.dataset.data.reduce((a, b) => a + b, 0);
                  if (sum === 0) return "0%";
                  return `${((value * 100) / sum).toFixed(0)}%`;
                },
              },
            },
          },
          cutout: "60%",
          onClick: (_evt: unknown, elements: { index: number }[]) => {
            if (elements.length > 0) {
              onOfficialClick(labels[elements[0].index]);
            }
          },
        },
      });
    }

    renderChart();

    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [roleCounts, onOfficialClick, themeIsDark]);

  return (
    <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-slate-300 dark:border-slate-600 p-4 sm:p-5 space-y-6 flex flex-col items-start sm:items-stretch">
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-start sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <h3 className="text-lg sm:text-xl font-bold flex items-center gap-3 text-slate-800 dark:text-white text-left">
          <i className="fas fa-user-tie text-blue-500 text-xl sm:text-2xl"></i>
          Nama Pejabat
        </h3>
      </div>
      <div className="relative h-[280px] sm:h-[300px] w-full flex items-center justify-center">
        <canvas ref={canvasRef}></canvas>
      </div>
    </div>
  );
}
