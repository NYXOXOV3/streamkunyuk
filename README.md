# StreamVault — Premium Streaming Platform

Platform streaming untuk movies, series, anime, donghua, dan micro-drama.  
Dibangun dengan **Next.js 16**, **Supabase**, **Tailwind CSS 4**, dan **shadcn/ui**.

---

## 📋 Persyaratan

- **Node.js** v18+ (recommended: v22+)
- **npm** v9+
- Akun **Supabase** (gratis di [supabase.com](https://supabase.com))

---

## 🚀 Cara Install & Run

### 1. Clone & Masuk Folder

```bash
git clone <repo-url>
cd streamkunyuk
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Buat file `.env.local`:

```bash
cp .env.example .env.local
```

Lalu isi dengan credentials Supabase kamu:

```env
# Supabase — isi dari Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...anon_key...

# Service role key — dari Project Settings → API (hidden)
SUPABASE_SERVICE_ROLE_KEY=eyJ...service_role_key...

# Encryption key untuk API credentials (32 karakter)
CREDENTIAL_ENCRYPTION_KEY=your-32-char-encryption-key-here
```

### 4. Setup Database (Supabase)

1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project kamu → **SQL Editor**
3. Copy isi file `supabase/migrations/*.sql` (atau dari `scripts/schema.sql`)
4. **Run** SQL tersebut untuk membuat semua tabel
5. (Opsional) Seed data demo:

```bash
SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_KEY=eyJ... \
npm run db:seed
```

### 5. Run Development Server

```bash
npm run dev
```

Buka **http://localhost:3000** 🎉

### 6. Build untuk Production

```bash
npm run build
npm run start
```

---

## 📦 Scripts yang Tersedia

| Perintah | Keterangan |
|----------|-----------|
| `npm run dev` | Jalankan dev server (port 3000) |
| `npm run build` | Build untuk production (standalone) |
| `npm run start` | Jalankan production server |
| `npm run lint` | Lint semua file |

---

## 🔧 Masalah Umum

### `Error: Cannot find module '...'`

```bash
# Hapus node_modules & install ulang
rm -rf node_modules package-lock.json
npm install
```

### Build gagal di Windows (EBUSY)

```bash
# Hapus folder .next dulu
rm -rf .next
npm run build
```

### Halaman kosong / 500 error

Pastikan semua environment variable terisi dengan benar, terutama `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

---

## 🏗️ Struktur Proyek

```
src/
├── app/               # Next.js App Router (pages + API)
│   ├── (auth)/        # Login & Register
│   ├── (main)/        # Home, Browse, Search, Watch
│   └── admin/         # Admin dashboard
├── components/        # UI components
│   ├── ui/            # shadcn/ui components
│   ├── auth/          # Auth forms & guards
│   ├── home/          # Homepage components
│   └── admin/         # Admin components
├── lib/               # Shared utilities
│   ├── supabase/      # Supabase clients & types
│   ├── admin/         # Admin API helpers
│   └── crypto/        # AES encryption untuk credentials
└── middleware.ts      # Request middleware
```

---

## 🌐 Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (email/password + Google OAuth)
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **State:** Zustand (client) + TanStack Query (server)
- **Animation:** Framer Motion
- **Player:** 2Embed.cc / VidAPI embed
- **Encryption:** AES-256-GCM untuk API credentials

---

## 📄 Lisensi

Private — All rights reserved.
