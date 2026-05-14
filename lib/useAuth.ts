"use client";

import { useCallback, useEffect, useState } from "react";

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;
const AUTH_STORAGE_KEY = "kataKita_user";
const LAST_ACTIVITY_KEY = "kataKita_lastActivity";
const AUTH_EVENT_NAME = "katakita-auth-changed";

export interface AuthUser {
  uid: string | number;
  email: string;
  nama?: string | null;
  role?: string;
}

export interface AuthState {
  user: AuthUser | null;
  userRole: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: (options?: { redirectToRoot?: boolean; isTimeout?: boolean }) => Promise<void>;
}

function readCachedUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function saveCachedUser(user: AuthUser | null) {
  if (!user) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    return;
  }

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
}

function emitAuthChanged(user: AuthUser | null) {
  window.dispatchEvent(
    new CustomEvent(AUTH_EVENT_NAME, {
      detail: { user },
    })
  );
}

function isAdminRoute() {
  return typeof window !== "undefined" && window.location.pathname.startsWith("/admin");
}

function redirectToRoot(isTimeout?: boolean) {
  if (typeof window === "undefined") return;
  window.location.replace(isTimeout ? "/?timeout=1" : "/");
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const applyUser = useCallback((nextUser: AuthUser | null) => {
    setUser(nextUser);
    setUserRole(nextUser?.role || null);
    saveCachedUser(nextUser);
  }, []);

  const logout = useCallback(
    async (options?: { redirectToRoot?: boolean; isTimeout?: boolean }) => {
      const savedTheme = localStorage.getItem("theme");

      try {
        await fetch("/api/auth/session", {
          method: "DELETE",
          cache: "no-store",
          credentials: "include",
        });
      } catch (err) {
        console.error("Logout request failed:", err);
      }

      localStorage.clear();
      sessionStorage.clear();
      if (savedTheme) localStorage.setItem("theme", savedTheme);

      // Clear browser caches automatically
      if ("caches" in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map((name) => caches.delete(name)));
        } catch (e) {
          console.error("Failed to clear cache:", e);
        }
      }

      // Clear all accessible cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      applyUser(null);
      emitAuthChanged(null);
      setLoading(false);

      if (options?.redirectToRoot || options?.isTimeout || isAdminRoute()) {
        redirectToRoot(options?.isTimeout);
      }
    },
    [applyUser]
  );

  const refreshSession = useCallback(
    async (options?: { redirectIfMissing?: boolean }) => {
      try {
        const res = await fetch("/api/auth/session", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });

        if (!res.ok) {
          applyUser(null);
          emitAuthChanged(null);
          if (options?.redirectIfMissing && isAdminRoute()) {
            redirectToRoot();
          }
          return;
        }

        const data = await res.json();
        const nextUser = data.user as AuthUser | null;

        if (!nextUser) {
          applyUser(null);
          emitAuthChanged(null);
          if (options?.redirectIfMissing && isAdminRoute()) {
            redirectToRoot();
          }
          return;
        }

        applyUser(nextUser);
        emitAuthChanged(nextUser);
      } catch (err) {
        console.error("Session refresh failed:", err);
        if (options?.redirectIfMissing && isAdminRoute()) {
          redirectToRoot();
        }
      } finally {
        setLoading(false);
      }
    },
    [applyUser]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        cache: "no-store",
        credentials: "include",
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Login failed" }));
        const error = new Error(errData.error || "Login failed");
        (error as any).code = errData.code || "";
        throw error;
      }

      const data = await res.json();
      const nextUser = data.user as AuthUser;
      applyUser(nextUser);
      emitAuthChanged(nextUser);
    },
    [applyUser]
  );

  useEffect(() => {
    const cachedUser = readCachedUser();
    if (cachedUser) {
      setUser(cachedUser);
      setUserRole(cachedUser.role || null);
    }

    refreshSession({ redirectIfMissing: true });

    const activityEvents = ["click", "scroll", "keypress", "mousemove", "touchstart"];
    const updateActivity = () => {
      if (readCachedUser()) {
        localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
      }
    };

    const checkInactivity = () => {
      const lastActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY) || 0);
      if (!lastActivity || !readCachedUser()) return;

      if (Date.now() - lastActivity > INACTIVITY_TIMEOUT_MS) {
        logout({ redirectToRoot: true, isTimeout: true });
      }
    };

    const handleStorageSync = () => {
      const nextUser = readCachedUser();
      setUser(nextUser);
      setUserRole(nextUser?.role || null);
    };

    const handleAuthSync = (event: Event) => {
      const detail = (event as CustomEvent<{ user?: AuthUser | null }>).detail;

      if (detail && "user" in detail) {
        setUser(detail.user ?? null);
        setUserRole(detail.user?.role || null);
        return;
      }

      handleStorageSync();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshSession({ redirectIfMissing: true });
      }
    };

    activityEvents.forEach((eventName) =>
      window.addEventListener(eventName, updateActivity, { passive: true })
    );
    window.addEventListener("storage", handleStorageSync);
    window.addEventListener(AUTH_EVENT_NAME, handleAuthSync);
    window.addEventListener("focus", handleVisibilityChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const interval = window.setInterval(checkInactivity, 60_000);

    return () => {
      window.clearInterval(interval);
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, updateActivity));
      window.removeEventListener("storage", handleStorageSync);
      window.removeEventListener(AUTH_EVENT_NAME, handleAuthSync);
      window.removeEventListener("focus", handleVisibilityChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [logout, refreshSession]);

  return { user, userRole, loading, login, logout };
}
