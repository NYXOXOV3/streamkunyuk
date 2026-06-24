# 👑 Panduan Panel Admin

## Akses Admin

Buka **http://domain-anda.com/admin**

## Login Admin

### Via Seed Script
Kalo udah jalanin `scripts/setup-supabase.ts`:
```
Email:    admin@streamvault.com
Password: admin123456
```

### Via Manual SQL
Atau buat admin langsung dari Supabase SQL Editor:

```sql
-- Cari user id dari auth.users
SELECT id, email FROM auth.users WHERE email = 'email-anda@gmail.com';

-- Set jadi admin
INSERT INTO public.profiles (id, display_name, is_admin)
VALUES ('user-id-dari-atas', 'Admin', true)
ON CONFLICT (id) DO UPDATE SET is_admin = true;
```

---

## Fitur Panel Admin

### 📊 Dashboard
Overview: total users, subscribers, content, watch hours, content by type/status.

### 🎬 Content Management
**Content List** — lihat, filter, cari, edit, delete content.
**Add Content** — manual input untuk anime/donghua.
**TMDB Import** — cari & import dari TMDB. Fitur **Auto Import by Year**.
**Melolo Import** — browse/import microdrama dari Melolo. Fitur **Auto Import by Page Range**.

### 🎮 Player Settings
Ganti video player provider (2Embed / VidAPI). Simpan di `site_settings`.

### 🖼️ Banners
Kelola homepage hero banners. Bisa content-based atau custom image + link.

### 🔍 SEO Settings
Atur meta title, description, keywords, OG image, logo & favicon URL.
Semua disimpan di `site_settings`.

### 🔑 API Configuration
Simpan API key untuk TMDB, Melolo, dll.
**Keys dienkripsi AES-256-GCM** sebelum disimpan.

### 👥 User Management
Lihat & edit users, set admin role, delete user.

---

## Fitur Per Content

Setiap content punya status:
- **Draft** — belum muncul di publik
- **Published** — muncul di homepage, browse, search
- **Archived** — disembunyikan

Premium:
- **is_premium_only** — content cuma untuk subscriber
- **free_trial_episodes** — berapa episode pertama yang gratis
- **is_locked / is_free_trial** — per-episode setting

---

## Troubleshooting Admin

### "Forbidden" — Gak bisa akses admin
1. Pastikan `is_admin = true` di tabel profiles
2. SQL: `SELECT * FROM public.profiles WHERE is_admin = true`
3. Kalo belum: `UPDATE public.profiles SET is_admin = true WHERE id = 'user-id'`

### Import TMDB gagal
1. Cek **API Configuration** → TMDB API key sudah terisi?
2. Cek **CREDENTIAL_ENCRYPTION_KEY** di `.env.local`

### Player error
1. Cek **Player Settings** — provider aktif
2. Pastiin content punya `tmdb_id` (untuk 2embed/vidapi) atau `external_content_id` (melolo)
