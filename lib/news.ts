import { dbPool } from "@/lib/server/database";
import {
  listOfficials,
  listMedia as listMediaCatalog,
} from "@/lib/server/repositories/catalogRepository";
import type {
  DashboardSummary,
  MediaItem,
  MediaMapping,
  NewsItem,
  OfficialItem,
  OfficialMapping,
  PaginatedNewsResponse,
  TrendLegendItem,
  TrendPoint,
} from "@/types";
import {
  MONTHS_ID,
  OFFICIAL_ROLE_COLORS,
  OFFICIAL_ROLE_ORDER,
  buildDefaultMediaMapping,
  buildDefaultOfficialMapping,
  formatDate,
  getOfficialRolePriority,
  getPrimaryRole,
  getSunday,
  normMedia,
  normalizeOfficialRole,
  parseDate,
  parsePejabatValue,
  stringToColor,
  toDateKey,
  toMonthKey,
} from "@/lib/utils";

interface NewsDbRow {
  id: number;
  judul: string;
  isi: string;
  media: string;
  pejabat: string | null;
  potensi: string;
  unit: string | null;
  tanggal_raw: string | number | null;
  tanggal_converted: string | null;
  user_email: string | null;
  created_at: string | null;
  updated_at?: string | null;
}

interface NewsQueryOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
  potensi?: string;
  media?: string;
  role?: string;
  periodType?: "weekly" | "monthly";
  timeKey?: string;
  includeFallback?: boolean;
}

const NEWS_SELECT = `
  SELECT
    id,
    judul,
    isi,
    media,
    pejabat,
    potensi,
    unit,
    tanggal_raw,
    tanggal_converted,
    user_email,
    created_at,
    updated_at
  FROM berita
`;

const COUNT_SELECT = `SELECT COUNT(*) AS total FROM berita`;

const DATE_SQL = `COALESCE(tanggal_converted, created_at)`;

/**
 * Global flag to track if MySQL Full-Text Search (FTS) index is available.
 * null: not checked yet, true: available, false: not available (fallback to LIKE).
 */
let isFtsAvailable: boolean | null = null;


const SORT_FIELD_MAP: Record<string, string> = {
  date: `${DATE_SQL}`,
  tanggal_raw: `${DATE_SQL}`,
  title: "judul",
  judul: "judul",
  media: "media",
  potensi: "potensi",
  created_at: "created_at",
};

const FALLBACK_NEWS: NewsItem[] = [
  {
    key: "demo-1",
    id: "demo-1",
    judul: "Program Pelayanan Publik Kota Serang Mendapat Respons Positif",
    isi:
      "Artikel contoh ini ditampilkan otomatis saat database berita belum memiliki data publik. Berita ini mewakili sentimen positif agar dashboard, filter statistik, detail berita, dan fitur cetak tetap dapat diuji.",
    media: "KataKita",
    mNorm: "KataKita",
    pejabat: ["Pejabat Lainnya"],
    potensi: "Positif",
    tanggal: "11 Mei 2026",
    tanggal_raw: Date.UTC(2026, 4, 11),
    unit: "Diskominfo Kota Serang",
    unitkerja: "Diskominfo Kota Serang",
    userEmail: "",
    tMingguKey: "2026-05-10",
    tBulanKey: "2026-05",
  },
  {
    key: "demo-2",
    id: "demo-2",
    judul: "Agenda Monitoring Media Kota Serang Berjalan Stabil",
    isi:
      "Berita contoh netral untuk memastikan daftar berita publik tetap berisi data ketika database masih kosong.",
    media: "KataKita",
    mNorm: "KataKita",
    pejabat: ["Pejabat Lainnya"],
    potensi: "Netral",
    tanggal: "10 Mei 2026",
    tanggal_raw: Date.UTC(2026, 4, 10),
    unit: "Diskominfo Kota Serang",
    unitkerja: "Diskominfo Kota Serang",
    userEmail: "",
    tMingguKey: "2026-05-10",
    tBulanKey: "2026-05",
  },
  {
    key: "demo-3",
    id: "demo-3",
    judul: "Catatan Evaluasi Layanan Publik Perlu Ditindaklanjuti",
    isi:
      "Berita contoh negatif untuk menjaga filter sentimen negatif tetap dapat diverifikasi di lingkungan tanpa data.",
    media: "KataKita",
    mNorm: "KataKita",
    pejabat: ["Pejabat Lainnya"],
    potensi: "Negatif",
    tanggal: "09 Mei 2026",
    tanggal_raw: Date.UTC(2026, 4, 9),
    unit: "Diskominfo Kota Serang",
    unitkerja: "Diskominfo Kota Serang",
    userEmail: "",
    tMingguKey: "2026-05-03",
    tBulanKey: "2026-05",
  },
];

