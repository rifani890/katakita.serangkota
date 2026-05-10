import { NextResponse } from "next/server";
import {
  createUnit,
  deleteUnit,
  listUnits,
  updateUnit,
} from "@/lib/server/repositories/catalogRepository";
import { requireSessionUser } from "@/lib/server/route-auth";

export async function GET() {
  try {
    const units = await listUnits();
    return NextResponse.json(units);
  } catch (err) {
    console.error("/api/unit GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireSessionUser();
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const { nama } = body;

    if (!nama || !nama.trim()) {
      return NextResponse.json({ error: "Nama unit tidak boleh kosong" }, { status: 400 });
    }

    await createUnit(nama);
    return NextResponse.json({ message: "Unit berhasil ditambahkan" });
  } catch (err: any) {
    console.error("/api/unit POST error:", err);
    if (err.code === "ER_DUP_ENTRY") {
      return NextResponse.json({ message: "Unit sudah tersedia" });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const auth = await requireSessionUser();
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const { id, nama } = body;

    if (!id || !nama || !nama.trim()) {
      return NextResponse.json({ error: "ID dan nama harus diisi" }, { status: 400 });
    }

    await updateUnit(id, nama);
    return NextResponse.json({ message: "Unit berhasil diupdate" });
  } catch (err: any) {
    console.error("/api/unit PUT error:", err);
    if (err.code === "ER_DUP_ENTRY") {
      return NextResponse.json({ error: "Unit sudah ada" }, { status: 400 });
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

    await deleteUnit(id);
    return NextResponse.json({ message: "Unit berhasil dihapus" });
  } catch (err) {
    console.error("/api/unit DELETE error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
