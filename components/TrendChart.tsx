"use client";

import { useEffect, useRef, useState } from "react";
import type { TrendLegendItem, TrendPoint } from "@/types";
import { initChart } from "@/lib/chart";
import { useTheme } from "@/lib/useTheme";

interface TrendChartProps {
  weeklyPoints: TrendPoint[];
  monthlyPoints: TrendPoint[];
  mediaLegend: TrendLegendItem[];
  onMediaTrendClick: (shorthand: string, timeKey: string, filterType: string) => void;
  onFilterByMedia: (media: string) => void;
}

type FilterType = "weekly" | "monthly";

export default function TrendChart({
  weeklyPoints,
  monthlyPoints,
  mediaLegend,
  onMediaTrendClick,
  onFilterByMedia,
}: TrendChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const [filterType, setFilterType] = useState<FilterType>("weekly");
  const [hoveredDataset, setHoveredDataset] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const { isDark: themeIsDark } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const points = filterType === "weekly" ? weeklyPoints : monthlyPoints;
    if (points.length === 0 || !canvasRef.current || !containerRef.current) return;

    const isDark = themeIsDark;
    const textColor = isDark ? "#cbd5e1" : "#475569";
    const gridColor = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)";
    const tooltipBg = isDark ? "#1e293b" : "#ffffff";
    const tooltipColor = isDark ? "#f8fafc" : "#1e293b";
    const tooltipBorder = isDark ? "#334155" : "#e2e8f0";

    const labels = points.map((point) => point.label);
    const datasets = mediaLegend.map((item, index) => ({
      label: item.shorthand,
      media: item.media,
      data: points.map((point) => point.counts[item.shorthand] ?? 0),
      borderColor: item.color,
      backgroundColor: item.color,
      fill: false,
      tension: 0.4,
      borderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 7,
      pointHitRadius: 12,
      spanGaps: true,
      order: 10 - index,
    }));

    const container = containerRef.current;
    const minPointWidth = filterType === "weekly" ? 60 : 100;
    const parentWidth = container.parentElement?.clientWidth ?? 400;
    const calculatedWidth = Math.max(parentWidth, labels.length * minPointWidth);
    container.style.width = `${calculatedWidth}px`;

    async function initOrUpdateChart() {
      const Chart = await initChart();

      const promoteDataset = (datasetIndex: number | null) => {
        if (!chartRef.current) return;
        chartRef.current.data.datasets.forEach(
          (
            dataset: { borderWidth: number; pointRadius: number; pointHoverRadius: number; order?: number },
            idx: number
          ) => {
            const isActive = datasetIndex === idx;
            dataset.borderWidth = isActive ? 4 : 2;
            dataset.pointRadius = isActive ? 6 : 4;
            dataset.pointHoverRadius = isActive ? 8 : 7;
            dataset.order = isActive ? 0 : 10 - idx;
          }
        );
        chartRef.current.update("none");
        setHoveredDataset(datasetIndex);
      };

      if (!chartRef.current) {
        chartRef.current = new Chart(canvasRef.current, {
          type: "line",
          data: { labels, datasets },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: "nearest", axis: "xy" },
            plugins: {
              datalabels: { display: false },
              legend: { display: false },
              tooltip: {
                backgroundColor: tooltipBg,
                titleColor: tooltipColor,
                bodyColor: tooltipColor,
                borderColor: tooltipBorder,
                borderWidth: 1,
                padding: 12,
                cornerRadius: 8,
                intersect: false,
                mode: "nearest",
                titleFont: { family: "Plus Jakarta Sans", weight: "bold" },
                bodyFont: { family: "Plus Jakarta Sans" },
                callbacks: {
                  title: (items: any[]) => {
                    if (!items.length) return "";
                    return points[items[0].dataIndex]?.label || "";
                  },
                  label: (ctx: any) => {
                    const label = ctx.dataset.label ? `${ctx.dataset.label}: ` : "";
                    return `${label}${Math.round(ctx.parsed.y)} Berita`;
                  },
                },
              },
            },
            scales: {
              x: {
                display: true,
                ticks: { color: textColor, font: { size: 10, family: "Plus Jakarta Sans", weight: "bold" }, maxRotation: 0, minRotation: 0 },
                grid: { display: false },
              },
              y: {
                display: true,
                beginAtZero: true,
                suggestedMax: 5,
                ticks: {
                  color: textColor,
                  font: { family: "Plus Jakarta Sans", weight: "bold", size: 11 },
                  stepSize: 1,
                  precision: 0,
                  callback: (value: any) => (value % 1 === 0 ? value : undefined),
                },
                grid: { color: gridColor },
              },
            },
            onHover: (_evt: any, elements: any[]) => {
              promoteDataset(elements.length > 0 ? elements[0].datasetIndex : null);
            },
            onClick: (_evt: any, elements: any[]) => {
              if (elements.length === 0) return;
              const { datasetIndex, index } = elements[0];
              const shorthand = datasets[datasetIndex]?.label;
              const timeKey = points[index]?.key;
              if (shorthand && timeKey) {
                onMediaTrendClick(shorthand, timeKey, filterType);
              }
            },
          },
        });
      } else {
        const chart = chartRef.current;
        // Update data
        chart.data.labels = labels;
        chart.data.datasets = datasets;

        // Update scales
        chart.options.scales.x.ticks.color = textColor;
        chart.options.scales.y.ticks.color = textColor;
        chart.options.scales.y.grid.color = gridColor;

        // Update tooltips
        chart.options.plugins.tooltip.backgroundColor = tooltipBg;
        chart.options.plugins.tooltip.titleColor = tooltipColor;
        chart.options.plugins.tooltip.bodyColor = tooltipColor;
        chart.options.plugins.tooltip.borderColor = tooltipBorder;
        
        // Update onClick handler to use current filterType and points
        chart.options.onClick = (_evt: any, elements: any[]) => {
          if (elements.length === 0) return;
          const { datasetIndex, index } = elements[0];
          const shorthand = chart.data.datasets[datasetIndex]?.label;
          const timeKey = points[index]?.key;
          if (shorthand && timeKey) {
            onMediaTrendClick(shorthand, timeKey, filterType);
          }
        };

        chart.update("none");
      }
    }

    initOrUpdateChart();
  }, [mounted, filterType, mediaLegend, monthlyPoints, onMediaTrendClick, weeklyPoints, themeIsDark]);

  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, []);

  const handleLegendHover = (shorthand: string | null) => {
    const chart = chartRef.current;
    if (!chart) return;
    if (shorthand === null) {
      chart.data.datasets.forEach(
        (dataset: { borderWidth: number; pointRadius: number; order?: number }, idx: number) => {
          dataset.borderWidth = 2;
          dataset.pointRadius = 4;
          dataset.order = 10 - idx;
        }
      );
    } else {
      chart.data.datasets.forEach(
        (
          dataset: { label: string; borderWidth: number; pointRadius: number; order?: number },
          idx: number
        ) => {
          const isActive = dataset.label === shorthand;
          dataset.borderWidth = isActive ? 4 : 0.5;
          dataset.pointRadius = isActive ? 6 : 0;
          dataset.order = isActive ? 0 : 10 - idx;
        }
      );
    }
    chart.update("none");
    setHoveredDataset(shorthand ? mediaLegend.findIndex((item) => item.shorthand === shorthand) : null);
  };

  return (
    <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-slate-300 dark:border-slate-600 p-4 sm:p-5 space-y-6 flex flex-col items-start sm:items-stretch">
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-start sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <h3 className="text-lg sm:text-xl font-bold flex items-center gap-3 text-slate-800 dark:text-white text-left">
          <i className="fas fa-chart-line text-blue-500 text-xl sm:text-2xl"></i>
          Tren Media Cetak
        </h3>
        <div className="flex items-center w-auto self-start sm:self-auto">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            className="text-[11px] bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-black text-slate-600 dark:text-slate-300 tracking-widest"
          >
            <option value="weekly">Mingguan</option>
            <option value="monthly">Bulanan</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 py-2 w-full relative z-10">
        {mediaLegend.map((item, index) => {
          const isHovered = hoveredDataset === index;
          return (
            <div
              key={item.media}
              className={`flex items-center gap-2 cursor-pointer transition-all group ${isHovered ? "opacity-100 scale-105" : "opacity-60 hover:opacity-100"}`}
              onClick={() => onFilterByMedia(item.media)}
              onMouseEnter={() => handleLegendHover(item.shorthand)}
              onMouseLeave={() => handleLegendHover(null)}
            >
              <div
                className="w-3 h-3 rounded-full shadow-lg transition-transform group-hover:scale-125"
                style={{ backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}66` }}
              />
              <span
                className={`text-[10px] font-black transition-colors tracking-[0.1em] ${isHovered ? "" : "text-slate-800 dark:text-white"}`}
                style={{ color: isHovered ? item.color : undefined }}
              >
                {item.shorthand}
              </span>
            </div>
          );
        })}
      </div>

      <div className="relative w-full h-[250px] sm:h-[280px] bg-slate-50/30 dark:bg-slate-900/20 rounded-2xl p-3 sm:p-4 border border-slate-100/50 dark:border-slate-800/50 relative z-10">
        <div className="w-full h-full overflow-x-auto overflow-y-hidden no-scrollbar">
          <div ref={containerRef} className="h-full" style={{ minWidth: "100%" }}>
            <canvas ref={canvasRef}></canvas>
          </div>
        </div>
      </div>
    </div>
  );
}
