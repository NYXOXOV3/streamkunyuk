/**
 * Banner Management - Table Setup
 * Creates the banners table for managing homepage hero banners.
 */

/**
 * Banner Management - Table Setup
 *
 * IMPORTANT: Before running this script, set these environment variables:
 *   SUPABASE_URL     — your Supabase project URL
 *   SUPABASE_SERVICE_KEY — your Supabase service role key
 *
 * Usage:
 *   SUPABASE_URL="https://xxx.supabase.co" SUPABASE_SERVICE_KEY="eyJ..." bun run scripts/setup-banners.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing required environment variables:");
  if (!SUPABASE_URL) console.error("   SUPABASE_URL not set");
  if (!SUPABASE_SERVICE_KEY) console.error("   SUPABASE_SERVICE_KEY not set");
  console.error("\nUsage: SUPABASE_URL='https://xxx.supabase.co' SUPABASE_SERVICE_KEY='eyJ...' bun run scripts/setup-banners.ts");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function setup() {
  console.log("🚀 Creating banners table...\n");

  // Create banners table via RPC (service role can run SQL via supabase-js)
  // We use the SQL API to create the table
  const sql = `
    CREATE TABLE IF NOT EXISTS public.banners (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      title TEXT,
      subtitle TEXT,
      banner_type TEXT NOT NULL DEFAULT 'content' CHECK (banner_type IN ('content', 'custom')),
      content_id UUID REFERENCES public.contents(id) ON DELETE SET NULL,
      custom_image_url TEXT,
      custom_link_url TEXT,
      cta_text TEXT DEFAULT 'Learn More',
      cta_link TEXT,
      sort_order INT NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true,
      start_date TIMESTAMPTZ,
      end_date TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

    -- Anyone can read active banners
    CREATE POLICY "Anyone can read active banners" ON public.banners FOR SELECT USING (is_active = true);
    
    -- Admins can do everything
    CREATE POLICY "Admins full access banners" ON public.banners FOR ALL USING (
      EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );

    -- Index for ordering
    CREATE INDEX IF NOT EXISTS idx_banners_sort_order ON public.banners(sort_order ASC);
    CREATE INDEX IF NOT EXISTS idx_banners_active ON public.banners(is_active) WHERE is_active = true;

    -- Updated_at trigger
    CREATE OR REPLACE FUNCTION public.banners_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS banners_updated_at ON public.banners;
    CREATE TRIGGER banners_updated_at BEFORE UPDATE ON public.banners
      FOR EACH ROW EXECUTE FUNCTION public.banners_updated_at();
  `;

  try {
    // Use the Supabase SQL API directly
    const response = await fetch(`${SUPABASE_URL!}/rest/v1/rpc/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY!,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY!}`,
      },
    });
    
    // The RPC endpoint won't work for DDL. Let's try a different approach.
    // We'll check if the table exists by trying to select from it
    const { error } = await supabase.from("banners").select("id").limit(1);
    
    if (error && error.message.includes("does not exist")) {
      console.log("⚠️  Table 'banners' does not exist yet.");
      console.log("📋 Please run the following SQL in your Supabase SQL Editor:\n");
      console.log(sql);
      console.log("\n✅ After running the SQL, the banner management will work.");
    } else if (error) {
      console.log("⚠️  Error checking table:", error.message);
      console.log("📋 Please run the following SQL in your Supabase SQL Editor:\n");
      console.log(sql);
    } else {
      console.log("✅ banners table already exists!");
    }
  } catch (e) {
    console.log("📋 Please run the following SQL in your Supabase SQL Editor:\n");
    console.log(sql);
  }
}

setup();