export function getFallbackNewsById(id: string | number): NewsItem | null {
  return FALLBACK_NEWS.find((item) => String(item.key) === String(id)) || null;
}

function filterFallbackNews(options: NewsQueryOptions): NewsItem[] {
  const search = options.search?.trim().toLowerCase();
  return FALLBACK_NEWS.filter((item) => {
    if (search) {
      const haystack = [
        item.judul,
        item.isi,
        item.media,
        item.potensi,
        item.unit,
        Array.isArray(item.pejabat) ? item.pejabat.join(" ") : item.pejabat,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    if (options.potensi?.trim() && item.potensi !== options.potensi.trim()) return false;
    if (options.media?.trim() && item.media !== options.media.trim()) return false;
    return true;
  });
}

function paginateFallbackNews(options: NewsQueryOptions): PaginatedNewsResponse {
  const pageSize = clampPageSize(Number(options.pageSize));
  const requestedPage = Math.max(1, Number(options.page) || 1);
  const items = filterFallbackNews(options);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const offset = (page - 1) * pageSize;

  return {
    items: items.slice(offset, offset + pageSize),
    page,
    pageSize,
    totalItems,
    totalPages,
  };
}

function mapNewsRow(row: NewsDbRow): NewsItem {
  const tanggalRaw = row.tanggal_raw ?? row.created_at ?? "";
  const parsedDate = parseDate(tanggalRaw);

  return {
    key: String(row.id),
    id: row.id,
    judul: row.judul ?? "",
    isi: row.isi ?? "",
    media: row.media ?? "",
    pejabat: parsePejabatValue(row.pejabat),
    potensi: row.potensi ?? "Netral",
    tanggal: row.tanggal_converted ? formatDate(row.tanggal_converted) : "",
    tanggal_raw: tanggalRaw,
    unit: row.unit ?? "",
    unitkerja: row.unit ?? "",
    userEmail: row.user_email ?? "",
    mNorm: normMedia(row.media),
    tMingguKey: toDateKey(getSunday(parsedDate)),
    tBulanKey: toMonthKey(parsedDate),
  };
}

function clampPageSize(pageSize?: number): number {
  if (!pageSize || Number.isNaN(pageSize)) return 10;
  return Math.min(Math.max(pageSize, 1), 100);
}

function normalizeSortField(sortField?: string): string {
  return SORT_FIELD_MAP[sortField || "date"] || SORT_FIELD_MAP.date;
}

function normalizeSortOrder(sortOrder?: string): "asc" | "desc" {
  return sortOrder === "asc" ? "asc" : "desc";
}

function createDateRange(periodType?: "weekly" | "monthly", timeKey?: string) {
  if (!periodType || !timeKey) return null;
  if (periodType === "monthly") {
    const [year, month] = timeKey.split("-").map(Number);
    if (!year || !month) return null;
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    return { start, end };
  }

  const base = new Date(timeKey);
  if (Number.isNaN(base.getTime())) return null;
  const start = new Date(base);
  const end = new Date(base);
  end.setDate(end.getDate() + 7);
  return { start, end };
}

function buildWhereClause(options: NewsQueryOptions, useFts = true) {
  const conditions: string[] = [];
  const values: Array<string | number> = [];

  if (options.search?.trim()) {
    const search = options.search.trim();

    if (useFts) {
      // Use MySQL Full-Text Search for high performance on large datasets
      // Columns: judul, isi, media, pejabat, unit
      conditions.push(`MATCH(judul, isi, media, pejabat, unit) AGAINST(? IN NATURAL LANGUAGE MODE)`);
      values.push(search);
    } else {
      // Fallback to LIKE if FTS index is not available
      const searchPattern = `%${search}%`;
      conditions.push(
        `(judul LIKE ? OR media LIKE ? OR potensi LIKE ? OR unit LIKE ? OR user_email LIKE ? OR pejabat LIKE ?)`
      );
      values.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }
  }


  if (options.potensi?.trim()) {
    conditions.push(`potensi = ?`);
    values.push(options.potensi.trim());
  }

  if (options.media?.trim()) {
    conditions.push(`media = ?`);
    values.push(options.media.trim());
  }

  const dateRange = createDateRange(options.periodType, options.timeKey);
  if (dateRange) {
    conditions.push(`${DATE_SQL} >= ? AND ${DATE_SQL} < ?`);
    values.push(
      dateRange.start.toISOString().slice(0, 19).replace("T", " "),
      dateRange.end.toISOString().slice(0, 19).replace("T", " ")
    );
  }

  const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";
  return { whereClause, values };
}

async function fetchOfficials(): Promise<OfficialItem[]> {
  try {
    return await listOfficials();
  } catch {
    return [];
  }
}

async function fetchMediaItems(): Promise<MediaItem[]> {
  try {
    return await listMediaCatalog();
  } catch {
    return [];
  }
}

function buildOfficialMapping(officials: OfficialItem[]): OfficialMapping {
  const mapping = buildDefaultOfficialMapping();
  for (const official of officials) {
    const name = official.nama || official.name || official.nama_pejabat;
    if (!name) continue;
    const jabatan = official.jabatan || official.role || "";
    const role = normalizeOfficialRole(jabatan);
    mapping[name] = {
      role,
      jabatan,
      priority: getOfficialRolePriority(jabatan),
      color: OFFICIAL_ROLE_COLORS[role] ?? "#64748b",
    };
  }
  return mapping;
}

async function buildMediaMapping(): Promise<{
  mediaMapping: MediaMapping;
  mediaLegend: TrendLegendItem[];
}> {
  const [mediaRows, distinctNewsMedia] = await Promise.all([
    fetchMediaItems(),
    dbPool
      .execute(
        `SELECT DISTINCT media FROM berita WHERE media IS NOT NULL AND TRIM(media) <> '' ORDER BY media ASC`
      )
      .then(([rows]) => rows as Array<{ media: string }>)
      .catch(() => []),
  ]);

  const mapping = buildDefaultMediaMapping();

  for (const media of mediaRows) {
    const name = media.nama || media.name;
    if (!name) continue;
    mapping[name] = {
      shorthand:
        media.shorthand ||
        name
          .split(" ")
          .map((word) => word[0])
          .join("")
          .toUpperCase()
          .slice(0, 3),
      color: media.color || stringToColor(name),
    };
  }

  for (const mediaRow of distinctNewsMedia) {
    const normalizedName = normMedia(mediaRow.media);
    if (mapping[normalizedName]) continue;
    mapping[normalizedName] = {
      shorthand: normalizedName
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 3),
      color: stringToColor(normalizedName),
    };
  }

  const mediaLegend = Object.entries(mapping)
    .map(([media, info]) => ({
      media,
      shorthand: info.shorthand,
      color: info.color,
    }))
    .sort((a, b) => a.media.localeCompare(b.media));

  return { mediaMapping: mapping, mediaLegend };
}

async function fetchNewsRowsByIds(ids: number[]): Promise<NewsItem[]> {
  if (ids.length === 0) return [];

  const placeholders = ids.map(() => "?").join(", ");
  const [rows] = await dbPool.execute(
    `${NEWS_SELECT} WHERE id IN (${placeholders})`,
    ids
  );

  const mapped = (rows as NewsDbRow[]).map(mapNewsRow);
  const orderMap = new Map(ids.map((id, index) => [id, index]));

  return mapped.sort(
    (a, b) =>
      (orderMap.get(Number(a.id ?? a.key)) ?? 0) -
      (orderMap.get(Number(b.id ?? b.key)) ?? 0)
  );
}

export async function getNewsById(id: string | number): Promise<NewsItem | null> {
  const [rows] = await dbPool.execute(`${NEWS_SELECT} WHERE id = ? LIMIT 1`, [id]);
  const row = (rows as NewsDbRow[])[0];
  return row ? mapNewsRow(row) : getFallbackNewsById(id);
}

export async function getPaginatedNews(
  options: NewsQueryOptions = {}
): Promise<PaginatedNewsResponse> {
  const requestedPage = Math.max(1, Number(options.page) || 1);
  const pageSize = clampPageSize(Number(options.pageSize));
  const sortField = normalizeSortField(options.sortField);
  const sortOrder = normalizeSortOrder(options.sortOrder);

  // Fallback Logic: Detect if FTS index is available before building the clause
  if (isFtsAvailable === null && options.search?.trim()) {
    try {
      await dbPool.execute(
        `SELECT 1 FROM berita WHERE MATCH(judul, isi, media, pejabat, unit) AGAINST('test') LIMIT 0`
      );
      isFtsAvailable = true;
    } catch {
      isFtsAvailable = false;
    }
  }

  const { whereClause, values } = buildWhereClause(options, isFtsAvailable !== false);


  if (options.role?.trim()) {
    const officials = await fetchOfficials();
    const officialMapping = buildOfficialMapping(officials);
    const [roleRows] = await dbPool.execute(
      `SELECT id, pejabat FROM berita${whereClause} ORDER BY ${sortField} ${sortOrder.toUpperCase()}`,
      values
    );

    const matchingIds = (roleRows as Array<{ id: number; pejabat: string | null }>)
      .filter((row) => {
        const primaryRole = getPrimaryRole(parsePejabatValue(row.pejabat), officialMapping);
        return primaryRole.toLowerCase() === options.role?.trim().toLowerCase();
      })
      .map((row) => row.id);

    const totalItems = matchingIds.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const page = Math.min(requestedPage, totalPages);
    const offset = (page - 1) * pageSize;
    const pagedIds = matchingIds.slice(offset, offset + pageSize);
    const items = await fetchNewsRowsByIds(pagedIds);

    return {
      items,
      page,
      pageSize,
      totalItems,
      totalPages,
    };
  }

  const [countRows] = await dbPool.execute(`${COUNT_SELECT}${whereClause}`, values);
  const totalItems = Number((countRows as Array<{ total: number }>)[0]?.total || 0);
  if (totalItems === 0 && options.includeFallback && !options.role?.trim()) {
    return paginateFallbackNews(options);
  }
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const offset = (page - 1) * pageSize;

  const [rows] = await dbPool.query(
    `${NEWS_SELECT}${whereClause} ORDER BY ${sortField} ${sortOrder.toUpperCase()} LIMIT ${Number(pageSize)} OFFSET ${Number(offset)}`,
    values
  );

  return {
    items: (rows as NewsDbRow[]).map(mapNewsRow),
    page,
    pageSize,
    totalItems,
    totalPages,
  };
}

export async function getAllNews(limit = 1000): Promise<NewsItem[]> {
  const safeLimit = Math.min(Math.max(limit, 1), 5000);
  const [rows] = await dbPool.execute(
    `${NEWS_SELECT} ORDER BY ${DATE_SQL} DESC LIMIT ?`,
    [safeLimit]
  );
  const mapped = (rows as NewsDbRow[]).map(mapNewsRow);
  return mapped.length > 0 ? mapped : FALLBACK_NEWS.slice(0, safeLimit);
}

export async function getNewsSitemapEntries(limit = 50000) {
  const safeLimit = Math.min(Math.max(limit, 1), 50000);
  try {
    const [rows] = await dbPool.execute(
      `
        SELECT id, judul, updated_at, created_at
        FROM berita
        ORDER BY updated_at DESC, created_at DESC
        LIMIT ?
      `,
      [safeLimit]
    );

    return (rows as Array<{ id: number; judul: string; updated_at: string | null; created_at: string | null }>).map(
      (row) => ({
        id: String(row.id),
        judul: row.judul || "",
        updatedAt: row.updated_at || row.created_at || null,
      })
    );
  } catch (err) {
    console.error("getNewsSitemapEntries error:", err);
    return [];
  }
}

function createEmptyTrendCounts(mediaLegend: TrendLegendItem[]) {
  return mediaLegend.reduce<Record<string, number>>((acc, item) => {
    acc[item.shorthand] = 0;
    return acc;
  }, {});
}

function buildTrendPoints(
  bucketMap: Record<string, Record<string, number>>,
  mediaLegend: TrendLegendItem[],
  periodType: "weekly" | "monthly"
): TrendPoint[] {
  return Object.keys(bucketMap)
    .sort()
    .map((key) => {
      const label =
        periodType === "monthly"
          ? (() => {
            const [year, month] = key.split("-").map(Number);
            const date = new Date(year, (month || 1) - 1, 1);
            return `${MONTHS_ID[date.getMonth()]} ${date.getFullYear()}`;
          })()
          : (() => {
            const start = new Date(key);
            const end = new Date(start);
            end.setDate(end.getDate() + 6);
            return `${start.getDate()} ${MONTHS_ID[start.getMonth()]} - ${end.getDate()} ${MONTHS_ID[end.getMonth()]} '${String(end.getFullYear()).slice(2)}`;
          })();

      return {
        key,
        label,
        counts: {
          ...createEmptyTrendCounts(mediaLegend),
          ...bucketMap[key],
        },
      };
    });
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [statsRows, officials, mediaCounts, officialRoleRows, trendRows, totalUnitsRows] =
    await Promise.all([
      dbPool
        .execute(
          `
            SELECT
              COUNT(*) AS total,
              SUM(CASE WHEN potensi = 'Positif' THEN 1 ELSE 0 END) AS positive,
              SUM(CASE WHEN potensi = 'Netral' THEN 1 ELSE 0 END) AS neutral,
              SUM(CASE WHEN potensi = 'Negatif' THEN 1 ELSE 0 END) AS negative
            FROM berita
          `
        )
        .then(([rows]) => rows as Array<{ total: number; positive: number; neutral: number; negative: number }>)
        .catch(() => [{ total: 0, positive: 0, neutral: 0, negative: 0 }]),
      fetchOfficials(),
      buildMediaMapping(),
      dbPool
        .execute(`SELECT pejabat FROM berita`)
        .then(([rows]) => rows as Array<{ pejabat: string | null }>)
        .catch(() => []),
      dbPool
        .execute(
          `
            SELECT media, DATE(${DATE_SQL}) AS bucket_date, COUNT(*) AS total
            FROM berita
            WHERE media IS NOT NULL AND TRIM(media) <> ''
            GROUP BY media, DATE(${DATE_SQL})
            ORDER BY bucket_date ASC
          `
        )
        .then(([rows]) => rows as Array<{ media: string; bucket_date: string; total: number }>)
        .catch(() => []),
      dbPool
        .execute(
          `
            SELECT
              (SELECT COUNT(*) FROM unit_kerja) AS totalUnits,
              (SELECT COUNT(*) FROM media) AS totalMedia
          `
        )
        .then(([rows]) => rows as Array<{ totalUnits: number; totalMedia: number }>)
        .catch(() => [{ totalUnits: 0, totalMedia: 0 }]),
    ]);

  const officialMapping = buildOfficialMapping(officials);
  const { mediaMapping, mediaLegend } = mediaCounts;

  const prioritizedRoleRows = officialRoleRows
    .map((row) => {
      const role = getPrimaryRole(parsePejabatValue(row.pejabat), officialMapping);
      return {
        role,
        priority: getOfficialRolePriority(role),
      };
    })
    .sort((a, b) => a.priority - b.priority);

  const roleTotals = new Map<string, number>();
  for (const row of prioritizedRoleRows) {
    const role = row.role;
    roleTotals.set(role, (roleTotals.get(role) || 0) + 1);
  }

  for (const role of OFFICIAL_ROLE_ORDER) {
    if (!roleTotals.has(role)) roleTotals.set(role, 0);
  }

  const officialCounts = Array.from(roleTotals.entries())
    .map(([role, total]) => ({
      role,
      total,
      priority: getOfficialRolePriority(role),
      color: OFFICIAL_ROLE_COLORS[role] ?? "#64748b",
    }))
    .sort((a, b) => a.priority - b.priority);

  const weeklyBucketMap: Record<string, Record<string, number>> = {};
  const monthlyBucketMap: Record<string, Record<string, number>> = {};

  for (const row of trendRows) {
    const mediaName = normMedia(row.media);
    const legendItem = mediaLegend.find((item) => item.media === mediaName);
    if (!legendItem) continue;

    const date = new Date(row.bucket_date);
    if (Number.isNaN(date.getTime())) continue;

    const weeklyKey = toDateKey(getSunday(date));
    const monthlyKey = toMonthKey(date);

    weeklyBucketMap[weeklyKey] ||= createEmptyTrendCounts(mediaLegend);
    monthlyBucketMap[monthlyKey] ||= createEmptyTrendCounts(mediaLegend);

    weeklyBucketMap[weeklyKey][legendItem.shorthand] += Number(row.total || 0);
    monthlyBucketMap[monthlyKey][legendItem.shorthand] += Number(row.total || 0);
  }

  const stats = statsRows[0] || { total: 0, positive: 0, neutral: 0, negative: 0 };
  const totals = totalUnitsRows[0] || { totalUnits: 0, totalMedia: 0 };
  const hasDbNews = Number(stats.total || 0) > 0;
  const fallbackStats = {
    total: FALLBACK_NEWS.length,
    positive: FALLBACK_NEWS.filter((item) => item.potensi === "Positif").length,
    neutral: FALLBACK_NEWS.filter((item) => item.potensi === "Netral").length,
    negative: FALLBACK_NEWS.filter((item) => item.potensi === "Negatif").length,
  };

  return {
    stats: {
      total: hasDbNews ? Number(stats.total || 0) : fallbackStats.total,
      positive: hasDbNews ? Number(stats.positive || 0) : fallbackStats.positive,
      neutral: hasDbNews ? Number(stats.neutral || 0) : fallbackStats.neutral,
      negative: hasDbNews ? Number(stats.negative || 0) : fallbackStats.negative,
    },
    officialCounts,
    trend: {
      weekly: buildTrendPoints(weeklyBucketMap, mediaLegend, "weekly"),
      monthly: buildTrendPoints(monthlyBucketMap, mediaLegend, "monthly"),
    },
    officialMapping,
    mediaMapping,
    mediaLegend,
    totalOfficials: officials.length,
    totalUnits: Number(totals.totalUnits || 0),
    totalMedia: Number(totals.totalMedia || 0),
  };
}
