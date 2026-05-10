import { NextResponse } from "next/server";
import { getAllNews, getPaginatedNews } from "@/lib/news";
import { executeStatement } from "@/lib/server/database";
import { requireSessionUser } from "@/lib/server/route-auth";
import { getSessionCookieName } from "@/lib/server/session";

function hasSessionCookie(req: Request): boolean {
  const cookie = req.headers.get("cookie") || "";
  return cookie.split(";").some((part) => part.trim().startsWith(`${getSessionCookieName()}=`));
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pageParam = searchParams.get("page");
    const search = searchParams.get("search") || undefined;
    const pageSize = Number(searchParams.get("pageSize") || 10);
    const sortField = searchParams.get("sortField") || undefined;
    const sortOrder = searchParams.get("sortOrder") || undefined;
    const potensi = searchParams.get("potensi") || undefined;
    const media = searchParams.get("media") || undefined;
    const role = searchParams.get("role") || undefined;
    const periodType = (searchParams.get("periodType") || undefined) as
      | "weekly"
      | "monthly"
      | undefined;
    const timeKey = searchParams.get("timeKey") || undefined;
    const full = searchParams.get("full") === "true";

    if (!pageParam && !search && !potensi && !media && !role && !periodType && !timeKey) {
      const items = await getAllNews(full ? 5000 : 1000);
      return NextResponse.json(items);
    }

    const paginated = await getPaginatedNews({
      page: Number(pageParam || 1),
      pageSize,
      search,
      sortField,
      sortOrder: sortOrder as "asc" | "desc" | undefined,
      potensi,
      media,
      role,
      periodType,
      timeKey,
      includeFallback: !hasSessionCookie(req),
    });

    return NextResponse.json(paginated);
  } catch (err) {
    console.error("/api/berita GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

function serializePejabat(pejabat: unknown): string | null {
  if (pejabat === undefined || pejabat === null) return null;
  if (typeof pejabat === "string") return pejabat;
  try {
    return JSON.stringify(pejabat);
  } catch {
    return String(pejabat);
  }
}

function toSqlDateTime(timestamp: unknown): string | null {
  if (timestamp === undefined || timestamp === null || timestamp === "") return null;
  const date = new Date(Number(timestamp));
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 19).replace("T", " ");
}

export async function POST(req: Request) {
  const auth = await requireSessionUser();
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const { judul, isi, media, pejabat, potensi, unit, tanggal_raw, userEmail } = body;

    if (!judul || !judul.trim()) {
      return NextResponse.json({ error: "Judul tidak boleh kosong" }, { status: 400 });
    }

    await executeStatement(
      `INSERT INTO berita (judul, isi, media, pejabat, potensi, unit, tanggal_raw, tanggal_converted, user_email, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        judul.trim(),
        isi || "",
        media || null,
        serializePejabat(pejabat),
        potensi || "Netral",
        unit || null,
        tanggal_raw || null,
        toSqlDateTime(tanggal_raw),
        userEmail || null,
      ]
    );

    return NextResponse.json({ message: "Berita berhasil ditambahkan" });
  } catch (err) {
    console.error("/api/berita POST error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const auth = await requireSessionUser();
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const { id, judul, isi, media, pejabat, potensi, unit, tanggal_raw, userEmail } = body;

    if (!id || !judul || !judul.trim()) {
      return NextResponse.json({ error: "ID dan judul harus diisi" }, { status: 400 });
    }

    await executeStatement(
      `UPDATE berita
       SET judul = ?, isi = ?, media = ?, pejabat = ?, potensi = ?, unit = ?, tanggal_raw = ?, tanggal_converted = ?, user_email = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        judul.trim(),
        isi || "",
        media || null,
        serializePejabat(pejabat),
        potensi || "Netral",
        unit || null,
        tanggal_raw || null,
        toSqlDateTime(tanggal_raw),
        userEmail || null,
        id,
      ]
    );

    return NextResponse.json({ message: "Berita berhasil diupdate" });
  } catch (err) {
    console.error("/api/berita PUT error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireSessionUser();
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 });
    }

    if (id.startsWith("demo-")) {
      return NextResponse.json({ message: "Berita demo berhasil dihapus" });
    }

    await executeStatement("DELETE FROM berita WHERE id = ?", [id]);
    return NextResponse.json({ message: "Berita berhasil dihapus" });
  } catch (err) {
    console.error("/api/berita DELETE error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
