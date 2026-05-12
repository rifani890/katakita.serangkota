"use client";

import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Newspaper,
  Pencil,
  Plus,
  Printer,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { printNews } from "@/lib/print";
import { formatDate, getBorderAccent, getCardGradient } from "@/lib/utils";
import { LoadingOverlay, ConfirmDialog } from "./AdminUI";
import type { NewsItem, PaginatedNewsResponse } from "@/types";

type SortField = "tanggal_raw" | "judul" | "media" | "potensi";
type SortOrder = "asc" | "desc";

const EMPTY_PAGE: PaginatedNewsResponse = {
  items: [],
  page: 1,
  pageSize: 10,
  totalItems: 0,
  totalPages: 1,
};

export default function AdminBeritaClient() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const deferredSearch = useDeferredValue(searchInput);
  const [sortField, setSortField] = useState<SortField>("tanggal_raw");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingText, setSavingText] = useState("Memproses...");
  const [response, setResponse] = useState<PaginatedNewsResponse>(EMPTY_PAGE);
  const [viewNews, setViewNews] = useState<NewsItem | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMsg, setConfirmMsg] = useState("");
  const [confirmType, setConfirmType] = useState<"info" | "delete">("info");
  const [confirmAction, setConfirmAction] = useState<() => void>(() => { });

  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(perPage),
      sortField,
      sortOrder,
    });
    if (deferredSearch.trim()) params.set("search", deferredSearch.trim());
    return params.toString();
  }, [deferredSearch, page, perPage, sortField, sortOrder]);

  useEffect(() => {
    let isCurrent = true;

    async function loadData() {
      setLoading(true);
      try {
        const res = await fetchWithAuth(`/api/berita?${queryString}`);
        if (!res.ok) throw new Error("Gagal memuat berita");
        const data = (await res.json()) as PaginatedNewsResponse;
        if (isCurrent) {
          setResponse(data);
        }
      } catch (err) {
        if (!isCurrent) return;
        console.error("AdminBeritaClient fetch error:", err);
        setResponse(EMPTY_PAGE);
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      isCurrent = false;
    };
  }, [queryString]);

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, perPage, sortField, sortOrder]);

  const askConfirm = (title: string, message: string, type: "info" | "delete", action: () => void) => {
    setConfirmTitle(title);
    setConfirmMsg(message);
    setConfirmType(type);
    setConfirmAction(() => action);
    setConfirmOpen(true);
  };

  const handleDelete = (key: string, judul: string) => {
    askConfirm("Hapus Berita", `Apakah Anda yakin ingin menghapus berita "${judul}" secara permanen?`, "delete", async () => {
      setConfirmOpen(false);
      setSavingText("Menghapus Berita...");
      setSaving(true);
      try {
        await fetchWithAuth(`/api/berita?id=${key}`, { method: "DELETE" });
        const res = await fetchWithAuth(`/api/berita?${queryString}`);
        if (res.ok) {
          const data = (await res.json()) as PaginatedNewsResponse;
          setResponse(data);
        }
      } catch (err) {
        console.error("handleDelete error:", err);
        alert("Gagal menghapus berita.");
      } finally {
        setSaving(false);
      }
    });
  };

  const handlePrint = (news: NewsItem) => {
    askConfirm("Cetak Berita", "Apakah Anda ingin mencetak rincian berita ini?", "info", () => {
      setConfirmOpen(false);
      printNews(news);
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((order) => (order === "asc" ? "desc" : "asc"));
      return;
    }
    setSortField(field);
    setSortOrder(field === "tanggal_raw" ? "desc" : "asc");
  };

  const potensiColor: Record<string, string> = {
    Positif: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    Negatif: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    Netral: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
  };

  const pageNumbers = Array.from({ length: Math.min(5, response.totalPages) }, (_, index) => {
    if (response.totalPages <= 5) return index + 1;
    if (response.page <= 3) return index + 1;
    if (response.page >= response.totalPages - 2) return response.totalPages - 4 + index;
    return response.page - 2 + index;
  });

  return (
    <div className="p-4 sm:p-8">
      <LoadingOverlay show={saving} text={savingText} />
      <ConfirmDialog
        show={confirmOpen}
        title={confirmTitle}
        message={confirmMsg}
        type={confirmType}
        onConfirm={confirmAction}
        onCancel={() => setConfirmOpen(false)}
      />

      {viewNews && (
        <div
          className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
          onClick={() => setViewNews(null)}
        >
          <div
            className="my-6 bg-white dark:bg-slate-800 w-full max-w-2xl max-h-[calc(100vh-3rem)] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-start gap-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">{viewNews.judul}</h3>
              <button
                onClick={() => setViewNews(null)}
                className="text-slate-400 hover:text-rose-500 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-400 font-medium">Media:</span> <span className="text-slate-800 dark:text-white font-semibold">{viewNews.media || "-"}</span></div>
                <div><span className="text-slate-400 font-medium">Tanggal:</span> <span className="text-slate-800 dark:text-white font-semibold">{formatDate(viewNews.tanggal_raw)}</span></div>
                <div>
                  <span className="text-slate-400 font-medium">Pejabat:</span>{" "}
                  <span className="text-slate-800 dark:text-white font-semibold">
                    {Array.isArray(viewNews.pejabat) ? viewNews.pejabat.join(", ") : viewNews.pejabat || "-"}
                  </span>
                </div>
                <div><span className="text-slate-400 font-medium">Unit:</span> <span className="text-slate-800 dark:text-white font-semibold">{viewNews.unit || "-"}</span></div>
                <div>
                  <span className="text-slate-400 font-medium">Potensi:</span>{" "}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${potensiColor[viewNews.potensi] || potensiColor.Netral}`}>{viewNews.potensi || "Netral"}</span>
                </div>
                <div><span className="text-slate-400 font-medium">Segment:</span> <span className="text-slate-800 dark:text-white font-semibold">{viewNews.segment || "-"}</span></div>

              </div>
              <div>
                <span className="text-slate-400 font-medium text-sm">Isi Berita:</span>
                <p className="mt-2 text-slate-700 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{viewNews.isi || "Tidak ada konten."}</p>
              </div>
            </div>
            <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setViewNews(null)}
                className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-5 space-y-6">
        <div className="flex flex-col gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-xl font-bold flex items-center gap-3 text-slate-800 dark:text-white">
              <Newspaper className="text-indigo-500" size={24} />
              Kelola Berita
            </h3>
            <Link
              href="/admin/berita/cms"
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 transition-all active:scale-95 text-sm w-full sm:w-auto justify-center"
            >
              <Plus size={16} /> Berita Baru
            </Link>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Cari berdasarkan judul, media, tanggal, pejabat, potensi, unit, atau user..."
              className="w-full bg-white dark:bg-slate-900 border-0 rounded-xl pl-11 pr-4 py-3 outline-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all text-sm text-slate-800 dark:text-white"
            />
          </div>
        </div>

        <div className="hidden lg:block overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
              <tr className="border-b border-slate-300 dark:border-slate-600 divide-x divide-slate-300 dark:divide-slate-600">
                <th className="px-4 py-3 text-xs font-bold uppercase w-12 text-center">No</th>
                <th className="px-4 py-3 text-xs font-bold uppercase w-28 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort("tanggal_raw")}>
                  Tanggal {sortField === "tanggal_raw" && <span>{sortOrder === "asc" ? "↑" : "↓"}</span>}
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort("judul")}>
                  Judul {sortField === "judul" && <span>{sortOrder === "asc" ? "↑" : "↓"}</span>}
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase w-28 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort("media")}>
                  Media {sortField === "media" && <span>{sortOrder === "asc" ? "↑" : "↓"}</span>}
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase">Pejabat</th>
                <th className="px-4 py-3 text-xs font-bold uppercase">Unit</th>
                <th className="px-4 py-3 text-xs font-bold uppercase">Segment</th>
                <th className="px-4 py-3 text-xs font-bold uppercase cursor-pointer hover:text-blue-600 transition-colors" onClick={() => handleSort("potensi")}>
                  Potensi {sortField === "potensi" && <span>{sortOrder === "asc" ? "↑" : "↓"}</span>}
                </th>
                <th className="px-4 py-3 text-xs font-bold uppercase">User</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-slate-400">Memuat data...</td></tr>
              ) : response.items.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-slate-400">Tidak ada berita ditemukan.</td></tr>
              ) : (
                response.items.map((news, index) => {
                  const pejabat = Array.isArray(news.pejabat) ? news.pejabat.join(", ") : news.pejabat || "-";
                  const colorClass = potensiColor[news.potensi] || potensiColor.Netral;
                  const displayUser = news.userEmail ? news.userEmail.replace("@gmail.com", "") : "-";
                  return (
                    <tr
                      key={news.key}
                      className="hover:bg-blue-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer group divide-x divide-slate-100 dark:divide-slate-700"
                      onClick={() => setViewNews(news)}
                    >
                      <td className="px-4 py-4 text-center text-slate-500 text-xs font-bold">
                        {(response.page - 1) * response.pageSize + index + 1}
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500 leading-tight max-w-[100px] break-words">
                        {formatDate(news.tanggal_raw)}
                      </td>
                      <td className="px-4 py-4 min-w-[220px]">
                        <div className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors leading-snug">{news.judul || "-"}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300 leading-tight max-w-[120px] break-words">
                        {news.media || "-"}
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-600 dark:text-slate-300 max-w-[180px]">{pejabat}</td>
                      <td className="px-4 py-4 text-xs text-slate-500 max-w-[140px]">{news.unit || "-"}</td>
                      <td className="px-4 py-4 text-xs text-slate-500 max-w-[120px]">{news.segment || "-"}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${colorClass}`}>{news.potensi || "Netral"}</span>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500 max-w-[120px] break-all">{displayUser}</td>
                      <td className="px-4 py-4" onClick={(event) => event.stopPropagation()}>
                        <div className="flex justify-center gap-1.5 flex-wrap">
                          <button onClick={() => setViewNews(news)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 dark:bg-slate-700/50 dark:text-slate-400 transition-all" title="Lihat">
                            <Eye size={13} />
                          </button>
                          <button onClick={() => handlePrint(news)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 transition-all" title="Cetak">
                            <Printer size={13} />
                          </button>
                          <button onClick={() => router.push(`/admin/berita/cms?id=${encodeURIComponent(news.key)}`)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 transition-all" title="Edit">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => handleDelete(news.key, news.judul)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 transition-all" title="Hapus">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="grid gap-4 lg:hidden">
          {loading ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-6 text-center text-slate-400">
              Memuat data...
            </div>
          ) : response.items.length === 0 ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-6 text-center text-slate-400">
              Tidak ada berita ditemukan.
            </div>
          ) : (
            response.items.map((news) => {
              const pejabat = Array.isArray(news.pejabat) ? news.pejabat.join(", ") : news.pejabat || "-";
              const colorClass = potensiColor[news.potensi] || potensiColor.Netral;

              const border = getBorderAccent(news.potensi);
              const cardGradient = getCardGradient(news.potensi);

              return (
                <div
                  key={news.key}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 p-4 space-y-3 relative overflow-hidden group transition-all"
                >
                  {/* Background Gradient */}
                  <div className={`absolute inset-0 ${cardGradient} opacity-60 group-hover:opacity-100 transition-opacity`} />

                  {/* Vertical Accent Bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-[5px] ${border} opacity-80 group-hover:opacity-100 transition-opacity`} />

                  <div className="flex flex-wrap items-center gap-y-2 gap-x-3 relative z-10 pl-3">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${colorClass}`}>{news.potensi || "Netral"}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                        <Calendar size={11} />
                        {formatDate(news.tanggal_raw)}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50 uppercase tracking-wider">
                        {news.media || "Media"}
                      </span>
                    </div>
                  </div>
                  <div className="relative z-10 pl-3">
                    <div className="text-base font-bold text-slate-800 dark:text-white leading-snug group-hover:text-blue-600 transition-colors">{news.judul}</div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <div><strong className="text-slate-700 dark:text-slate-200">Media:</strong> {news.media || "-"}</div>
                    <div><strong className="text-slate-700 dark:text-slate-200">Unit:</strong> {news.unit || "-"}</div>
                    <div className="sm:col-span-2"><strong className="text-slate-700 dark:text-slate-200">Pejabat:</strong> {pejabat}</div>
                    <div className="sm:col-span-2 break-all"><strong className="text-slate-700 dark:text-slate-200">User:</strong> {news.userEmail || "-"}</div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button onClick={() => setViewNews(news)} className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold">
                      <Eye size={14} /> Lihat
                    </button>
                    <button onClick={() => handlePrint(news)} className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm font-semibold">
                      <Printer size={14} /> Cetak
                    </button>
                    <button onClick={() => router.push(`/admin/berita/cms?id=${encodeURIComponent(news.key)}`)} className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-semibold">
                      <Pencil size={14} /> Edit
                    </button>
                    <button onClick={() => handleDelete(news.key, news.judul)} className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 text-sm font-semibold">
                      <Trash2 size={14} /> Hapus
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
          <div className="text-sm text-slate-500">
            {/* Teks informasi pagination telah dihapus */}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Baris:</span>
            <select
              value={perPage}
              onChange={(event) => setPerPage(Number(event.target.value))}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm outline-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white"
            >
              {[10, 20, 50, 100].map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>

          {response.totalPages > 1 && (
            <div className="flex gap-1.5 items-center">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="w-9 h-9 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700 text-slate-500 disabled:opacity-40 hover:bg-slate-50 transition-all">
                <ChevronLeft size={14} />
              </button>
              {pageNumbers.map((value) => (
                <button key={value} onClick={() => setPage(value)} className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${page === value ? "bg-indigo-600 text-white" : "bg-white dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700 text-slate-600 dark:text-slate-400 hover:bg-indigo-50"}`}>
                  {value}
                </button>
              ))}
              <button onClick={() => setPage(Math.min(response.totalPages, page + 1))} disabled={page === response.totalPages} className="w-9 h-9 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700 text-slate-500 disabled:opacity-40 hover:bg-slate-50 transition-all">
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
