"use client";

import { useState, useEffect, useCallback } from "react";
import { Building2, Plus, Pencil, Trash2 } from "lucide-react";
import { LoadingOverlay, ConfirmDialog, Modal } from "./AdminUI";

interface UnitKerja {
  key: string;
  id?: number;
  unit: string;
  nama?: string;
  pimpinan?: string;
}

export default function AdminUnitClient() {
  const [data, setData] = useState<UnitKerja[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingText, setSavingText] = useState("Memproses...");

  const [modalOpen, setModalOpen] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [formUnit, setFormUnit] = useState("");
  const [formPimpinan, setFormPimpinan] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmType, setConfirmType] = useState<"delete" | "info">("info");
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMsg, setConfirmMsg] = useState("");
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/unit");
      if (res.ok) {
        const arr: UnitKerja[] = await res.json();
        setData(arr.sort((a, b) => (a.unit || a.nama || "").localeCompare(b.unit || b.nama || "")));
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
      setFormUnit(found?.unit || found?.nama || "");
      setFormPimpinan(found?.pimpinan || "");
    } else {
      setFormUnit("");
      setFormPimpinan("");
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

  const handleSave = async () => {
    if (!formUnit.trim()) { alert("Nama unit kerja wajib diisi."); return; }
    const action = activeKey ? "memperbarui" : "menambahkan";
    if (!confirm(`Apakah Anda yakin ingin ${action} unit kerja ini?`)) return;

    setSavingText("Menyimpan...");
    setSaving(true);
    try {
      const payload = { nama: formUnit.trim() };
      const res = await fetch("/api/unit", {
        method: activeKey ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activeKey ? { id: activeKey, ...payload } : payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Gagal menyimpan unit kerja.");
      }

      setModalOpen(false);
      await loadData();
      askConfirm("Data Tersimpan", "Unit kerja berhasil disimpan.", "info", () => {
        setConfirmOpen(false);
      });
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (key: string, unit: string) => {
    askConfirm("Hapus Unit Kerja", `Hapus unit kerja "${unit}"?`, "delete", async () => {
      setConfirmOpen(false);
      setSavingText("Menghapus...");
      setSaving(true);
      try {
        await fetch(`/api/unit?id=${key}`, { method: "DELETE" });
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
        title={activeKey ? "Edit Unit Kerja" : "Tambah Unit Kerja"}
        titleIcon={<Building2 size={20} className="text-emerald-500" />}
        maxWidth="max-w-md"
      >
        <div className="p-5 sm:p-8 space-y-5">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              Nama Unit Kerja <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formUnit}
              onChange={(e) => setFormUnit(e.target.value)}
              placeholder="Masukkan nama unit kerja..."
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-blue-500/50 transition-all text-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Pimpinan / Staff</label>
            <input
              type="text"
              value={formPimpinan}
              onChange={(e) => setFormPimpinan(e.target.value)}
              placeholder="Nama pimpinan unit..."
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-blue-500/50 transition-all text-slate-800 dark:text-white"
            />
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
              className="flex-1 px-4 py-3 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30 transition-all"
            >
              Simpan
            </button>
          </div>
        </div>
      </Modal>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <h3 className="text-xl font-bold flex items-center gap-3 text-slate-800 dark:text-white">
            <Building2 className="text-emerald-500" size={24} />
            Kelola Unit Kerja
          </h3>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30 transition-all active:scale-95 text-sm w-full sm:w-auto justify-center"
          >
            <Plus size={16} /> Tambah Unit Kerja
          </button>
        </div>

        <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold uppercase tracking-wider border-b border-slate-300 dark:border-slate-600 divide-x divide-slate-300 dark:divide-slate-600">
                <th className="px-6 py-4 w-16 text-center">No</th>
                <th className="px-6 py-4">Nama Unit Kerja</th>
                <th className="px-6 py-4">Pimpinan / Staff</th>
                <th className="px-6 py-4 text-center w-32">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">Memuat data...</td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">Belum ada data unit kerja.</td>
                </tr>
              ) : (
                data.map((u, i) => (
                  <tr key={u.key} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 text-center text-slate-500 text-sm">{i + 1}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-white">{u.unit || u.nama}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-sm">{u.pimpinan || "-"}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openModal(u.key)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 transition-all"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(u.key, u.unit)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 transition-all"
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
              Belum ada data unit kerja.
            </div>
          ) : (
            data.map((item, index) => (
              <div key={item.key} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Unit #{index + 1}</div>
                    <div className="mt-1 text-base font-bold text-slate-800 dark:text-white">{item.unit || item.nama}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal(item.key)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 transition-all"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.key, item.unit)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  <strong className="text-slate-800 dark:text-white">Pimpinan / Staff:</strong> {item.pimpinan || "-"}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
