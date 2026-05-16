# KataKita Kota Serang — News Monitoring Dashboard

Dashboard pemantauan berita media cetak modern untuk Pemerintah Kota Serang, dibangun dengan **Next.js 14**, **Tailwind CSS**, dan **MySQL**. Dirancang untuk memberikan wawasan cepat mengenai tren media, sentimen publik, dan keterlibatan pejabat secara _real-time_.

---

## ✨ Fitur Utama

| Modul                                  | Deskripsi                                                                                      |
| -------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 📊 **Dashboard Publik**                | Statistik ringkas, grafik interaktif, daftar berita 2 kolom                                    |
| 🗞️ **Halaman Detail Berita**           | Daftar penuh dengan penomoran No.01, sortir, search, pagination                                |
| 📈 **Tren Media (Line Chart)**         | Filter Mingguan/Bulanan — klik titik untuk filter berita                                       |
| 🥧 **Proporsi Pejabat (Pie Chart)**    | Klik segmen untuk filter berita per pejabat                                                    |
| 🌟 **Influencer Internal (Bar Chart)** | Grafik berita per Pejabat/Tokoh mingguan, tersinkronisasi presisi dengan halaman detail berita |
| 🔐 **Admin Panel**                     | CRUD berita, pejabat, unit kerja, media, tokoh (role-based)                                    |
| 📻 **Kelola Media & Tokoh**            | Tambah/edit/hapus media & nama tokoh (khusus Admin)                                            |
| 🖨️ **Cetak Berita**                    | Print-friendly layout langsung dari modal atau halaman detail dengan informasi tokoh lengkap   |
| 🌙 **Dark Mode**                       | Toggle tema gelap/terang                                                                       |
| 📱 **Responsif**                       | Adaptif untuk Desktop, Tablet, dan Mobile (backdrop overlay menu)                              |
| ⬅️ **Navigasi Back/Forward**           | Tombol back/forward browser mempertahankan halaman & scroll position                           |

---

## 🛠️ Teknologi

- **Framework**: Next.js 14 (App Router, SSR + Client Components)
- **Styling**: Tailwind CSS + Lucide Icons
- **Charts**: Chart.js dengan plugin interaktif
- **Database**: MySQL (Railway Cloud) via `mysql2`
- **Auth**: Session Cookie (HttpOnly + Secure)
- **Language**: TypeScript

---

## 📂 Struktur Proyek

```
katakita.serangkota/
├── app/
│   ├── admin/                  # Admin panel (protected)
│   │   ├── _components/        # Komponen admin (nama singkat)
│   │   │   ├── Layout.tsx      # Sidebar + navbar admin
│   │   │   ├── BeritaCMS.tsx   # Editor berita (Rich Text)
│   │   │   ├── Berita.tsx      # Tabel kelola berita
│   │   │   ├── Dashboard.tsx   # Halaman utama admin
│   │   │   ├── KelolaAdmin.tsx # Manajemen akun admin
│   │   │   ├── Media.tsx       # Kelola media (admin only)
│   │   │   ├── Pejabat.tsx     # Kelola pejabat
│   │   │   ├── Tokoh.tsx       # Kelola nama tokoh
│   │   │   ├── Unit.tsx        # Kelola unit kerja
│   │   │   └── UI.tsx          # Komponen UI bersama (modal, confirm, dll)
│   │   ├── berita/             # Halaman daftar & editor berita
│   │   ├── kelola-admin/       # Manajemen akun
│   │   ├── media/              # Halaman kelola media
│   │   ├── pejabat/            # Halaman kelola pejabat
│   │   ├── tokoh/              # Halaman kelola tokoh
│   │   └── unit-kerja/         # Halaman kelola unit
│   ├── api/                    # Server-side API endpoints
│   │   ├── auth/               # Login, session, logout
│   │   ├── berita/             # CRUD berita & filter dinamis
│   │   ├── media/              # CRUD media
│   │   ├── pejabat/            # CRUD pejabat
│   │   ├── tokoh/              # CRUD nama tokoh
│   │   └── unit/               # CRUD unit kerja
│   └── berita/[id]/[slug]/     # Halaman publik berita (SSR + SEO)
├── components/                 # Komponen halaman publik
│   ├── DashboardClient.tsx     # Orkestrator utama halaman publik
│   ├── DetailPage.tsx          # Daftar berita detail + penomoran
│   ├── NewsList.tsx            # Grid 2-kolom berita terbaru
│   ├── TrendChart.tsx          # Grafik tren media (line)
│   ├── OfficialChart.tsx       # Grafik proporsi pejabat (pie)
│   ├── HeroSection.tsx         # Bagian hero atas
│   ├── StatCards.tsx           # Kartu statistik
│   ├── Navbar.tsx              # Navigasi atas
│   ├── NewsModal.tsx           # Modal detail berita
│   ├── LoginModal.tsx          # Modal login
│   └── ScrollToTopButton.tsx   # Tombol kembali ke atas
├── lib/
│   ├── server/
│   │   ├── database.ts         # Koneksi MySQL pool
│   │   ├── session.ts          # Manajemen token sesi
│   │   └── repositories/       # Fungsi query DB (catalog, news, user)
│   ├── fetchWithAuth.ts        # Fetch wrapper dengan otentikasi
│   ├── news.ts                 # Logika pemrosesan & query berita
│   ├── print.ts                # Fungsi cetak berita
│   ├── useAuth.ts              # Custom hook manajemen sesi
│   ├── useDashboardSummary.ts  # Hook agregasi data dashboard
│   └── utils.ts                # Fungsi utilitas (format, normalisasi)
├── types/
│   └── index.ts                # Definisi tipe TypeScript
├── middleware.ts               # Route guard /admin
└── public/                     # Aset statis (logo, favicon)
```

