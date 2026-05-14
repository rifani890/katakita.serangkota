"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { OfficialMapping } from "@/types";
import { useDashboardSummary } from "@/lib/useDashboardSummary";
import { printNews } from "@/lib/print";
import Navbar from "@/components/Navbar";
import StatCards from "@/components/StatCards";

import NewsList from "@/components/NewsList";
import DetailPage, { type DetailPageQuery } from "@/components/DetailPage";
import NewsModal from "@/components/NewsModal";
import HeroSection from "@/components/HeroSection";

type ActivePage = "dashboard" | "detail";

interface FilterLabel {
  label: string;
  color: string;
}

export default function Home() {
  const { stats, officialCounts, trend, officialMapping, mediaLegend, loading, error } =
    useDashboardSummary();

  const [activePage, setActivePage] = useState<ActivePage>("dashboard");
  const [detailQuery, setDetailQuery] = useState<DetailPageQuery>({});
  const [filterLabel, setFilterLabel] = useState<FilterLabel>({ label: "Semua", color: "#3b82f6" });
  const [modalKey, setModalKey] = useState<string | null>(null);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dashboardScrollY = useRef(0);

  useEffect(() => {
    // Check for timeout parameter
    const params = new URLSearchParams(window.location.search);
    if (params.get("timeout") === "1") {
      setShowTimeoutModal(true);
      // Clean up URL without refreshing
      window.history.replaceState({}, document.title, "/");
    }

    // Restore state from sessionStorage after mount to prevent hydration mismatch
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

    // Persist to session storage
    sessionStorage.setItem("katakita_activePage", "detail");
    sessionStorage.setItem("katakita_detailQuery", JSON.stringify(query));
    sessionStorage.setItem("katakita_filterLabel", JSON.stringify({ label, color }));
    sessionStorage.setItem("katakita_dashboardScrollY", String(dashboardScrollY.current));

    // Push a history entry so the device back button triggers popstate
    window.history.pushState({ page: "detail" }, "");

    requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
  }, []);

  const handleBackToDashboard = useCallback(() => {
    setActivePage("dashboard");

    // Mark as dashboard but KEEP detailQuery & filterLabel so forward navigation can restore them
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

  // Listen to the device/browser back AND forward button
  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      const currentPage = sessionStorage.getItem("katakita_activePage");

      if (event.state?.page === "detail") {
        // User pressed forward — restore the detail page
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
        // User pressed back — go to dashboard
        if (currentPage === "detail") {
          handleBackToDashboard();
        }
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [handleBackToDashboard]);

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
      const color = officialCounts.find((item) => item.role === roleName)?.color || "#64748b";
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
    <div className="relative antialiased overflow-x-hidden min-h-screen bg-slate-50 dark:bg-dark-bg text-slate-900 dark:text-dark-text font-poppins transition-colors duration-300">
      {/* Grid Pattern & Glows for the entire window */}
      <div
        className="fixed inset-0 opacity-[0.03] dark:opacity-10 pointer-events-none z-0"
        style={{
          backgroundImage:
            "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      ></div>
      <div className="fixed top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-blue-500/5 dark:from-blue-500/10 to-transparent pointer-events-none z-0"></div>

      {/* Floating particles */}
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-purple-400/20 dark:bg-purple-500/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen pointer-events-none z-0"></div>
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-blue-400/20 dark:bg-blue-500/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen pointer-events-none z-0"></div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <main
          className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-0 transition-opacity duration-300 ${mounted ? "opacity-100" : "opacity-0"}`}
        >
          {error && (
            <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-600 dark:text-rose-400 text-sm font-medium">
              {error}
            </div>
          )}

          {activePage === "dashboard" && (
            <div className="space-y-2">
              <HeroSection onOpenModal={setModalKey} />
              <StatCards stats={stats} loading={loading} onFilter={handleStatFilter} />

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

        {/* Timeout Notification Modal */}
        {showTimeoutModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-700 text-center transform animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="w-12 h-12 bg-rose-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-rose-500/40">
                  <i className="fas fa-clock text-xl"></i>
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-3">
                Sesi Berakhir
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                Sesi Anda telah berakhir secara otomatis setelah <strong>5 menit</strong> tanpa
                aktivitas demi keamanan data.
              </p>
              <button
                onClick={() => setShowTimeoutModal(false)}
                className="w-full py-4 rounded-2xl font-black bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/30 transition-all active:scale-95"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}

        <footer className="py-2 text-center border-t border-slate-200 dark:border-slate-800 bg-transparent transition-colors mt-0">
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-[0.2em] ">
            Diskominfo &copy; 2026 KataKita Kota Serang
          </p>
        </footer>
      </div>
    </div>
  );
}
