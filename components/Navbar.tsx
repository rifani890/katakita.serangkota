"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Moon,
  Sun,
  BarChart2,
  LogIn,
  LogOut,
  Loader2,
  Home as HomeIcon,
  Menu,
  X,
  LayoutDashboard,
} from "lucide-react";
import { useTheme } from "@/lib/useTheme";
import { useAuth } from "@/lib/useAuth";
import Login from "./Login";

interface NavbarProps {
  onHomeClick?: () => void;
}

export default function Navbar({ onHomeClick }: NavbarProps = {}) {
  const { isDark, toggleTheme } = useTheme();
  const { user, loading: authLoading, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [loginRedirect, setLoginRedirect] = useState("/admin");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isLoggedIn = Boolean(user);

  const showLoginBtn = !authLoading && !isLoggedIn;
  const showLogoutBtn = !authLoading && isLoggedIn;
  const showAdminBtn = !authLoading && isLoggedIn;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("login") === "1" && !authLoading && !isLoggedIn) {
      const next = params.get("next");
      setLoginRedirect(next?.startsWith("/") ? next : "/admin");
      setShowLogin(true);
    }
  }, [authLoading, isLoggedIn]);

  const [showConfirmLogout, setShowConfirmLogout] = useState(false);

  const handleLogout = async () => {
    setShowConfirmLogout(false);
    setShowLogin(false);
    await logout();
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 w-full bg-white/90 dark:bg-dark-card/90 backdrop-blur-md border-b border-slate-300 dark:border-slate-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between min-h-16 py-3 items-center gap-3">
            {/* Logo — always a root link */}
            <Link
              href="/"
              className="flex items-center gap-3 min-w-0 group cursor-pointer"
              onClick={(e) => {
                if (onHomeClick) {
                  e.preventDefault();
                  onHomeClick();
                }
              }}
            >
              <div className="w-10 h-10 overflow-hidden flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105">
                <img
                  src="/logo.png"
                  alt="Logo KataKita"
                  className="w-10 h-10 object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent leading-none">
                  KataKita
                </span>
                <span className="text-[9px] font-black tracking-[0.3em] text-slate-400 dark:text-slate-500 mt-0.5">
                  Kota Serang
                </span>
              </div>
            </Link>

            {/* Desktop Center Nav */}
            <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-1 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl">
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-all"
                onClick={(e) => {
                  if (onHomeClick) {
                    e.preventDefault();
                    onHomeClick();
                  }
                }}
              >
                <HomeIcon size={16} />
                Home
              </Link>
              <Link
                href="/grafik"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-all"
              >
                <BarChart2 size={16} />
                Grafik
              </Link>
            </div>

            {/* Desktop Right Actions */}
            <div className="relative flex justify-end items-center gap-2 sm:gap-3 z-20">
              {/* Theme toggle — always visible (mobile + desktop) */}
              <button
                onClick={toggleTheme}
                className="flex p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Toggle Tema"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {authLoading && (
                <div
                  className="hidden md:flex items-center justify-center w-[7.5rem] sm:w-[8.5rem] h-10 rounded-lg bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300"
                  aria-busy="true"
                  aria-label="Memuat status login"
                >
                  <Loader2 size={18} className="animate-spin" />
                </div>
              )}

              {showAdminBtn && (
                <a
                  href="/admin"
                  className="hidden md:inline-flex btn text-sm border-0 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 transition-colors items-center gap-2 px-3 sm:px-4 py-2 font-bold rounded-lg cursor-pointer"
                >
                  <LayoutDashboard size={16} />
                  <span>Admin</span>
                </a>
              )}

              {showLogoutBtn && (
                <button
                  type="button"
                  onClick={() => setShowConfirmLogout(true)}
                  className="hidden md:flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-900/50 transition-colors"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              )}

              {showLoginBtn && (
                <button
                  type="button"
                  onClick={() => {
                    setLoginRedirect("/admin");
                    setShowLogin(true);
                  }}
                  className="hidden md:flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors"
                >
                  <LogIn size={16} />
                  <span>Login</span>
                </button>
              )}

              {/* Mobile hamburger */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                aria-label="Toggle Menu"
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Backdrop — click to close menu */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Mobile dropdown */}
        {isMobileMenuOpen && (
          <div className="relative z-50 md:hidden border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-dark-card/95 backdrop-blur-xl px-4 py-4 space-y-2 shadow-lg">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <HomeIcon size={18} className="text-indigo-500" />
              Home
            </Link>
            <Link
              href="/grafik"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <BarChart2 size={18} className="text-blue-500" />
              Grafik
            </Link>

            <div className="border-t border-slate-200/50 dark:border-slate-700/50 my-2"></div>

            {showAdminBtn && (
              <a
                href="/admin"
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
              >
                <LayoutDashboard size={18} />
                Admin
              </a>
            )}

            {showLogoutBtn && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setShowConfirmLogout(true);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 font-bold hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
              >
                <LogOut size={18} />
                Logout
              </button>
            )}

            {showLoginBtn && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setLoginRedirect("/admin");
                  setShowLogin(true);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-bold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
              >
                <LogIn size={18} />
                Login
              </button>
            )}
          </div>
        )}
      </nav>

      <Login isOpen={showLogin} onClose={() => setShowLogin(false)} redirectTo={loginRedirect} />

      {showConfirmLogout && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setShowConfirmLogout(false)}
        >
          <div
            className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-xl w-full max-w-sm border border-slate-200 dark:border-slate-700"
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
                className="flex-1 px-4 py-2 rounded-lg font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 rounded-lg font-medium bg-rose-600 hover:bg-rose-700 text-white transition-colors"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
