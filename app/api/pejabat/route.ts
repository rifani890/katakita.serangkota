import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import {
  createOfficial,
  deleteOfficial,
  listOfficials,
  updateOfficial,
} from "@/lib/server/repositories/catalogRepository";
import { requireSessionUser } from "@/lib/server/route-auth";
import { OFFICIAL_ROLE_ORDER } from "@/lib/utils";

export async function GET() {
  try {
    const officials = await listOfficials();
    return NextResponse.json(officials);
  } catch (err) {
    logger.error("/api/pejabat GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireSessionUser();
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const { nama, color, jenis_kelamin } = body;

    if (!nama || !nama.trim()) {
      return NextResponse.json({ error: "Nama pejabat tidak boleh kosong" }, { status: 400 });
    }

    if (nama.length > 100) {
      return NextResponse.json(
        { error: "Nama pejabat terlalu panjang (maks 100 karakter)" },
        { status: 400 }
      );
    }

    const jabatan = (body.jabatan as string | undefined)?.trim() || "Pejabat Lainnya";

    if (jabatan.length > 100) {
      return NextResponse.json(
        { error: "Jabatan terlalu panjang (maks 100 karakter)" },
        { status: 400 }
      );
    }

    const COLOR_REGEX = /^#[0-9a-fA-F]{3,8}$|^hsl\(\d{1,3},\s?\d{1,3}%?,\s?\d{1,3}%?\)$/;
    if (color && !COLOR_REGEX.test(color)) {
      return NextResponse.json({ error: "Format warna tidak valid" }, { status: 400 });
    }

    await createOfficial({ nama, jabatan, color, jenis_kelamin });
    return NextResponse.json({ message: "Pejabat berhasil ditambahkan" });
  } catch (err: any) {
    logger.error("/api/pejabat POST error:", err);
    if (err.code === "ER_DUP_ENTRY") {
      return NextResponse.json({ message: "Pejabat sudah tersedia" });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const auth = await requireSessionUser();
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const { id, nama, color, jenis_kelamin } = body;

    if (!id || !nama || !nama.trim()) {
      return NextResponse.json({ error: "ID dan nama harus diisi" }, { status: 400 });
    }

    if (nama.length > 100) {
      return NextResponse.json(
        { error: "Nama pejabat terlalu panjang (maks 100 karakter)" },
        { status: 400 }
      );
    }

    const jabatan = (body.jabatan as string | undefined)?.trim() || "Pejabat Lainnya";

    if (jabatan.length > 100) {
      return NextResponse.json(
        { error: "Jabatan terlalu panjang (maks 100 karakter)" },
        { status: 400 }
      );
    }

    const COLOR_REGEX = /^#[0-9a-fA-F]{3,8}$|^hsl\(\d{1,3},\s?\d{1,3}%?,\s?\d{1,3}%?\)$/;
    if (color && !COLOR_REGEX.test(color)) {
      return NextResponse.json({ error: "Format warna tidak valid" }, { status: 400 });
    }

    await updateOfficial({ id, nama, jabatan, color, jenis_kelamin });
    return NextResponse.json({ message: "Pejabat berhasil diupdate" });
  } catch (err: any) {
    logger.error("/api/pejabat PUT error:", err);
    if (err.code === "ER_DUP_ENTRY") {
      return NextResponse.json({ error: "Pejabat sudah ada" }, { status: 400 });
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

    await deleteOfficial(id);
    return NextResponse.json({ message: "Pejabat berhasil dihapus" });
  } catch (err) {
    logger.error("/api/pejabat DELETE error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
