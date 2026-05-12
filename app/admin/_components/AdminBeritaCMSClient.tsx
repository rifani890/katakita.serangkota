"use client";

import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Bold,
  CalendarDays,
  Check,
  ChevronDown,
  ImageIcon,
  Italic,
  Link2,
  List,
  Newspaper,
  Plus,
  Save,
  Settings2,
  Underline,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { LoadingOverlay, ConfirmDialog } from "./AdminUI";
import type { MediaItem, NewsItem, OfficialItem, UnitItem } from "@/types";

interface AdminBeritaCMSClientProps {
  beritaId?: string;
}

function normalizePejabat(value: NewsItem["pejabat"] | null | undefined): string[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [String(value)];
  } catch {
    return [String(value)];
  }
}

function toInputDate(value: Date): string {
  return value.toISOString().split("T")[0];
}

export default function AdminBeritaCMSClient({ beritaId }: AdminBeritaCMSClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const isEdit = Boolean(beritaId);

  const [allUnits, setAllUnits] = useState<UnitItem[]>([]);
  const [allOfficials, setAllOfficials] = useState<OfficialItem[]>([]);
  const [allMedia, setAllMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingText, setSavingText] = useState("Memproses...");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMsg, setConfirmMsg] = useState("");
  const [confirmType, setConfirmType] = useState<"info" | "delete">("info");
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});

  const askConfirm = (title: string, message: string, type: "info" | "delete", action: () => void) => {
    setConfirmTitle(title);
    setConfirmMsg(message);
    setConfirmType(type);
    setConfirmAction(() => action);
    setConfirmOpen(true);
  };

  const [formJudul, setFormJudul] = useState("");
  const [formMedia, setFormMedia] = useState("");
  const [formTanggal, setFormTanggal] = useState("");
  const [formPejabat, setFormPejabat] = useState<string[]>([]);
  const [formUnit, setFormUnit] = useState("");
  const [formPotensi, setFormPotensi] = useState("");
  const [formIsi, setFormIsi] = useState("");

  const [showPejabatDrop, setShowPejabatDrop] = useState(false);
  const [showUnitDrop, setShowUnitDrop] = useState(false);
  const [pejabatSearch, setPejabatSearch] = useState("");
  const [unitSearch, setUnitSearch] = useState("");
  const [newMediaName, setNewMediaName] = useState("");
  const [showQuickMedia, setShowQuickMedia] = useState(false);

  const pejabatDropRef = useRef<HTMLDivElement>(null);
  const unitDropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pejabatDropRef.current && !pejabatDropRef.current.contains(e.target as Node)) {
        setShowPejabatDrop(false);
      }
      if (unitDropRef.current && !unitDropRef.current.contains(e.target as Node)) {
        setShowUnitDrop(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fillForm = useCallback((news: NewsItem) => {
    setFormJudul(news.judul || "");
    setFormMedia(news.media || "");
    setFormPotensi(news.potensi || "Netral");
    setFormUnit(news.unit || news.unitkerja || "");
    setFormIsi(news.isi || "");
    const d = news.tanggal_raw ? new Date(Number(news.tanggal_raw)) : null;
    setFormTanggal(d && !isNaN(d.getTime()) ? d.toISOString().split("T")[0] : "");
    setFormPejabat(normalizePejabat(news.pejabat));
  }, []);

  const refreshUnits = useCallback(async () => {
    const res = await fetchWithAuth("/api/unit", { cache: "no-store" });
    if (res.ok) {
      const units: UnitItem[] = await res.json();
      setAllUnits(units);
    }
  }, []);

  const refreshOfficials = useCallback(async () => {
    const res = await fetchWithAuth("/api/pejabat", { cache: "no-store" });
    if (res.ok) {
      const officials: OfficialItem[] = await res.json();
      setAllOfficials(officials);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [unitsRes, officialsRes, mediaRes, newsRes] = await Promise.all([
        fetch("/api/unit", { cache: "no-store" }),
        fetch("/api/pejabat", { cache: "no-store" }),
        fetch("/api/media", { cache: "no-store" }),
        beritaId ? fetch(`/api/berita/${beritaId}`, { cache: "no-store" }) : Promise.resolve(null),
      ]);

      const units: UnitItem[] = unitsRes.ok ? await unitsRes.json() : [];
      const officials: OfficialItem[] = officialsRes.ok ? await officialsRes.json() : [];
      const media: MediaItem[] = mediaRes.ok ? await mediaRes.json() : [];

      setAllUnits(units);
      setAllOfficials(officials);
      setAllMedia(media);

      if (beritaId && newsRes) {
        if (newsRes.ok) {
          const news = (await newsRes.json()) as NewsItem;
          fillForm(news);
        } else {
          alert("Berita tidak ditemukan.");
          router.replace("/admin/berita");
        }
      } else {
        setFormTanggal((current) => current || "");
        setFormMedia((current) => current || "");
        setFormPejabat((current) => current.length > 0 ? current : []);
        setFormUnit((current) => current || "");
      }
    } finally {
      setLoading(false);
    }
  }, [beritaId, fillForm, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const allMediaNames = Array.from(
    new Set([
      formMedia,
      ...allMedia.map((m) => m.nama || m.name || "").filter(Boolean),
    ])
  ).filter(Boolean).sort((a, b) => a.localeCompare(b));

  const filteredOfficials = allOfficials.filter((o) => {
    const name = o.nama || o.name || o.nama_pejabat || "";
    return name.toLowerCase().includes(pejabatSearch.toLowerCase());
  });

  const filteredUnits = allUnits.filter((u) => {
    const name = u.unit || u.nama || "";
    return name.toLowerCase().includes(unitSearch.toLowerCase());
  });

  const togglePejabat = (nama: string) => {
    setFormPejabat((prev) =>
      prev.includes(nama) ? prev.filter((p) => p !== nama) : [...prev, nama]
    );
  };

  const handleQuickAddMedia = () => {
    const name = newMediaName.trim();
    if (!name) return;
    askConfirm("Tambah Media", `Yakin ingin menambahkan media "${name}"?`, "info", async () => {
      setConfirmOpen(false);
      setSavingText("Menambahkan Media...");
      setSaving(true);
      try {
        const res = await fetchWithAuth("/api/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nama: name }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Gagal menambahkan media");
        }
        setFormMedia(name);
        setNewMediaName("");
        setShowQuickMedia(false);
        await loadData();
      } catch (err) {
        alert((err as Error).message);
      } finally {
        setSaving(false);
      }
    });
  };

  const handleSave = () => {
    if (!formJudul.trim()) { alert("Judul berita wajib diisi."); return; }
    if (!formMedia) { alert("Media wajib dipilih."); return; }
    if (!formTanggal) { alert("Tanggal wajib diisi."); return; }
    if (formPejabat.length === 0) { alert("Harap pilih setidaknya satu pejabat."); return; }
    
    askConfirm("Konfirmasi Simpan", "Apakah Anda yakin ingin menyimpan berita ini?", "info", async () => {
      setConfirmOpen(false);
      setSavingText("Menyimpan Berita...");
      setSaving(true);
      try {
        const dateObj = new Date(formTanggal);
        const payload = {
          judul: formJudul.trim(),
          isi: formIsi.trim(),
          media: formMedia,
          pejabat: formPejabat,
          unit: formUnit,
          potensi: formPotensi,
          tanggal_raw: dateObj.getTime(),
          userEmail: user?.email || "",
        };

        const res = await fetchWithAuth("/api/berita", {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(isEdit ? { id: beritaId, ...payload } : payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Gagal menyimpan berita");
        }
        router.push("/admin/berita");
        router.refresh();
      } catch (err) {
        alert((err as Error).message);
      } finally {
        setSaving(false);
      }
    });
  };

  const handleFormat = (tag: string) => {
    const textarea = document.getElementById("editor-textarea") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formIsi;
    const selectedText = text.substring(start, end);
    let newText = text;

    if (tag === "link") {
      const url = prompt("Masukkan URL:");
      if (url) newText = text.substring(0, start) + `<a href="${url}">${selectedText || url}</a>` + text.substring(end);
    } else if (tag === "img") {
      const url = prompt("Masukkan URL Gambar:");
      if (url) newText = text.substring(0, start) + `<img src="${url}" alt="image" />` + text.substring(end);
    } else if (tag === "ul") {
      newText = text.substring(0, start) + `<ul>\n<li>${selectedText || "List item"}</li>\n</ul>` + text.substring(end);
    } else {
      newText = text.substring(0, start) + `<${tag}>${selectedText}</${tag}>` + text.substring(end);
    }

    setFormIsi(newText);
    setTimeout(() => {
      textarea.focus();
    }, 0);
  };

  const toolbarActions = [
    { Icon: Bold, action: () => handleFormat("b") },
    { Icon: Italic, action: () => handleFormat("i") },
    { Icon: Underline, action: () => handleFormat("u") },
    { Icon: Link2, action: () => handleFormat("link") },
    { Icon: List, action: () => handleFormat("ul") },
    { Icon: ImageIcon, action: () => handleFormat("img") },
  ];

  return (
    <div className="min-h-full bg-slate-100 dark:bg-slate-900">
      <LoadingOverlay show={saving || loading} text={loading ? "Memuat CMS..." : savingText} />
      <ConfirmDialog
        show={confirmOpen}
        title={confirmTitle}
        message={confirmMsg}
        type={confirmType}
        onConfirm={confirmAction}
        onCancel={() => setConfirmOpen(false)}
      />

      <div className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/95 text-white backdrop-blur-md">
        <div className="px-4 sm:px-5 py-2.5 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
          <button
            onClick={() => router.push("/admin/berita")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white font-bold hover:bg-white/20 transition-all text-sm shadow-sm"
          >
            <ArrowLeft size={16} /> Kembali
          </button>

          <div className="min-w-0 text-center">
            <span className="block truncate text-sm sm:text-xl font-black">{isEdit ? "Edit Artikel Berita" : "News Article Editor"}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/admin/berita")}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-white/15 hover:bg-white/20 text-white font-medium transition-all text-sm"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-900/30 transition-all text-sm"
            >
              <Check size={16} />
              <span className="hidden sm:inline">Publikasikan</span>
              <span className="sm:hidden">Simpan</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-8">
        <div className="mx-auto max-w-7xl grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_456px] gap-6 items-start">
          <main className="order-3 xl:order-1 space-y-5">
            <section className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-5">
              <label className="block text-base font-black text-slate-900 dark:text-white mb-2">
                Judul Artikel <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formJudul}
                onChange={(e) => setFormJudul(e.target.value)}
                placeholder="Masukkan judul berita..."
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2.5 text-xl sm:text-2xl font-black leading-tight text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </section>

            <section className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
              <div className="p-5 pb-3">
                <label className="block text-base font-black text-slate-900 dark:text-white mb-2">
                  Konten Artikel <span className="text-rose-500">*</span>
                </label>
                <div className="rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden bg-white dark:bg-slate-900">
                  <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                    {toolbarActions.map(({ Icon, action }, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={action}
                        className="w-8 h-8 inline-flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        aria-label="Toolbar"
                      >
                        <Icon size={17} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    id="editor-textarea"
                    value={formIsi}
                    onChange={(e) => setFormIsi(e.target.value)}
                    rows={18}
                    placeholder="Mulai tulis isi berita di sini..."
                    className="w-full min-h-[400px] bg-transparent px-4 py-4 outline-none text-slate-900 dark:text-white leading-relaxed resize-y"
                  />
                </div>
              </div>
            </section>
          </main>

          <aside className="order-1 xl:order-2 xl:sticky xl:top-24 flex flex-col gap-5">
            <section className="order-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-visible">
              <div className="px-5 pt-5 flex items-center gap-2">
                <Settings2 className="text-slate-700 dark:text-slate-200" size={18} />
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Pengaturan Publikasi</h3>
              </div>
              <div className="p-5 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="flex items-center gap-2 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                      <CalendarDays size={14} /> Tanggal <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formTanggal}
                      onChange={(e) => setFormTanggal(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 outline-none focus:ring-2 ring-indigo-500 transition-all text-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                      Potensi <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formPotensi}
                      onChange={(e) => setFormPotensi(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 outline-none focus:ring-2 ring-indigo-500 transition-all text-slate-800 dark:text-white"
                    >
                      <option value="" disabled>Pilih Potensi</option>
                      <option value="Positif">Positif</option>
                      <option value="Netral">Netral</option>
                      <option value="Negatif">Negatif</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => router.push("/admin/berita")}
                    className="px-4 py-3 rounded-lg font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-3 rounded-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    <Save size={16} /> Simpan
                  </button>
                </div>
              </div>
            </section>

            <section className="order-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-visible">
              <div className="px-5 pt-5 flex items-center gap-2">
                <Newspaper className="text-slate-700 dark:text-slate-200" size={18} />
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Pengaturan Sumber Berita</h3>
              </div>
              <div className="p-5 space-y-5">
                <div>
                  <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                    Nama Media <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={formMedia}
                      onChange={(e) => setFormMedia(e.target.value)}
                      className="flex-1 min-w-0 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 outline-none focus:ring-2 ring-indigo-500 transition-all text-slate-800 dark:text-white"
                    >
                      <option value="">Pilih Media</option>
                      {allMediaNames.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowQuickMedia(!showQuickMedia)}
                      className="px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all"
                      title="Tambah media"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  {showQuickMedia && (
                    <div className="mt-2 p-3 bg-white dark:bg-slate-900 rounded-lg border border-indigo-200 dark:border-indigo-800 space-y-2">
                      <input
                        type="text"
                        value={newMediaName}
                        onChange={(e) => setNewMediaName(e.target.value)}
                        placeholder="Nama media baru..."
                        className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-800 dark:text-white"
                      />
                      <button onClick={handleQuickAddMedia} className="w-full py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all">
                        Tambah & Pilih
                      </button>
                    </div>
                  )}
                </div>

                <div ref={pejabatDropRef}>
                  <label className="flex items-center gap-2 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                    <Users size={14} /> Nama Pejabat <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        if (!showPejabatDrop) void refreshOfficials();
                        setShowPejabatDrop(!showPejabatDrop);
                        setShowUnitDrop(false);
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 outline-none focus:ring-2 ring-indigo-500 transition-all text-left flex items-center justify-between"
                    >
                      <span className={formPejabat.length === 0 ? "text-slate-400 text-sm" : "text-slate-800 dark:text-white text-sm font-medium"}>
                        {formPejabat.length === 0 ? "Pilih Pejabat" : formPejabat.length === 1 ? formPejabat[0] : `${formPejabat.length} Pejabat Terpilih`}
                      </span>
                      <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />
                    </button>
                    {showPejabatDrop && (
                      <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                          <input
                            type="text"
                            value={pejabatSearch}
                            onChange={(e) => setPejabatSearch(e.target.value)}
                            placeholder="Cari pejabat..."
                            className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-800 dark:text-white"
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                          {filteredOfficials.map((o) => {
                            const name = o.nama || o.name || o.nama_pejabat || "";
                            if (!name) return null;
                            const checked = formPejabat.includes(name);
                            return (
                              <label key={o.key} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                                <input type="checkbox" checked={checked} onChange={() => togglePejabat(name)} className="w-4 h-4 rounded border-slate-300 text-indigo-600" />
                                <div>
                                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{name}</div>
                                  {o.jabatan && <div className="text-xs text-slate-400">{o.jabatan}</div>}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div ref={unitDropRef}>
                  <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Unit Kerja</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        if (!showUnitDrop) void refreshUnits();
                        setShowUnitDrop(!showUnitDrop);
                        setShowPejabatDrop(false);
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 outline-none focus:ring-2 ring-indigo-500 transition-all text-left flex items-center justify-between"
                    >
                      <span className={!formUnit ? "text-slate-400 text-sm" : "text-slate-800 dark:text-white text-sm font-medium"}>{formUnit || "Pilih Unit Kerja"}</span>
                      <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />
                    </button>
                    {showUnitDrop && (
                      <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                          <input
                            type="text"
                            value={unitSearch}
                            onChange={(e) => setUnitSearch(e.target.value)}
                            placeholder="Cari unit kerja..."
                            className="w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-slate-800 dark:text-white"
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                          <button type="button" onClick={() => { setFormUnit(""); setShowUnitDrop(false); }} className="w-full text-left px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg">
                            -- Kosongkan Pilihan --
                          </button>
                          {filteredUnits.map((u) => {
                            const name = u.unit || u.nama || "";
                            if (!name) return null;
                            return (
                              <button
                                key={u.key}
                                type="button"
                                onClick={() => { setFormUnit(name); setShowUnitDrop(false); }}
                                className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors ${formUnit === name ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400" : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                              >
                                {name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
