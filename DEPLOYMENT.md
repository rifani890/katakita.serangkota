# 🚀 Panduan Deployment — KataKita Kota Serang

> Dokumen ini menjelaskan cara mengkonfigurasi dan mendeploy aplikasi KataKita Kota Serang ke berbagai platform hosting produksi.

---

## 📋 Prasyarat

Sebelum deployment, pastikan:

- [x] Node.js **v18+** terinstal
- [x] Database **MySQL 8.0+** sudah siap (lokal atau cloud)
- [x] File `.env.production` sudah dikonfigurasi
- [x] `npm run build` berhasil tanpa error
- [x] Security hardening sudah diterapkan (lihat `security.md`)

---

## 🔐 Konfigurasi Environment Variables

Buat atau edit file `.env.production` di root project:

```env
# === URL Publik Aplikasi ===
NEXT_PUBLIC_SITE_URL=https://domain-anda.com

# === Database MySQL ===
DB_HOST=host-database-anda
DB_USER=username_database
DB_PASS=password_database_anda
DB_NAME=nama_database
DB_PORT=3306

# === Auth Secret (wajib unik & acak) ===
# Generate dengan: openssl rand -base64 32
AUTH_SECRET=ganti_dengan_secret_acak_anda
```

> ⚠️ **PENTING**: Jangan pernah commit file `.env.production` yang berisi credentials asli ke Git. File ini sudah ada di `.gitignore`.

### Cara Generate AUTH_SECRET

```bash
# Linux/macOS
openssl rand -base64 32

# Atau dengan Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 🔗 Daftar File yang Mengandung URL Domain

Saat mengganti domain produksi (misalnya dari `https://katakita-serangkota.vercel.app` ke domain baru), Anda **wajib** mengupdate URL di file-file berikut:

### File yang HARUS diubah

| No  | File                 | Baris                                    | Keterangan                                        |
| --- | -------------------- | ---------------------------------------- | ------------------------------------------------- |
| 1   | `.env.local`         | `NEXT_PUBLIC_SITE_URL=...`               | URL untuk development (bisa tetap atau sesuaikan) |
| 2   | `.env.production`    | `NEXT_PUBLIC_SITE_URL=...`               | **URL domain produksi** — ini yang paling penting |
| 3   | `lib/utils.ts`       | Baris 56: `DEFAULT_SITE_URL`             | Fallback URL jika env variable tidak tersedia     |
| 4   | `next.config.mjs`    | Baris 48: `destination` di `redirects()` | Target redirect HTTP → HTTPS                      |
| 5   | `lib/server/cors.ts` | Baris 4: `ALLOWED_ORIGINS`               | Daftar origin yang diizinkan untuk CORS           |

### Cara cepat menemukan semua URL hardcode

```bash
# Jalankan dari root project
grep -rn "katakita-serangkota.vercel.app" --include="*.ts" --include="*.tsx" --include="*.mjs" --include="*.env*" .
```

### Penjelasan tiap file

#### 1. `.env.local` dan `.env.production`

```env
# Ganti URL ini sesuai domain baru
NEXT_PUBLIC_SITE_URL=https://domain-baru-anda.com
```

File `.env.local` digunakan saat development, `.env.production` digunakan saat build production. Variable `NEXT_PUBLIC_SITE_URL` dibaca oleh metadata (canonical URL, OpenGraph, sitemap, robots.txt).

#### 2. `lib/utils.ts` — DEFAULT_SITE_URL

```typescript
// Baris 56 — ganti URL fallback
export const DEFAULT_SITE_URL = "https://domain-baru-anda.com";
```

Ini adalah fallback jika `NEXT_PUBLIC_SITE_URL` tidak diset. Digunakan oleh fungsi `getSiteUrl()` yang dipanggil di `layout.tsx`, `robots.ts`, dan `sitemap.ts`.

#### 3. `next.config.mjs` — HTTPS Redirect

```javascript
// Di dalam async redirects() — ganti destination URL
destination: "https://domain-baru-anda.com/:path*",
```

Ini memaksa semua request HTTP redirect ke HTTPS di production.

#### 4. `lib/server/cors.ts` — CORS Allowed Origins

```typescript
// Baris 4 — ganti fallback origin
const ALLOWED_ORIGINS = [process.env.NEXT_PUBLIC_SITE_URL || "https://domain-baru-anda.com"].filter(
  Boolean
);
```

Mengontrol origin mana yang diizinkan mengakses API. Jika `NEXT_PUBLIC_SITE_URL` sudah diset di environment, file ini **tidak perlu diubah** karena membaca dari env variable.

### File yang TIDAK perlu diubah (membaca dari env variable)

