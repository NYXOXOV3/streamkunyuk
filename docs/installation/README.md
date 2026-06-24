# 📚 Installation Guide — StreamVault

Panduan lengkap installasi dan setup StreamVault dari awal sampai siap production.

---

## 📋 Daftar Isi

| # | Dokumen | Deskripsi |
|---|---------|-----------|
| 1 | [Prasyarat](01-prerequisites.md) | Kebutuhan software, hardware, dan akun |
| 2 | [Localhost](02-localhost.md) | Installasi di Windows/macOS/Linux |
| 3 | [VPS](03-vps.md) | Installasi di VPS (Ubuntu + Nginx + PM2) |
| 4 | [cPanel](04-cpanel.md) | Installasi di cPanel shared hosting |
| 5 | [Database Setup](05-database-setup.md) | Setup Supabase & migrations |
| 6 | [Environment Variables](06-env-configuration.md) | Konfigurasi .env.local |
| 7 | [Admin Guide](07-admin-guide.md) | Panduan fitur panel admin |

---

## 📌 Quick Start (Localhost — 5 Menit)

```bash
# 1. Clone
git clone https://github.com/your-repo/streamkunyuk.git
cd streamkunyuk

# 2. Install
npm install

# 3. Buat .env.local (isi dengan credentials Supabase)
cp .env.example .env.local

# 4. Jalanin SQL migration di Supabase SQL Editor
# Buka supabase/migrations/ → run semua .sql

# 5. Run
npm run dev
```

Buka **http://localhost:3456** 🎉

---

## 🔧 Quick Start (VPS — 10 Menit)

```bash
# SSH ke server
ssh user@ip-vps

# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git nginx

# Clone & build
cd /var/www
git clone https://github.com/your-repo/streamkunyuk.git
cd streamkunyuk
npm install
npm run build

# Setup PM2
npm install -g pm2
pm2 start .next/standalone/server.js --name streamkunyuk -- -p 3456
pm2 save
pm2 startup

# Setup Nginx reverse proxy (lihat doc 03-vps.md)
```

---

## 📁 Struktur Dokumentasi

```
docs/installation/
├── README.md                ← Kamu disini
├── 01-prerequisites.md      ← Prasyarat
├── 02-localhost.md          ← Local development
├── 03-vps.md               ← VPS production
├── 04-cpanel.md            ← cPanel hosting
├── 05-database-setup.md    ← Supabase
├── 06-env-configuration.md ← Environment variables
└── 07-admin-guide.md       ← Panel admin
```
