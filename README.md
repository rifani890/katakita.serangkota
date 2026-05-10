# KataKita Next.js

Dashboard monitoring berita Kota Serang berbasis Next.js 14, MySQL, dan Tailwind CSS.

## Ringkasan

Fitur utama yang sekarang tersedia:

- Dashboard publik yang responsif untuk desktop, tablet, dan HP.
- Chart pejabat dengan prioritas urutan:
  `Walikota Serang -> Wakil Walikota Serang -> Sekretaris Daerah Kota Serang -> Pejabat Lainnya`
  memakai nilai prioritas numerik 1 sampai 4.
- Pagination, search, dan sorting berita berbasis server-side agar tetap ringan saat data membesar.
- Halaman detail berita publik yang ramah SEO di URL:
  `/berita/[id]/[slug]`.
- Metadata SEO, Open Graph, JSON-LD `NewsArticle`, `robots.txt`, dan `sitemap.xml`.
- Sesi login berbasis cookie `httpOnly`, proteksi route admin, dan redirect otomatis ke root saat sesi habis.
- Panel admin untuk kelola berita, pejabat, unit kerja, dan admin/user.

## Teknologi

- Next.js 14 App Router
- React 18
- Tailwind CSS
- MySQL (`mysql2/promise`)
- Chart.js

## Struktur Penting

- `app/`
  Halaman, route API, sitemap, robots, detail berita SEO, dan komponen admin yang di-co-locate di `app/admin/_components`.
- `components/`
  UI publik yang dipakai lintas halaman.
- `lib/news.ts`
  Query berita, server-side pagination, summary dashboard, dan helper sitemap.
- `lib/server/`
  Helper database, session, auth route guard, dan repository server-side.
- `lib/utils.ts`
  Helper tanggal, slug, excerpt, prioritas pejabat, dan util SEO.
- `types/`
  Tipe data aplikasi.

## SEO yang Ditambahkan

- Metadata global di `app/layout.tsx`
- Metadata halaman beranda di `app/page.tsx`
- Metadata dinamis per berita di `app/berita/[id]/[slug]/page.tsx`
- Structured data `NewsArticle`
- `app/robots.ts`
- `app/sitemap.ts`

Catatan:

- Supaya URL kanonis dan sitemap benar di production, set `NEXT_PUBLIC_SITE_URL`.
- Berita baru akan punya halaman detail SEO yang bisa diindeks Google tanpa perlu halaman statis manual.

## Keamanan

Perubahan keamanan yang sudah diterapkan:

- login admin sekarang membuat sesi cookie `httpOnly`
- route `/admin/*` diproteksi oleh `middleware.ts`
- route admin sensitif seperti `kelola-admin` hanya bisa diakses role `admin`
- API tulis/hapus master data dan berita sekarang memerlukan sesi login
- sesi akan diarahkan kembali ke root `/` saat hilang atau kedaluwarsa
- header keamanan dasar ditambahkan di `next.config.mjs`

## Pagination dan Performa

Sebelum perapihan, daftar berita banyak diproses di browser. Sekarang:

- daftar berita publik memakai `GET /api/berita?page=...`
- daftar berita admin memakai `GET /api/berita?page=...`
- pencarian, sort, dan pagination dilakukan di server
- halaman detail filter juga mengambil data per halaman dari server
- `sitemap.xml` dibuat dinamis

Untuk data ribuan sampai besar, pendekatan ini jauh lebih ringan di browser.

Jika data tumbuh sampai sangat besar sekali:

- pertahankan pagination server-side
- pertimbangkan index database di kolom `created_at`, `tanggal_converted`, `potensi`, `media`
- pertimbangkan summary table/materialized aggregation untuk chart yang sangat besar

## Variabel Environment

Saat ini proyek membaca:

```env
DB_HOST=
DB_PORT=
DB_USER=
DB_PASS=
DB_NAME=
DB_SOCKET=
DB_CONNECTION_LIMIT=
NEXT_PUBLIC_SITE_URL=
SITE_URL=
AUTH_SECRET=
```

Minimal untuk production:

```env
DB_HOST=
DB_PORT=
DB_USER=
DB_PASS=
DB_NAME=
NEXT_PUBLIC_SITE_URL=
AUTH_SECRET=
```

## Menjalankan Proyek

1. Install dependency

```bash
npm install
```

2. Pastikan MySQL aktif, database sudah tersedia, dan variabel environment sudah sesuai.

3. Jalankan development server

```bash
npm run dev
```

4. Build production

```bash
npm run build
```

5. Jalankan lint

```bash
npm run lint
```

## Endpoint Penting

- `GET /api/dashboard/summary`
  Summary statistik dashboard dan data chart.
- `GET /api/auth/session`
  Validasi sesi aktif saat ini.
- `GET /api/berita`
  List berita dengan mode pagination server-side.
- `GET /api/berita/[id]`
  Detail satu berita.
- `POST /api/berita`
  Tambah berita.
- `PUT /api/berita`
  Ubah berita.
- `DELETE /api/berita?id=...`
  Hapus berita.

## Perubahan Besar yang Sudah Dirapikan

- Menghapus duplikasi endpoint berita lama `/api/news`
- Menghapus hook yang tidak terpakai:
  `lib/useSQLData.ts`, `lib/useSQLAdmin.ts`
- Memindahkan komponen admin dari `components/admin` ke `app/admin/_components`
- Mengganti helper database lama menjadi `lib/server/database.ts`
- Menambahkan repository server-side agar logika query lebih mudah dibaca
- Menyederhanakan `AdminBeritaClient` agar fokus ke listing
- Mengoptimalkan `AdminBeritaCMSClient` agar saat edit hanya mengambil satu berita
- Menambahkan tampilan kartu mobile untuk halaman admin yang sebelumnya sangat desktop-first
- Menghapus artefak seed/test dan file contoh yang tidak dibutuhkan runtime aplikasi

## Catatan Database

Aplikasi mengasumsikan tabel-tabel utama berikut tersedia:

- `berita`
- `pejabat`
- `unit_kerja`
- `media`
- `users`

Beberapa fitur akan tetap build meski database tidak aktif saat build, tetapi data dinamis tentu membutuhkan koneksi database saat runtime.
