"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowUpDown,
  ExternalLink,
  Eye,
  Printer,
  Search,
} from "lucide-react";
import type { NewsItem, OfficialMapping, PaginatedNewsResponse, SortConfig } from "@/types";
import {
  buildNewsPath,
  formatDate,
  getBorderAccent,
  getOfficialMapping,
  getOfficialRolePriority,
  getSentimenClass,
} from "@/lib/utils";

export interface DetailPageQuery {
  potensi?: string;
  media?: string;
  role?: string;
  periodType?: "weekly" | "monthly";
  timeKey?: string;
  recentDays?: number;
}

interface DetailPageProps {
  filterQuery: DetailPageQuery;
  filterLabel: React.ReactNode;
  officialMapping: OfficialMapping;
  onBack: () => void;
  onOpenModal: (key: string) => void;
  onPrintDirect: (key: string) => void;
}

const EMPTY_PAGE: PaginatedNewsResponse = {
  items: [],
  page: 1,
  pageSize: 10,
  totalItems: 0,
  totalPages: 1,
};

export default function DetailPage({
  filterQuery,
  filterLabel,
  officialMapping,
  onBack,
  onOpenModal,
  onPrintDirect,
}: DetailPageProps) {
  const [searchInput, setSearchInput] = useState("");
  const deferredSearch = useDeferredValue(searchInput);
  const [sort, setSort] = useState<SortConfig>({ column: "date", direction: "desc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<PaginatedNewsResponse>(EMPTY_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearch, filterQuery, pageSize, sort]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      page: String(currentPage),
      pageSize: String(pageSize),
      sortField: sort.column,
      sortOrder: sort.direction,
    });

    if (deferredSearch.trim()) params.set("search", deferredSearch.trim());
    if (filterQuery.potensi) params.set("potensi", filterQuery.potensi);
    if (filterQuery.media) params.set("media", filterQuery.media);
    if (filterQuery.role) params.set("role", filterQuery.role);
    if (filterQuery.periodType) params.set("periodType", filterQuery.periodType);
    if (filterQuery.timeKey) params.set("timeKey", filterQuery.timeKey);
    if (filterQuery.recentDays) params.set("recentDays", String(filterQuery.recentDays));
    return params.toString();
  }, [currentPage, deferredSearch, filterQuery, pageSize, sort]);

  useEffect(() => {
    let isCurrent = true;

    async function fetchDetail() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/berita?${queryString}`);
        if (!res.ok) throw new Error("Gagal memuat berita");
        const data = (await res.json()) as PaginatedNewsResponse;
        if (isCurrent) {
          setResponse(data);
        }
      } catch (err) {
        if (!isCurrent) return;
        console.error("DetailPage fetch error:", err);
        setError("Gagal memuat daftar berita terfilter.");
        setResponse(EMPTY_PAGE);
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    }

    fetchDetail();
    return () => {
      isCurrent = false;
    };
  }, [queryString]);

  function toggleSort(column: SortConfig["column"]) {
    setSort((previous) =>
      previous.column === column
        ? { column, direction: previous.direction === "asc" ? "desc" : "asc" }
        : { column, direction: column === "date" ? "desc" : "asc" }
    );
  }

  function SortIcon({ column }: { column: SortConfig["column"] }) {
    if (sort.column !== column) return <ArrowUpDown size={12} className="opacity-40 ml-1" />;
    return sort.direction === "asc" ? (
      <ArrowUp size={12} className="ml-1 text-blue-500" />
    ) : (
      <ArrowDown size={12} className="ml-1 text-blue-500" />
    );
  }

  const pageNumbers: number[] = [];
  const start = Math.max(1, response.page - 1);
  const end = Math.min(response.totalPages, start + 2);
  for (let index = start; index <= end; index++) pageNumbers.push(index);

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-slate-800 rounded-[1.5rem] shadow-sm border border-slate-200 dark:border-slate-700 p-5 sm:p-6 space-y-6 relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-bold flex items-center gap-3 flex-wrap">
              <i className="fas fa-filter text-blue-600"></i>
              <div className="inline-flex items-center">{filterLabel}</div>
            </h3>
          </div>
          <button
            onClick={onBack}
            className="self-end sm:self-auto py-2.5 px-5 rounded-xl text-sm font-bold bg-red-500 hover:bg-blue-700 text-white shadow-md shadow-blue-500/30 transition-all flex items-center justify-center gap-2 group whitespace-nowrap"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />{" "}
            Kembali
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Telusuri Berita..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 bg-slate-100 dark:bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700/60 overflow-x-auto w-full lg:w-auto">
            <span className="text-xs font-bold text-slate-600 tracking-widest whitespace-nowrap">
              Urutkan:
            </span>
            {(["date", "title", "media", "potensi"] as SortConfig["column"][]).map((column) => (
              <button
                key={column}
                onClick={() => toggleSort(column)}
                className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-500 flex items-center gap-1 transition-colors whitespace-nowrap outline-none"
              >
                {column === "date"
                  ? "Tanggal"
                  : column === "title"
                    ? "Judul"
                    : column === "media"
                      ? "Media"
                      : "Potensi"}
                <SortIcon column={column} />
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <div className="flex flex-col gap-4">
            {loading ? (
              <div className="p-12 text-center text-slate-500 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 rounded-xl">
                Sedang memuat data...
              </div>
            ) : error ? (
              <div className="p-12 text-center text-rose-500 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl">
                {error}
              </div>
            ) : response.items.length === 0 ? (
              <div className="p-12 text-center text-slate-500 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 rounded-xl">
                Tidak ada data ditemukan dalam filter ini.
              </div>
            ) : (
              response.items.map((news, index) => {
                const pejabatArray = Array.isArray(news.pejabat)
                  ? news.pejabat
                  : news.pejabat
                    ? [news.pejabat]
                    : [];
                const border = getBorderAccent(news.potensi);
                const sentimenClass = getSentimenClass(news.potensi);
                const seqNumber = (response.page - 1) * response.pageSize + index + 1;

                return (
                  <div
                    key={news.key}
                    onClick={() => onOpenModal(news.key)}
                    className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 sm:p-5 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group flex flex-col gap-5 items-start relative overflow-hidden"
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${border}`} />

                    <div className="flex-1 flex flex-col gap-3 pl-1 w-full">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 mr-1">
                          No.{seqNumber.toString().padStart(2, "0")}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wider scale-90 -ml-1 ${sentimenClass}`}
                        >
                          {news.potensi}
                        </span>
                        <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider">
                          {news.media}
                        </span>
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 tracking-widest ml-1">
                          {formatDate(news.tanggal_raw)}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100 leading-relaxed text-[15px] sm:text-base group-hover:text-blue-600 transition-colors min-w-0">
                          {news.judul}
                        </div>

                        <div
                          className="flex flex-wrap items-center gap-2 shrink-0"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <button
                            onClick={() => onOpenModal(news.key)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"
                            title="Baca Berita"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => onPrintDirect(news.key)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all"
                            title="Cetak Berita"
                          >
                            <Printer size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (onOpenModal) onOpenModal(news.key);
                            }}
                            className="inline-flex min-h-9 items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                          >
                            Baca Selengkapnya
                            <ExternalLink size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300 mt-1">
                        {pejabatArray.length > 0 ? (
                          (() => {
                            // Sort by priority, pick the top one to display. Give highest priority to the filtered role if present.
                            const targetRole = filterQuery.role?.trim().toLowerCase();
                            const sorted = [...pejabatArray].sort((a, b) => {
                              const mA = getOfficialMapping(a, officialMapping);
                              const mB = getOfficialMapping(b, officialMapping);
                              const roleA = (mA?.jabatan || mA?.role || a).toLowerCase();
                              const roleB = (mB?.jabatan || mB?.role || b).toLowerCase();

                              if (targetRole) {
                                if (roleA === targetRole && roleB !== targetRole) return -1;
                                if (roleB === targetRole && roleA !== targetRole) return 1;
                              }

                              const pA = getOfficialRolePriority(mA?.jabatan || mA?.role || a);
                              const pB = getOfficialRolePriority(mB?.jabatan || mB?.role || b);
                              return pA - pB;
                            });
                            const topName = sorted[0];
                            const topMapping = getOfficialMapping(topName, officialMapping);
                            const roleLabel = topMapping ? topMapping.role : "";
                            const extras = pejabatArray.length - 1;
                            return (
                              <>
                                <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800/60 px-2 py-1.5 rounded-md border border-slate-200 dark:border-slate-700">
                                  <i className="fas fa-user text-[10px] text-blue-500 shrink-0"></i>
                                  <span className="font-medium text-slate-700 dark:text-slate-300 break-words flex-1 min-w-[50px] leading-snug">
                                    {topName}
                                  </span>
                                  {roleLabel && (
                                    <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider">
                                      {roleLabel}
                                    </span>
                                  )}
                                </div>
                                {extras > 0 && (
                                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/60 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                                    +{extras} lainnya
                                  </span>
                                )}
                              </>
                            );
                          })()
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-col-reverse sm:flex-row items-center gap-6 w-full justify-center">
            <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
              <span className="text-[10px] font-black tracking-widest opacity-60">Tampilkan</span>
              <select
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
                className="bg-slate-100/50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-1.5 focus:ring-2 focus:ring-blue-500 font-black text-slate-700 dark:text-slate-300 transition-all outline-none appearance-none cursor-pointer"
              >
                {[10, 20, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <span className="text-[10px] font-black tracking-widest opacity-60">Baris</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={response.page === 1}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-all shadow-sm"
              >
                <i className="fas fa-chevron-left text-xs"></i>
              </button>
              <div className="flex items-center gap-2">
                {pageNumbers.map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${page === response.page ? "bg-blue-600 text-white shadow-lg shadow-blue-500/40" : "hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"}`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage((page) => Math.min(response.totalPages, page + 1))}
                disabled={response.page === response.totalPages}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-all shadow-sm"
              >
                <i className="fas fa-chevron-right text-xs"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
