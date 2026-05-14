export interface BeritaRow {
  id: number;
  judul: string;
  isi: string;
  media?: string | null;
  pejabat?: string | null;
  potensi?: "Positif" | "Netral" | "Negatif" | string;
  unit?: string | null;
  tanggal_raw?: number | null;
  tanggal_converted?: string | null;
  user_email?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}
