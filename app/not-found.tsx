"use client";

import Link from "next/link";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative antialiased overflow-hidden min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 font-poppins flex flex-col items-center justify-center p-4">
      {/* Background Pattern & Particles */}
      <div
        className="fixed inset-0 opacity-[0.03] dark:opacity-10 pointer-events-none z-0"
        style={{
          backgroundImage:
            "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      ></div>
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-purple-400/20 dark:bg-purple-500/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen pointer-events-none z-0"></div>
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-blue-400/20 dark:bg-blue-500/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen pointer-events-none z-0"></div>

      {/* Glassmorphism Card */}
      <div className="relative z-10 bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-[2rem] p-8 sm:p-12 border border-slate-200/80 dark:border-slate-700/80 shadow-2xl shadow-blue-500/5 text-center max-w-lg w-full flex flex-col items-center">
        {/* Floating 404 Icon Badge */}
        <div className="relative mb-8 group cursor-default">
          <div className="absolute inset-0 bg-blue-500/20 dark:bg-blue-500/30 rounded-[2rem] blur-xl animate-pulse"></div>
          <div className="w-28 h-28 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2rem] rotate-3 group-hover:rotate-6 transition-transform duration-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 relative z-10">
            <span className="text-4xl font-black tracking-tighter">404</span>
          </div>
          <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-white dark:bg-slate-700 rounded-2xl -rotate-12 group-hover:-rotate-6 transition-transform duration-500 flex items-center justify-center border-4 border-slate-50 dark:border-slate-800 shadow-lg z-20">
            <AlertCircle className="text-rose-500 drop-shadow-sm" size={24} />
          </div>
        </div>

        {/* Text Content */}
        <h1 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white mb-4 tracking-tight leading-tight">
          Halaman Tidak Ditemukan
        </h1>

        <p className="text-slate-500 dark:text-slate-400 mb-10 leading-relaxed font-medium">
          Waduh! Sepertinya halaman yang Anda cari telah dipindahkan, namanya diubah, atau mungkin
          tidak pernah ada.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <button
            onClick={() => window.history.back()}
            className="flex-1 py-4 px-4 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center gap-2 group border border-transparent dark:border-slate-600/50"
          >
            <ArrowLeft
              size={18}
              className="group-hover:-translate-x-1 transition-transform opacity-70"
            />
            Kembali
          </button>

          <Link
            href="/"
            className="flex-1 py-4 px-4 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl shadow-blue-500/30 hover:shadow-blue-500/40 transition-all flex items-center justify-center gap-2 group hover:-translate-y-0.5"
          >
            <Home
              size={18}
              className="group-hover:-translate-y-0.5 transition-transform opacity-90"
            />
            Beranda
          </Link>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-6 left-0 right-0 text-center z-10 pointer-events-none">
        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-[0.2em] ">
          Diskominfo Kota Serang &copy; 2026 KataKita
        </p>
      </div>
    </div>
  );
}
