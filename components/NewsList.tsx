"use client";

import { useDeferredValue, useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Search } from "lucide-react";
import type { NewsItem, PaginatedNewsResponse } from "@/types";
import { buildNewsPath, formatDate, getBorderAccent, getSentimenClass } from "@/lib/utils";

interface NewsListProps {
  onOpenModal: (key: string) => void;
  onOpenDetail: () => void;
}

interface NewsCardProps {
  news: NewsItem;
  onClick: () => void;
}

function NewsCard({ news, onClick }: NewsCardProps) {
  const border = getBorderAccent(news.potensi);
  const sentimenClass = getSentimenClass(news.potensi);

  return (
    <div
      onClick={onClick}
      className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 sm:p-5 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group flex flex-col gap-3 relative overflow-hidden"
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${border}`} />
      <div className="flex flex-wrap items-center gap-3 pl-1">
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${sentimenClass}`}>
          {news.potensi}
        </span>
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-widest">
          {formatDate(news.tanggal_raw)}
        </span>
      </div>
      <div className="font-bold text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors leading-relaxed text-[15px] pl-1">
        {news.judul}
      </div>
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pl-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {news.media || "Media tidak tersedia"}
        </span>
        <Link
          href={buildNewsPath(news)}
          onClick={(event) => event.stopPropagation()}
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Baca Selengkapnya <ExternalLink size={12} />
        </Link>
      </div>
    </div>
  );
}

const EMPTY_PAGE: PaginatedNewsResponse = {
  items: [],
  page: 1,
  pageSize: 10,
  totalItems: 0,
  totalPages: 1,
};

export default function NewsList({ onOpenModal, onOpenDetail }: NewsListProps) {
  const [searchInput, setSearchInput] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<PaginatedNewsResponse>(EMPTY_PAGE);
  const deferredSearch = useDeferredValue(searchInput);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      page: String(currentPage),
      pageSize: String(pageSize),
      sortField: "date",
      sortOrder: "desc",
    });

    if (deferredSearch.trim()) {
      params.set("search", deferredSearch.trim());
    }

    async function fetchNews() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/berita?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Gagal memuat berita");
        const data = (await res.json()) as PaginatedNewsResponse;
        setResponse(data);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        console.error("NewsList fetch error:", err);
        setError("Gagal memuat daftar berita.");
        setResponse(EMPTY_PAGE);
      } finally {
        setLoading(false);
      }
    }

    fetchNews();
    return () => controller.abort();
  }, [currentPage, deferredSearch, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearch, pageSize]);

  const pageNumbers: number[] = [];
  const start = Math.max(1, response.page - 1);
  const end = Math.min(response.totalPages, start + 2);
  for (let index = start; index <= end; index++) pageNumbers.push(index);

  return (
    <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-slate-300 dark:border-slate-600 p-4 sm:p-5 space-y-6 mt-8 sm:mt-12">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <h3 className="text-lg sm:text-xl font-bold flex items-center gap-3 text-slate-800 dark:text-white text-left">
          <i className="fas fa-newspaper text-blue-600 text-xl sm:text-2xl"></i>
          Daftar Berita Terbaru
        </h3>
        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Cari berdasarkan judul, potensi, pejabat..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-sm"
          />
        </div>
      </div>

      <div className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-700 mb-4 pr-2 pb-3">
          <div className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-xs">
            Informasi Berita
          </div>
          <button
            onClick={onOpenDetail}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors flex items-center gap-1 group"
          >
            Buka Detail
            <i className="fas fa-external-link-alt text-[10px] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"></i>
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="animate-pulse bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-8 text-center text-slate-400">
              Sedang memuat data...
            </div>
          ) : error ? (
            <div className="p-8 text-center text-rose-500 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl">
              {error}
            </div>
          ) : response.items.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 rounded-xl">
              Tidak ada berita ditemukan.
            </div>
          ) : (
            response.items.map((news) => (
              <NewsCard key={news.key} news={news} onClick={() => onOpenModal(news.key)} />
            ))
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pt-4">
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 font-medium">
          <span>
            Menampilkan{" "}
            <strong className="text-slate-800 dark:text-slate-200">
              {response.totalItems === 0
                ? 0
                : (response.page - 1) * response.pageSize + 1}
              -
              {Math.min(response.page * response.pageSize, response.totalItems)}
            </strong>{" "}
            dari{" "}
            <strong className="text-slate-800 dark:text-slate-200">
              {response.totalItems}
            </strong>{" "}
            berita
          </span>
          <span className="text-xs text-slate-400">
            Mode ringan aktif: data diambil per halaman dari server.
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full lg:w-auto">
          <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
            <span>Tampilkan</span>
            <select
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value))}
              className="bg-blue-50/50 dark:bg-slate-950/50 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 dark:text-slate-300 transition-colors"
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>baris</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={response.page === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <i className="fas fa-chevron-left text-xs"></i>
            </button>
            {pageNumbers.map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all ${page === response.page ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"}`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((page) => Math.min(response.totalPages, page + 1))}
              disabled={response.page === response.totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <i className="fas fa-chevron-right text-xs"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
