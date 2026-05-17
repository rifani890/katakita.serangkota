"use client";

import { useEffect, useState } from "react";
import { TopEntityCount, OfficialMapping } from "@/types";
import { User, ArrowRight } from "lucide-react";
import { getOfficialMapping } from "@/lib/utils";

interface GrafikMingguanProps {
  onOfficialClick?: (name: string) => void;
  officialMapping?: OfficialMapping;
}

export default function GrafikMingguan({ onOfficialClick, officialMapping }: GrafikMingguanProps) {
  const [topOfficials, setTopOfficials] = useState<TopEntityCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeeklyOfficials() {
      try {
        const res = await fetch("/api/berita?page=1&pageSize=100&sortField=date&sortOrder=desc");
        if (res.ok) {
          const data = await res.json();
          if (data.items && data.items.length > 0) {
            const latestItem = data.items[0];
            const latestDate = new Date(latestItem.tanggal_raw || Date.now());

            const endOfWeek = new Date(latestDate);
            endOfWeek.setHours(23, 59, 59, 999);

            const startOfWeek = new Date(latestDate);
            startOfWeek.setDate(latestDate.getDate() - 6); // 7 hari terakhir (termasuk hari ini)
            startOfWeek.setHours(0, 0, 0, 0);

            const weeklyItems = data.items.filter((item: any) => {
              if (!item.tanggal_raw) return false;
              const itemDate = new Date(item.tanggal_raw);
              return itemDate >= startOfWeek && itemDate <= endOfWeek;
            });

            const counts = new Map<string, number>();
            weeklyItems.forEach((item: any) => {
              const pejabats = Array.isArray(item.pejabat)
                ? item.pejabat
                : item.pejabat
                  ? [item.pejabat]
                  : [];
              pejabats.forEach((p: string) => {
                const name = p.trim();
                if (name && name !== "Pejabat Lainnya") {
                  let label = name;
                  if (officialMapping) {
                    const info = getOfficialMapping(name, officialMapping);
                    label = info?.jabatan || info?.role || name;
                  }
                  counts.set(label, (counts.get(label) || 0) + 1);
                }
              });
            });

            const officials = Array.from(counts.entries())
              .map(([name, total]) => ({ name, total }))
              .sort((a, b) => b.total - a.total)
              .slice(0, 10);

            setTopOfficials(officials);
          } else {
            setTopOfficials([]);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchWeeklyOfficials();
  }, []);

  const maxOfficial = Math.max(...topOfficials.map((o) => o.total), 1);

  return (
    <div className="relative">
      <div className="bg-white dark:bg-slate-800/80 rounded-[1.5rem] p-6 shadow-sm border border-slate-200/80 dark:border-slate-700/80 backdrop-blur-xl hover:shadow-xl hover:shadow-slate-300/50 dark:hover:shadow-black/50 transition-all duration-500 relative overflow-hidden group">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue-500/10 blur-[60px] rounded-full pointer-events-none transition-opacity duration-500 group-hover:opacity-100"></div>
        <div className="flex items-center gap-3 mb-6 relative z-10 border-b border-slate-100 dark:border-slate-700/50 pb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <User size={20} />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white tracking-tight">
              Trending Pejabat Mingguan
            </h3>
            {onOfficialClick && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                Influencer Internal
              </p>
            )}
          </div>
        </div>
        <div className="space-y-3 relative z-10 max-h-[210px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-100 dark:[&::-webkit-scrollbar-track]:bg-slate-800/50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-600">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-slate-200 border-l-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : topOfficials.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-4">
              Data Tidak Ada ( Kosong )
            </p>
          ) : (
            topOfficials.map((item, idx) => {
              const pct = Math.round((item.total / maxOfficial) * 100);
              const content = (
                <>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span
                      className="font-semibold text-slate-700 dark:text-slate-300 truncate pr-2 flex items-center gap-1.5"
                      title={item.name}
                    >
                      {onOfficialClick && (
                        <ArrowRight
                          size={12}
                          className="text-blue-500 opacity-0 group-hover/bar:opacity-100 -translate-x-1 group-hover/bar:translate-x-0 transition-all duration-200 flex-shrink-0"
                        />
                      )}
                      {item.name}
                    </span>
                    <span className="font-black text-blue-600 dark:text-blue-400 tabular-nums flex-shrink-0">
                      {item.total}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700/50 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-400 to-blue-600 h-2.5 rounded-full transition-all duration-1000 ease-out group-hover/bar:brightness-110"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </>
              );

              if (onOfficialClick) {
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onOfficialClick(item.name)}
                    className="group/bar w-full text-left rounded-xl p-2.5 -mx-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-150 cursor-pointer"
                    title={`Lihat berita terkait ${item.name}`}
                  >
                    {content}
                  </button>
                );
              }

              return (
                <div key={idx} className="group/bar p-2.5 -mx-2.5">
                  {content}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
