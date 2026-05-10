"use client";

import { useEffect, useRef, useState } from "react";
import type { TrendLegendItem, TrendPoint } from "@/types";
import { initChart } from "@/lib/chart";

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

  useEffect(() => {
    const points = filterType === "weekly" ? weeklyPoints : monthlyPoints;
    if (points.length === 0 || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    const isDark = document.documentElement.classList.contains("dark");
    const textColor = isDark ? "#cbd5e1" : "#475569";
    const gridColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";

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

    const minPointWidth = filterType === "weekly" ? 60 : 100;
    const parentWidth = container.parentElement?.clientWidth ?? 400;
    const calculatedWidth = Math.max(parentWidth, labels.length * minPointWidth);
    container.style.width = `${calculatedWidth}px`;

    async function renderChart() {
      const Chart = await initChart();

      if (chartRef.current) chartRef.current.destroy();

      const promoteDataset = (datasetIndex: number | null) => {
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

      chartRef.current = new Chart(canvas, {
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
              backgroundColor: "#1e293b",
              intersect: false,
              mode: "nearest",
              callbacks: {
                title: (items: { dataIndex: number }[]) => {
                  if (!items.length) return "";
                  return points[items[0].dataIndex]?.label || "";
                },
                label: (ctx: { dataset: { label: string }; parsed: { y: number } }) => {
                  const label = ctx.dataset.label ? `${ctx.dataset.label}: ` : "";
                  return `${label}${Math.round(ctx.parsed.y)} Berita`;
                },
              },
            },
          },
          scales: {
            x: {
              display: true,
              ticks: { color: textColor, font: { size: 10 }, maxRotation: 0, minRotation: 0 },
              grid: { display: false },
            },
            y: {
              display: true,
              beginAtZero: true,
              suggestedMax: 5,
              ticks: {
                color: textColor,
                stepSize: 1,
                precision: 0,
                callback: (value: number) => (value % 1 === 0 ? value : undefined),
              },
              grid: { color: gridColor },
            },
          },
          onHover: (_evt: unknown, elements: { datasetIndex: number }[]) => {
            promoteDataset(elements.length > 0 ? elements[0].datasetIndex : null);
          },
          onClick: (_evt: unknown, elements: { datasetIndex: number; index: number }[]) => {
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
    }

    renderChart();

    return () => {
      chartRef.current?.destroy();
    };
  }, [filterType, mediaLegend, monthlyPoints, onMediaTrendClick, weeklyPoints]);

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
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <h3 className="text-lg sm:text-xl font-bold flex items-center gap-3 text-slate-800 dark:text-white text-left">
          <i className="fas fa-chart-line text-indigo-500 text-xl sm:text-2xl"></i>
          Tren Media Cetak
        </h3>
        <div className="flex items-center w-full sm:w-auto">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            className="w-full sm:w-auto text-sm bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold text-slate-600 dark:text-slate-300"
          >
            <option value="weekly">Mingguan</option>
            <option value="monthly">Bulanan</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-start sm:justify-center gap-4 sm:gap-8 py-2 w-full">
        {mediaLegend.map((item, index) => {
          const isHovered = hoveredDataset === index;
          return (
            <div
              key={item.media}
              className={`flex items-center gap-2 cursor-pointer transition-all group ${isHovered ? "opacity-100" : "opacity-70 hover:opacity-100"}`}
              onClick={() => onFilterByMedia(item.media)}
              onMouseEnter={() => handleLegendHover(item.shorthand)}
              onMouseLeave={() => handleLegendHover(null)}
            >
              <div
                className="w-4 h-4 rounded-full ring-2 ring-transparent group-hover:ring-offset-1 transition-all"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm font-bold text-slate-600 dark:text-slate-400 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                {item.shorthand}
              </span>
            </div>
          );
        })}
      </div>

      <div className="relative w-full h-[250px] sm:h-[280px] bg-white dark:bg-slate-900 rounded-xl p-3 sm:p-4">
        <div className="w-full h-full overflow-x-auto overflow-y-hidden">
          <div ref={containerRef} className="h-full" style={{ minWidth: "100%" }}>
            <canvas ref={canvasRef}></canvas>
          </div>
        </div>
      </div>
    </div>
  );
}
