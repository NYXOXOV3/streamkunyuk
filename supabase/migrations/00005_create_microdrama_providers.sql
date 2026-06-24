-- ============================================================
-- STREAMVAULT — Micro-Drama Providers Table
-- Allows admin to manage multiple micro-drama API sources
-- and pick which one is active for importing/streaming
-- ============================================================

CREATE TABLE IF NOT EXISTS public.microdrama_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  base_url TEXT NOT NULL,
  api_key TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  supported_languages TEXT[] NOT NULL DEFAULT '{"id","en"}',
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.microdrama_providers ENABLE ROW LEVEL SECURITY;

-- Admins can manage providers
CREATE POLICY "Admins can read microdrama_providers" ON public.microdrama_providers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can insert microdrama_providers" ON public.microdrama_providers
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update microdrama_providers" ON public.microdrama_providers
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can delete microdrama_providers" ON public.microdrama_providers
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.microdrama_providers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS microdrama_providers_updated_at ON public.microdrama_providers;
CREATE TRIGGER microdrama_providers_updated_at BEFORE UPDATE ON public.microdrama_providers
  FOR EACH ROW EXECUTE FUNCTION public.microdrama_providers_updated_at();

-- Seed default providers
INSERT INTO public.microdrama_providers (provider_name, display_name, description, base_url, is_active, sort_order, supported_languages) VALUES
  ('melolo', 'Melolo Short Drama', 'Indonesian short dramas from Melolo platform. Supports ID, EN, ES, TH, PT, VI, JA, KO languages.', 'https://api.sonzaix.indevs.in/melolo', true, 1, ARRAY['id','en','es','th','pt','vi','ja','ko']),
  ('dramabox', 'DramaBox', 'Short drama content from DramaBox (placeholder — configure URL & API key in settings).', 'https://api.dramabox.com/v1', false, 2, ARRAY['en','id']),
  ('flickshort', 'FlickShort', 'Short drama content from FlickShort (placeholder — configure URL & API key in settings).', 'https://api.flickshort.com/v1', false, 3, ARRAY['en','id'])
ON CONFLICT (provider_name) DO NOTHING;
