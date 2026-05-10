"use client";

import { useState, useEffect, useCallback } from "react";
import { User, Plus, Pencil, Trash2 } from "lucide-react";
import { LoadingOverlay, ConfirmDialog, Modal } from "./AdminUI";

interface Pejabat {
  key: string;
  id?: number;
  nama: string;
  jabatan?: string;
  jenis_kelamin?: string;
}

export default function AdminPejabatClient() {
  const [data, setData] = useState<Pejabat[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingText, setSavingText] = useState("Memproses...");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [formNama, setFormNama] = useState("");
  const [formJabatan, setFormJabatan] = useState("");
  const [formGender, setFormGender] = useState("Laki-laki");

  // Confirm state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmType, setConfirmType] = useState<"delete" | "info">("info");
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMsg, setConfirmMsg] = useState("");
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pejabat");
      if (res.ok) {
        const arr: Pejabat[] = await res.json();
        setData(arr);
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
      setFormNama(found?.nama || "");
      setFormJabatan(found?.jabatan || "");
      setFormGender(found?.jenis_kelamin || "Laki-laki");
    } else {
      setFormNama("");
      setFormJabatan("");
      setFormGender("Laki-laki");
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
    if (!formNama.trim()) { alert("Nama pejabat wajib diisi."); return; }
    const action = activeKey ? "memperbarui" : "menambahkan";
    askConfirm("Konfirmasi Simpan", `Apakah Anda yakin ingin ${action} data pejabat ini?`, "info", async () => {
      setConfirmOpen(false);
      setSavingText("Menyimpan...");
      setSaving(true);
      try {
        const payload = {
          nama: formNama.trim(),
          jabatan: formJabatan.trim(),
          color: null
        };
        if (activeKey) {
          await fetch("/api/pejabat", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: activeKey, ...payload }),
          });
        } else {
          await fetch("/api/pejabat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        }
        setModalOpen(false);
        await loadData();
      } catch (err: unknown) {
        alert((err as Error).message);
      } finally {
        setSaving(false);
      }
    });
  };

  const handleDelete = (key: string, nama: string) => {
    askConfirm("Hapus Pejabat", `Hapus data pejabat "${nama}"?`, "delete", async () => {
      setConfirmOpen(false);
      setSavingText("Menghapus...");
      setSaving(true);
      try {
        await fetch(`/api/pejabat?id=${key}`, { method: "DELETE" });
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
        title={activeKey ? "Edit Pejabat" : "Tambah Pejabat"}
        titleIcon={<User size={20} className="text-amber-500" />}
        maxWidth="max-w-md"
      >
        <div className="p-5 sm:p-8 space-y-5">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              Nama Pejabat <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formNama}
              onChange={(e) => setFormNama(e.target.value)}
              placeholder="Masukkan nama pejabat..."
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-blue-500/50 transition-all text-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Jabatan</label>
            <input
              type="text"
              value={formJabatan}
              onChange={(e) => setFormJabatan(e.target.value)}
              placeholder="Masukkan jabatan..."
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-blue-500/50 transition-all text-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Jenis Kelamin</label>
            <select
              value={formGender}
              onChange={(e) => setFormGender(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-blue-500/50 transition-all text-slate-800 dark:text-white"
            >
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
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
              className="flex-1 px-4 py-3 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30 transition-all"
            >
              Simpan
            </button>
          </div>
        </div>
      </Modal>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <h3 className="text-xl font-bold flex items-center gap-3 text-slate-800 dark:text-white">
            <User className="text-amber-500" size={24} />
            Master Data Pejabat
          </h3>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30 transition-all active:scale-95 text-sm w-full sm:w-auto justify-center"
          >
            <Plus size={16} /> Tambah Pejabat
          </button>
        </div>

        <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold uppercase tracking-wider border-b border-slate-300 dark:border-slate-600 divide-x divide-slate-300 dark:divide-slate-600">
                <th className="px-6 py-4 w-16 text-center">No</th>
                <th className="px-6 py-4">Nama Pejabat</th>
                <th className="px-6 py-4">Jabatan</th>
                <th className="px-6 py-4">Jenis Kelamin</th>
                <th className="px-6 py-4 text-center w-32">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">Memuat data...</td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">Belum ada data pejabat.</td>
                </tr>
              ) : (
                data.map((p, i) => (
                  <tr key={p.key} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 text-center text-slate-500 text-sm">{i + 1}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-white">{p.nama}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-sm">{p.jabatan || "-"}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-sm">{p.jenis_kelamin || "-"}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openModal(p.key)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 transition-all"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.key, p.nama)}
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
              Belum ada data pejabat.
            </div>
          ) : (
            data.map((item, index) => (
              <div key={item.key} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Pejabat #{index + 1}</div>
                    <div className="mt-1 text-base font-bold text-slate-800 dark:text-white">{item.nama}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal(item.key)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 transition-all"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.key, item.nama)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="grid gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <div><strong className="text-slate-800 dark:text-white">Jabatan:</strong> {item.jabatan || "-"}</div>
                  <div><strong className="text-slate-800 dark:text-white">Jenis Kelamin:</strong> {item.jenis_kelamin || "-"}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
