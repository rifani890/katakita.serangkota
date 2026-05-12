# Product Requirements Document (PRD) - Testing Phase
## Project: KataKita Dashboard Kota Serang

### 1. Overview
Dokumen ini disusun untuk pengujian aplikasi KataKita dengan fokus utama pada **Responsivitas Antarmuka (UI/UX)** dan **Keamanan Sistem (Security)** sebelum dilakukan deployment ke tahap produksi.

---

### 2. Fokus Pengujian: Responsivitas (Responsiveness)
Tujuan: Memastikan dashboard dapat diakses dengan nyaman di berbagai perangkat (Mobile, Tablet, Desktop).

#### 2.1. Komponen Utama
*   **Navigation Bar (Navbar)**:
    *   Logo dan teks "KataKita Kota Serang" tidak boleh terpotong di layar kecil.
    *   Tombol toggle tema (Dark/Light) harus mudah diklik di mobile.
*   **StatCards (Kartu Statistik)**:
    *   Layout harus berubah dari 4 kolom (Desktop) menjadi 2 kolom (Tablet) dan 1 kolom (Mobile).
    *   Animasi hover harus tetap halus tanpa menyebabkan layout shifting.
*   **Charts (Grafik Pejabat & Tren)**:
    *   Kedua grafik harus sejajar sempurna di desktop.
    *   Di mobile, grafik harus menumpuk secara vertikal (stacking) dengan margin yang konsisten.
    *   Dropdown "Mingguan/Bulanan" tidak boleh meluap (overflow) ke luar layar.
*   **NewsList (Daftar Berita)**:
    *   **Pagination**: Di tampilan HP, tombol angka harus berada di tengah, dan selector "Tampilkan 10, 20..." harus berada di bawahnya secara rapi.
    *   Tabel berita harus menggunakan mekanisme *scroll horizontal* atau *card-view* di layar sangat kecil.

---

### 3. Fokus Pengujian: Keamanan (Security)
Tujuan: Melindungi integritas data dan memastikan akses hanya diberikan kepada pihak yang berwenang.

#### 3.1. Autentikasi & Otorisasi
*   **Session Management**: Memastikan token JWT/Session terlindungi dengan `httpOnly` dan `secure` cookies.
*   **Admin Route Protection**: Semua route `/admin` dan API `/api/admin/*` wajib dicek melalui middleware atau server-side check (NextAuth `getServerSession`).
*   **Role Validation**: Memastikan user dengan role non-admin tidak dapat mengakses fungsi penghapusan atau edit berita.

#### 3.2. Keamanan Data & API
*   **SQL Injection Prevention**: Memastikan semua query ke database menggunakan parameterized queries (sudah dihandle oleh Prisma/ORM).
*   **Cross-Site Scripting (XSS)**: Memastikan input judul dan isi berita disanitasi sebelum dirender (Next.js secara default meng-escape teks).
*   **API Rate Limiting**: Memastikan endpoint pencarian tidak dapat dibombardir oleh bot (DDoS prevention).
*   **Environment Variables**: Memastikan tidak ada rahasia (DB URL, NextAuth Secret) yang bocor ke sisi client (hanya gunakan prefix `NEXT_PUBLIC_` untuk yang aman bagi client).

---

### 4. Skenario Pengujian (Test Cases)
| ID | Kategori | Skenario | Hasil yang Diharapkan |
|:---|:---|:---|:---|
| R-01 | Responsivitas | Buka dashboard di iPhone 12/13 (Chrome DevTools) | Pagination rapi di tengah, selector di bawahnya. |
| R-02 | Responsivitas | Hover StatCards di Light Mode | Muncul warna latar belakang yang jelas sesuai aksen. |
| S-01 | Keamanan | Akses langsung ke `/admin` tanpa login | Redirect otomatis ke halaman login atau root. |
| S-02 | Keamanan | Mencoba POST ke `/api/berita` tanpa session | Mengembalikan Error 401 Unauthorized. |
| S-03 | Keamanan | Input script `<script>alert(1)</script>` di search | Script dirender sebagai teks literal, bukan dieksekusi. |

---

### 5. Penutup
Setiap temuan (bug) terkait responsivitas dan keamanan harus segera dilaporkan dan diperbaiki sebelum siklus sprint ini berakhir.
