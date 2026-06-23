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

CREATE POLICY "Anyone can read active banners" ON public.banners FOR SELECT USING (is_active = true);
CREATE POLICY "Admins full access banners" ON public.banners FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

CREATE INDEX IF NOT EXISTS idx_banners_sort_order ON public.banners(sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_banners_active ON public.banners(is_active) WHERE is_active = true;