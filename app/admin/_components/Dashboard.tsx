"use client";

import { BarChart2, Building2, Newspaper, TrendingUp, User } from "lucide-react";
import Link from "next/link";
import { useDashboardSummary } from "@/lib/useDashboardSummary";
import GrafikPejabat from "@/components/GrafikPejabat";
import GrafikMedia from "@/components/GrafikMedia";
import GrafikMingguan from "@/components/GrafikMingguan";

export default function Dashboard() {
  const {
    stats,
    totalOfficials,
    totalUnits,
    totalMedia,
    officialCounts,
    trend,
    mediaLegend,
    weeklyTopOfficials,
    loading,
  } = useDashboardSummary();

  const cards = [
    {
      label: "Total Berita",
      value: stats.total,
      icon: Newspaper,
      color: "blue",
      href: "/admin/berita",
    },
    { label: "Pejabat", value: totalOfficials, icon: User, color: "amber", href: "/admin/pejabat" },
    {
      label: "Unit Kerja",
      value: totalUnits,
      icon: Building2,
      color: "emerald",
      href: "/admin/unit",
    },
    { label: "Media", value: totalMedia, icon: TrendingUp, color: "indigo", href: "/admin/berita" },
  ];

  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    amber:
      "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    emerald:
      "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    indigo:
      "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
  };

  return (
    <div className="p-4 sm:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <BarChart2 className="text-blue-500" size={28} />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Dashboard Overview</h2>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color, href }) => (
          <Link
            key={label}
            href={href}
            className={`rounded-xl border p-4 sm:p-5 flex flex-col gap-3 hover:scale-[1.02] transition-all cursor-pointer ${colorMap[color]}`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold">{label}</span>
              <Icon size={20} />
            </div>
            {loading ? (
              <div className="h-8 w-16 bg-current opacity-20 rounded animate-pulse" />
            ) : (
              <span className="text-2xl sm:text-3xl font-black">{value}</span>
            )}
          </Link>
        ))}
      </div>

      <div className="space-y-8">
        <GrafikMingguan topOfficials={weeklyTopOfficials} />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-[1.5rem] shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6 transition-all duration-500 hover:shadow-xl backdrop-blur-xl">
            <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
              <User size={18} className="text-blue-500" />
              Proporsi Pejabat
            </h4>
            <GrafikPejabat roleCounts={officialCounts} onOfficialClick={() => {}} />
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-[1.5rem] shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6 transition-all duration-500 hover:shadow-xl backdrop-blur-xl">
            <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-indigo-500" />
              Tren Publikasi Media
            </h4>
            <GrafikMedia
              weeklyPoints={trend.weekly}
              monthlyPoints={trend.monthly}
              mediaLegend={mediaLegend}
              onMediaTrendClick={() => {}}
              onFilterByMedia={() => {}}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/admin/berita"
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 sm:p-6 flex items-center gap-4 hover:border-indigo-400 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
            <Newspaper className="text-indigo-500" size={22} />
          </div>
          <div>
            <div className="font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 transition-colors">
              Kelola Berita
            </div>
            <div className="text-xs text-slate-400">Tambah, edit, hapus berita</div>
          </div>
        </Link>
        <Link
          href="/admin/pejabat"
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 sm:p-6 flex items-center gap-4 hover:border-amber-400 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
            <User className="text-amber-500" size={22} />
          </div>
          <div>
            <div className="font-bold text-slate-800 dark:text-white group-hover:text-amber-600 transition-colors">
              Nama Pejabat
            </div>
            <div className="text-xs text-slate-400">Master data pejabat</div>
          </div>
        </Link>
        <Link
          href="/admin/unit"
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 sm:p-6 flex items-center gap-4 hover:border-emerald-400 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
            <Building2 className="text-emerald-500" size={22} />
          </div>
          <div>
            <div className="font-bold text-slate-800 dark:text-white group-hover:text-emerald-600 transition-colors">
              Unit Kerja
            </div>
            <div className="text-xs text-slate-400">Kelola unit kerja</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