---

## 🚀 Instalasi Lokal

### Prasyarat (Tools & Library)

Sebelum memulai instalasi, pastikan sistem Anda telah terpasang _tools_ berikut:

1. **Node.js** (Versi 18.x atau yang lebih baru) - [Unduh Node.js](https://nodejs.org/)
2. **NPM** atau **Yarn** (Biasanya sudah termasuk di dalam instalasi Node.js)
3. **Database MySQL** (Versi 5.7+ atau 8.x) - [Unduh MySQL](https://dev.mysql.com/downloads/mysql/) atau Anda bisa menggunakan XAMPP/MAMP.
4. **Git** - [Unduh Git](https://git-scm.com/)

Saat Anda menjalankan perintah `npm install` nanti, paket/library utama (_dependencies_) yang akan dipasang meliputi:

- `next` (v14.2.5) & `react` (v18)
- `mysql2` (Driver database)
- `bcryptjs` (Enkripsi password)
- `chart.js` & `react-chartjs-2` (Untuk merender grafik dashboard)
- `lucide-react` (Koleksi ikon)
- `tailwindcss` (Framework CSS)

---

### 1. Clone & Install

```bash
git clone https://github.com/username/katakita.serangkota.git
cd katakita.serangkota
npm install
```

### 2. Konfigurasi Environment

Buat file `.env.local` di _root_ folder:

```env
DB_HOST=localhost
DB_USER=root
DB_PASS=password_anda
DB_NAME=katakita_db
DB_PORT=3306
AUTH_SECRET=isi_dengan_string_acak_minimal_32_karakter
NEXT_PUBLIC_SITE_URL=https://domain-anda.com
```

Generate `AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. File yang Harus Dikonfigurasi Saat Ganti Domain

Jika mengganti domain produksi, update URL di file-file berikut:

| No  | File                 | Yang Diubah                                               |
| --- | -------------------- | --------------------------------------------------------- |
| 1   | `.env.local`         | `NEXT_PUBLIC_SITE_URL=https://domain-baru.com`            |
| 2   | `.env.production`    | `NEXT_PUBLIC_SITE_URL=https://domain-baru.com`            |
| 3   | `lib/utils.ts`       | Baris 56: `DEFAULT_SITE_URL = "https://domain-baru.com"`  |
| 4   | `next.config.mjs`    | Baris 48: `destination: "https://domain-baru.com/:path*"` |
| 5   | `lib/server/cors.ts` | Baris 4: fallback URL di `ALLOWED_ORIGINS`                |

File yang **tidak perlu diubah** (otomatis baca dari `NEXT_PUBLIC_SITE_URL`):
`app/layout.tsx`, `app/robots.ts`, `app/sitemap.ts`, `lib/server/session.ts`, `lib/server/csrf.ts`

Cari semua URL hardcode:

```bash
grep -rn "katakita-serangkota.vercel.app" --include="*.ts" --include="*.tsx" --include="*.mjs" --include="*.env*" .
```

### 4. Jalankan Server Pengembangan

```bash
npm run dev
```

Buka `http://localhost:3000`

---

## 🌍 Deployment

> Panduan lengkap tersedia di file `DEPLOYMENT.md`

### VPS dengan PM2 + Nginx

```bash
# Clone, install, konfigurasi
git clone https://github.com/username/katakita.serangkota.git
cd katakita.serangkota
npm install
nano .env.production   # isi environment variables

# Build & jalankan
npm run build
npm install -g pm2
pm2 start npm --name "katakita" -- run start
pm2 startup && pm2 save
```

Konfigurasi Nginx:

```nginx
server {
    listen 80;
    server_name domain-anda.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name domain-anda.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

SSL dengan Certbot:

```bash
sudo certbot --nginx -d domain-anda.com
```

---

## 🔒 Keamanan

- **Route Guard**: Middleware Next.js memproteksi semua rute `/admin`
- **Auto-Logout**: Sesi otomatis diputus setelah 5 menit tidak aktif
- **Cookie HttpOnly + Secure**: Token sesi tidak bisa diakses oleh JavaScript (XSS protection)
- **Parameterized Queries**: Semua query menggunakan parameter binding (SQL Injection protection)
- **Role-Based Access**: Menu dan endpoint tertentu hanya dapat diakses oleh `admin`
- **Cross-Tab Sync**: Logout di satu tab mematikan sesi di semua tab
- **Data Sensitif**: File `.env.local` dan `*.sql`

---

## 👥 Role Pengguna

| Role         | Berita | Pejabat | Unit Kerja | Media | Kelola Admin |
| ------------ | ------ | ------- | ---------- | ----- | ------------ |
| **Publik**   | Baca   | -       | -          | -     | -            |
| **Operator** | CRUD   | CRUD    | CRUD       | -     | -            |
| **Admin**    | CRUD   | CRUD    | CRUD       | CRUD  | CRUD         |

---

## 📝 Catatan Perubahan Terbaru (v1.2.0)

- ✅ **Kelola Media**: Halaman baru untuk admin mengelola daftar media + color picker
- ✅ **Penomoran Berita**: Nomor urut No.01, No.02 di halaman detail (lintas halaman)
- ✅ **Grid 2 Kolom**: Daftar berita tampil 2 kolom di layar Desktop
- ✅ **Navigasi Back/Forward**: Tombol back/forward browser berfungsi penuh + scroll position
- ✅ **Penamaan File Lebih Singkat**: Komponen admin dipersingkat (mis: `AdminBeritaClient.tsx` → `Berita.tsx`)
- ✅ **Color Picker**: Input warna menggunakan native color picker + text input HEX
- ✅ **Ekspor Database**: File `data.sql`

---
