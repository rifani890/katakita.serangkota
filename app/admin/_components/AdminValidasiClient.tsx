"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Play,
  Square,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Smartphone,
  Bell,
  RefreshCw,
  ListChecks,
  TrendingUp,
  FileText,
  Eye,
} from "lucide-react";
import { useDashboardSummary } from "@/lib/useDashboardSummary";
import { OFFICIAL_ROLE_ORDER, getOfficialRolePriority } from "@/lib/utils";

interface ValidationResult {
  id: string;
  rule: string;
  expected: string;
  actual: string;
  status: "pass" | "fail";
  category: "priority" | "normalization" | "data" | "mapping";
}

interface RunSummary {
  runId: string;
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  duration: number;
  status: "running" | "completed" | "failed";
}

export default function AdminValidasiClient() {
  const {
    stats,
    officialCounts,
    totalOfficials,
    totalUnits,
    totalMedia,
    loading: summaryLoading,
  } = useDashboardSummary();

  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [latestRun, setLatestRun] = useState<RunSummary | null>(null);
  const [history, setHistory] = useState<RunSummary[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [showCompactView, setShowCompactView] = useState(false);
  const [selectedError, setSelectedError] = useState<ValidationResult | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("testsprite_history");
      if (stored) {
        const parsed = JSON.parse(stored) as RunSummary[];
        setHistory(parsed);
        if (parsed.length > 0) setLatestRun(parsed[0]);
      }
    } catch {
      // ignore
    }
  }, []);

  const saveHistory = useCallback((newRun: RunSummary) => {
    setHistory((prev) => {
      const next = [newRun, ...prev].slice(0, 10);
      try {
        localStorage.setItem("testsprite_history", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const runValidation = useCallback(async () => {
    setIsRunning(true);
    setResults([]);
    const startTime = Date.now();

    const newResults: ValidationResult[] = [];

    // Test 1: Priority Order Checker
    const sortedRoles = [...officialCounts].sort(
      (a, b) => (a.priority || 4) - (b.priority || 4)
    );
    const expectedOrder = OFFICIAL_ROLE_ORDER;
    sortedRoles.forEach((role, index) => {
      const expected = expectedOrder[index] || "Pejabat Lainnya";
      newResults.push({
        id: `priority-${index}`,
        rule: `Priority Order Position ${index + 1}`,
        expected,
        actual: role.role,
        status: role.role === expected ? "pass" : "fail",
        category: "priority",
      });
    });

    // Test 2: Normalization Test
    const testCases = [
      { input: "'Walikota Serang'", expected: "Walikota Serang" },
      { input: "  Wakil Walikota Serang  ", expected: "Wakil Walikota Serang" },
      { input: '"Sekda"', expected: "Sekretaris Daerah Kota Serang" },
      { input: "WALIKOTA", expected: "Walikota Serang" },
    ];

    testCases.forEach((tc, idx) => {
      const normalized = tc.input
        .trim()
        .replace(/^['"]+|['"]+$/g, "")
        .trim()
        .toLowerCase();
      const compact = normalized.replace(/\s+/g, "");
      let actual = "Pejabat Lainnya";
      if (compact.includes("wakilwalikota")) actual = "Wakil Walikota Serang";
      else if (compact.includes("walikota")) actual = "Walikota Serang";
      else if (
        normalized.includes("sekertaris daerah") ||
        normalized.includes("sekretaris daerah") ||
        normalized === "sekda" ||
        normalized.includes("sekda")
      )
        actual = "Sekretaris Daerah Kota Serang";

      newResults.push({
        id: `normalization-${idx}`,
        rule: `Normalize input: ${tc.input}`,
        expected: tc.expected,
        actual,
        status: actual === tc.expected ? "pass" : "fail",
        category: "normalization",
      });
    });

    // Test 3: Data integrity
    newResults.push({
      id: "data-stats",
      rule: "Total Berita matches sum of sentiments",
      expected: String(stats.total),
      actual: String(stats.positive + stats.neutral + stats.negative),
      status: stats.total === stats.positive + stats.neutral + stats.negative ? "pass" : "fail",
      category: "data",
    });

    newResults.push({
      id: "data-officials",
      rule: "Total Pejabat is non-negative",
      expected: ">= 0",
      actual: String(totalOfficials),
      status: totalOfficials >= 0 ? "pass" : "fail",
      category: "data",
    });

    newResults.push({
      id: "data-units",
      rule: "Total Unit Kerja is non-negative",
      expected: ">= 0",
      actual: String(totalUnits),
      status: totalUnits >= 0 ? "pass" : "fail",
      category: "data",
    });

    newResults.push({
      id: "data-media",
      rule: "Total Media is non-negative",
      expected: ">= 0",
      actual: String(totalMedia),
      status: totalMedia >= 0 ? "pass" : "fail",
      category: "data",
    });

    // Test 4: Mapping consistency
    officialCounts.forEach((role, idx) => {
      const priority = getOfficialRolePriority(role.role);
      newResults.push({
        id: `mapping-${idx}`,
        rule: `Mapping priority for ${role.role}`,
        expected: String(priority),
        actual: String(role.priority || priority),
        status: (role.priority || priority) === priority ? "pass" : "fail",
        category: "mapping",
      });
    });

    // Simulate run delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setResults(newResults);
    const passed = newResults.filter((r) => r.status === "pass").length;
    const failed = newResults.filter((r) => r.status === "fail").length;

    const summary: RunSummary = {
      runId: `RUN-${Date.now()}`,
      timestamp: new Date().toISOString(),
      totalTests: newResults.length,
      passed,
      failed,
      duration: Date.now() - startTime,
      status: failed > 0 ? "failed" : "completed",
    };

    setLatestRun(summary);
    saveHistory(summary);

    // Alert behavior
    if (failed > 0) {
      setAlertMessage(`⚠️ ${failed} validasi gagal terdeteksi! Mohon periksa detail error.`);
      setShowAlert(true);
    } else {
      // No alert for passing run, but show success briefly
      setAlertMessage("");
      setShowAlert(false);
    }

    setIsRunning(false);
  }, [officialCounts, stats, totalOfficials, totalUnits, totalMedia, saveHistory]);

  const stopValidation = () => {
    setIsRunning(false);
  };

  const failedResults = results.filter((r) => r.status === "fail");
  const passedResults = results.filter((r) => r.status === "pass");

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className={`p-4 sm:p-8 space-y-6 ${previewMode === "mobile" ? "max-w-sm mx-auto" : ""}`}>
      {/* Alert Notification */}
      {showAlert && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 p-4 flex items-start gap-3"
        >
          <Bell className="text-rose-500 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <div className="font-bold text-rose-700 dark:text-rose-400">Validation Alert</div>
            <div className="text-sm text-rose-600 dark:text-rose-300">{alertMessage}</div>
          </div>
          <button
            onClick={() => setShowAlert(false)}
            className="text-rose-500 hover:text-rose-700 text-sm font-bold"
            aria-label="Close alert"
          >
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Shield className="text-blue-500" size={28} />
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Validasi Data (TestSprite)</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Automated data validation & priority rules</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Mobile Preview Toggle */}
          <button
            onClick={() => setPreviewMode(previewMode === "desktop" ? "mobile" : "desktop")}
            className="flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] min-w-[44px] rounded-lg font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all text-sm"
            title="Toggle Mobile Preview"
          >
            <Smartphone size={16} />
            <span className="hidden sm:inline">
              {previewMode === "desktop" ? "Preview Mobile" : "Preview Desktop"}
            </span>
          </button>

          {/* Run/Stop Test Buttons */}
          {!isRunning ? (
            <button
              onClick={runValidation}
              disabled={summaryLoading}
              className="flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] min-w-[44px] rounded-lg font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Run Test"
            >
              <Play size={16} />
              <span>Run Test</span>
            </button>
          ) : (
            <button
              onClick={stopValidation}
              className="flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] min-w-[44px] rounded-lg font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/30 transition-all active:scale-95"
              aria-label="Stop Test"
            >
              <Square size={16} />
              <span>Stop Test</span>
            </button>
          )}
        </div>
      </div>

      {/* Latest Run Summary */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Clock size={18} className="text-blue-500" />
            Status Run Terakhir
          </h3>
          {latestRun && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Terakhir dijalankan: {formatDate(latestRun.timestamp)}
            </span>
          )}
        </div>

        {!latestRun ? (
          <div className="text-center py-8 text-slate-400">
            <ListChecks size={36} className="mx-auto mb-3 opacity-50" />
            <p>Belum ada validasi yang dijalankan.</p>
            <p className="text-xs mt-1">Klik &quot;Run Test&quot; untuk memulai siklus validasi.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-3">
              <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">Total Tests</div>
              <div className="text-2xl font-black text-blue-700 dark:text-blue-300">{latestRun.totalTests}</div>
            </div>
            <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-3">
              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Passed</div>
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{latestRun.passed}</div>
            </div>
            <div className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 p-3">
              <div className="text-xs font-semibold text-rose-600 dark:text-rose-400">Failed</div>
              <div className="text-2xl font-black text-rose-700 dark:text-rose-300">{latestRun.failed}</div>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-3">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">Duration</div>
              <div className="text-2xl font-black text-slate-700 dark:text-slate-300">
                {(latestRun.duration / 1000).toFixed(1)}s
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pass/Fail Status Cards (Mobile Summary Dashboard) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={18} />
            <span className="text-xs font-semibold">Positif</span>
          </div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-2">
            {summaryLoading ? "-" : stats.positive}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-4">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <AlertCircle size={18} />
            <span className="text-xs font-semibold">Netral</span>
          </div>
          <div className="text-2xl font-black text-slate-700 dark:text-slate-300 mt-2">
            {summaryLoading ? "-" : stats.neutral}
          </div>
        </div>
        <div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 p-4">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <XCircle size={18} />
            <span className="text-xs font-semibold">Negatif</span>
          </div>
          <div className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-2">
            {summaryLoading ? "-" : stats.negative}
          </div>
        </div>
        <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <TrendingUp size={18} />
            <span className="text-xs font-semibold">Total</span>
          </div>
          <div className="text-2xl font-black text-blue-700 dark:text-blue-300 mt-2">
            {summaryLoading ? "-" : stats.total}
          </div>
        </div>
      </div>

      {/* Priority Rules Panel */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 sm:p-6">
        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
          <ListChecks size={18} className="text-amber-500" />
          Aturan Prioritas (Priority Rules)
        </h3>
        <ol className="space-y-2">
          {OFFICIAL_ROLE_ORDER.map((role, idx) => (
            <li
              key={role}
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700"
            >
              <span className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 text-white font-bold text-sm">
                {idx + 1}
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">{role}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Validation Results */}
      {results.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <FileText size={18} className="text-indigo-500" />
              Hasil Validasi
            </h3>
            <button
              onClick={() => setShowCompactView(!showCompactView)}
              className="flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
              aria-label="Toggle compact view"
            >
              <Smartphone size={14} />
              {showCompactView ? "Tampilan Penuh" : "Tampilan Kompak (Mobile)"}
            </button>
          </div>

          {/* Failed/Error Summary Items - Clickable */}
          {failedResults.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-bold uppercase tracking-wider text-rose-500 mb-2">
                Failed Items ({failedResults.length})
              </div>
              <div className="space-y-2">
                {failedResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => setSelectedError(result)}
                    className="w-full flex items-start gap-3 p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all text-left"
                    aria-label={`View error details for ${result.rule}`}
                  >
                    <XCircle className="text-rose-500 flex-shrink-0 mt-0.5" size={18} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-rose-700 dark:text-rose-400 text-sm">
                        {result.rule}
                      </div>
                      {!showCompactView && (
                        <div className="text-xs text-rose-600 dark:text-rose-300 mt-1">
                          Expected: <span className="font-mono">{result.expected}</span> | Actual:{" "}
                          <span className="font-mono">{result.actual}</span>
                        </div>
                      )}
                    </div>
                    <Eye size={16} className="text-rose-400 flex-shrink-0 mt-0.5" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Passed Items */}
          {passedResults.length > 0 && !showCompactView && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-500 mb-2">
                Passed Items ({passedResults.length})
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {passedResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
                  >
                    <CheckCircle2 className="text-emerald-500 flex-shrink-0 mt-0.5" size={18} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm">
                        {result.rule}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Details Modal */}
      {selectedError && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedError(null)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <XCircle className="text-rose-500" size={24} />
                <h4 className="text-lg font-bold text-slate-800 dark:text-white">Detail Error</h4>
              </div>
              <button
                onClick={() => setSelectedError(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold w-8 h-8 flex items-center justify-center"
                aria-label="Close error details"
              >
                ×
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Rule</div>
                <div className="text-sm text-slate-800 dark:text-white">{selectedError.rule}</div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Category</div>
                <div className="text-sm text-slate-800 dark:text-white capitalize">{selectedError.category}</div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-500 mb-1">Expected</div>
                <div className="text-sm font-mono p-2 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300">
                  {selectedError.expected}
                </div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-rose-500 mb-1">Actual</div>
                <div className="text-sm font-mono p-2 rounded bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300">
                  {selectedError.actual}
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedError(null)}
              className="w-full px-4 py-3 min-h-[44px] rounded-lg font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 sm:p-6">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
            <RefreshCw size={18} className="text-indigo-500" />
            Riwayat Validasi
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {history.map((run) => (
              <div
                key={run.runId}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {run.status === "completed" ? (
                    <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={18} />
                  ) : (
                    <XCircle className="text-rose-500 flex-shrink-0" size={18} />
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                      {run.runId}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(run.timestamp)}
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-emerald-500">Pass: {run.passed}</div>
                  <div className="text-xs text-rose-500">Fail: {run.failed}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
