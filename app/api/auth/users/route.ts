import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import {
  createUser,
  deleteUser,
  findUserByEmail,
  listUsers,
  updateUser,
  updateUserRole,
} from "@/lib/server/repositories/userRepository";
import { requireAdminUser } from "@/lib/server/route-auth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  const auth = await requireAdminUser();
  if (auth.response) return auth.response;

  try {
    const users = await listUsers();
    return NextResponse.json(users.map(({ passwordHash: _passwordHash, ...user }) => user));
  } catch (err) {
    logger.error("/api/auth/users GET error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAdminUser();
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const email = (body.email || "").toString().trim();
    const password = (body.password || "").toString();
    const nama = (body.nama || "").toString();
    const role = body.role === "admin" ? "admin" : "user";

    if (!email) {
      return NextResponse.json({ error: "Email tidak boleh kosong" }, { status: 400 });
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "Format email tidak valid" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
    }

    if (email.length > 100) {
      return NextResponse.json(
        { error: "Email terlalu panjang (maks 100 karakter)" },
        { status: 400 }
      );
    }

    if (nama.length > 100) {
      return NextResponse.json(
        { error: "Nama terlalu panjang (maks 100 karakter)" },
        { status: 400 }
      );
    }

    if (password.length > 100) {
      return NextResponse.json(
        { error: "Password terlalu panjang (maks 100 karakter)" },
        { status: 400 }
      );
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
    }

    await createUser({ email, password, nama, role });
    return NextResponse.json({ message: "User berhasil ditambahkan" });
  } catch (err: any) {
    logger.error("/api/auth/users POST error:", err);
    if (err.code === "ER_DUP_ENTRY") {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const auth = await requireAdminUser();
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const id = (body.id || "").toString();
    const email = (body.email || "").toString().trim();
    const nama = (body.nama || "").toString();
    const password = (body.password || "").toString();
    const role = body.role === "admin" ? "admin" : body.role === "user" ? "user" : "";

    if (!id || !role) {
      return NextResponse.json({ error: "ID dan role harus diisi" }, { status: 400 });
    }

    if (role !== "admin" && role !== "user") {
      return NextResponse.json({ error: "Role tidak valid" }, { status: 400 });
    }

    if (!email && !nama && !password) {
      await updateUserRole(id, role);
      return NextResponse.json({ message: "Role berhasil diupdate" });
    }

    if (!email) {
      return NextResponse.json({ error: "Email tidak boleh kosong" }, { status: 400 });
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "Format email tidak valid" }, { status: 400 });
    }

    if (password && password.length < 6) {
      return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
    }

    if (email.length > 100) {
      return NextResponse.json(
        { error: "Email terlalu panjang (maks 100 karakter)" },
        { status: 400 }
      );
    }

    if (nama.length > 100) {
      return NextResponse.json(
        { error: "Nama terlalu panjang (maks 100 karakter)" },
        { status: 400 }
      );
    }

    if (password && password.length > 100) {
      return NextResponse.json(
        { error: "Password terlalu panjang (maks 100 karakter)" },
        { status: 400 }
      );
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser && String(existingUser.id) !== String(id)) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
    }

    await updateUser({
      id,
      email,
      nama,
      role,
      password: password || undefined,
    });
    return NextResponse.json({ message: "User berhasil diupdate" });
  } catch (err: any) {
    logger.error("/api/auth/users PUT error:", err);
    if (err.code === "ER_DUP_ENTRY") {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireAdminUser();
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 });
    }

    // Prevent admin from deleting their own account
    if (String(id) === String(auth.user!.uid)) {
      return NextResponse.json(
        { error: "Anda tidak bisa menghapus akun Anda sendiri" },
        { status: 403 }
      );
    }

    await deleteUser(id);
    return NextResponse.json({ message: "User berhasil dihapus" });
  } catch (err) {
    logger.error("/api/auth/users DELETE error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
