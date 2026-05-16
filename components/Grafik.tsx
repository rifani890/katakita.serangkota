"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { OfficialMapping } from "@/types";
import { useDashboardSummary } from "@/lib/useDashboardSummary";
import Navbar from "@/components/Navbar";
import GrafikPejabat from "@/components/GrafikPejabat";
import GrafikMedia from "@/components/GrafikMedia";
import StatCards from "@/components/StatCards";
import DetailPage, { type DetailPageQuery } from "@/components/DetailPage";
import NewsModal from "@/components/NewsModal";
import { printNews } from "@/lib/print";

type ActivePage = "dashboard" | "detail";

interface FilterLabel {
  label: string;
  color: string;
}

export default function Grafik() {
  const {
    stats,
    officialCounts,
    trend,
    officialMapping,
    mediaLegend,
    weeklyTopOfficials,
    weeklyTopUnits,
    loading,
    error,
  } = useDashboardSummary();

  const [activePage, setActivePage] = useState<ActivePage>("dashboard");
  const [detailQuery, setDetailQuery] = useState<DetailPageQuery>({});
  const [filterLabel, setFilterLabel] = useState<FilterLabel>({ label: "Semua", color: "#3b82f6" });
  const [modalKey, setModalKey] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const dashboardScrollY = useRef(0);

  useEffect(() => {
    const savedPage = sessionStorage.getItem("katakita_activePage");
    if (savedPage === "detail") {
      setActivePage("detail");
      const savedQuery = sessionStorage.getItem("katakita_detailQuery");
      if (savedQuery) setDetailQuery(JSON.parse(savedQuery));
      const savedLabel = sessionStorage.getItem("katakita_filterLabel");
      if (savedLabel) setFilterLabel(JSON.parse(savedLabel));
    }
    setMounted(true);
  }, []);

  const openDetailPage = useCallback((query: DetailPageQuery, label: string, color: string) => {
    dashboardScrollY.current = window.scrollY;
    setDetailQuery(query);
    setFilterLabel({ label, color });
    setActivePage("detail");

    sessionStorage.setItem("katakita_activePage", "detail");
    sessionStorage.setItem("katakita_detailQuery", JSON.stringify(query));
    sessionStorage.setItem("katakita_filterLabel", JSON.stringify({ label, color }));
    sessionStorage.setItem("katakita_dashboardScrollY", String(dashboardScrollY.current));

    window.history.pushState({ page: "detail" }, "");
    requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
  }, []);

  const handleBackToDashboard = useCallback(() => {
    setActivePage("dashboard");
    sessionStorage.setItem("katakita_activePage", "dashboard");
    const savedY = Number(
      sessionStorage.getItem("katakita_dashboardScrollY") || dashboardScrollY.current
    );
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: savedY, left: 0, behavior: "auto" });
      });
    });
  }, []);

  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      const currentPage = sessionStorage.getItem("katakita_activePage");
      if (event.state?.page === "detail") {
        if (currentPage !== "detail") {
          const savedQuery = sessionStorage.getItem("katakita_detailQuery");
          const savedLabel = sessionStorage.getItem("katakita_filterLabel");
          if (savedQuery && savedLabel) {
            const query = JSON.parse(savedQuery) as DetailPageQuery;
            const lbl = JSON.parse(savedLabel) as FilterLabel;
            setDetailQuery(query);
            setFilterLabel(lbl);
            setActivePage("detail");
            sessionStorage.setItem("katakita_activePage", "detail");
            requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
          }
        }
      } else {
        if (currentPage === "detail") {
          handleBackToDashboard();
        }
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [handleBackToDashboard]);

  const handleOfficialClick = useCallback(
    (roleName: string) => {
      const color = officialCounts.find((item) => item.role === roleName)?.color || "#64748b";
      openDetailPage({ role: roleName }, roleName, color);
    },
    [officialCounts, openDetailPage]
  );

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
    <div className="relative antialiased overflow-x-hidden min-h-screen bg-slate-50 dark:bg-dark-bg text-slate-900 dark:text-dark-text font-poppins transition-colors duration-300">
      <div
        className="fixed inset-0 opacity-[0.03] dark:opacity-10 pointer-events-none z-0"
        style={{
          backgroundImage:
            "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      ></div>
      <div className="fixed top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-blue-500/5 dark:from-blue-500/10 to-transparent pointer-events-none z-0"></div>

      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-purple-400/20 dark:bg-purple-500/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen pointer-events-none z-0"></div>
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-blue-400/20 dark:bg-blue-500/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen pointer-events-none z-0"></div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <main
          className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 transition-opacity duration-300 ${mounted ? "opacity-100" : "opacity-0"}`}
        >
          {error && (
            <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-600 dark:text-rose-400 text-sm font-medium">
              {error}
            </div>
          )}

          {activePage === "dashboard" && (
            <div className="space-y-8">
              <div className="text-center mb-10">
                <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight mb-4">
                  Grafik & Statistik Media
                </h1>
                <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                  Grafik dari seluruh berita terkait pejabat, unit kerja, dan perkembangan media di
                  Kota Serang.
                </p>
              </div>

              {loading ? (
                <div className="h-64 flex items-center justify-center bg-white dark:bg-slate-800/80 rounded-[1.5rem] border border-slate-200 dark:border-slate-700">
                  <div className="w-10 h-10 border-4 border-slate-200 border-l-blue-500 rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <div className="mb-8">
                    <StatCards stats={stats} loading={loading} onFilter={handleStatFilter} />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start">
                    <GrafikPejabat
                      roleCounts={officialCounts}
                      onOfficialClick={handleOfficialClick}
                    />
                    <GrafikMedia
                      weeklyPoints={trend.weekly}
                      monthlyPoints={trend.monthly}
                      mediaLegend={mediaLegend}
                      onMediaTrendClick={handleMediaTrendClick}
                      onFilterByMedia={handleFilterByMedia}
                    />
                  </div>
                </>
              )}
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

        <footer className="py-2 text-center border-t border-slate-200 dark:border-slate-800 bg-transparent transition-colors mt-auto">
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-[0.2em] ">
            Diskominfo &copy; 2026 KataKita Kota Serang
          </p>
        </footer>
      </div>
    </div>
  );
}
