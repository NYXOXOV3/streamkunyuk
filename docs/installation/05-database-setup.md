# 🗄️ Setup Database (Supabase)

## Membuat Project Supabase

1. Buka [supabase.com](https://supabase.com) → **Start Your Project**
2. Isi:
   - **Name:** `streamkunyuk`
   - **Database Password:** simpan dengan aman
   - **Region:** pilih yang terdekat (Singapore / Tokyo)
3. Tunggu sampai selesai (~2 menit)

## Dapatkan Credentials

1. Buka project → **Project Settings** → **API**
2. Copy:
   - **Project URL** → jadi `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → jadi `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → jadi `SUPABASE_SERVICE_ROLE_KEY`

## Jalankan Migrations

Buka **SQL Editor** → **New Query** → jalankan SQL berikut secara berurutan:

### 1. Profiles Table
Buka file [`supabase/migrations/00001_create_profiles.sql`](../../supabase/migrations/00001_create_profiles.sql) → copy → run

### 2. Content Tables
Buka file [`supabase/migrations/00002_create_content_tables.sql`](../../supabase/migrations/00002_create_content_tables.sql) → copy → run

### 3. Banners Table
Buka file [`supabase/migrations/00003_create_banners_table.sql`](../../supabase/migrations/00003_create_banners_table.sql) → copy → run

### 4. Site Settings
Buka file [`supabase/migrations/00004_create_site_settings.sql`](../../supabase/migrations/00004_create_site_settings.sql) → copy → run

### 5. Microdrama Providers
Buka file [`supabase/migrations/00005_create_microdrama_providers.sql`](../../supabase/migrations/00005_create_microdrama_providers.sql) → copy → run

## Struktur Database

```
public.profiles              — User profiles
public.contents              — Movies, series, anime, donghua, microdrama
public.episodes              — Episode per content
public.seasons               — Season per TV series
public.categories            — Genre/category
public.content_categories    — Junction: content ↔ category
public.content_providers     — Import sources (TMDB, Manual)
public.api_providers         — API provider config
public.api_credentials       — Encrypted API keys
public.microdrama_providers  — Micro-drama API sources
public.subscription_tiers    — Subscription plans
public.subscriptions         — User subscriptions
public.payments              — Payment history
public.watch_history         — User watch tracking
public.favorites             — User favorites
public.banners               — Homepage banners
public.site_settings         — Key-value configs
```

## Auth Settings (Wajib!)

1. Buka **Authentication** → **Providers**
2. **Email/Password** — pastikan ON
   - **Confirm emails:** **DISABLE** (untuk development, biar langsung login tanpa verifikasi)
3. (Opsional) **Google** — ON, isi Client ID & Secret dari Google Cloud Console

## RLS Policies

Semua tabel udah punya Row Level Security bawaan dari migration. Intinya:
- **Public read** — untuk content, categories, dll (bisa dibaca tanpa login)
- **User own** — profile, subscription, watch history (hanya pemilik)
- **Admin only** — api_providers, banners, site_settings (hanya admin)

## Cek Setup Berhasil

Buka **Table Editor** di Supabase → harusnya ada semua tabel yang terdaftar.

Kalo ada yang kurang, tinggal run SQL migration yang sesuai.
