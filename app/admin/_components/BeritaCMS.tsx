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
    Building2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { LoadingOverlay, ConfirmDialog, Modal } from "./UI";
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

export default function BeritaCMS({ beritaId }: AdminBeritaCMSClientProps) {
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
    const [confirmAction, setConfirmAction] = useState<() => void>(() => { });

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
    const [formSegment, setFormSegment] = useState("");

    const [showPejabatDrop, setShowPejabatDrop] = useState(false);
    const [showUnitDrop, setShowUnitDrop] = useState(false);
    const [pejabatSearch, setPejabatSearch] = useState("");
    const [unitSearch, setUnitSearch] = useState("");
    const [newMediaName, setNewMediaName] = useState("");
    const [showPejabatModal, setShowPejabatModal] = useState(false);
    const [newPejabatName, setNewPejabatName] = useState("");
    const [newPejabatJabatan, setNewPejabatJabatan] = useState("");
    const [showJabatanDrop, setShowJabatanDrop] = useState(false);
    const [showUnitModal, setShowUnitModal] = useState(false);
    const [newUnitName, setNewUnitName] = useState("");
    const [newUnitPimpinan, setNewUnitPimpinan] = useState("");
    const [showMediaModal, setShowMediaModal] = useState(false);

    const pejabatDropRef = useRef<HTMLDivElement>(null);
    const unitDropRef = useRef<HTMLDivElement>(null);
    const jabatanDropRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (pejabatDropRef.current && !pejabatDropRef.current.contains(e.target as Node)) {
                setShowPejabatDrop(false);
            }
            if (unitDropRef.current && !unitDropRef.current.contains(e.target as Node)) {
                setShowUnitDrop(false);
            }
            if (jabatanDropRef.current && !jabatanDropRef.current.contains(e.target as Node)) {
                setShowJabatanDrop(false);
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
        setFormSegment(news.segment || "");
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
                setFormSegment("");
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
                setShowMediaModal(false);
                await loadData();
            } catch (err) {
                alert((err as Error).message);
            } finally {
                setSaving(false);
            }
        });
    };

    const handleQuickAddPejabat = () => {
        const name = newPejabatName.trim();
        if (!name) return;
        const finalJabatan = newPejabatJabatan.trim();
        askConfirm("Tambah Pejabat", `Yakin ingin menambahkan pejabat "${name}"?`, "info", async () => {
            setConfirmOpen(false);
            setSavingText("Menambahkan Pejabat...");
            setSaving(true);
            try {
                const res = await fetchWithAuth("/api/pejabat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ nama: name, jabatan: finalJabatan }),
                });
                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.error || "Gagal menambahkan pejabat");
                }
                setNewPejabatName("");
                setNewPejabatJabatan("");
                setShowJabatanDrop(false);
                setShowPejabatModal(false);
                await refreshOfficials();
                // auto select
                setFormPejabat((prev) => (prev.includes(name) ? prev : [...prev, name]));
            } catch (err) {
                alert((err as Error).message);
            } finally {
                setSaving(false);
            }
        });
    };

    const handleQuickAddUnit = () => {
        let fullName = newUnitName.trim();
        if (newUnitPimpinan.trim()) {
            if (fullName) fullName += " - ";
            fullName += newUnitPimpinan.trim();
        }

        if (!fullName) return;

        askConfirm("Tambah Unit", `Yakin ingin menambahkan unit "${fullName}"?`, "info", async () => {
            setConfirmOpen(false);
            setSavingText("Menambahkan Unit...");
            setSaving(true);
            try {
                const res = await fetchWithAuth("/api/unit", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ nama: fullName }),
                });
                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.error || "Gagal menambahkan unit");
                }
                setNewUnitName("");
                setNewUnitPimpinan("");
                setShowUnitModal(false);
                await refreshUnits();
                setFormUnit(fullName);
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
                    segment: formSegment,
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

    const handleFormat = (action: string) => {
        const editor = editorRef.current;
        if (!editor) return;
        editor.focus();

        try {
            if (action === "bold" || action === "b") document.execCommand("bold");
            else if (action === "italic" || action === "i") document.execCommand("italic");
            else if (action === "underline" || action === "u") document.execCommand("underline");
            else if (action === "link") {
                const url = prompt("Masukkan URL:");
                if (url) document.execCommand("createLink", false, url);
            } else if (action === "img") {
                const url = prompt("Masukkan URL Gambar:");
                if (url) document.execCommand("insertImage", false, url);
            } else if (action === "ul") {
                document.execCommand("insertUnorderedList");
            }
        } catch (err) {
            console.error("Format action error:", err);
        }

        // sync HTML back to state
        setFormIsi(editor.innerHTML);
    };

    const toolbarActions = [
        { Icon: Bold, action: () => handleFormat("bold") },
        { Icon: Italic, action: () => handleFormat("italic") },
        { Icon: Underline, action: () => handleFormat("underline") },
        { Icon: Link2, action: () => handleFormat("link") },
        { Icon: List, action: () => handleFormat("ul") },
        { Icon: ImageIcon, action: () => handleFormat("img") },
    ];

    // sync editor DOM with formIsi without forcing overwrite each render
    useEffect(() => {
        const ed = editorRef.current;
        if (!ed) return;
        if (ed.innerHTML !== (formIsi || "")) ed.innerHTML = formIsi || "";
    }, [formIsi]);

    // toolbar active state tracking (bold/italic/underline)
    const [boldActive, setBoldActive] = useState(false);
    const [italicActive, setItalicActive] = useState(false);
    const [underlineActive, setUnderlineActive] = useState(false);

    useEffect(() => {
        const onSel = () => {
            try {
                setBoldActive(document.queryCommandState("bold"));
                setItalicActive(document.queryCommandState("italic"));
                setUnderlineActive(document.queryCommandState("underline"));
            } catch {
                // ignore
            }
        };
        document.addEventListener("selectionchange", onSel);
        return () => document.removeEventListener("selectionchange", onSel);
    }, []);

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

            {/* --- Modals for manual add --- */}
            <Modal
                show={showPejabatModal}
                onClose={() => setShowPejabatModal(false)}
                title="Tambah Pejabat Manual"
                titleIcon={<Users size={20} className="text-indigo-500" />}
                maxWidth="max-w-md"
            >
                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Nama Pejabat</label>
                        <input
                            type="text"
                            value={newPejabatName}
                            onChange={(e) => setNewPejabatName(e.target.value)}
                            placeholder="Masukkan nama pejabat..."
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 ring-indigo-500 text-slate-800 dark:text-white"
                        />
                    </div>
                    <div className="space-y-2" ref={jabatanDropRef}>
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Jabatan</label>
                        <div className="relative">
                            <div
                                onClick={() => setShowJabatanDrop(!showJabatanDrop)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus-within:ring-2 ring-indigo-500 transition-all flex items-center justify-between cursor-text"
                            >
                                <input
                                    type="text"
                                    value={newPejabatJabatan}
                                    onChange={(e) => {
                                        setNewPejabatJabatan(e.target.value);
                                        setShowJabatanDrop(true);
                                    }}
                                    onFocus={() => setShowJabatanDrop(true)}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowJabatanDrop(true);
                                    }}
                                    placeholder="Ketik atau pilih jabatan..."
                                    className="bg-transparent outline-none w-full text-slate-800 dark:text-white placeholder:text-slate-400"
                                />
                                <ChevronDown size={16} className="text-slate-400 flex-shrink-0 ml-2" />
                            </div>
                            {showJabatanDrop && (
                                <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                    <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                                        {["Walikota Serang", "Wakil Walikota Serang", "Sekretaris Daerah Kota Serang"]
                                            .filter((j) => j.toLowerCase().includes(newPejabatJabatan.toLowerCase()))
                                            .map((jab) => (
                                                <button
                                                    key={jab}
                                                    type="button"
                                                    onClick={() => {
                                                        setNewPejabatJabatan(jab);
                                                        setShowJabatanDrop(false);
                                                    }}
                                                    className="w-full text-left px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                                >
                                                    {jab}
                                                </button>
                                            ))}
                                        {["Walikota Serang", "Wakil Walikota Serang", "Sekretaris Daerah Kota Serang"].filter((j) => j.toLowerCase().includes(newPejabatJabatan.toLowerCase())).length === 0 && (
                                            <div className="p-3 text-center text-slate-400 text-xs italic">
                                                {newPejabatJabatan.trim() ? `Gunakan "${newPejabatJabatan.trim()}"` : "Ketik untuk mencari/membuat jabatan"}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={handleQuickAddPejabat}
                        disabled={!newPejabatName.trim()}
                        className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-50"
                    >
                        Tambah & Pilih Pejabat
                    </button>
                </div>
            </Modal>

            <Modal
                show={showUnitModal}
                onClose={() => setShowUnitModal(false)}
                title="Tambah Unit Kerja Manual"
                titleIcon={<Building2 size={20} className="text-emerald-500" />}
                maxWidth="max-w-md"
            >
                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Nama Unit Kerja</label>
                        <input
                            type="text"
                            value={newUnitName}
                            onChange={(e) => setNewUnitName(e.target.value)}
                            placeholder="Dinas / Instansi / Unit..."
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 ring-indigo-500 text-slate-800 dark:text-white"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Pimpinan / Staff</label>
                        <input
                            type="text"
                            value={newUnitPimpinan}
                            onChange={(e) => setNewUnitPimpinan(e.target.value)}
                            placeholder="Nama pimpinan unit..."
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 ring-indigo-500 text-slate-800 dark:text-white"
                        />
                    </div>
                    <button
                        onClick={handleQuickAddUnit}
                        disabled={!newUnitName.trim()}
                        className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-50"
                    >
                        Tambah & Pilih Unit
                    </button>
                </div>
            </Modal>

            <Modal
                show={showMediaModal}
                onClose={() => setShowMediaModal(false)}
                title="Tambah Media Manual"
                titleIcon={<Newspaper size={20} className="text-indigo-500" />}
                maxWidth="max-w-md"
            >
                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Nama Media</label>
                        <input
                            type="text"
                            value={newMediaName}
                            onChange={(e) => setNewMediaName(e.target.value)}
                            placeholder="Masukkan nama media..."
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 ring-indigo-500 text-slate-800 dark:text-white"
                        />
                    </div>
                    <button
                        onClick={handleQuickAddMedia}
                        disabled={!newMediaName.trim()}
                        className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-50"
                    >
                        Tambah & Pilih Media
                    </button>
                </div>
            </Modal>



            <div className="p-4 sm:p-8">
                <div className="mx-auto max-w-7xl grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_456px] gap-6 items-start">
                    <main className="order-3 xl:order-1 flex flex-col gap-5">
                        <section className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-5">
                            <label className="block text-base font-black text-slate-900 dark:text-white mb-2">
                                Judul Berita <span className="text-rose-500">*</span>
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
                                    Isi Berita <span className="text-rose-500">*</span>
                                </label>
                                <div className="rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden bg-white dark:bg-slate-900">
                                    <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                                        {toolbarActions.map(({ Icon, action }, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onMouseDown={(e) => { e.preventDefault(); action(); }}
                                                className="w-8 h-8 inline-flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                aria-label="Toolbar"
                                            >
                                                <Icon size={17} />
                                            </button>
                                        ))}
                                    </div>
                                    <div
                                        id="editor"
                                        ref={editorRef}
                                        contentEditable
                                        suppressContentEditableWarning
                                        onInput={(e) => setFormIsi((e.target as HTMLDivElement).innerHTML)}
                                        role="textbox"
                                        aria-multiline="true"
                                        data-placeholder="Mulai tulis isi berita di sini..."
                                        className="w-full min-h-[400px] bg-white px-4 py-4 outline-none text-slate-900 leading-relaxed resize-y prose max-w-full"
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
                                        <label className="flex items-center gap-2 text-xs font-black text-slate-500 dark:text-slate-400 tracking-widest mb-2">
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
                                        <label className="block text-xs font-black text-slate-500 dark:text-slate-400 tracking-widest mb-2">
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

                            </div>
                        </section>

                        <section className="order-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-visible">
                            <div className="px-5 pt-5 flex items-center gap-2">
                                <Newspaper className="text-slate-700 dark:text-slate-200" size={18} />
                                <h3 className="text-xl font-black text-slate-900 dark:text-white">Pengaturan Berita</h3>
                            </div>
                            <div className="p-5 space-y-5">
                                <div>
                                    <label className="block text-xs font-black text-slate-500 dark:text-slate-400 tracking-widest mb-2">
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
                                            onClick={() => setShowMediaModal(true)}
                                            className="px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all"
                                            title="Tambah media"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-500 dark:text-slate-400 tracking-widest mb-2">
                                        Segment Berita
                                    </label>
                                    <select
                                        value={formSegment}
                                        onChange={(e) => setFormSegment(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 outline-none focus:ring-2 ring-indigo-500 transition-all text-slate-800 dark:text-white"
                                    >
                                        <option value="">Pilih Segment</option>
                                        <option value="Peristiwa Kota Serang">Peristiwa Kota Serang</option>
                                        <option value="Peristiwa Kepala Daerah">Peristiwa Kepala Daerah</option>
                                        <option value="Pembangunan Fisik">Pembangunan Fisik</option>
                                    </select>
                                </div>

                                <div ref={pejabatDropRef}>
                                    <label className="flex items-center gap-2 text-xs font-black text-slate-500 dark:text-slate-400 tracking-widest mb-2">
                                        <Users size={14} /> Nama Pejabat <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <div
                                            onClick={() => {
                                                if (!showPejabatDrop) {
                                                    void refreshOfficials();
                                                    setPejabatSearch("");
                                                }
                                                setShowPejabatDrop(!showPejabatDrop);
                                                setShowUnitDrop(false);
                                            }}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 outline-none focus-within:ring-2 ring-indigo-500 transition-all text-left flex items-center justify-between cursor-text"
                                        >
                                            {!showPejabatDrop ? (
                                                <span className={formPejabat.length === 0 ? "text-slate-400 text-sm" : "text-slate-800 dark:text-white text-sm font-medium truncate"}>
                                                    {formPejabat.length === 0 ? "Pilih Pejabat" : formPejabat.length === 1 ? formPejabat[0] : `${formPejabat.length} Pejabat Terpilih`}
                                                </span>
                                            ) : (
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    value={pejabatSearch}
                                                    onChange={(e) => setPejabatSearch(e.target.value)}
                                                    placeholder="Ketik untuk mencari pejabat..."
                                                    className="bg-transparent outline-none w-full text-sm text-slate-800 dark:text-white placeholder:text-slate-400"
                                                />
                                            )}
                                            <ChevronDown size={16} className="text-slate-400 flex-shrink-0 ml-2" />
                                        </div>
                                        {showPejabatDrop && (
                                            <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                                <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                                                    {filteredOfficials.length === 0 ? (
                                                        <div className="p-4 text-center text-slate-400 text-xs italic">Pejabat tidak ditemukan</div>
                                                    ) : (
                                                        filteredOfficials.map((o) => {
                                                            const name = o.nama || o.name || o.nama_pejabat || "";
                                                            if (!name) return null;
                                                            const checked = formPejabat.includes(name);
                                                            return (
                                                                <label key={o.key} className="flex items-center gap-3 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors group">
                                                                    <input type="checkbox" checked={checked} onChange={() => togglePejabat(name)} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                                                    <div className="min-w-0">
                                                                        <div className={`text-sm font-semibold truncate ${checked ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200'}`}>{name}</div>
                                                                        {o.jabatan && <div className="text-[10px] text-slate-400 truncate tracking-wider">{o.jabatan}</div>}
                                                                    </div>
                                                                </label>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                                <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setShowPejabatModal(true);
                                                            setShowPejabatDrop(false);
                                                        }}
                                                        className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                    >
                                                        <Plus size={14} /> Tambah Pejabat Manual
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div ref={unitDropRef}>
                                    <label className="flex items-center gap-2 text-xs font-black text-slate-500 dark:text-slate-400 tracking-widest mb-2">
                                        <Building2 size={14} /> Unit Kerja
                                    </label>
                                    <div className="relative">
                                        <div
                                            onClick={() => {
                                                if (!showUnitDrop) {
                                                    void refreshUnits();
                                                    setUnitSearch("");
                                                }
                                                setShowUnitDrop(!showUnitDrop);
                                                setShowPejabatDrop(false);
                                            }}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 outline-none focus-within:ring-2 ring-indigo-500 transition-all text-left flex items-center justify-between cursor-text"
                                        >
                                            {!showUnitDrop ? (
                                                <span className={!formUnit ? "text-slate-400 text-sm" : "text-slate-800 dark:text-white text-sm font-medium truncate"}>
                                                    {formUnit || "Pilih Unit Kerja"}
                                                </span>
                                            ) : (
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    value={unitSearch}
                                                    onChange={(e) => setUnitSearch(e.target.value)}
                                                    placeholder="Ketik untuk mencari unit kerja..."
                                                    className="bg-transparent outline-none w-full text-sm text-slate-800 dark:text-white placeholder:text-slate-400"
                                                />
                                            )}
                                            <ChevronDown size={16} className="text-slate-400 flex-shrink-0 ml-2" />
                                        </div>
                                        {showUnitDrop && (
                                            <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                                <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                                                    <button type="button" onClick={() => { setFormUnit(""); setShowUnitDrop(false); }} className="w-full text-left px-3 py-2.5 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors italic">
                                                        -- Kosongkan Pilihan --
                                                    </button>
                                                    {filteredUnits.length === 0 ? (
                                                        <div className="p-4 text-center text-slate-400 text-xs italic">Unit tidak ditemukan</div>
                                                    ) : (
                                                        filteredUnits.map((u) => {
                                                            const name = u.unit || u.nama || "";
                                                            if (!name) return null;
                                                            const isSelected = formUnit === name;
                                                            return (
                                                                <button
                                                                    key={u.key}
                                                                    type="button"
                                                                    onClick={() => { setFormUnit(name); setShowUnitDrop(false); }}
                                                                    className={`w-full text-left px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${isSelected ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none" : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                                                                >
                                                                    {name}
                                                                </button>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                                <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setShowUnitModal(true);
                                                            setShowUnitDrop(false);
                                                        }}
                                                        className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                    >
                                                        <Plus size={14} /> Tambah Unit Manual
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </aside>
                </div>

                <div className="mt-8 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-6">
                    <button
                        onClick={() => router.push("/admin/berita")}
                        className="w-full sm:w-auto px-6 py-4 sm:py-3 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSave}
                        className="w-full sm:w-auto px-8 py-4 sm:py-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2"
                    >
                        <Check size={18} />
                        Simpan
                    </button>
                </div>
            </div>
        </div>
    );
}
