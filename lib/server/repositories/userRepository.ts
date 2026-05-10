import bcrypt from "bcryptjs";
import { executeStatement, queryFirst, queryRows } from "@/lib/server/database";

export interface UserRecord {
  id: string;
  email: string;
  nama?: string | null;
  role: string;
  createdAt?: string | null;
  passwordHash?: string | null;
}

interface UserRow {
  id: number;
  email: string;
  name: string | null;
  role: string | null;
  created_at: string | null;
  password_hash: string | null;
  password?: string | null;
}

function mapUserRow(row: UserRow): UserRecord {
  return {
    id: String(row.id),
    email: row.email,
    nama: row.name,
    role: row.role || "user",
    createdAt: row.created_at,
    passwordHash: row.password_hash ?? row.password ?? null,
  };
}

export async function listUsers(): Promise<UserRecord[]> {
  const rows = await queryRows<UserRow>(
    "SELECT id, email, name, role, created_at, password_hash FROM users ORDER BY email ASC"
  );

  return rows.map(mapUserRow);
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const row = await queryFirst<UserRow>(
    "SELECT id, email, name, role, created_at, password_hash, password FROM users WHERE email = ? LIMIT 1",
    [email.trim()]
  );

  return row ? mapUserRow(row) : null;
}

export async function createUser(input: {
  email: string;
  password: string;
  nama?: string | null;
  role: string;
}) {
  const passwordHash = await bcrypt.hash(input.password, 10);

  return executeStatement(
    "INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)",
    [input.email.trim(), passwordHash, input.nama?.trim() || "", input.role]
  );
}

export async function updateUserRole(id: string | number, role: string) {
  return executeStatement("UPDATE users SET role = ? WHERE id = ?", [role, id]);
}

export async function updateUser(input: {
  id: string | number;
  email: string;
  nama?: string | null;
  role: string;
  password?: string;
}) {
  if (input.password) {
    const passwordHash = await bcrypt.hash(input.password, 10);
    return executeStatement(
      "UPDATE users SET email = ?, name = ?, role = ?, password_hash = ? WHERE id = ?",
      [input.email.trim(), input.nama?.trim() || "", input.role, passwordHash, input.id]
    );
  }

  return executeStatement(
    "UPDATE users SET email = ?, name = ?, role = ? WHERE id = ?",
    [input.email.trim(), input.nama?.trim() || "", input.role, input.id]
  );
}

export async function deleteUser(id: string | number) {
  return executeStatement("DELETE FROM users WHERE id = ?", [id]);
}

export async function verifyUserPassword(email: string, password: string): Promise<UserRecord | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;

  const dbPassword = user.passwordHash || "";
  const looksHashed =
    typeof dbPassword === "string" &&
    (dbPassword.startsWith("$2a$") ||
      dbPassword.startsWith("$2b$") ||
      dbPassword.startsWith("$2y$"));

  const passwordMatches = looksHashed
    ? await bcrypt.compare(password, dbPassword)
    : password === dbPassword;

  return passwordMatches ? user : null;
}
