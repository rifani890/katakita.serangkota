"use client";

import { useEffect, useRef } from "react";
import { Trash2, CheckCircle, X } from "lucide-react";

// ---- Loading Overlay ----
interface LoadingOverlayProps {
  show: boolean;
  text?: string;
}

export function LoadingOverlay({ show, text = "Sedang Memproses..." }: LoadingOverlayProps) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[9999] flex flex-col items-center justify-center px-4">
      <div className="bg-white/90 dark:bg-slate-800/90 p-10 rounded-3xl shadow-2xl flex flex-col items-center gap-6 border border-slate-200 dark:border-slate-700 max-w-xs w-full">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/20" />
          <div className="relative flex items-center justify-center w-full h-full">
            <div className="animate-spin rounded-full h-16 w-16 border-[5px] border-slate-200 dark:border-slate-700 border-t-blue-600" />
          </div>
        </div>
        <p className="text-slate-700 dark:text-slate-300 font-bold text-xl text-center">{text}</p>
      </div>
    </div>
  );
}

// ---- Confirm Dialog ----
export type ConfirmType = "delete" | "info" | "warn";

interface ConfirmDialogProps {
  show: boolean;
  title: string;
  message: string;
  type?: ConfirmType;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  show,
  title,
  message,
  type = "delete",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (show && contentRef.current) {
      setTimeout(() => {
        contentRef.current?.classList.remove("translate-y-4", "opacity-0");
      }, 10);
    }
  }, [show]);

  if (!show) return null;

  const isDelete = type === "delete";

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9990] flex flex-col items-center justify-center px-4">
      <div
        ref={contentRef}
        className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl w-full max-w-sm flex flex-col gap-8 border border-slate-200 dark:border-slate-800 translate-y-4 opacity-0 transition-all duration-300"
      >
        <div className="flex flex-col items-center text-center gap-4">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl mb-2 ${
              isDelete
                ? "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"
                : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
            }`}
          >
            {isDelete ? <Trash2 size={32} className="animate-bounce" /> : <CheckCircle size={32} className="animate-bounce" />}
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white">{title}</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-4 rounded-xl font-bold text-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-300 transition-all"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-4 rounded-xl font-bold text-lg text-white transition-all shadow-lg ${
              isDelete
                ? "bg-rose-600 hover:bg-rose-700 shadow-rose-500/30"
                : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/30"
            }`}
          >
            {isDelete ? "Ya, Hapus" : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Modal wrapper ----
interface ModalProps {
  show: boolean;
  onClose: () => void;
  title: string;
  titleIcon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({ show, onClose, title, titleIcon, children, maxWidth = "max-w-4xl" }: ModalProps) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto flex items-start justify-center py-10">
      <div className={`bg-white dark:bg-slate-800 w-full ${maxWidth} rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 relative`}>
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 rounded-t-3xl">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            {titleIcon}
            {title}
          </h3>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-500 transition-all"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
