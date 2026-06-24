# 💻 Installasi Localhost (Windows/macOS/Linux)

## Langkah 1 — Clone Repository

```bash
git clone https://github.com/your-repo/streamkunyuk.git
cd streamkunyuk
```

## Langkah 2 — Install Dependencies

```bash
npm install
```

## Langkah 3 — Setup Environment Variables

Buat file `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` dengan data dari Supabase project kamu:

```env
# === SUPABASE ===
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...anon_key...
SUPABASE_SERVICE_ROLE_KEY=eyJ...service_role_key...

# === ENCRYPTION ===
CREDENTIAL_ENCRYPTION_KEY=your-32-char-encryption-key-here
```

> **Dimana dapatnya?**  
> - Buka [Supabase Dashboard](https://supabase.com/dashboard) → Project → Settings → API  
> - `NEXT_PUBLIC_SUPABASE_URL` = Project URL  
> - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon/public key  
> - `SUPABASE_SERVICE_ROLE_KEY` = service_role key (rahasia, jangan dishare!)  
> - `CREDENTIAL_ENCRYPTION_KEY` = string 32 karakter (bebas, contoh: `streamvault-enc-key-2024-32chars!!`)

## Langkah 4 — Setup Database (Supabase)

**Cara 1 — via SQL Editor (recommended):**
1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project → **SQL Editor**
3. Buka file `supabase/migrations/` — jalankan SQL satu per satu:
   - `00001_create_profiles.sql`
   - `00002_create_content_tables.sql`
   - `00003_create_banners_table.sql`
   - `00004_create_site_settings.sql`
   - `00005_create_microdrama_providers.sql`

**Cara 2 — via Migration file:**
Copy paste isi file `supabase/migrations/XXXXX.sql` ke SQL Editor → **Run**

## Langkah 5 — Seed Data (Opsional)

Ada 2 script seed yang bisa dipakai:

### Seed Demo Content
```bash
SUPABASE_URL="https://xxx.supabase.co" SUPABASE_SERVICE_KEY="eyJ..." npx tsx scripts/setup-supabase.ts
```

Ini akan membuat:
- Admin user: `admin@streamvault.com` / `admin123456`
- 10 sample content (movies, series, anime, donghua, microdrama)
- Episodes untuk setiap content

### Seed Banners
```bash
SUPABASE_URL="https://xxx.supabase.co" SUPABASE_SERVICE_KEY="eyJ..." npx tsx scripts/setup-banners.ts
```

## Langkah 6 — Run Development Server

```bash
npm run dev
```

Buka **http://localhost:3456** di browser.

## Langkah 7 — Build untuk Production (Local Test)

```bash
npm run build
npm run start
```

Akses **http://localhost:3456**

---

## 🐛 Troubleshooting Localhost

### Error: `EADDRINUSE` — port sudah dipake
```bash
# Bunuh proses yang pake port
taskkill //F //IM node.exe   # Windows
killall node                  # macOS/Linux
rm -rf .next
npm run dev
```

### Error: `Cannot find module` — dependencies corrupt
```bash
rm -rf node_modules package-lock.json
npm install
```

### Error: Supabase connection — env variables salah
```bash
# Pastikan .env.local isinya benar
cat .env.local

# Coba pake placeholder buat testing build
NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co" \
NEXT_PUBLIC_SUPABASE_ANON_KEY="placeholder" \
npm run build
```

### Admin login ga bisa
Pastikan SQL migration udah dijalanin, terutama trigger `on_auth_user_created` untuk auto-create profile setelah signup.