File-file berikut otomatis menggunakan URL dari `NEXT_PUBLIC_SITE_URL`, jadi **tidak perlu diedit manual**:

| File                    | Fungsi                                        |
| ----------------------- | --------------------------------------------- |
| `app/layout.tsx`        | Metadata `metadataBase`, canonical, OpenGraph |
| `app/robots.ts`         | URL sitemap di robots.txt                     |
| `app/sitemap.ts`        | URL berita di sitemap.xml                     |
| `lib/server/session.ts` | Deteksi HTTPS untuk secure cookie             |
| `lib/server/csrf.ts`    | Deteksi HTTPS untuk secure CSRF cookie        |

---

## 🌐 Opsi Deployment

### Opsi 1: Vercel (Rekomendasi)

Vercel adalah platform resmi dari pembuat Next.js. Paling mudah dan optimal.

#### Langkah-langkah:

1. **Push ke GitHub/GitLab**

   ```bash
   git add .
   git commit -m "Production ready"
   git push origin main
   ```

2. **Hubungkan ke Vercel**
   - Buka [vercel.com](https://vercel.com) dan login
   - Klik **"Add New Project"**
   - Import repository dari GitHub/GitLab
   - Pilih branch `main`

3. **Set Environment Variables di Vercel**
   - Buka **Settings → Environment Variables**
   - Tambahkan semua variabel berikut:

   | Variable               | Value                                         | Environment |
   | ---------------------- | --------------------------------------------- | ----------- |
   | `NEXT_PUBLIC_SITE_URL` | `https://domain-anda.com`                     | Production  |
   | `DB_HOST`              | Host MySQL Anda                               | Production  |
   | `DB_USER`              | Username MySQL                                | Production  |
   | `DB_PASS`              | Password MySQL                                | Production  |
   | `DB_NAME`              | Nama database                                 | Production  |
   | `DB_PORT`              | Port MySQL (biasanya `3306`)                  | Production  |
   | `AUTH_SECRET`          | Secret acak (hasil `openssl rand -base64 32`) | Production  |

4. **Deploy**
   - Klik **Deploy** — Vercel akan otomatis build dan deploy
   - Setelah selesai, aplikasi akan tersedia di URL Vercel

5. **Custom Domain (Opsional)**
   - Buka **Settings → Domains**
   - Tambahkan domain kustom Anda
   - Ikuti instruksi DNS (biasanya tambah CNAME record)

#### Konfigurasi DNS untuk Custom Domain:

```
Type: CNAME
Name: @ atau subdomain
Value: cname.vercel-dns.com
TTL: 3600
```

---

### Opsi 2: VPS / Server Sendiri (Ubuntu/Debian)

Cocok untuk server milik Diskominfo atau hosting mandiri.

#### A. Persiapan Server

```bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Install Nginx (Reverse Proxy)
sudo apt install -y nginx

# Install Certbot (SSL/HTTPS)
sudo apt install -y certbot python3-certbot-nginx
```

#### B. Upload & Build Aplikasi

```bash
# Clone repository ke server
cd /var/www
git clone https://github.com/username/katakita-serangkota.git
cd katakita-serangkota

# Install dependencies
npm ci --production=false

# Buat file environment
nano .env.production
# (isi dengan konfigurasi environment variables di atas)

# Build aplikasi
npm run build
```

#### C. Jalankan dengan PM2

```bash
# Start aplikasi
pm2 start npm --name "katakita" -- start

# Auto-restart saat server reboot
pm2 startup
pm2 save

# Cek status
pm2 status
pm2 logs katakita
```

#### D. Konfigurasi Nginx (Reverse Proxy + HTTPS)

Buat file konfigurasi Nginx:

```bash
sudo nano /etc/nginx/sites-available/katakita
```

Isi dengan:

```nginx
server {
    listen 80;
    server_name domain-anda.com www.domain-anda.com;

    # Redirect HTTP ke HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name domain-anda.com www.domain-anda.com;

    # SSL akan dikonfigurasi oleh Certbot
    # ssl_certificate /etc/letsencrypt/live/domain-anda.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/domain-anda.com/privkey.pem;

    # Security Headers tambahan di level Nginx
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # Proxy ke Next.js
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

    # Cache static assets
    location /_next/static {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location /favicon.ico {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=86400";
    }
}
```

Aktifkan konfigurasi:

```bash
# Symlink ke sites-enabled
sudo ln -s /etc/nginx/sites-available/katakita /etc/nginx/sites-enabled/

# Hapus default config (opsional)
sudo rm /etc/nginx/sites-enabled/default

# Test konfigurasi
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### E. Setup SSL dengan Certbot

```bash
# Dapatkan sertifikat SSL gratis dari Let's Encrypt
sudo certbot --nginx -d domain-anda.com -d www.domain-anda.com

# Auto-renew (biasanya sudah otomatis)
sudo certbot renew --dry-run
```

---

### Opsi 3: Docker

Cocok untuk deployment yang konsisten dan portable.

#### Dockerfile

Buat file `Dockerfile` di root project:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

#### docker-compose.yml

```yaml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SITE_URL=https://domain-anda.com
      - DB_HOST=db
      - DB_USER=katakita_user
      - DB_PASS=password_aman_anda
      - DB_NAME=katakita_db
      - DB_PORT=3306
      - AUTH_SECRET=ganti_dengan_secret_acak
      - NODE_ENV=production
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root_password_aman
      MYSQL_DATABASE: katakita_db
      MYSQL_USER: katakita_user
      MYSQL_PASSWORD: password_aman_anda
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"
    restart: unless-stopped

volumes:
  mysql_data:
```

#### Jalankan:

```bash
# Build dan jalankan
docker compose up -d --build

# Cek status
docker compose ps

# Lihat logs
docker compose logs -f app
```

---

## 🗄️ Konfigurasi Database MySQL

### Buat Database & User

```sql
-- Login ke MySQL sebagai root
mysql -u root -p

-- Buat database
CREATE DATABASE katakita_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Buat user khusus (JANGAN pakai root di production!)
CREATE USER 'katakita_user'@'%' IDENTIFIED BY 'password_aman_anda';
GRANT ALL PRIVILEGES ON katakita_db.* TO 'katakita_user'@'%';
FLUSH PRIVILEGES;
```

### Import Struktur Tabel

Jika sudah ada SQL dump:

```bash
mysql -u katakita_user -p katakita_db < backup.sql
```

### MySQL Cloud (Rekomendasi untuk Vercel)

Karena Vercel adalah serverless, Anda memerlukan MySQL cloud yang accessible dari internet:

| Provider                               | Gratis?      | Keterangan                                    |
| -------------------------------------- | ------------ | --------------------------------------------- |
| [Railway](https://railway.app)         | ✅ Free tier | Mudah setup, sudah digunakan saat development |
| [PlanetScale](https://planetscale.com) | ✅ Free tier | MySQL serverless, sangat cepat                |
| [Aiven](https://aiven.io)              | ✅ Free tier | MySQL managed                                 |
| [TiDB Cloud](https://tidbcloud.com)    | ✅ Free tier | MySQL compatible                              |

---

## ✅ Checklist Sebelum Go-Live

Jalankan checklist ini setelah deployment:

```bash
# 1. Pastikan build berhasil
npm run build

# 2. Cek vulnerability
npm audit

# 3. Test endpoint
curl -I https://domain-anda.com
# Pastikan response headers mengandung:
# - Strict-Transport-Security
# - X-Content-Type-Options: nosniff
# - X-Frame-Options: DENY

# 4. Test robots.txt
curl https://domain-anda.com/robots.txt
# Pastikan /admin dan /api/ di-disallow

# 5. Test login rate limiting
# Coba login gagal 5x berturut-turut — harus muncul pesan rate limit

# 6. Test halaman error
# Buka URL yang tidak ada — harus tampil halaman error custom
```

### Verifikasi Security Headers

Buka [securityheaders.com](https://securityheaders.com) dan scan URL produksi Anda.

---

## 🔄 Update / Re-deploy

### Vercel (Otomatis)

```bash
git add .
git commit -m "Update fitur X"
git push origin main
# Vercel otomatis re-deploy
```

### VPS (Manual)

```bash
cd /var/www/katakita-serangkota
git pull origin main
npm ci
npm run build
pm2 restart katakita
```

### Docker

```bash
docker compose down
git pull origin main
docker compose up -d --build
```

---

## 🆘 Troubleshooting

### Build gagal

```bash
# Hapus cache dan rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Database connection error

```bash
# Test koneksi dari server
mysql -h DB_HOST -P DB_PORT -u DB_USER -p DB_NAME

# Pastikan firewall mengizinkan port MySQL
sudo ufw allow 3306
```

### Aplikasi tidak bisa diakses

```bash
# Cek PM2
pm2 status
pm2 logs katakita --lines 50

# Cek Nginx
sudo nginx -t
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log

# Cek port
sudo netstat -tlnp | grep 3000
```

### SSL Certificate expired

```bash
sudo certbot renew
sudo systemctl restart nginx
```

---

## 📞 Kontak & Dukungan

Jika mengalami kendala deployment, hubungi:

- **Tim Pengembang**: Diskominfo Kota Serang
- **Email**: (isi email kontak)

---

_Dokumen ini dibuat untuk kebutuhan deployment aplikasi KataKita Kota Serang ke hosting produksi._
