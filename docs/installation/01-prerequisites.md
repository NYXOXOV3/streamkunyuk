# 📋 Prasyarat & Persiapan

Sebelum install StreamVault, pastikan semua kebutuhan berikut terpenuhi.

## 🔧 Kebutuhan Minimum

| Komponen | Localhost | VPS | cPanel |
|----------|-----------|-----|--------|
| **OS** | Windows 10+ / macOS / Linux | Ubuntu 22.04+ / Debian 12+ | CentOS 7+ / AlmaLinux 8+ |
| **Node.js** | v18+ (recommended v22) | v18+ (recommended v22) | v18+ (via NodeSelector) |
| **npm** | v9+ | v9+ | v9+ |
| **RAM** | 4 GB | 2 GB | 2 GB |
| **Disk** | 10 GB | 10 GB | 10 GB |
| **Domain** | — | Wajib | Wajib |

## 📦 Software yang Diperlukan

### Node.js
```bash
# Cek versi
node --version   # harus ≥ v18
npm --version    # harus ≥ v9
```

**Cara install Node.js:**
- **Windows:** Download dari [nodejs.org](https://nodejs.org)
- **Linux (Ubuntu/Debian):**
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt install -y nodejs
  ```
- **cPanel:** Gunakan **Node.js Selector** dari cPanel → Setup Node.js App

### Git
```bash
git --version
# Install: sudo apt install git
```

### Supabase Account
1. Daftar di [supabase.com](https://supabase.com) (gratis)
2. Buat project baru
3. Simpan **Project URL**, **anon key**, dan **service_role key**

### Domain & SSL (VPS / cPanel)
- Domain sudah指向 ke server
- SSL certificate (bisa pakai Let's Encrypt gratis)

---

## 📁 File yang ADidapatkan Setelah Clone

```
streamkunyuk/
├── src/              # Source code utama
├── public/           # Static files
├── supabase/         # SQL migrations
├── docs/             # Dokumentasi
├── package.json
├── next.config.ts
└── tsconfig.json
```

---

## ✅ Checklist Persiapan

- [ ] Node.js v22+ terinstall
- [ ] npm v9+ terinstall
- [ ] Git terinstall
- [ ] Akun Supabase sudah dibuat
- [ ] Project Supabase sudah dibuat
- [ ] Domain sudah指向 (VPS/cPanel)
- [ ] SSH access (VPS) atau File Manager (cPanel)

Sudah siap? Lanjut ke **[02-localhost.md](02-localhost.md)** untuk installasi local.
