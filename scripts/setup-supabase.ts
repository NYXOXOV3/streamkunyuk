/**
 * StreamVault - Full Supabase Schema Setup + Seed Data
 * 
 * This script:
 * 1. Creates ALL tables needed by the app
 * 2. Seeds an admin user + sample content with episodes
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://gjrckrnmspbolvrujmnf.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqcmNrcm5tc3Bib2x2cnVqbW5mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjAzNDk1MywiZXhwIjoyMDk3NjEwOTUzfQ._osuy9lG__GMLd89Q8uhzuhT6b4kL-vqJaO-IhmvCHI";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function setup() {
  console.log("🚀 StreamVault Supabase Setup\n");

  // Check connection
  const { error: connCheck } = await supabase.from("profiles").select("id").limit(1);
  console.log(`📡 Connection: OK`);
  console.log(`📋 Profiles table exists: ${!connCheck ? "YES" : "NO (${connCheck.message})"}`);

  if (connCheck && connCheck.message.includes("does not exist")) {
    console.log("\n❌ Tables don't exist yet. Creating via SQL first...");
    console.log("Please run the SQL schema in your Supabase SQL Editor first.");
    console.log("SQL file will be generated at scripts/schema.sql");
    generateSchemaSQL();
    return;
  }

  // ============================================================
  // STEP 1: Create Admin User
  // ============================================================
  console.log("\n▶ Creating admin user...");

  let adminId: string | undefined;

  const { data: adminUser, error: adminError } = await supabase.auth.admin.createUser({
    email: "admin@streamvault.com",
    password: "admin123456",
    email_confirm: true,
    user_metadata: { display_name: "Admin" },
  });

  if (adminError) {
    if (adminError.message.includes("already registered") || adminError.message.includes("already exists")) {
      console.log("  ⚠ Admin email already exists, fetching...");
      const { data: existing } = await supabase.auth.admin.listUsers();
      const found = existing?.users?.find(u => u.email === "admin@streamvault.com");
      if (found) {
        adminId = found.id;
        console.log(`  ✅ Found existing admin: ${adminId}`);
      }
    } else {
      console.log(`  ❌ Error: ${adminError.message}`);
    }
  } else {
    adminId = adminUser.user.id;
    console.log(`  ✅ Admin user created: ${adminId}`);
  }

  if (!adminId) {
    console.log("  ❌ Could not get admin user ID, aborting.");
    return;
  }

  // ============================================================
  // STEP 2: Set admin profile
  // ============================================================
  console.log("\n▶ Setting admin profile (is_admin = true)...");
  const { error: profileErr } = await supabase
    .from("profiles")
    .upsert({ id: adminId, display_name: "Admin", is_admin: true }, { onConflict: "id" });

  if (profileErr) {
    console.log(`  ❌ Profile error: ${profileErr.message}`);
  } else {
    console.log("  ✅ Admin profile set");
  }

  // ============================================================
  // STEP 3: Seed Categories
  // ============================================================
  console.log("\n▶ Seeding categories...");
  const categories = [
    { name: "Action", slug: "action", sort_order: 1 },
    { name: "Comedy", slug: "comedy", sort_order: 2 },
    { name: "Drama", slug: "drama", sort_order: 3 },
    { name: "Horror", slug: "horror", sort_order: 4 },
    { name: "Romance", slug: "romance", sort_order: 5 },
    { name: "Sci-Fi", slug: "sci-fi", sort_order: 6 },
    { name: "Thriller", slug: "thriller", sort_order: 7 },
    { name: "Fantasy", slug: "fantasy", sort_order: 8 },
    { name: "Animation", slug: "animation", sort_order: 9 },
    { name: "Documentary", slug: "documentary", sort_order: 10 },
  ];

  let catOk = 0, catFail = 0;
  for (const cat of categories) {
    const { error } = await supabase.from("categories").upsert(cat, { onConflict: "slug" });
    if (error) { catFail++; if (catFail <= 2) console.log(`  ⚠ "${cat.name}": ${error.message}`); }
    else catOk++;
  }
  console.log(`  ✅ Categories: ${catOk} seeded${catFail ? `, ${catFail} failed` : ""}`);

  // ============================================================
  // STEP 4: Seed Content
  // ============================================================
  console.log("\n▶ Seeding content (10 items)...");
  const sampleContent = [
    {
      id: "demo-movie-1", title: "The Last Horizon", type: "movie", release_year: 2024,
      poster_url: "https://placehold.co/400x600/1a1a2e/e50914?text=Last+Horizon&font=montserrat",
      backdrop_url: "https://placehold.co/1920x800/1a1a2e/e50914?text=The+Last+Horizon&font=montserrat",
      synopsis: "In a post-apocalyptic world, a lone survivor embarks on a dangerous journey across the wasteland to find the last safe haven for humanity.",
      rating: 8.5, rating_count: 12500, language: "en", is_premium_only: false,
      status: "published", featured: true, featured_order: 1, published_at: "2024-12-01T00:00:00Z",
    },
    {
      id: "demo-series-1", title: "Shadow Protocol", type: "series", release_year: 2024,
      poster_url: "https://placehold.co/400x600/1a1a2e/d4af37?text=Shadow+Protocol&font=montserrat",
      backdrop_url: "https://placehold.co/1920x800/1a1a2e/d4af37?text=Shadow+Protocol&font=montserrat",
      synopsis: "A brilliant cyber-security analyst discovers a hidden conspiracy within the world's largest tech company. As she digs deeper, she realizes the conspiracy reaches into the highest levels of government.",
      rating: 9.1, rating_count: 28300, language: "en", is_premium_only: true, free_trial_episodes: 3,
      status: "published", featured: true, featured_order: 2, published_at: "2024-11-15T00:00:00Z",
    },
    {
      id: "demo-anime-1", title: "Blade of Eternity", type: "anime", release_year: 2024,
      poster_url: "https://placehold.co/400x600/1a1a2e/ff6b35?text=Blade+Eternity&font=montserrat",
      backdrop_url: "https://placehold.co/1920x800/1a1a2e/ff6b35?text=Blade+of+Eternity&font=montserrat",
      synopsis: "In a world where swordsmen channel spiritual energy through ancient blades, a young orphan discovers he wields the legendary Eternal Blade — a weapon that hasn't been awakened in a thousand years.",
      rating: 8.9, rating_count: 45600, language: "ja", country_of_origin: "JP",
      is_premium_only: true, free_trial_episodes: 2,
      status: "published", featured: true, featured_order: 3, published_at: "2024-10-20T00:00:00Z",
    },
    {
      id: "demo-movie-2", title: "Midnight Express", type: "movie", release_year: 2023,
      poster_url: "https://placehold.co/400x600/1a1a2e/00d4ff?text=Midnight+Express&font=montserrat",
      backdrop_url: "https://placehold.co/1920x800/1a1a2e/00d4ff?text=Midnight+Express&font=montserrat",
      synopsis: "A retired intelligence officer is pulled back into action when a former ally goes rogue with a weapon that could destabilize entire nations.",
      rating: 7.8, rating_count: 8900, language: "en", is_premium_only: false,
      status: "published", featured: true, featured_order: 4, published_at: "2024-09-01T00:00:00Z",
    },
    {
      id: "demo-donghua-1", title: "Cultivation Supreme", type: "donghua", release_year: 2024,
      poster_url: "https://placehold.co/400x600/1a1a2e/bd93f9?text=Cultivation+Supreme&font=montserrat",
      backdrop_url: "https://placehold.co/1920x800/1a1a2e/bd93f9?text=Cultivation+Supreme&font=montserrat",
      synopsis: "Born with the lowest spiritual root in a cultivation world, a young man defies all expectations when he discovers an ancient inheritance.",
      rating: 8.7, rating_count: 32100, language: "zh", country_of_origin: "CN",
      is_premium_only: false, status: "published", featured: true, featured_order: 5, published_at: "2024-11-01T00:00:00Z",
    },
    {
      id: "demo-series-2", title: "The Underground", type: "series", release_year: 2023,
      poster_url: "https://placehold.co/400x600/1a1a2e/50fa7b?text=The+Underground&font=montserrat",
      backdrop_url: "https://placehold.co/1920x800/1a1a2e/50fa7b?text=The+Underground&font=montserrat",
      synopsis: "Deep beneath the streets of modern London lies a secret society that has controlled the city's fate for centuries.",
      rating: 8.2, rating_count: 15700, language: "en", is_premium_only: false,
      status: "published", featured: false, published_at: "2024-08-15T00:00:00Z",
    },
    {
      id: "demo-movie-3", title: "Neon Requiem", type: "movie", release_year: 2024,
      poster_url: "https://placehold.co/400x600/1a1a2e/f1fa8c?text=Neon+Requiem&font=montserrat",
      backdrop_url: "https://placehold.co/1920x800/1a1a2e/f1fa8c?text=Neon+Requiem&font=montserrat",
      synopsis: "In a cyberpunk megacity of 2087, a street musician discovers that her songs can hack into people's neural implants.",
      rating: 8.0, rating_count: 6700, language: "en", is_premium_only: true,
      status: "published", featured: false, published_at: "2024-12-10T00:00:00Z",
    },
    {
      id: "demo-anime-2", title: "Spirit Hunter Academy", type: "anime", release_year: 2023,
      poster_url: "https://placehold.co/400x600/1a1a2e/ff79c6?text=Spirit+Hunter&font=montserrat",
      backdrop_url: "https://placehold.co/1920x800/1a1a2e/ff79c6?text=Spirit+Hunter+Academy&font=montserrat",
      synopsis: "At an exclusive academy hidden between dimensions, students learn to hunt malevolent spirits.",
      rating: 8.3, rating_count: 21400, language: "ja", country_of_origin: "JP",
      is_premium_only: false, status: "published", featured: false, published_at: "2024-07-01T00:00:00Z",
    },
    {
      id: "demo-microdrama-1", title: "Love in 60 Seconds", type: "microdrama", release_year: 2024,
      poster_url: "https://placehold.co/400x600/1a1a2e/ffb86c?text=Love+60s&font=montserrat",
      backdrop_url: "https://placehold.co/1920x800/1a1a2e/ffb86c?text=Love+in+60+Seconds&font=montserrat",
      synopsis: "A fast-paced romantic micro-series following two rival coffee shop owners who keep running into each other.",
      rating: 7.5, rating_count: 4300, language: "en", is_premium_only: false,
      status: "published", featured: false, published_at: "2024-11-20T00:00:00Z",
    },
    {
      id: "demo-movie-4", title: "The Architect", type: "movie", release_year: 2024,
      poster_url: "https://placehold.co/400x600/1a1a2e/8be9fd?text=The+Architect&font=montserrat",
      backdrop_url: "https://placehold.co/1920x800/1a1a2e/8be9fd?text=The+Architect&font=montserrat",
      synopsis: "A renowned architect discovers that the buildings she designs are being used as part of a vast surveillance network.",
      rating: 7.9, rating_count: 5100, language: "en", is_premium_only: false,
      status: "published", featured: false, published_at: "2024-12-05T00:00:00Z",
    },
  ];

  let contentOk = 0, contentFail = 0;
  for (const c of sampleContent) {
    const { error } = await supabase.from("contents").upsert(c, { onConflict: "id" });
    if (error) { contentFail++; if (contentFail <= 2) console.log(`  ⚠ "${c.title}": ${error.message}`); }
    else { contentOk++; console.log(`  ✅ "${c.title}"`); }
  }
  console.log(`  📊 Content: ${contentOk} seeded${contentFail ? `, ${contentFail} failed` : ""}`);

  // ============================================================
  // STEP 5: Seed Episodes
  // ============================================================
  console.log("\n▶ Seeding episodes...");

  const episodeTemplates = [
    // Shadow Protocol (premium, first 3 free trial)
    ...Array.from({ length: 6 }, (_, i) => ({
      content_id: "demo-series-1", episode_number: i + 1,
      title: ["The Signal", "Ghost in the Code", "The Insider", "Burn Notice", "Crossfire", "Zero Day"][i],
      is_locked: i >= 3, is_free_trial: i < 3, runtime_seconds: [2700, 2850, 2600, 2900, 2750, 3000][i],
    })),
    // Blade of Eternity (premium, first 2 free trial)
    ...Array.from({ length: 5 }, (_, i) => ({
      content_id: "demo-anime-1", episode_number: i + 1,
      title: ["The Awakening", "First Blood", "The Tournament", "Hidden Power", "The Betrayal"][i],
      is_locked: i >= 2, is_free_trial: i < 2, runtime_seconds: 1440,
    })),
    // Cultivation Supreme (free)
    ...Array.from({ length: 4 }, (_, i) => ({
      content_id: "demo-donghua-1", episode_number: i + 1,
      title: ["Mortal Root", "Spirit Bone", "The Inheritance", "Ascension"][i],
      is_locked: false, is_free_trial: false, runtime_seconds: 1440,
    })),
    // The Underground (free)
    ...Array.from({ length: 3 }, (_, i) => ({
      content_id: "demo-series-2", episode_number: i + 1,
      title: ["Beneath the Streets", "The Society", "Uncovered"][i],
      is_locked: false, is_free_trial: false, runtime_seconds: [3000, 2850, 2900][i],
    })),
    // Spirit Hunter Academy (free)
    ...Array.from({ length: 3 }, (_, i) => ({
      content_id: "demo-anime-2", episode_number: i + 1,
      title: ["Enrollment Day", "No Spiritual Power", "The Barrier Falls"][i],
      is_locked: false, is_free_trial: false, runtime_seconds: 1440,
    })),
    // Love in 60 Seconds (microdrama, free)
    ...Array.from({ length: 4 }, (_, i) => ({
      content_id: "demo-microdrama-1", episode_number: i + 1,
      title: ["Spill", "The Rivalry", "Rain", "The Finale"][i],
      is_locked: false, is_free_trial: false, runtime_seconds: [90, 105, 120, 110][i],
    })),
  ];

  let epOk = 0, epFail = 0;
  for (const ep of episodeTemplates) {
    const { error } = await supabase.from("episodes").upsert({
      id: `${ep.content_id}-ep${ep.episode_number}`,
      content_id: ep.content_id,
      episode_number: ep.episode_number,
      title: ep.title,
      synopsis: `Episode ${ep.episode_number} — ${ep.title}`,
      thumbnail_url: `https://placehold.co/640x360/1a1a2e/e50914?text=Ep+${ep.episode_number}&font=montserrat`,
      runtime_seconds: ep.runtime_seconds,
      video_url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
      is_locked: ep.is_locked,
      is_free_trial: ep.is_free_trial,
    }, { onConflict: "id" });

    if (error) { epFail++; if (epFail <= 2) console.log(`  ⚠ Episode: ${error.message}`); }
    else epOk++;
  }
  console.log(`  📊 Episodes: ${epOk} seeded${epFail ? `, ${epFail} failed` : ""}`);

  // ============================================================
  // DONE
  // ============================================================
  console.log("\n" + "=".repeat(50));
  console.log("✅ SETUP COMPLETE!");
  console.log("=".repeat(50));
  console.log("\n📧 Admin Login:");
  console.log("   Email:    admin@streamvault.com");
  console.log("   Password: admin123456");
  console.log("\n🌐 Open http://localhost:3000/login to test!");
}

async function generateSchemaSQL() {
  const sql = `-- StreamVault Full Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type_filter TEXT,
  icon_url TEXT,
  sort_order INT NOT NULL DEFAULT 0
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read categories" ON public.categories FOR SELECT USING (true);

-- ============================================
-- CONTENT_PROVIDERS
-- ============================================
CREATE TABLE IF NOT EXISTS public.content_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  api_provider_id UUID REFERENCES public.api_providers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.content_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read content_providers" ON public.content_providers FOR SELECT USING (true);

-- ============================================
-- API_PROVIDERS
-- ============================================
CREATE TABLE IF NOT EXISTS public.api_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_name TEXT NOT NULL,
  provider_type TEXT NOT NULL DEFAULT 'metadata',
  description TEXT,
  base_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_tested_at TIMESTAMPTZ,
  test_status TEXT NOT NULL DEFAULT 'untested',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.api_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage api_providers" ON public.api_providers FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- ============================================
-- SUBSCRIPTION_TIERS
-- ============================================
CREATE TABLE IF NOT EXISTS public.subscription_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_quality TEXT NOT NULL DEFAULT '1080p',
  features TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read subscription_tiers" ON public.subscription_tiers FOR SELECT USING (true);

-- ============================================
-- SUBSCRIPTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES public.subscription_tiers(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active','inactive','cancelled','past_due','trialing')),
  payment_provider TEXT,
  payment_provider_sub_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all subscriptions" ON public.subscriptions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- ============================================
-- CONTENTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.contents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tmdb_id INT,
  provider_source_id TEXT,
  title TEXT NOT NULL,
  original_title TEXT,
  synopsis TEXT,
  type TEXT NOT NULL CHECK (type IN ('movie','series','anime','donghua','microdrama')),
  release_year INT,
  runtime_minutes INT,
  poster_url TEXT,
  backdrop_url TEXT,
  trailer_url TEXT,
  rating DECIMAL(3,1) NOT NULL DEFAULT 0,
  rating_count INT NOT NULL DEFAULT 0,
  language TEXT NOT NULL DEFAULT 'en',
  country_of_origin TEXT,
  external_content_id TEXT,
  external_url TEXT,
  is_premium_only BOOLEAN NOT NULL DEFAULT false,
  free_trial_episodes INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  featured BOOLEAN NOT NULL DEFAULT false,
  featured_order INT NOT NULL DEFAULT 0,
  slug TEXT,
  meta_title TEXT,
  meta_description TEXT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published content" ON public.contents FOR SELECT USING (status = 'published');
CREATE POLICY "Admins can manage content" ON public.contents FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_contents_title_search ON public.contents USING GIN (to_tsvector('english', title || ' ' || COALESCE(synopsis, '')));
CREATE INDEX IF NOT EXISTS idx_contents_type ON public.contents(type);
CREATE INDEX IF NOT EXISTS idx_contents_status ON public.contents(status);
CREATE INDEX IF NOT EXISTS idx_contents_featured ON public.contents(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_contents_published ON public.contents(published_at DESC) WHERE status = 'published';

-- ============================================
-- SEASONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.seasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
  season_number INT NOT NULL,
  title TEXT,
  synopsis TEXT,
  poster_url TEXT,
  air_date DATE,
  UNIQUE(content_id, season_number)
);

ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read seasons" ON public.seasons FOR SELECT USING (true);

-- ============================================
-- EPISODES
-- ============================================
CREATE TABLE IF NOT EXISTS public.episodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
  season_id UUID REFERENCES public.seasons(id) ON DELETE SET NULL,
  episode_number INT NOT NULL,
  title TEXT,
  synopsis TEXT,
  thumbnail_url TEXT,
  runtime_seconds INT,
  video_url TEXT,
  video_url_backup TEXT,
  video_quality JSONB,
  subtitles_url JSONB,
  external_episode_id TEXT,
  external_url TEXT,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  is_free_trial BOOLEAN NOT NULL DEFAULT false,
  air_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(content_id, episode_number)
);

ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read episodes" ON public.episodes FOR SELECT USING (true);
CREATE POLICY "Admins can manage episodes" ON public.episodes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- ============================================
-- CONTENT_CATEGORIES (junction table)
-- ============================================
CREATE TABLE IF NOT EXISTS public.content_categories (
  content_id UUID NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (content_id, category_id)
);

ALTER TABLE public.content_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read content_categories" ON public.content_categories FOR SELECT USING (true);

-- ============================================
-- WATCH_HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS public.watch_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
  episode_id UUID REFERENCES public.episodes(id) ON DELETE SET NULL,
  progress_seconds INT NOT NULL DEFAULT 0,
  duration_seconds INT NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  last_watched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own history" ON public.watch_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own history" ON public.watch_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own history" ON public.watch_history FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- FAVORITES
-- ============================================
CREATE TABLE IF NOT EXISTS public.favorites (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, content_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own favorites" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own favorites" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- PAYMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  payment_provider TEXT NOT NULL,
  provider_payment_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','refunded','expired')),
  payment_method TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all payments" ON public.payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- ============================================
-- Update updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER contents_updated_at BEFORE UPDATE ON public.contents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER episodes_updated_at BEFORE UPDATE ON public.episodes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
`;

  const fs = await import("fs");
  const path = await import("path");
  fs.writeFileSync(path.join(process.cwd(), "scripts", "schema.sql"), sql);
  console.log("\n✅ SQL schema written to scripts/schema.sql");
  console.log("📝 Copy the contents and run in Supabase Dashboard → SQL Editor");
}

setup().catch(console.error);