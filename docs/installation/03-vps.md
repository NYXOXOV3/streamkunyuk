# 🖥️ Installasi VPS (Ubuntu 22.04+)

## Langkah 1 — Connect ke VPS

```bash
ssh user@ip-vps-anda
```

## Langkah 2 — Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git nginx

# Cek versi
node --version   # v22.x.x
npm --version    # v10.x.x
```

## Langkah 3 — Clone Project

```bash
cd /var/www
sudo git clone https://github.com/your-repo/streamkunyuk.git
cd streamkunyuk
sudo chown -R $USER:$USER .
```

## Langkah 4 — Install Dependencies & Build

```bash
npm install

# Buat .env.local
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
CREDENTIAL_ENCRYPTION_KEY=your-32-char-encryption-key-here
EOF

# Build
npm run build
```

## Langkah 5 — Setup PM2 (Process Manager)

```bash
npm install -g pm2

# Buat file ecosystem
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'streamkunyuk',
    cwd: '/var/www/streamkunyuk',
    script: 'node .next/standalone/server.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3456,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      CREDENTIAL_ENCRYPTION_KEY: process.env.CREDENTIAL_ENCRYPTION_KEY,
    },
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
  }]
};
EOF

# Start aplikasi
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

## Langkah 6 — Setup Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/streamkunyuk
```

Isi dengan:

```nginx
server {
    listen 80;
    server_name domain-anda.com www.domain-anda.com;

    # Redirect ke HTTPS (kalau pake SSL)
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name domain-anda.com www.domain-anda.com;

    # SSL — pakai Let's Encrypt
    ssl_certificate /etc/letsencrypt/live/domain-anda.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/domain-anda.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Reverse proxy ke Next.js
    location / {
        proxy_pass http://127.0.0.1:3456;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files cache
    location /_next/static {
        proxy_pass http://127.0.0.1:3456;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    location /public {
        proxy_pass http://127.0.0.1:3456;
        expires 30d;
    }
}
```

Aktifkan site:

```bash
sudo ln -s /etc/nginx/sites-available/streamkunyuk /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Langkah 7 — SSL Certificate (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d domain-anda.com -d www.domain-anda.com
```

## Langkah 8 — Firewall

```bash
sudo ufw allow 22/tcp          # SSH
sudo ufw allow 80/tcp          # HTTP
sudo ufw allow 443/tcp         # HTTPS
sudo ufw enable
```

---

## 📦 Production Script (Opsional)

Buat file `/var/www/streamkunyuk/scripts/deploy.sh`:

```bash
#!/bin/bash
cd /var/www/streamkunyuk
git pull origin main
npm install
npm run build
pm2 restart streamkunyuk
echo "✅ Deploy selesai!"
```

```bash
chmod +x scripts/deploy.sh
```

---

## 🔄 Update Aplikasi

```bash
cd /var/www/streamkunyuk
git pull origin main
npm install
npm run build
pm2 restart streamkunyuk
```

---

## 🐛 Troubleshooting VPS

### Port 3456 ga kebuka
```bash
# Cek apakah app jalan
pm2 status

# Cek log
pm2 logs streamkunyuk

# Cek port
ss -tlnp | grep 3456
```

### Nginx 502 Bad Gateway
```bash
# Cek apakah proxy_pass指向 port yang benar
sudo nginx -t

# Restart
sudo systemctl restart nginx
pm2 restart streamkunyuk
```

### Disk penuh
```bash
df -h
du -sh /var/www/streamkunyuk/.next
# Hapus .next lama kalo perlu
rm -rf /var/www/streamkunyuk/.next
npm run build
```
