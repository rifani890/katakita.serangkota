# KataKita Kota Serang - News Dashboard

Dashboard monitoring berita modern untuk Pemerintah Kota Serang yang dibangun menggunakan **Next.js 14**, **Tailwind CSS**, dan **MySQL**. Aplikasi ini dirancang untuk memberikan wawasan cepat mengenai tren media, sentimen publik, dan keterlibatan pejabat secara *real-time*.

## ✨ Fitur Utama & Keunggulan

### 1. Visual & Premium Dashboard
- **Dynamic Glassmorphism**: Antarmuka bersih dengan efek kaca transparan dan *mesh gradients* yang memberikan kesan premium dan modern.
- **Interactive StatCards**: Kartu statistik dengan animasi *glow* dan perubahan warna latar belakang dinamis berdasarkan kategori (Indigo, Teal, Zinc, Rose) saat di-*hover*.
- **Sentiment Icons**: Visualisasi sentimen yang intuitif menggunakan set ikon wajah (*Smile-beam*, *Meh*, *Frown-open*) untuk memudahkan identifikasi suasana berita.

### 2. Analisis Tren yang Akurat
- **Synchronized Charts**: Grafik tren media cetak yang mendukung filter **Mingguan** dan **Bulanan** dengan sinkronisasi data yang presisi.
- **Timezone-Aware Filtering**: Logika filter tanggal yang dioptimalkan untuk zona waktu lokal (WIB), memastikan data di awal/akhir periode tetap terekam dengan benar.
- **Interactive Data Points**: Klik pada titik grafik untuk langsung melihat daftar berita terfilter untuk media dan periode tersebut.

### 3. Pengalaman Pengguna (UX) yang Konsisten
- **Unified Pagination**: Sistem navigasi halaman yang terstandarisasi (terpusat/centered) dengan selector jumlah baris (10, 20, 50, 100) di seluruh halaman dashboard dan detail.
- **Responsive Design**: Tata letak yang adaptif sepenuhnya untuk Desktop, Tablet, hingga Smartphone, termasuk penyesuaian otomatis grafik dan tabel berita.
- **Sentiment Badges**: Label sentimen berbentuk *pill* (lonjong) dengan *border* tipis yang seragam untuk keterbacaan yang lebih baik.

### 4. Performa & SEO
- **Server-Side Processing**: Pagination, pencarian, dan pengurutan dilakukan di sisi server (MySQL) menggunakan query yang dioptimalkan (Full-Text Search jika tersedia).
- **SEO Ready**: URL ramah SEO (`/berita/[id]/[slug]`), Metadata dinamis, Open Graph, JSON-LD NewsArticle, sitemap.xml, dan robots.txt otomatis.

## 🛠️ Teknologi Utama

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS & Lucide Icons
- **Chart**: Chart.js with Interactive Plugins
- **Database**: MySQL with Connection Pooling
- **Auth**: Secure Cookie-based Authentication

## 📂 Struktur Penting

- `app/`: Routing, API Handlers, dan Admin Components.
- `components/`: UI Publik (Navbar, StatCards, TrendChart, NewsList, dll).
- `lib/news.ts`: Logika inti query berita, server-side pagination, dan agregasi statistik.
- `lib/utils.ts`: Helper untuk format tanggal lokal, normalisasi peran pejabat, dan SEO.

## 🚀 Instalasi & Pengembangan

1. **Clone & Install**
   ```bash
   git clone https://github.com/username/katakita.serangkota.git
   npm install
   ```

2. **Konfigurasi Environment**
   Buat file `.env` dan sesuaikan variabel berikut:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=
   DB_NAME=katakita
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   AUTH_SECRET=rahasia_anda
   ```

3. **Jalankan Aplikasi**
   ```bash
   npm run dev
   ```

## 🛠️ Panduan Kustomisasi & Pengembangan

### 1. Merubah Tampilan (UI Styling)
Dashboard ini dibangun dengan sistem desain berbasis **Tailwind CSS**. Untuk merubah tampilan:
- **Warna Aksen**: Edit `tailwind.config.ts` untuk merubah palet warna global atau langsung ubah kelas warna pada komponen (misal: `indigo-600`, `teal-500`).
- **Efek Glassmorphism**: Gunakan kelas `backdrop-blur-md` dan kombinasi `bg-white/90` (light) atau `bg-dark-card/90` (dark).
- **Animasi Hover**: Interaksi kartu statistik dikelola di `components/StatCards.tsx` menggunakan objek `hoverBgMap`. Ubah nilai di sana untuk mengganti intensitas warna hover.
- **Iconography**: Ikon menggunakan **Lucide React** dan **FontAwesome** (untuk wajah sentimen). Anda bisa mengganti ikon di masing-masing file komponen.

### 2. Pengelolaan Database
Aplikasi ini berinteraksi langsung dengan database MySQL melalui `lib/server/database.ts`.
- **Menambah Kolom**: Jika Anda menambah kolom di tabel `berita`, pastikan untuk memperbarui interface `NewsDbRow` dan fungsi `mapNewsRow` di `lib/news.ts`.
- **Mapping Pejabat & Media**: 
    - Daftar pejabat dikelola melalui `OfficialMapping` di `lib/utils.ts`. 
    - Logika normalisasi nama media berada di fungsi `normMedia` dan `buildMediaMapping` di `lib/news.ts`.
- **Optimasi Query**: Fitur pencarian menggunakan MySQL **Full-Text Search**. Pastikan index FTS terpasang pada kolom `judul, isi, media, pejabat, unit` untuk performa maksimal.

## 🔒 Keamanan
- **Route Guard**: Middleware Next.js untuk memproteksi akses ke area `/admin`.
- **Session Security**: Cookie `httpOnly` dan `secure` untuk menjaga integritas sesi.
- **XSS & SQLi Protection**: Sanitasi input otomatis dan *parameterized queries* melalui ORM/Database helper.

---

*Dikembangkan oleh Diskominfo Kota Serang &copy; 2026 KataKita.*
