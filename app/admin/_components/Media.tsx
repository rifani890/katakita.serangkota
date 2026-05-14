"use client";

import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useState, useEffect, useCallback } from "react";
import { Radio, Plus, Pencil, Trash2 } from "lucide-react";
import { LoadingOverlay, ConfirmDialog, Modal } from "./UI";
import { MediaItem } from "@/types";

export default function Media() {
  const [data, setData] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingText, setSavingText] = useState("Memproses...");

  const [modalOpen, setModalOpen] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [formNama, setFormNama] = useState("");
  const [formShorthand, setFormShorthand] = useState("");
  const [formColor, setFormColor] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmType, setConfirmType] = useState<"delete" | "info">("info");
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMsg, setConfirmMsg] = useState("");
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/media");
      if (res.ok) {
        const arr: MediaItem[] = await res.json();
        setData(arr.sort((a, b) => (a.nama || a.name || "").localeCompare(b.nama || b.name || "")));
      } else {
        setData([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openModal = (key: string | null = null) => {
    setActiveKey(key);
    if (key) {
      const found = data.find((d) => d.key === key);
      setFormNama(found?.nama || found?.name || "");
      setFormShorthand(found?.shorthand || "");
      setFormColor(found?.color || "");
    } else {
      setFormNama("");
      setFormShorthand("");
      setFormColor("");
    }
    setModalOpen(true);
  };

  const askConfirm = (title: string, msg: string, type: "delete" | "info", action: () => void) => {
    setConfirmTitle(title);
    setConfirmMsg(msg);
    setConfirmType(type);
    setConfirmAction(() => action);
    setConfirmOpen(true);
  };

  const handleSave = () => {
    if (!formNama.trim()) {
      alert("Nama media wajib diisi.");
      return;
    }
    const action = activeKey ? "memperbarui" : "menambahkan";

    askConfirm("Konfirmasi", `Apakah Anda yakin ingin ${action} media ini?`, "info", async () => {
      setConfirmOpen(false);
      setSavingText("Menyimpan...");
      setSaving(true);
      try {
        const payload = {
          nama: formNama.trim(),
          shorthand: formShorthand.trim(),
          color: formColor.trim(),
        };
        const res = await fetchWithAuth("/api/media", {
          method: activeKey ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(activeKey ? { id: activeKey, ...payload } : payload),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Gagal menyimpan media.");
        }

        setModalOpen(false);
        await loadData();
        askConfirm("Data Tersimpan", "Media berhasil disimpan.", "info", () => {
          setConfirmOpen(false);
        });
      } catch (err: unknown) {
        alert((err as Error).message);
      } finally {
        setSaving(false);
      }
    });
  };

  const handleDelete = (key: string, nama: string) => {
    askConfirm("Hapus Media", `Hapus media "${nama}"?`, "delete", async () => {
      setConfirmOpen(false);
      setSavingText("Menghapus...");
      setSaving(true);
      try {
        await fetchWithAuth(`/api/media?id=${key}`, { method: "DELETE" });
        await loadData();
      } catch (err: unknown) {
        alert((err as Error).message);
      } finally {
        setSaving(false);
      }
    });
  };

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

      <Modal
        show={modalOpen}
        onClose={() => setModalOpen(false)}
        title={activeKey ? "Edit Media" : "Tambah Media"}
        titleIcon={<Radio size={20} className="text-blue-500" />}
        maxWidth="max-w-md"
      >
        <div className="p-5 sm:p-8 space-y-5">
          <div>
            <label className="block text-xs font-black text-slate-400 tracking-widest mb-2">
              Nama Media <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formNama}
              onChange={(e) => setFormNama(e.target.value)}
              placeholder="Masukkan nama media..."
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-blue-500/50 transition-all text-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 tracking-widest mb-2">
              Shorthand / Singkatan
            </label>
            <input
              type="text"
              value={formShorthand}
              onChange={(e) => setFormShorthand(e.target.value)}
              placeholder="Misal: KB, RN..."
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-blue-500/50 transition-all text-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 tracking-widest mb-2">
              Warna Kustom
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formColor || "#3b82f6"}
                onChange={(e) => setFormColor(e.target.value)}
                className="w-14 h-12 rounded-xl cursor-pointer border-0 bg-transparent p-0"
                title="Pilih Warna"
              />
              <input
                type="text"
                value={formColor}
                onChange={(e) => setFormColor(e.target.value)}
                placeholder="#3b82f6"
                className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-blue-500/50 transition-all text-slate-800 dark:text-white uppercase"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => setModalOpen(false)}
              className="flex-1 px-4 py-3 rounded-xl font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 transition-all"
            >
              Simpan
            </button>
          </div>
        </div>
      </Modal>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <h3 className="text-xl font-bold flex items-center gap-3 text-slate-800 dark:text-white">
            <Radio className="text-blue-500" size={24} />
            Kelola Media
          </h3>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 transition-all active:scale-95 text-sm w-full sm:w-auto justify-center"
          >
            <Plus size={16} /> Tambah Media
          </button>
        </div>

        <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold tracking-wider border-b border-slate-300 dark:border-slate-600 divide-x divide-slate-300 dark:divide-slate-600">
                <th className="px-6 py-4 w-16 text-center">No</th>
                <th className="px-6 py-4">Nama Media</th>
                <th className="px-6 py-4">Singkatan</th>
                <th className="px-6 py-4 text-center w-32">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                    Memuat data...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                    Belum ada data media.
                  </td>
                </tr>
              ) : (
                data.map((m, i) => {
                  const nama = m.nama || m.name || "";
                  return (
                    <tr
                      key={m.key}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-center text-slate-500 text-sm">{i + 1}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800 dark:text-white">
                        <div className="flex items-center gap-2">
                          {m.color && (
                            <div
                              className="w-3 h-3 rounded-full shadow-sm"
                              style={{ backgroundColor: m.color }}
                            />
                          )}
                          {nama}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-sm">
                        {m.shorthand || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openModal(m.key)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 transition-all"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(m.key, nama)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 transition-all"
                            title="Hapus"
                          >
                            <Trash2 size={14} />
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

        <div className="grid gap-4 md:hidden">
          {loading ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-6 text-center text-slate-400">
              Memuat data...
            </div>
          ) : data.length === 0 ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-6 text-center text-slate-400">
              Belum ada data media.
            </div>
          ) : (
            data.map((m, i) => {
              const nama = m.nama || m.name || "";
              return (
                <div
                  key={m.key}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-3"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="text-xs font-bold text-slate-400 mb-1 block">#{i + 1}</span>
                      <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        {m.color && (
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: m.color }}
                          />
                        )}
                        {nama}
                      </h4>
                      {m.shorthand && <p className="text-sm text-slate-500 mt-1">{m.shorthand}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openModal(m.key)}
                        className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(m.key, nama)}
                        className="p-2 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
