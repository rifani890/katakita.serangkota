"use client";

import { useCallback, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Home,
  Newspaper,
  Building2,
  User,
  Globe,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  Shield,
  Radio,
  BarChart2,
  Users,
} from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { useTheme } from "@/lib/useTheme";
import { useState } from "react";

const baseNavItems = [
  { href: "/admin", label: "Home", icon: Home },
  { href: "/admin/berita", label: "Kelola Berita", icon: Newspaper },
  { href: "/admin/unit", label: "Unit Kerja", icon: Building2 },
  { href: "/admin/pejabat", label: "Nama Pejabat", icon: User },
  { href: "/admin/tokoh", label: "Nama Tokoh", icon: Users },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, userRole, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { isDark, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);

  const navItems =
    userRole === "admin"
      ? [
          ...baseNavItems,
          { href: "/admin/media", label: "Kelola Media", icon: Radio },
          { href: "/admin/kelola-admin", label: "Kelola Admin", icon: Shield },
        ]
      : baseNavItems;

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  const handleLogout = useCallback(
    async (isAuto = false) => {
      setShowConfirmLogout(false);
      await logout();
      if (isAuto) {
        router.replace("/?timeout=1");
      } else {
        router.replace("/");
      }
    },
    [logout, router]
  );

  // Auto Logout 5 Menit Inactivity
  useEffect(() => {
    if (!user) return;

    let timer: NodeJS.Timeout;

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      // Logout setelah 5 menit (300.000 ms)
      timer = setTimeout(() => {
        handleLogout(true); // Pass true for auto-logout
      }, 300000);
    };

    // Listen to various user interactions
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("mousedown", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("scroll", resetTimer);
    window.addEventListener("touchstart", resetTimer);
    window.addEventListener("click", resetTimer);

    // Initial timer
    resetTimer();

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("mousedown", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("scroll", resetTimer);
      window.removeEventListener("touchstart", resetTimer);
      window.removeEventListener("click", resetTimer);
    };
  }, [user, handleLogout]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="w-10 h-10 border-4 border-slate-200 border-l-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="antialiased min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-poppins transition-colors duration-300">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-300 dark:border-slate-600">
        <div className="max-w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              {/* Mobile sidebar toggle */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Menu size={20} />
              </button>
              <Link href="/" className="flex items-center gap-3 cursor-pointer group">
                <div className="w-10 h-10 overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105">
                  <Image
                    src="/logo.png"
                    alt="Logo"
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>
                <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  KataKita
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Toggle Tema"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button
                onClick={() => setShowConfirmLogout(true)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-900/50 transition-colors"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-4rem)] w-full relative overflow-hidden">
        {/* Sidebar overlay (mobile) */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
 absolute inset-y-0 left-0 z-40 w-64
 transform transition-transform duration-300 ease-in-out
 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
 md:relative md:translate-x-0
 flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 h-full
 `}
        >
          {/* Mobile close */}
          <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
            <span className="font-bold text-slate-800 dark:text-white">Admin Menu</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 text-slate-500 hover:text-slate-600"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 md:py-8 space-y-2 overflow-y-auto">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setSidebarOpen(false)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                    isActive
                      ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20 font-bold"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  }`}
                >
                  <Icon size={18} className="w-5 text-center flex-shrink-0" />
                  <span className="text-left flex-1">{label}</span>
                </Link>
              );
            })}

            <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
              <Link
                href="/"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 font-bold transition-all"
              >
                <Globe size={18} className="w-5 text-center flex-shrink-0" />
                <span className="text-left flex-1">Lihat Website</span>
              </Link>
            </div>
          </nav>

          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setShowConfirmLogout(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 font-medium transition-all"
            >
              <LogOut size={18} className="w-5 text-center flex-shrink-0" />
              <span className="text-left flex-1">Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto w-full">
          <div className="min-h-full flex flex-col">
            <div className="flex-1">{children}</div>
            {/* Footer Inside Main Content */}
            <footer className="py-8 text-center border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 transition-colors mt-auto">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-[0.2em] ">
                Diskominfo &copy; 2026 KataKita Kota Serang
              </p>
            </footer>
          </div>
        </main>
      </div>

      {/* Custom Logout Confirmation Modal */}
      {showConfirmLogout && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setShowConfirmLogout(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl w-full max-w-sm border border-slate-200 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
              Konfirmasi Logout
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Apakah Anda yakin ingin keluar dari sistem?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmLogout(false)}
                className="flex-1 px-4 py-2 rounded-lg font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => handleLogout()}
                className="flex-1 px-4 py-2 rounded-lg font-medium bg-rose-600 hover:bg-rose-700 text-white transition-colors"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
