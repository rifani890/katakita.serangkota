"use client";

import { useEffect, useState } from "react";
import { Printer, Trash2, X } from "lucide-react";
import Image from "next/image";
import DOMPurify from "isomorphic-dompurify";
import type { NewsItem } from "@/types";
import { formatDate, getSentimenClass } from "@/lib/utils";

interface NewsModalProps {
  newsKey: string | null;
  onClose: () => void;
  onPrint: (key: string) => void;
  canDelete?: boolean;
  onDelete?: (key: string) => void;
}

export default function NewsModal({
  newsKey,
  onClose,
  onPrint,
  canDelete = false,
  onDelete,
}: NewsModalProps) {
  const [visible, setVisible] = useState(false);
  const [news, setNews] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!newsKey) {
      setVisible(false);
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    setVisible(true);
    setLoading(true);

    let isCurrent = true;

    fetch(`/api/berita/${newsKey}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Gagal mengambil berita");
        return (await res.json()) as NewsItem;
      })
      .then((data) => {
        if (isCurrent) setNews(data);
      })
      .catch((err) => {
        if (!isCurrent) return;
        console.error("NewsModal fetch error:", err);
        setNews(null);
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
      document.body.style.overflow = "";
    };
  }, [newsKey]);

  if (!newsKey) return null;

  const pejabatArray = news
    ? Array.isArray(news.pejabat)
      ? news.pejabat
      : news.pejabat
        ? [news.pejabat]
        : []
    : [];

  const tokohArray = news
    ? Array.isArray(news.tokoh)
      ? news.tokoh
      : news.tokoh
        ? [news.tokoh]
        : []
    : [];

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      setNews(null);
      onClose();
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
      <div
        className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
        onClick={handleClose}
      />
      <div
        className={`relative w-full max-w-3xl bg-white dark:bg-dark-card rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 max-h-[92vh] flex flex-col ${visible ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
      >
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 overflow-hidden flex items-center justify-center">
              <Image src="/logo.png" alt="Logo" width={40} height={40} className="object-contain" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-slate-800 dark:text-white">Pratinjau Berita</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-500 hover:text-rose-500 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-5 sm:p-8 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-slate-200 border-l-blue-500 rounded-full animate-spin" />
              <p className="text-slate-500 animate-pulse font-medium">Mengambil isi berita...</p>
            </div>
          ) : !news ? (
            <div className="py-16 text-center text-slate-500">Berita tidak dapat dimuat.</div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm font-semibold text-blue-600 dark:text-blue-400 tracking-widest">
                  <span>{news.media}</span>
                  <span>&bull;</span>
                  <span>{formatDate(news.tanggal_raw)}</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  {news.judul}
                </h2>
              </div>

              <div className="flex flex-wrap gap-2 py-1">
                {pejabatArray.length > 0 &&
                  pejabatArray.map((name, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wider bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                    >
                      <i className="fas fa-user text-[9px] text-blue-500"></i> {name}
                    </span>
                  ))}
                {tokohArray.length > 0 &&
                  tokohArray.map((name, i) => (
                    <span
                      key={`tokoh-${i}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wider bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                    >
                      <i className="fas fa-user text-[9px] text-orange-500"></i> {name}
                    </span>
                  ))}
                {news.unit && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wider bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    {news.unit}
                  </span>
                )}
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wider ${getSentimenClass(news.potensi)}`}
                >
                  {news.potensi}
                </span>
              </div>

              <div
                className="prose prose-slate dark:prose-invert max-w-none 
                prose-p:leading-relaxed prose-p:text-slate-600 dark:prose-p:text-slate-300 
                prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                prose-headings:text-slate-800 dark:prose-headings:text-white prose-headings:font-bold
                prose-img:rounded-xl prose-img:shadow-md mt-6"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(news.isi || "") }}
              />
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-lg font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-all active:scale-95"
            >
              Tutup
            </button>
            {news && (
              <>
                {canDelete && onDelete && (
                  <button
                    onClick={() => onDelete(news.key)}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/30 transition-all active:scale-95"
                  >
                    <Trash2 size={16} /> Hapus Berita
                  </button>
                )}
                <button
                  onClick={() => onPrint(news.key)}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 transition-all active:scale-95"
                >
                  <Printer size={16} /> Cetak Berita
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
