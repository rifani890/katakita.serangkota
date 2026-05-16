"use client";

import { useEffect, useState } from "react";
import type { NewsItem } from "@/types";
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp } from "lucide-react";

export default function HeroSection({ onOpenModal }: { onOpenModal?: (key: string) => void }) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch(
          "/api/berita?potensi=Positif&pageSize=10&sortField=date&sortOrder=desc"
        );
        if (res.ok) {
          const data = await res.json();
          if (data.items && data.items.length > 0) {
            const latestItem = data.items[0];
            const latestDate = new Date(latestItem.tanggal_raw || Date.now());

            const day = latestDate.getDay();
            const startOfWeek = new Date(latestDate);
            startOfWeek.setDate(latestDate.getDate() - day);
            startOfWeek.setHours(0, 0, 0, 0);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);

            const weeklyItems = data.items.filter((item: NewsItem) => {
              if (!item.tanggal_raw) return false;
              const itemDate = new Date(item.tanggal_raw);
              return itemDate >= startOfWeek && itemDate <= endOfWeek;
            });

            setNews(weeklyItems.slice(0, 5));
          } else {
            setNews([]);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, []);

  useEffect(() => {
    if (news.length === 0 || isHovered) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % news.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [news.length, isHovered]);

  return (
    <section className="relative w-full rounded-3xl bg-white dark:bg-dark-card border border-slate-300 dark:border-slate-600 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-10 lg:py-14 flex flex-col lg:flex-row items-center gap-10">
        {/* Left Side: Typography */}
        <div className="flex-1 text-center lg:text-left space-y-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 dark:from-blue-200 dark:via-indigo-200 dark:to-purple-200 tracking-tight leading-tight">
            Memahami Berita Lebih Dalam dengan Data
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-blue-100/70 leading-relaxed font-medium max-w-2xl mx-auto lg:mx-0">
            Katakita membantu Anda melihat keterkaitan antar tokoh, isu, dan peristiwa melalui
            analisis berita media cetak berbasis data yang interaktif.
          </p>
        </div>

        {/* Divider for Mobile Only */}
        <div className="w-full h-px bg-slate-200 dark:bg-slate-700 block lg:hidden -my-4"></div>

        {/* Right Side: 3D Carousel */}
        <div className="flex-1 w-full relative mt-0 lg:mt-0 flex flex-col">
          <div className="text-center mb-3">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-200 tracking-widest flex items-center justify-center gap-2 mb-6">
              <TrendingUp className="text-emerald-500" size={16} />
              Trending Berita Mingguan
            </h3>
          </div>
          <div
            className="relative h-[320px] md:h-[380px] w-full perspective-[1000px] flex items-center justify-center"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {loading ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-[4px] border-slate-200 dark:border-slate-700 border-t-blue-500"></div>
              </div>
            ) : news.length === 0 ? (
              <div className="text-slate-500 dark:text-slate-400 text-center text-sm font-medium">
                Belum ada berita positif.
              </div>
            ) : (
              news.map((item, index) => {
                // Calculate 3D position
                const diff = (index - activeIndex + news.length) % news.length;
                const offset = diff > Math.floor(news.length / 2) ? diff - news.length : diff;

                const zIndex = news.length - Math.abs(offset);
                // Adjust translateY based on screen size for vertical layout
                const translateY = offset * 50;
                const translateZ = -Math.abs(offset) * 100;
                const rotateX = offset * -15; // Invert to rotate correctly
                const scale = 1 - Math.abs(offset) * 0.15;
                const isVisible = Math.abs(offset) <= 1;
                const opacity = isVisible ? 1 - Math.abs(offset) * 0.4 : 0;
                const isActive = offset === 0;

                return (
                  <div
                    key={item.key}
                    onClick={() => {
                      if (isActive) {
                        if (onOpenModal) onOpenModal(item.key);
                      } else {
                        setActiveIndex(index);
                      }
                    }}
                    className={`absolute w-[280px] sm:w-[320px] p-6 rounded-3xl cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${isActive ? "ring-2 ring-emerald-500/30 dark:ring-white/20 shadow-xl shadow-slate-300 dark:shadow-emerald-900/30 hover:scale-105" : "hover:scale-[1.02] shadow-md"} ${!isVisible ? "pointer-events-none" : ""}`}
                    style={{
                      transform: `translateY(${translateY}%) translateZ(${translateZ}px) rotateX(${rotateX}deg) scale(${scale})`,
                      zIndex,
                      opacity,
                    }}
                  >
                    {/* Glassmorphism Card Background */}
                    <div className="absolute inset-0 rounded-3xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200 dark:border-slate-700"></div>
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/50 to-transparent dark:from-white/5 dark:to-transparent pointer-events-none"></div>

                    {/* Card Content */}
                    <div className="relative z-10 flex items-center gap-2 mb-4">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse"></span>
                      <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 tracking-widest uppercase">
                        Positif
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 ml-auto">
                        {item.tanggal}
                      </span>
                    </div>
                    <h3 className="relative z-10 text-lg font-bold text-slate-800 dark:text-white line-clamp-3 leading-snug mb-5">
                      {item.judul}
                    </h3>
                    <div className="relative z-10 flex items-center gap-2 text-[10px] font-black text-blue-700 dark:text-blue-300 tracking-wider bg-slate-100 dark:bg-slate-900/50 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="truncate">
                        {Array.isArray(item.pejabat) ? item.pejabat[0] : item.pejabat}
                      </span>
                      <span className="mx-1 opacity-40">•</span>
                      <span className="truncate">{item.media}</span>
                    </div>
                  </div>
                );
              })
            )}

            {/* Navigation Indicators */}
            {news.length > 0 && (
              <div className="absolute top-0 bottom-0 -left-2 sm:-left-6 flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                {news.map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 rounded-full transition-all duration-300 ${i === activeIndex ? "h-6 bg-blue-500 dark:bg-blue-400" : "h-1.5 bg-slate-300 dark:bg-slate-700"}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
