# KataKita Kota Serang — News Monitoring Dashboard

Dashboard pemantauan berita media cetak modern untuk Pemerintah Kota Serang, dibangun dengan **Next.js 14**, **Tailwind CSS**, dan **MySQL (Railway)**. Dirancang untuk memberikan wawasan cepat mengenai tren media, sentimen publik, dan keterlibatan pejabat secara *real-time*.

> **Status:** ✅ Lulus Pengujian Penuh (23/23) — Siap Produksi  
> Lihat laporan lengkap di [PRD.md](./PRD.md)

---

## ✨ Fitur Utama

| Modul | Deskripsi |
|-------|-----------|
| 📊 **Dashboard Publik** | Statistik ringkas, grafik interaktif, daftar berita 2 kolom |
| 🗞️ **Halaman Detail Berita** | Daftar penuh dengan penomoran No.01, sortir, search, pagination |
| 📈 **Tren Media (Line Chart)** | Filter Mingguan/Bulanan — klik titik untuk filter berita |
| 🥧 **Proporsi Pejabat (Pie Chart)** | Klik segmen untuk filter berita per pejabat |
| 🔐 **Admin Panel** | CRUD berita, pejabat, unit kerja, media (role-based) |
| 📻 **Kelola Media** | Tambah/edit/hapus media + color picker (khusus Admin) |
| 🖨️ **Cetak Berita** | Print-friendly layout langsung dari modal atau halaman detail |
| 🌙 **Dark Mode** | Toggle tema gelap/terang |
| 📱 **Responsif** | Adaptif untuk Desktop, Tablet, dan Mobile |
| ⬅️ **Navigasi Back/Forward** | Tombol back/forward browser mempertahankan halaman & scroll position |

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
│   │   │   ├── Unit.tsx        # Kelola unit kerja
│   │   │   └── UI.tsx          # Komponen UI bersama (modal, confirm, dll)
│   │   ├── berita/             # Halaman daftar & editor berita
│   │   ├── kelola-admin/       # Manajemen akun
│   │   ├── media/              # Halaman kelola media
│   │   ├── pejabat/            # Halaman kelola pejabat
│   │   └── unit-kerja/         # Halaman kelola unit
│   ├── api/                    # Server-side API endpoints
│   │   ├── auth/               # Login, session, logout
│   │   ├── berita/             # CRUD berita
│   │   ├── media/              # CRUD media
│   │   ├── pejabat/            # CRUD pejabat
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

### 1. Clone & Install

```bash
git clone https://github.com/username/katakita.serangkota.git
cd katakita.serangkota
npm install
```

### 2. Konfigurasi Environment

Buat file `.env.local` di *root* folder:

```env
# Database (Railway atau lokal)
DB_HOST=localhost
DB_USER=root
DB_PASS=password_anda
DB_NAME=railway
DB_PORT=3306

# Atau gunakan URL lengkap
MYSQL_URL=mysql://user:pass@host:port/database

# Kunci enkripsi sesi — WAJIB diisi di produksi!
# Generate dengan: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
AUTH_SECRET=isi_dengan_string_acak_minimal_32_karakter
```

> [!IMPORTANT]
> **`AUTH_SECRET` wajib diisi saat deploy ke server produksi.**
> Jika tidak diisi, aplikasi akan menggunakan kunci default `dev-only-change-me` yang lemah dan tidak aman.
> Gunakan perintah berikut untuk membuat kunci acak yang kuat:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```


### 3. Jalankan Server Pengembangan

```bash
npm run dev
```

Buka `http://localhost:3000`

---

## 🌍 Deployment

### Opsi A: cPanel (Setup Node.js App)

> *Syarat: Paket hosting harus mendukung fitur "Setup Node.js App" atau "Phusion Passenger"*

1. Build di lokal:
   ```bash
   npm run build
   ```
2. *Zip* seluruh proyek (sertakan `.next/`, **kecuali** `node_modules/`, `.git/`, `.env.local`)
3. Upload & ekstrak di folder baru di cPanel (bukan `public_html`)
4. Buat file `.env.local` di server dan isi konfigurasi database
5. Di cPanel → **Setup Node.js App** → Create Application:
   - Node.js version: `18.x` atau `20.x`
   - Application mode: `Production`
   - Application root: nama folder yang dibuat
   - Application startup file: `server.js`
6. Klik **Run NPM Install** → **Start App**

### Opsi B: VPS dengan PM2 (Disarankan)

```bash
# 1. Clone & install
git clone https://github.com/username/katakita.serangkota.git
cd katakita.serangkota
npm install

# 2. Buat .env.local dan konfigurasi
nano .env.local

# 3. Build
npm run build

# 4. Install PM2 dan jalankan
npm install -g pm2
pm2 start npm --name "katakita" -- run start
pm2 startup   # Agar otomatis jalan saat server restart
pm2 save
```

**Konfigurasi Nginx (Reverse Proxy):**

```nginx
server {
    listen 80;
    server_name katakita.serangkota.go.id;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Pasang HTTPS dengan Certbot:
```bash
sudo certbot --nginx -d katakita.serangkota.go.id
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

| Role | Berita | Pejabat | Unit Kerja | Media | Kelola Admin |
|------|--------|---------|-----------|-------|-------------|
| **Publik** | Baca | - | - | - | - |
| **Operator** | CRUD | CRUD | CRUD | - | - |
| **Admin** | CRUD | CRUD | CRUD | CRUD | CRUD |

---

## 📤 Ekspor Database

Untuk backup database:

```bash
# Menggunakan mysqldump (jika tersedia)
mysqldump -h turntable.proxy.rlwy.net -P 34692 -u root -p railway > backup.sql

# Atau gunakan script Node.js yang sudah tersedia
node -e "require('mysqldump')({connection:{...}, dumpToFile:'backup.sql'})"
```

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

*Dikembangkan oleh Diskominfo Kota Serang © 2026 KataKita*
