"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Moon, Sun, BarChart2, LogIn, LogOut, Loader2 } from "lucide-react";
import { useTheme } from "@/lib/useTheme";
import { useAuth } from "@/lib/useAuth";
import LoginModal from "./LoginModal";

export default function Navbar() {
  const { isDark, toggleTheme } = useTheme();
  const { user, loading: authLoading, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [loginRedirect, setLoginRedirect] = useState("/admin");

  const isLoggedIn = Boolean(user);
  const isAdmin = user?.role === "admin";

  const showLoginBtn = !authLoading && !isLoggedIn;
  const showLogoutBtn = !authLoading && isLoggedIn;
  const showAdminBtn = !authLoading && isLoggedIn && isAdmin;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("login") === "1" && !authLoading && !isLoggedIn) {
      const next = params.get("next");
      setLoginRedirect(next?.startsWith("/") ? next : "/admin");
      setShowLogin(true);
    }
  }, [authLoading, isLoggedIn]);

  const handleLogout = async () => {
    if (confirm("Apakah Anda yakin ingin keluar (logout) dari sistem ini?")) {
      setShowLogin(false);
      await logout();
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 w-full bg-white/90 dark:bg-dark-card/90 backdrop-blur-md border-b border-slate-300 dark:border-slate-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between min-h-16 py-3 items-center gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 overflow-hidden flex items-center justify-center flex-shrink-0">
                <Image
                  src="/logo.png"
                  alt="Logo KataKita"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <span className="text-lg sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent truncate">
                KataKita
              </span>
            </div>

            <div className="relative flex flex-wrap justify-end items-center gap-2 sm:gap-3">
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Toggle Tema"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {authLoading && (
                <div
                  className="flex items-center justify-center w-[7.5rem] sm:w-[8.5rem] h-10 rounded-lg bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400"
                  aria-busy="true"
                  aria-label="Memuat status login"
                >
                  <Loader2 size={18} className="animate-spin" />
                </div>
              )}

              {showAdminBtn && (
                <a
                  href="/admin"
                  className="inline-flex btn text-sm border-0 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 transition-colors items-center gap-2 px-3 sm:px-4 py-2 font-bold rounded-lg cursor-pointer"
                >
                  <BarChart2 size={16} />
                  <span className="hidden sm:inline">Admin</span>
                </a>
              )}

              {showLogoutBtn && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-900/50 transition-colors"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              )}

              {showLoginBtn && (
                <button
                  type="button"
                  onClick={() => {
                    setLoginRedirect("/admin");
                    setShowLogin(true);
                  }}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors"
                >
                  <LogIn size={16} />
                  <span className="hidden sm:inline">Login</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        redirectTo={loginRedirect}
      />
    </>
  );
}
