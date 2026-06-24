# ▲ Deploy ke Vercel

## Prasyarat

- Akun [Vercel](https://vercel.com) (bisa login pake GitHub)
- Repository sudah di GitHub
- Project sudah bisa build di local (`npm run build`)

## Langkah 1 — Connect GitHub ke Vercel

1. Buka [vercel.com](https://vercel.com)
2. Login (pake GitHub)
3. Klik **Add New** → **Project**
4. Pilih repository `streamkunyuk`

## Langkah 2 — Configure Project

Vercel akan auto-detect framework sebagai **Next.js**. Setting default:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Next.js (auto) |
| **Root Directory** | `./` |
| **Build Command** | `npm run vercel-build` |
| **Output Directory** | `.next` |
| **Install Command** | `npm install` |

## Langkah 3 — Environment Variables

Di halaman configure, scroll ke **Environment Variables**, tambah:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...anon...
SUPABASE_SERVICE_ROLE_KEY=eyJ...service_role...
CREDENTIAL_ENCRYPTION_KEY=your-32-char-key
```

> **Production, Preview, Development** — set semuanya sama.

## Langkah 4 — Deploy

Klik **Deploy** → tunggu ~2 menit.

Selesai! Dapet URL: `https://streamkunyuk.vercel.app`

## Langkah 5 — Custom Domain (Opsional)

1. Buka project di Vercel Dashboard
2. **Settings** → **Domains**
3. Masukin domain kamu
4. Ikutin petunjuk DNS (A record / CNAME)

## Langkah 6 — Automatic Deploy

Setiap kali **push ke branch `main`**, Vercel otomatis:
1. Trigger build
2. Deploy ke production
3. Kasih URL preview (buat staging)

## Structure Files for Vercel

```
├── vercel.json          ← Routing & headers
├── .vercelignore        ← File yg gak perlu di-upload
├── next.config.ts       ← Support Vercel + standalone
└── .env.example         ← Template env variables
```

## Environment di Vercel Dashboard

Buka project → **Settings** → **Environment Variables** → **Add**:

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | All |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | All |
| `CREDENTIAL_ENCRYPTION_KEY` | `your-key` | All |

## Troubleshooting Vercel

### Build Error: Module not found
```bash
# Pastiin semua dependency terinstall
npm install
# Coba build local dulu
npm run build
```

### 500 Internal Server Error
Cek **Function Logs** di Vercel Dashboard → project → **Functions**.

### Supabase Connection Failed
Pastiin environment variables udah diisi di Vercel Dashboard.

### Images Not Loading
Vercel udah include `sharp` otomatis buat image optimization.
Kalo pake external images, pastiin `remotePatterns` di `next.config.ts` udah bener.

### Streaming / Long Response Time
Vercel free plan punya limit 10s untuk serverless functions.
Kalo import banyak data, bisa timeout. Upgrade ke Pro kalo perlu.

## Catatan

- **Free Plan:** 100 GB bandwidth, 100 jam build, 10s function timeout
- **Pro Plan:** $20/bulan — unbounded, 60s timeout, faster builds
- **Database:** Tetap pake Supabase (external), gak ada di Vercel
