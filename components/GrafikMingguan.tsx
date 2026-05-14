"use client";

import { TopEntityCount } from "@/types";
import { User, ArrowRight } from "lucide-react";

interface GrafikMingguanProps {
  topOfficials: TopEntityCount[];
  onOfficialClick?: (name: string) => void;
}

export default function GrafikMingguan({ topOfficials, onOfficialClick }: GrafikMingguanProps) {
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
              Influencer Internal
            </h3>
            {onOfficialClick && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                Klik nama untuk lihat berita terkait
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3 relative z-10">
          {topOfficials.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-4">
              Belum ada data minggu ini
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
