-- ============================================================
-- STREAMVAULT — Site Settings Table
-- Key-value store for global app configuration
-- Used by: SEO settings, Player provider, and other global configs
-- ============================================================

-- Create the table
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Admins can read/write site_settings
CREATE POLICY "Admins can read site_settings" ON public.site_settings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can insert site_settings" ON public.site_settings
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update site_settings" ON public.site_settings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can delete site_settings" ON public.site_settings
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.site_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS site_settings_updated_at ON public.site_settings;
CREATE TRIGGER site_settings_updated_at BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.site_settings_updated_at();

-- Seed default values
INSERT INTO public.site_settings (key, value) VALUES
  ('active_player_provider', '2embed'),
  ('site_title', 'StreamVault — Premium Streaming'),
  ('tagline', 'Movies, Series, Anime, Donghua & Micro-Dramas'),
  ('description', 'Stream movies, series, anime, donghua, and micro-dramas. Cinematic experience, anytime, anywhere.'),
  ('keywords', 'streaming, movies, series, anime, donghua, micro-drama, watch online'),
  ('og_image', ''),
  ('twitter_handle', '@streamvault'),
  ('logo_url', ''),
  ('icon_url', '')
ON CONFLICT (key) DO NOTHING;
