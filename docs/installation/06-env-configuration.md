# 🔐 Konfigurasi Environment Variables

## File .env.local

Buat file `.env.local` di root project (`E:\Downloads\streamkunyuk\.env.local`):

```env
# ========================================
# SUPABASE — Wajib
# ========================================
NEXT_PUBLIC_SUPABASE_URL=https://gjrckrnmspbolvrujmnf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ========================================
# ENCRYPTION — Wajib (min 32 karakter)
# ========================================
CREDENTIAL_ENCRYPTION_KEY=streamvault-enc-key-2024-32chars!!
```

## Penjelasan Setiap Variable

| Variable | Wajib? | Fungsi |
|----------|--------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Public anon key untuk client-side |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Admin key (jangan pernah di-expose ke client) |
| `CREDENTIAL_ENCRYPTION_KEY` | ✅ | Kunci enkripsi AES-256 untuk API keys |

## Dimana Dapatnya?

### Supabase Credentials
1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project
3. **Project Settings** (icon gear) → **API**
4. Copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

### Encryption Key
Buat string 32 karakter (bebas):
```
streamvault-enc-key-2024-32chars!!
# atau
my-super-secret-key-1234567890abcd!
```

> ⚠️ **Peringatan:** Kalo ganti encryption key ini, semua API key yang tersimpan di database harus di-set ulang!

## Multiple Environments

Bisa bikin file env berbeda untuk tiap environment:

```bash
.env.local           # Local development (priority)
.env.production      # Production VPS
.env                 # Default fallback
```

Git udah di-set ignore `.env.local`, `.env.production`, dll.
Hanya `.env.example` yang di-track sebagai referensi.

## Verifikasi

Jalankan perintah ini buat ngecek env terbaca:

```bash
# Di terminal
echo $NEXT_PUBLIC_SUPABASE_URL

# Atau setelah npm run dev, cek di console:
# "Environments: .env.local, .env"
```

## Common Mistakes

❌ **Typo di variable name**
```
NEXT_PUBLIC_SUPABASE_URL → NEXT_PUBLIC_SUPABASE_URL  ✅
NEXT_PUB_SUPABASE_URL    → ❌ salah
```

❌ **Kelebihan spasi**
```env
NEXT_PUBLIC_SUPABASE_URL= https://xxx.supabase.co  → ❌ spasi setelah =
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co   → ✅
```

❌ **Quotes gak perlu**
```env
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co" → ❌ (bisa error)
```
