import { NextResponse } from "next/server";
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
    console.error("/api/pejabat GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireSessionUser();
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const { nama, color } = body;

    if (!nama || !nama.trim()) {
      return NextResponse.json({ error: "Nama pejabat tidak boleh kosong" }, { status: 400 });
    }

    const jabatan = (body.jabatan as string | undefined)?.trim() || "Pejabat Lainnya";

    await createOfficial({ nama, jabatan, color });
    return NextResponse.json({ message: "Pejabat berhasil ditambahkan" });
  } catch (err: any) {
    console.error("/api/pejabat POST error:", err);
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
    const { id, nama, color } = body;

    if (!id || !nama || !nama.trim()) {
      return NextResponse.json({ error: "ID dan nama harus diisi" }, { status: 400 });
    }

    const jabatan = (body.jabatan as string | undefined)?.trim() || "Pejabat Lainnya";

    await updateOfficial({ id, nama, jabatan, color });
    return NextResponse.json({ message: "Pejabat berhasil diupdate" });
  } catch (err: any) {
    console.error("/api/pejabat PUT error:", err);
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
    console.error("/api/pejabat DELETE error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
