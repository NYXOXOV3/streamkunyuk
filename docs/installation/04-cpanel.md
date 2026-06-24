# 🌐 Installasi cPanel

cPanel support Node.js apps via **Setup Node.js App** atau **Apache reverse proxy**.

## Langkah 1 — Upload File

**Via File Manager:**
1. Login ke cPanel
2. Buka **File Manager**
3. Masuk ke folder `public_html` atau subfolder (contoh: `streamkunyuk`)
4. **Upload** — upload file zip project
5. **Extract** — extract file zip

**Via Git:**

1. Buka **Terminal** di cPanel
2. Clone project:
```bash
cd /home/user/
git clone https://github.com/your-repo/streamkunyuk.git
```

## Langkah 2 — Setup Node.js App (cPanel Native)

1. Buka **Setup Node.js App** di cPanel
2. Klik **Create Application**
3. Isi:
   - **Node.js version:** v22.x.x
   - **Application mode:** Production
   - **Application root:** `/home/user/streamkunyuk` (atau `public_html/streamkunyuk`)
   - **Application URL:** domain-anda.com atau subdomain
   - **Application startup file:** `.next/standalone/server.js`
   - **Pass environment variables:** Ya
   - **Environment variables:**
     ```
     NODE_ENV=production
     PORT=3456
     NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
     SUPABASE_SERVICE_ROLE_KEY=eyJ...
     CREDENTIAL_ENCRYPTION_KEY=your-32-char-encryption-key-here
     ```
4. Klik **Create**

## Langkah 3 — Install Dependencies via Terminal

```bash
cd /home/user/streamkunyuk
npm install
```

## Langkah 4 — Setup .env.local

Buat file `.env.local` di root project:

```bash
nano .env.local
```

Isi:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
CREDENTIAL_ENCRYPTION_KEY=your-32-char-encryption-key-here
```

## Langkah 5 — Build

```bash
cd /home/user/streamkunyuk
npm run build
```

Perintah build akan menghasilkan folder `.next/standalone/`.

## Langkah 6 — Start Aplikasi

Kembali ke **Setup Node.js App** → klik **Start App** atau **Restart**.

Jika menggunakan **Terminal**:
```bash
cd /home/user/streamkunyuk
NODE_ENV=production node .next/standalone/server.js &
```

## Langkah 7 — Setup Subdomain (Opsional)

1. Buka **Subdomains** di cPanel
2. Buat subdomain:
   - **Subdomain:** `stream`
   - **Domain:** `domain-anda.com`
   - **Document Root:** `public_html/streamkunyuk`
3. Klik **Create**

## Langkah 8 — Setup Domain Utama (Override)

Jika ingin domain utama指向 project:

1. Buka **Domains** → **Aliases**
2. Atau edit `.htaccess` di root `public_html`:

```apache
RewriteEngine On
RewriteRule ^(.*) http://127.0.0.1:3456/$1 [P,L]
```

Atau pakai **Apache Includes**:
1. Buka **Include Editor** → **Pre Virtual Include**
2. Tambah:
```apache
ProxyPass / http://127.0.0.1:3456/
ProxyPassReverse / http://127.0.0.1:3456/
```

---

## 📦 Update Aplikasi (cPanel)

1. **File Manager** → upload file baru (overwrite)
2. Buka **Terminal**:
```bash
cd /home/user/streamkunyuk
npm install
npm run build
```
3. **Setup Node.js App** → **Restart**

Atau via Git:
```bash
cd /home/user/streamkunyuk
git pull origin main
npm install
npm run build
```
Kemudian restart app dari **Setup Node.js App**.

---

## 🐛 Troubleshooting cPanel

### App muncul "502 Bad Gateway"
- Cek apakah port aplikasi jalan: `lsof -i :3456`
- Pastiin **Application startup file**指向 `server.js` yang benar
- Restart app dari **Setup Node.js App**

### 500 Internal Server Error
- Cek log error: **Errors** → **Error Log** di cPanel
- Atau dari terminal: `cat /home/user/streamkunyuk/.next/logs/*`

### Node.js App Not Running
1. Buka **Setup Node.js App**
2. Cek **Application Status** — harus "Running"
3. Klik **Stop** → **Start** ulang

### File Permission Error
```bash
cd /home/user/streamkunyuk
find . -type d -exec chmod 755 {} \;
find . -type f -exec chmod 644 {} \;
chmod 750 .next/standalone/server.js
```

### Environment Variable Not Found
Pastikan env variable diisi di **Setup Node.js App** → **Environment Variables**.
Atau `.env.local` ada di root project.
