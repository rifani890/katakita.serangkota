import type { OfficialMapping, MediaMapping, NewsItem } from "@/types";

export const MONTHS_ID = [
  "Jan","Feb","Mar","Apr","Mei","Jun",
  "Jul","Agu","Sep","Okt","Nov","Des",
];

export const OFFICIAL_ROLE_ORDER = [
  "Walikota Serang",
  "Wakil Walikota Serang",
  "Sekretaris Daerah Kota Serang",
  "Pejabat Lainnya",
] as const;

export const OFFICIAL_ROLE_PRIORITY: Record<(typeof OFFICIAL_ROLE_ORDER)[number], number> = {
  "Walikota Serang": 1,
  "Wakil Walikota Serang": 2,
  "Sekretaris Daerah Kota Serang": 3,
  "Pejabat Lainnya": 4,
};

export const OFFICIAL_ROLE_COLORS: Record<string, string> = {
  "Walikota Serang": "#3b82f6",
  "Wakil Walikota Serang": "#f59e0b",
  "Sekretaris Daerah Kota Serang": "#8B4513",
  "Pejabat Lainnya": "#64748b",
};

export const DEFAULT_SITE_URL = "http://localhost:3000";

export function parseDate(dateVal: string | number | undefined): Date {
  if (!dateVal) return new Date(0);
  const d = new Date(dateVal as string);
  return isNaN(d.getTime()) ? new Date(0) : d;
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function toMonthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function getSunday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatDate(dateVal: string | number | undefined): string {
  const d = parseDate(dateVal);
  if (d.getTime() === 0) return "-";
  const day = String(d.getDate()).padStart(2, "0");
  const month = MONTHS_ID[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export function formatDateISO(dateVal: string | number | undefined): string {
  const d = parseDate(dateVal);
  if (d.getTime() === 0) return "";
  return d.toISOString();
}

export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, "");
}

export function normMedia(m: string | undefined): string {
  if (!m) return "Lainnya";
  const c = m.toLowerCase().replace(/\s+/g, "");
  if (c.includes("kabarbanten")) return "Kabar Banten";
  if (c.includes("radarbanten")) return "Radar Banten";
  if (c.includes("bantenraya")) return "Banten Raya";
  return m.trim();
}

export function getSentimenClass(sentimen: string): string {
  switch (sentimen) {
    case "Positif": return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400";
    case "Negatif": return "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400";
    default: return "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300";
  }
}

export function getBorderAccent(potensi: string): string {
  if (potensi === "Positif") return "bg-emerald-500";
  if (potensi === "Negatif") return "bg-rose-500";
  return "bg-slate-400";
}

export function getPrimaryRole(
  pejabat: string | string[] | undefined,
  officialMapping: OfficialMapping
): string {
  if (!pejabat) return "Pejabat Lainnya";
  const names = Array.isArray(pejabat) ? pejabat : [pejabat];
  const foundRoles = names
    .map((name) => {
      const official = getOfficialMapping(name, officialMapping);
      return official?.jabatan || official?.role || name;
    })
    .filter(Boolean)
    .map(normalizeOfficialRole);

  if (foundRoles.length === 0) return "Pejabat Lainnya";

  foundRoles.sort((a, b) => getOfficialRolePriority(a) - getOfficialRolePriority(b));
  return foundRoles[0];
}

export function normalizeOfficialRole(role: string | undefined): string {
  const normalized = (role || "").trim().replace(/^['"]+|['"]+$/g, "").trim().toLowerCase();
  const compact = normalized.replace(/\s+/g, "");
  if (!normalized) return "Pejabat Lainnya";

  // Cek Wakil dulu sebelum Walikota (urutan penting!)
  if (compact.includes("wakilwalikota") || compact.includes("wkl.walikota")) {
    return "Wakil Walikota Serang";
  }
  if (compact.includes("walikota") || compact.includes("walikota") || compact === "wk") {
    return "Walikota Serang";
  }
  if (
    normalized.includes("sekretaris daerah") ||
    normalized.includes("sekertaris daerah") ||
    normalized.startsWith("sekda") ||
    compact === "sekda"
  ) {
    return "Sekretaris Daerah Kota Serang";
  }
  return "Pejabat Lainnya";
}

export function getOfficialRolePriority(role: string | undefined): number {
  const normalized = normalizeOfficialRole(role) as keyof typeof OFFICIAL_ROLE_PRIORITY;
  return OFFICIAL_ROLE_PRIORITY[normalized] || OFFICIAL_ROLE_PRIORITY["Pejabat Lainnya"];
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trim()}...`;
}

export function buildNewsSlug(news: Pick<NewsItem, "judul">): string {
  return slugify(news.judul || "berita");
}

export function buildNewsPath(news: Pick<NewsItem, "key" | "judul">): string {
  return `/berita/${news.key}/${buildNewsSlug(news)}`;
}

export function getNewsExcerpt(news: Pick<NewsItem, "isi" | "judul">, maxLength = 160): string {
  const source = stripHtml(news.isi || news.judul || "");
  return truncateText(source, maxLength);
}

export function parsePejabatValue(pejabat: unknown): string[] {
  if (Array.isArray(pejabat)) {
    return pejabat.map(String).flatMap(s => s.split(',')).map(s => s.trim()).filter(Boolean);
  }
  if (typeof pejabat !== "string" || !pejabat.trim()) return [];
  try {
    const parsed = JSON.parse(pejabat);
    if (Array.isArray(parsed)) {
      return parsed.map(String).flatMap(s => s.split(',')).map(s => s.trim()).filter(Boolean);
    }
    return String(parsed).split(',').map(s => s.trim()).filter(Boolean);
  } catch {
    return pejabat.split(',').map(s => s.trim()).filter(Boolean);
  }
}

export function getOfficialMapping(
  rawName: string,
  officialMapping: OfficialMapping
): OfficialMapping[string] | null {
  if (!rawName) return null;

  const cleanName = rawName.trim().replace(/^['"]+|['"]+$/g, "");

  if (officialMapping[cleanName]) return officialMapping[cleanName];

  const lowerClean = cleanName.toLowerCase();
  for (const [key, val] of Object.entries(officialMapping)) {
    const cleanKey = key.trim().replace(/^['"]+|['"]+$/g, "").toLowerCase();
    if (cleanKey === lowerClean) return val;
  }
  return null;
}

export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 50%)`;
}

export function buildDefaultOfficialMapping(): OfficialMapping {
  return {
    "H. Budi Rustandi": {
      role: "Walikota Serang",
      jabatan: "Walikota Serang",
      priority: 1,
      color: OFFICIAL_ROLE_COLORS["Walikota Serang"],
    },
    "Nur Agis Aulia": {
      role: "Wakil Walikota Serang",
      jabatan: "Wakil Walikota Serang",
      priority: 2,
      color: OFFICIAL_ROLE_COLORS["Wakil Walikota Serang"],
    },
    "Nanang Saefudin": {
      role: "Sekretaris Daerah Kota Serang",
      jabatan: "Sekretaris Daerah Kota Serang",
      priority: 3,
      color: OFFICIAL_ROLE_COLORS["Sekretaris Daerah Kota Serang"],
    },
    "Pejabat Lainnya": {
      role: "Pejabat Lainnya",
      jabatan: "Pejabat Lainnya",
      priority: 4,
      color: OFFICIAL_ROLE_COLORS["Pejabat Lainnya"],
    },
  };
}

export function buildDefaultMediaMapping(): MediaMapping {
  return {
    "Kabar Banten": { shorthand: "KB", color: "#22c55e" },
    "Radar Banten": { shorthand: "RB", color: "#1e3a8a" },
    "Banten Raya": { shorthand: "BR", color: "#7f1d1d" },
  };
}

export function searchNews(news: NewsItem[], query: string): NewsItem[] {
  const q = query.toLowerCase();
  if (!q) return news;
  return news.filter((n) =>
    (n.judul || "").toLowerCase().includes(q) ||
    (n.media || "").toLowerCase().includes(q) ||
    (n.potensi || "").toLowerCase().includes(q) ||
    (n.tanggal || "").toLowerCase().includes(q) ||
    (n.unit || "").toLowerCase().includes(q) ||
    (n.userEmail || "").toLowerCase().includes(q) ||
    (Array.isArray(n.pejabat)
      ? n.pejabat.join(" ")
      : n.pejabat || ""
    ).toLowerCase().includes(q)
  );
}
