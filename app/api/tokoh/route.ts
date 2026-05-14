import { NextResponse } from "next/server";
import { executeStatement, queryRows } from "@/lib/server/database";
import { requireSessionUser } from "@/lib/server/route-auth";

export async function GET() {
  try {
    const rows = await queryRows(
      "SELECT id, nama, jenis_kelamin, jabatan FROM tokoh ORDER BY nama ASC"
    );
    return NextResponse.json(rows);
  } catch (err) {
    console.error("/api/tokoh GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireSessionUser();
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const { nama, jenis_kelamin, jabatan } = body;

    if (!nama || !nama.trim()) {
      return NextResponse.json({ error: "Nama tokoh harus diisi" }, { status: 400 });
    }

    await executeStatement("INSERT INTO tokoh (nama, jenis_kelamin, jabatan) VALUES (?, ?, ?)", [
      nama.trim(),
      jenis_kelamin?.trim() || "",
      jabatan?.trim() || "",
    ]);

    return NextResponse.json({ message: "Tokoh berhasil ditambahkan" });
  } catch (err) {
    console.error("/api/tokoh POST error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const auth = await requireSessionUser();
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const { id, nama, jenis_kelamin, jabatan } = body;

    if (!id || !nama || !nama.trim()) {
      return NextResponse.json({ error: "ID dan Nama tokoh harus diisi" }, { status: 400 });
    }

    await executeStatement(
      "UPDATE tokoh SET nama = ?, jenis_kelamin = ?, jabatan = ? WHERE id = ?",
      [nama.trim(), jenis_kelamin?.trim() || "", jabatan?.trim() || "", id]
    );

    return NextResponse.json({ message: "Tokoh berhasil diperbarui" });
  } catch (err) {
    console.error("/api/tokoh PUT error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireSessionUser();
  if (auth.response) return auth.response;

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID tokoh harus diisi" }, { status: 400 });
    }

    await executeStatement("DELETE FROM tokoh WHERE id = ?", [id]);

    return NextResponse.json({ message: "Tokoh berhasil dihapus" });
  } catch (err) {
    console.error("/api/tokoh DELETE error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
