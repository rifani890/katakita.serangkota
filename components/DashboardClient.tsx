"use client";

import { useCallback, useRef, useState } from "react";
import type { OfficialMapping } from "@/types";
import { useDashboardSummary } from "@/lib/useDashboardSummary";
import { printNews } from "@/lib/print";
import Navbar from "@/components/Navbar";
import StatCards from "@/components/StatCards";
import OfficialChart from "@/components/OfficialChart";
import TrendChart from "@/components/TrendChart";
import NewsList from "@/components/NewsList";
import DetailPage, { type DetailPageQuery } from "@/components/DetailPage";
import NewsModal from "@/components/NewsModal";

type ActivePage = "dashboard" | "detail";

interface FilterLabel {
  label: string;
  color: string;
}

export default function DashboardClient() {
  const {
    stats,
    officialCounts,
    trend,
    officialMapping,
    mediaLegend,
    loading,
    error,
  } = useDashboardSummary();

  const [activePage, setActivePage] = useState<ActivePage>("dashboard");
  const [detailQuery, setDetailQuery] = useState<DetailPageQuery>({});
  const [filterLabel, setFilterLabel] = useState<FilterLabel>({ label: "Semua", color: "#3b82f6" });
  const [modalKey, setModalKey] = useState<string | null>(null);
  const dashboardScrollY = useRef(0);

  const openDetailPage = useCallback((query: DetailPageQuery, label: string, color: string) => {
    dashboardScrollY.current = window.scrollY;
    setDetailQuery(query);
    setFilterLabel({ label, color });
    setActivePage("detail");
    requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
  }, []);

  const handleBackToDashboard = useCallback(() => {
    setActivePage("dashboard");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: dashboardScrollY.current, left: 0, behavior: "auto" });
      });
    });
  }, []);

  const handleStatFilter = useCallback(
    (type: "total" | "positive" | "neutral" | "negative") => {
      if (type === "total") {
        openDetailPage({}, "Semua Berita", "#3b82f6");
        return;
      }

      const config = {
        positive: { label: "Positif", color: "#10b981", potensi: "Positif" },
        neutral: { label: "Netral", color: "#94a3b8", potensi: "Netral" },
        negative: { label: "Negatif", color: "#f43f5e", potensi: "Negatif" },
      }[type];

      openDetailPage({ potensi: config.potensi }, config.label, config.color);
    },
    [openDetailPage]
  );

  const handleOfficialClick = useCallback(
    (roleName: string) => {
      const color =
        officialCounts.find((item) => item.role === roleName)?.color || "#64748b";
      openDetailPage({ role: roleName }, roleName, color);
    },
    [officialCounts, openDetailPage]
  );

  const handleMediaTrendClick = useCallback(
    (shorthand: string, timeKey: string, filterType: string) => {
      const media = mediaLegend.find((item) => item.shorthand === shorthand);
      if (!media) return;
      openDetailPage(
        {
          media: media.media,
          periodType: filterType as "weekly" | "monthly",
          timeKey,
        },
        `${media.media} • ${filterType === "weekly" ? "Per Minggu" : "Per Bulan"}`,
        media.color
      );
    },
    [mediaLegend, openDetailPage]
  );

  const handleFilterByMedia = useCallback(
    (media: string) => {
      const color = mediaLegend.find((item) => item.media === media)?.color || "#3b82f6";
      openDetailPage({ media }, `Media: ${media}`, color);
    },
    [mediaLegend, openDetailPage]
  );

  const handleOpenDetail = useCallback(() => {
    openDetailPage({}, "Semua Berita", "#3b82f6");
  }, [openDetailPage]);

  const handlePrintDirect = useCallback(async (key: string) => {
    if (!confirm("Apakah Anda ingin mencetak berita ini secara langsung?")) return;

    try {
      const res = await fetch(`/api/berita/${key}`);
      if (!res.ok) throw new Error("Gagal mengambil berita");
      const news = await res.json();
      printNews(news);
    } catch (err) {
      console.error("handlePrintDirect error:", err);
      alert("Berita gagal dimuat untuk dicetak.");
    }
  }, []);

  const filterLabelJSX = (
    <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
      <span
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: filterLabel.color, boxShadow: `0 0 8px ${filterLabel.color}66` }}
      />
      <span className="text-slate-700 dark:text-slate-200 font-bold">{filterLabel.label}</span>
    </span>
  );

  return (
    <div className="antialiased overflow-x-hidden min-h-screen bg-slate-50 dark:bg-dark-bg text-slate-900 dark:text-dark-text font-poppins transition-colors duration-300">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-6 sm:pb-8">
        {error && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-600 dark:text-rose-400 text-sm font-medium">
            {error}
          </div>
        )}

        {activePage === "dashboard" && (
          <div className="space-y-8">
            <StatCards
              stats={stats}
              loading={loading}
              onFilter={handleStatFilter}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              <OfficialChart roleCounts={officialCounts} onOfficialClick={handleOfficialClick} />
              <TrendChart
                weeklyPoints={trend.weekly}
                monthlyPoints={trend.monthly}
                mediaLegend={mediaLegend}
                onMediaTrendClick={handleMediaTrendClick}
                onFilterByMedia={handleFilterByMedia}
              />
            </div>
            <NewsList onOpenModal={setModalKey} onOpenDetail={handleOpenDetail} />
          </div>
        )}

        {activePage === "detail" && (
          <DetailPage
            filterQuery={detailQuery}
            filterLabel={filterLabelJSX}
            officialMapping={officialMapping as OfficialMapping}
            onBack={handleBackToDashboard}
            onOpenModal={setModalKey}
            onPrintDirect={handlePrintDirect}
          />
        )}
      </main>

      <NewsModal
        newsKey={modalKey}
        onClose={() => setModalKey(null)}
        onPrint={handlePrintDirect}
      />

      <footer className="py-12 text-center border-t border-slate-200 dark:border-slate-800 bg-transparent transition-colors">
        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase">
          Diskominfo &copy; 2026 KataKita Kota Serang
        </p>
      </footer>
    </div>
  );
}
