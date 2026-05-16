"use client";

import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useState, useEffect, useCallback } from "react";
import { Users, Plus, Pencil, Trash2 } from "lucide-react";
import { LoadingOverlay, ConfirmDialog, Modal } from "./UI";

interface Tokoh {
  key?: string;
  id?: number;
  nama: string;
  jabatan?: string;
  jenis_kelamin?: string;
}

export default function TokohClient() {
  const [data, setData] = useState<Tokoh[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingText, setSavingText] = useState("Memproses...");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [formNama, setFormNama] = useState("");
  const [formJabatan, setFormJabatan] = useState("");
  const [formGender, setFormGender] = useState("");

  // Confirm state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmType, setConfirmType] = useState<"delete" | "info" | "confirm">("info");
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMsg, setConfirmMsg] = useState("");
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/tokoh");
      if (res.ok) {
        const arr: Tokoh[] = await res.json();
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

  const openModal = (id: number | null = null) => {
    setActiveId(id);
    if (id) {
      const found = data.find((d) => d.id === id);
      setFormNama(found?.nama || "");
      setFormJabatan(found?.jabatan || "");
      setFormGender(found?.jenis_kelamin || "Laki-laki");
    } else {
      setFormNama("");
      setFormJabatan("");
      setFormGender("");
    }
    setModalOpen(true);
  };

  const askConfirm = (
    title: string,
    msg: string,
    type: "delete" | "info" | "confirm",
    action: () => void
  ) => {
    setConfirmTitle(title);
    setConfirmMsg(msg);
    setConfirmType(type);
    setConfirmAction(() => action);
    setConfirmOpen(true);
  };

  const handleSave = () => {
    if (!formNama.trim()) {
      alert("Nama tokoh wajib diisi.");
      return;
    }
    const action = activeId ? "memperbarui" : "menambahkan";
    askConfirm(
      "Konfirmasi Simpan",
      `Apakah Anda yakin ingin ${action} data tokoh ini?`,
      "confirm",
      async () => {
        setConfirmOpen(false);
        setSavingText("Menyimpan...");
        setSaving(true);
        try {
          const payload = {
            nama: formNama.trim(),
            jabatan: formJabatan.trim(),
            jenis_kelamin: formGender || null,
          };
          if (activeId) {
            await fetchWithAuth("/api/tokoh", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: activeId, ...payload }),
            });
          } else {
            await fetchWithAuth("/api/tokoh", {
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
      }
    );
  };

  const handleDelete = (id: number, nama: string) => {
    askConfirm("Hapus Tokoh", `Hapus data tokoh "${nama}"?`, "delete", async () => {
      setConfirmOpen(false);
      setSavingText("Menghapus...");
      setSaving(true);
      try {
        await fetchWithAuth(`/api/tokoh?id=${id}`, { method: "DELETE" });
        await loadData();
        setSaving(false);
        askConfirm("Berhasil Dihapus", `Tokoh "${nama}" telah berhasil dihapus.`, "info", () =>
          setConfirmOpen(false)
        );
      } catch (err: unknown) {
        setSaving(false);
        askConfirm("Gagal Menghapus", (err as Error).message, "info", () => setConfirmOpen(false));
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
        title={activeId ? "Edit Tokoh" : "Tambah Tokoh"}
        titleIcon={<Users size={20} className="text-orange-500" />}
        maxWidth="max-w-md"
      >
        <div className="p-5 sm:p-8 space-y-5">
          <div>
            <label className="block text-xs font-black text-slate-400 tracking-widest mb-2">
              Nama Tokoh <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formNama}
              onChange={(e) => setFormNama(e.target.value)}
              placeholder="Masukkan nama tokoh..."
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-blue-500/50 transition-all text-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 tracking-widest mb-2">
              Jabatan / Keterangan
            </label>
            <input
              type="text"
              value={formJabatan}
              onChange={(e) => setFormJabatan(e.target.value)}
              placeholder="Masukkan jabatan atau keterangan..."
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-blue-500/50 transition-all text-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 tracking-widest mb-2">
              Jenis Kelamin
            </label>
            <select
              value={formGender}
              onChange={(e) => setFormGender(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-blue-500/50 transition-all text-slate-800 dark:text-white"
            >
              <option value="">- Kosong -</option>
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
              className="flex-1 px-4 py-3 rounded-xl font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/30 transition-all"
            >
              Simpan
            </button>
          </div>
        </div>
      </Modal>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <h3 className="text-xl font-bold flex items-center gap-3 text-slate-800 dark:text-white">
            <Users className="text-orange-500" size={24} />
            Master Data Tokoh
          </h3>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/30 transition-all active:scale-95 text-sm w-full sm:w-auto justify-center"
          >
            <Plus size={16} /> Tambah Tokoh
          </button>
        </div>

        <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold tracking-wider border-b border-slate-300 dark:border-slate-600 divide-x divide-slate-300 dark:divide-slate-600">
                <th className="px-6 py-4 w-16 text-center">No</th>
                <th className="px-6 py-4">Nama Tokoh</th>
                <th className="px-6 py-4">Jabatan/Keterangan</th>
                <th className="px-6 py-4">Jenis Kelamin</th>
                <th className="px-6 py-4 text-center w-32">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    Memuat data...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    Belum ada data tokoh.
                  </td>
                </tr>
              ) : (
                data.map((p, i) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-center text-slate-500 text-sm">{i + 1}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-white">
                      {p.nama}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-sm">
                      {p.jabatan || "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-sm">
                      {p.jenis_kelamin || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openModal(p.id!)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 transition-all"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id!, p.nama)}
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
              Belum ada data tokoh.
            </div>
          ) : (
            data.map((item, index) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold tracking-wider text-slate-500">
                      Tokoh #{index + 1}
                    </div>
                    <div className="mt-1 text-base font-bold text-slate-800 dark:text-white">
                      {item.nama}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal(item.id!)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 transition-all"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id!, item.nama)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="grid gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <div>
                    <strong className="text-slate-800 dark:text-white">Jabatan:</strong>{" "}
                    {item.jabatan || "-"}
                  </div>
                  <div>
                    <strong className="text-slate-800 dark:text-white">Jenis Kelamin:</strong>{" "}
                    {item.jenis_kelamin || "-"}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
