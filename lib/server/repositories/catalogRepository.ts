import type { MediaItem, OfficialItem, UnitItem } from "@/types";
import { executeStatement, queryRows } from "@/lib/server/database";
import { getOfficialRolePriority, normalizeOfficialRole } from "@/lib/utils";

interface MediaRow {
  id: number;
  nama: string;
  shorthand: string | null;
  color: string | null;
}

interface UnitRow {
  id: number;
  nama: string;
  pimpinan: string | null;
}

interface OfficialRow {
  id: number;
  nama: string;
  jabatan: string | null;
  jenis_kelamin: string | null;
  color: string | null;
}

export async function listMedia(): Promise<MediaItem[]> {
  const rows = await queryRows<MediaRow>(
    "SELECT id, nama, shorthand, color FROM media ORDER BY nama ASC"
  );

  return rows.map((row) => ({
    key: String(row.id),
    id: row.id,
    nama: row.nama,
    name: row.nama,
    shorthand: row.shorthand ?? undefined,
    color: row.color ?? undefined,
  }));
}

export async function createMedia(input: {
  nama: string;
  shorthand?: string | null;
  color?: string | null;
}) {
  return executeStatement("INSERT INTO media (nama, shorthand, color) VALUES (?, ?, ?)", [
    input.nama.trim(),
    input.shorthand?.trim() || null,
    input.color || null,
  ]);
}

export async function updateMedia(input: {
  id: string | number;
  nama: string;
  shorthand?: string | null;
  color?: string | null;
}) {
  return executeStatement("UPDATE media SET nama = ?, shorthand = ?, color = ? WHERE id = ?", [
    input.nama.trim(),
    input.shorthand?.trim() || null,
    input.color || null,
    input.id,
  ]);
}

export async function deleteMedia(id: string | number) {
  return executeStatement("DELETE FROM media WHERE id = ?", [id]);
}

export async function listUnits(): Promise<UnitItem[]> {
  const rows = await queryRows<UnitRow>("SELECT id, nama, pimpinan FROM unit_kerja ORDER BY nama ASC");

  return rows.map((row) => ({
    key: String(row.id),
    id: row.id,
    unit: row.nama,
    nama: row.nama,
    pimpinan: row.pimpinan ?? undefined,
  }));
}

export async function createUnit(nama: string, pimpinan?: string | null) {
  return executeStatement("INSERT INTO unit_kerja (nama, pimpinan) VALUES (?, ?)", [
    nama.trim(),
    pimpinan?.trim() || null,
  ]);
}

export async function updateUnit(id: string | number, nama: string, pimpinan?: string | null) {
  return executeStatement("UPDATE unit_kerja SET nama = ?, pimpinan = ? WHERE id = ?", [
    nama.trim(),
    pimpinan?.trim() || null,
    id,
  ]);
}

export async function deleteUnit(id: string | number) {
  return executeStatement("DELETE FROM unit_kerja WHERE id = ?", [id]);
}

export async function listOfficials(): Promise<OfficialItem[]> {
  const rows = await queryRows<OfficialRow>(
    "SELECT id, nama, jabatan, jenis_kelamin, color FROM pejabat ORDER BY nama ASC"
  );

  return rows
    .map((row) => ({
      key: String(row.id),
      id: row.id,
      nama: row.nama,
      name: row.nama,
      nama_pejabat: row.nama,
      jabatan: row.jabatan ?? undefined,
      role: row.jabatan ?? undefined,
      jenis_kelamin: row.jenis_kelamin ?? undefined,
      color: row.color ?? undefined,
      priority: getOfficialRolePriority(normalizeOfficialRole(row.jabatan ?? undefined)),
    }))
    .sort((a, b) => {
      const priorityDiff = getOfficialRolePriority(a.jabatan) - getOfficialRolePriority(b.jabatan);
      if (priorityDiff !== 0) return priorityDiff;
      return (a.nama || "").localeCompare(b.nama || "");
    });
}

export async function createOfficial(input: {
  nama: string;
  jabatan?: string | null;
  jenis_kelamin?: string | null;
  color?: string | null;
}) {
  return executeStatement("INSERT INTO pejabat (nama, jabatan, jenis_kelamin, color) VALUES (?, ?, ?, ?)", [
    input.nama.trim(),
    input.jabatan?.trim() || null,
    input.jenis_kelamin?.trim() || null,
    input.color || null,
  ]);
}

export async function updateOfficial(input: {
  id: string | number;
  nama: string;
  jabatan?: string | null;
  jenis_kelamin?: string | null;
  color?: string | null;
}) {
  return executeStatement("UPDATE pejabat SET nama = ?, jabatan = ?, jenis_kelamin = ?, color = ? WHERE id = ?", [
    input.nama.trim(),
    input.jabatan?.trim() || null,
    input.jenis_kelamin?.trim() || null,
    input.color || null,
    input.id,
  ]);
}

export async function deleteOfficial(id: string | number) {
  return executeStatement("DELETE FROM pejabat WHERE id = ?", [id]);
}
