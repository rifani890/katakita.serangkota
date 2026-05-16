import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import {
  createMedia,
  deleteMedia,
  listMedia,
  updateMedia,
} from "@/lib/server/repositories/catalogRepository";
import { requireSessionUser } from "@/lib/server/route-auth";

export async function GET() {
  try {
    const medias = await listMedia();
    return NextResponse.json(medias);
  } catch (err) {
    logger.error("/api/media GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireSessionUser();
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const { nama, shorthand, color } = body;

    if (!nama || !nama.trim()) {
      return NextResponse.json({ error: "Nama media tidak boleh kosong" }, { status: 400 });
    }

    if (nama.length > 100) {
      return NextResponse.json(
        { error: "Nama media terlalu panjang (maks 100 karakter)" },
        { status: 400 }
      );
    }

    if (shorthand && shorthand.length > 50) {
      return NextResponse.json(
        { error: "Singkatan terlalu panjang (maks 50 karakter)" },
        { status: 400 }
      );
    }

    const COLOR_REGEX = /^#[0-9a-fA-F]{3,8}$|^hsl\(\d{1,3},\s?\d{1,3}%?,\s?\d{1,3}%?\)$/;
    if (color && !COLOR_REGEX.test(color)) {
      return NextResponse.json({ error: "Format warna tidak valid" }, { status: 400 });
    }

    await createMedia({ nama, shorthand, color });
    return NextResponse.json({ message: "Media berhasil ditambahkan" });
  } catch (err: any) {
    logger.error("/api/media POST error:", err);
    if (err.code === "ER_DUP_ENTRY") {
      return NextResponse.json({ message: "Media sudah tersedia" });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const auth = await requireSessionUser();
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const { id, nama, shorthand, color } = body;

    if (!id || !nama || !nama.trim()) {
      return NextResponse.json({ error: "ID dan nama harus diisi" }, { status: 400 });
    }

    if (nama.length > 100) {
      return NextResponse.json(
        { error: "Nama media terlalu panjang (maks 100 karakter)" },
        { status: 400 }
      );
    }

    if (shorthand && shorthand.length > 50) {
      return NextResponse.json(
        { error: "Singkatan terlalu panjang (maks 50 karakter)" },
        { status: 400 }
      );
    }

    const COLOR_REGEX = /^#[0-9a-fA-F]{3,8}$|^hsl\(\d{1,3},\s?\d{1,3}%?,\s?\d{1,3}%?\)$/;
    if (color && !COLOR_REGEX.test(color)) {
      return NextResponse.json({ error: "Format warna tidak valid" }, { status: 400 });
    }

    await updateMedia({ id, nama, shorthand, color });
    return NextResponse.json({ message: "Media berhasil diupdate" });
  } catch (err: any) {
    logger.error("/api/media PUT error:", err);
    if (err.code === "ER_DUP_ENTRY") {
      return NextResponse.json({ error: "Media sudah ada" }, { status: 400 });
    }
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

    await deleteMedia(id);
    return NextResponse.json({ message: "Media berhasil dihapus" });
  } catch (err) {
    logger.error("/api/media DELETE error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
