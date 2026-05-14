export interface NewsItem {
  key: string;
  id?: string | number;
  judul: string;
  isi?: string;
  media: string;
  mNorm: string;
  pejabat: string | string[];
  tokoh?: string | string[];
  potensi: "Positif" | "Netral" | "Negatif" | string;
  tanggal: string;
  tanggal_raw: string | number;
  unit?: string;
  unitkerja?: string;
  userEmail?: string;
  tMingguKey: string;
  tBulanKey: string;
  segment?: string;
}

export interface PaginatedNewsResponse {
  items: NewsItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface UnitItem {
  key: string;
  unit?: string;
  nama?: string;
  pimpinan?: string;
}

export interface OfficialItem {
  key: string;
  id?: string | number;
  nama?: string;
  name?: string;
  nama_pejabat?: string;
  jabatan?: string;
  role?: string;
  jenis_kelamin?: string;
  color?: string;
  priority?: number;
}

export interface TokohItem {
  id?: string | number;
  nama: string;
  jenis_kelamin?: string;
  jabatan?: string;
}

export interface MediaItem {
  key: string;
  nama?: string;
  name?: string;
  shorthand?: string;
  color?: string;
}

export interface OfficialMapping {
  [name: string]: {
    role: string;
    color: string;
    jabatan?: string;
    priority?: number;
  };
}

export interface MediaMapping {
  [name: string]: { shorthand: string; color: string };
}

export type SortConfig = {
  column: "no" | "date" | "title" | "media" | "official" | "potensi";
  direction: "asc" | "desc";
};

export type Page = "dashboard" | "detail";

export interface OfficialCountItem {
  role: string;
  color: string;
  total: number;
  priority: number;
}

export interface TrendLegendItem {
  media: string;
  shorthand: string;
  color: string;
}

export interface TrendPoint {
  key: string;
  label: string;
  counts: Record<string, number>;
}

export interface TopEntityCount {
  name: string;
  total: number;
}

export interface DashboardSummary {
  stats: {
    total: number;
    positive: number;
    neutral: number;
    negative: number;
  };
  officialCounts: OfficialCountItem[];
  trend: {
    weekly: TrendPoint[];
    monthly: TrendPoint[];
  };
  weeklyTopOfficials: TopEntityCount[];
  weeklyTopUnits: TopEntityCount[];
  officialMapping: OfficialMapping;
  mediaMapping: MediaMapping;
  mediaLegend: TrendLegendItem[];
  totalOfficials: number;
  totalUnits: number;
  totalMedia: number;
}

export * from "./db";
