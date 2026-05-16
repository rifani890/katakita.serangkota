import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { getAllNews, getNewsById, getPaginatedNews } from "@/lib/news";
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
    const recentDays = searchParams.get("recentDays")
      ? Number(searchParams.get("recentDays"))
      : undefined;
    const full = searchParams.get("full") === "true";

    if (
      !pageParam &&
      !search &&
      !potensi &&
      !media &&
      !role &&
      !periodType &&
      !timeKey &&
      !recentDays
    ) {
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
      recentDays,
      includeFallback: !hasSessionCookie(req),
    });

    return NextResponse.json(paginated);
  } catch (err) {
    logger.error("/api/berita GET error:", err);
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
    const { judul, isi, media, pejabat, tokoh, potensi, unit, segment, tanggal_raw } = body;

    // Use authenticated user email from session — never trust client-supplied email
    const userEmail = auth.user!.email;

    if (!judul || !judul.trim()) {
      return NextResponse.json({ error: "Judul tidak boleh kosong" }, { status: 400 });
    }

    if (judul.length > 500) {
      return NextResponse.json(
        { error: "Judul terlalu panjang (maks 500 karakter)" },
        { status: 400 }
      );
    }

    if (isi && isi.length > 100000) {
      return NextResponse.json(
        { error: "Isi berita terlalu panjang (maks 100.000 karakter)" },
        { status: 400 }
      );
    }

    await executeStatement(
      `INSERT INTO berita (judul, isi, media, pejabat, tokoh, potensi, unit, segment, tanggal_raw, tanggal_converted, user_email, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        judul.trim(),
        isi || "",
        media || null,
        serializePejabat(pejabat),
        serializePejabat(tokoh),
        potensi || "Netral",
        unit || null,
        segment || null,
        tanggal_raw || null,
        toSqlDateTime(tanggal_raw),
        userEmail || null,
      ]
    );

    return NextResponse.json({ message: "Berita berhasil ditambahkan" });
  } catch (err) {
    logger.error("/api/berita POST error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const auth = await requireSessionUser();
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const { id, judul, isi, media, pejabat, tokoh, potensi, unit, segment, tanggal_raw } = body;

    // Use authenticated user email from session — never trust client-supplied email
    const userEmail = auth.user!.email;

    if (!id || !judul || !judul.trim()) {
      return NextResponse.json({ error: "ID dan judul harus diisi" }, { status: 400 });
    }

    if (judul.length > 500) {
      return NextResponse.json(
        { error: "Judul terlalu panjang (maks 500 karakter)" },
        { status: 400 }
      );
    }

    if (isi && isi.length > 100000) {
      return NextResponse.json(
        { error: "Isi berita terlalu panjang (maks 100.000 karakter)" },
        { status: 400 }
      );
    }

    // Ownership check: non-admin users can only edit their own berita
    if (auth.user!.role !== "admin") {
      const existing = await getNewsById(id);
      if (!existing || existing.userEmail !== auth.user!.email) {
        return NextResponse.json(
          { error: "Anda tidak memiliki akses untuk mengedit berita ini" },
          { status: 403 }
        );
      }
    }

    await executeStatement(
      `UPDATE berita
       SET judul = ?, isi = ?, media = ?, pejabat = ?, tokoh = ?, potensi = ?, unit = ?, segment = ?, tanggal_raw = ?, tanggal_converted = ?, user_email = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        judul.trim(),
        isi || "",
        media || null,
        serializePejabat(pejabat),
        serializePejabat(tokoh),
        potensi || "Netral",
        unit || null,
        segment || null,
        tanggal_raw || null,
        toSqlDateTime(tanggal_raw),
        userEmail || null,
        id,
      ]
    );

    return NextResponse.json({ message: "Berita berhasil diupdate" });
  } catch (err) {
    logger.error("/api/berita PUT error:", err);
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

    // Ownership check: non-admin users can only delete their own berita
    if (auth.user!.role !== "admin") {
      const existing = await getNewsById(id);
      if (!existing || existing.userEmail !== auth.user!.email) {
        return NextResponse.json(
          { error: "Anda tidak memiliki akses untuk menghapus berita ini" },
          { status: 403 }
        );
      }
    }

    await executeStatement("DELETE FROM berita WHERE id = ?", [id]);
    return NextResponse.json({ message: "Berita berhasil dihapus" });
  } catch (err) {
    logger.error("/api/berita DELETE error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
