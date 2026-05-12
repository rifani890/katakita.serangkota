"use client";

import { useEffect, useRef, useState } from "react";
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
  const [mounted, setMounted] = useState(false);

  const { isDark: themeIsDark } = useTheme();

  // Set mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  const orderedCounts = [...roleCounts].sort(
    (a, b) =>
      (a.priority || getOfficialRolePriority(a.role)) -
      (b.priority || getOfficialRolePriority(b.role))
  );

  useEffect(() => {
    if (!mounted || roleCounts.length === 0 || !canvasRef.current) return;

    const isDark = themeIsDark;
    const textColor = isDark ? "#cbd5e1" : "#475569";
    const borderColor = isDark ? "#1e293b" : "#ffffff";
    const tooltipBg = isDark ? "#1e293b" : "#ffffff";
    const tooltipColor = isDark ? "#f8fafc" : "#1e293b";
    const tooltipBorder = isDark ? "#334155" : "#e2e8f0";

    const labels = orderedCounts.map((item) => item.role);
    const colors = orderedCounts.map((item) => item.color || "#64748b");
    const totals = orderedCounts.map((item) => item.total);

    async function initOrUpdateChart() {
      const Chart = await initChart();

      if (!chartRef.current) {
        chartRef.current = new Chart(canvasRef.current, {
          type: "doughnut",
          data: {
            labels,
            datasets: [
              {
                data: totals,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: borderColor,
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
                display: (context: any) => {
                  const dataset = context.dataset;
                  const value = dataset.data[context.dataIndex];
                  return value > 0;
                },
              },
              tooltip: {
                backgroundColor: tooltipBg,
                titleColor: tooltipColor,
                bodyColor: tooltipColor,
                borderColor: tooltipBorder,
                borderWidth: 1,
                titleFont: { family: "Poppins" },
                bodyFont: { family: "Poppins", weight: "bold", size: 14 },
                padding: 12,
                cornerRadius: 8,
                displayColors: false,
                callbacks: {
                  title: () => "",
                  label: (context: any) => {
                    const value = context.raw || 0;
                    const sum = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                    if (sum === 0) return "0%";
                    const percentage = ((value * 100) / sum).toFixed(0);
                    return `${context.label}: ${value} (${percentage}%)`;
                  },
                },
              },
            },
            cutout: "60%",
            onClick: (_evt: any, elements: any[]) => {
              if (elements.length > 0) {
                onOfficialClick(labels[elements[0].index]);
              }
            },
          },
        });
      } else {
        const chart = chartRef.current;
        chart.data.labels = labels;
        chart.data.datasets[0].data = totals;
        chart.data.datasets[0].backgroundColor = colors;
        chart.data.datasets[0].borderColor = borderColor;

        // Update theme options
        chart.options.plugins.legend.labels.color = textColor;
        chart.options.plugins.tooltip.backgroundColor = tooltipBg;
        chart.options.plugins.tooltip.titleColor = tooltipColor;
        chart.options.plugins.tooltip.bodyColor = tooltipColor;
        chart.options.plugins.tooltip.borderColor = tooltipBorder;

        chart.update("none");
      }
    }

    initOrUpdateChart();
  }, [mounted, orderedCounts, themeIsDark, onOfficialClick]);

  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, []);

  if (!mounted) {
    return (
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-slate-300 dark:border-slate-600 p-4 sm:p-5 h-[400px] animate-pulse">
        <div className="h-6 w-1/3 bg-slate-200 dark:bg-slate-700 rounded mb-6"></div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-48 h-48 rounded-full border-8 border-slate-100 dark:border-slate-800"></div>
        </div>
      </div>
    );
  }

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
