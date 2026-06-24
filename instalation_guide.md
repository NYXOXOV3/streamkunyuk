📥 Cara Install StreamVault

  1. Install dependencies

  npm install

  2. Setup env

  cp .env.example .env.local
  Edit .env.local — isi credentials Supabase kamu:
  - NEXT_PUBLIC_SUPABASE_URL — ambil dari Supabase Dashboard → Project Settings → API
  - NEXT_PUBLIC_SUPABASE_ANON_KEY — sama, anon public key
  - SUPABASE_SERVICE_ROLE_KEY — service role key (rahasia!)
  - CREDENTIAL_ENCRYPTION_KEY — bebas, minimal 32 karakter

  3. Setup Database

  Buka Supabase Dashboard → SQL Editor → paste isi supabase/migrations/ → Run

  4. Run 🔥

  npm run dev
  Buka http://localhost:3000

  Build production

  npm run build
  npm run start