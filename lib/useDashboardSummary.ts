"use client";

import { useCallback, useEffect, useState } from "react";
import type { DashboardSummary } from "@/types";

const EMPTY_SUMMARY: DashboardSummary = {
  stats: {
    total: 0,
    positive: 0,
    neutral: 0,
    negative: 0,
  },
  officialCounts: [],
  trend: {
    weekly: [],
    monthly: [],
  },
  officialMapping: {},
  mediaMapping: {},
  mediaLegend: [],
  totalOfficials: 0,
  totalUnits: 0,
  totalMedia: 0,
};

export function useDashboardSummary() {
  const [summary, setSummary] = useState<DashboardSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/dashboard/summary", { credentials: "include" });
      if (!res.ok) {
        throw new Error("Gagal memuat ringkasan dashboard");
      }

      const data = (await res.json()) as DashboardSummary;
      setSummary(data);
    } catch (err) {
      console.error("useDashboardSummary error:", err);
      setError("Gagal memuat data dashboard. Silakan coba lagi.");
      setSummary(EMPTY_SUMMARY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    ...summary,
    loading,
    error,
    refetch: fetchSummary,
  };
}
