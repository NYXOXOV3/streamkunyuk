-- ============================================================
-- STREAMVAULT — Tripay Payment Gateway Integration
-- ============================================================

-- 1. Payment gateways config table
CREATE TABLE IF NOT EXISTS public.payment_gateways (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gateway_name TEXT NOT NULL UNIQUE, -- 'tripay'
  display_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_sandbox BOOLEAN NOT NULL DEFAULT true,
  api_key TEXT,
  private_key TEXT,
  merchant_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage payment_gateways" ON public.payment_gateways FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- 2. Subscription plans (admin-configurable pricing & duration)
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(12,2) NOT NULL,
  duration_days INT NOT NULL, -- 30, 90, 365, etc.
  quality TEXT NOT NULL DEFAULT '1080p',
  max_devices INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  features TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active subscription_plans" ON public.subscription_plans FOR SELECT USING (is_active = true OR auth.uid() IN (
  SELECT id FROM public.profiles WHERE is_admin = true
));
CREATE POLICY "Admins can manage subscription_plans" ON public.subscription_plans FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- 3. Payment transactions log
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
  gateway_name TEXT NOT NULL DEFAULT 'tripay',
  gateway_reference TEXT, -- Tripay reference
  merchant_ref TEXT UNIQUE, -- Our internal reference
  amount DECIMAL(12,2) NOT NULL,
  fee_merchant DECIMAL(12,2) NOT NULL DEFAULT 0,
  fee_customer DECIMAL(12,2) NOT NULL DEFAULT 0,
  amount_received DECIMAL(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'UNPAID' CHECK (status IN ('UNPAID','PAID','EXPIRED','FAILED','REFUND')),
  payment_method TEXT,
  payment_name TEXT,
  pay_code TEXT,
  checkout_url TEXT,
  callback_data JSONB,
  paid_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own transactions" ON public.payment_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all transactions" ON public.payment_transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- 4. Seed default subscription plan
INSERT INTO public.subscription_plans (name, display_name, description, price, duration_days, quality, max_devices, features, sort_order) VALUES
  ('basic_monthly', 'Basic Monthly', 'HD streaming, 1 device', 29900, 30, '720p', 1, ARRAY['720p streaming','1 device','Ad-free','5 free trial episodes'], 1),
  ('premium_monthly', 'Premium Monthly', 'Full HD, 2 devices, all content', 59900, 30, '1080p', 2, ARRAY['1080p Full HD','2 devices','Ad-free','All content unlocked','Priority support'], 2),
  ('premium_yearly', 'Premium Yearly', 'Best value — 2 months free!', 599000, 365, '1080p', 3, ARRAY['1080p Full HD','3 devices','Ad-free','All content unlocked','Priority support','Early access'], 3)
ON CONFLICT (name) DO NOTHING;

-- Default Tripay gateway (inactive until configured)
INSERT INTO public.payment_gateways (gateway_name, display_name, is_active, is_sandbox) VALUES
  ('tripay', 'TriPay Indonesia', false, true)
ON CONFLICT (gateway_name) DO NOTHING;

-- Seed default subscription tiers (for backward compatibility with existing code)
UPDATE public.subscription_tiers
SET price_monthly = 59900, price_yearly = 599000, max_quality = '1080p'
WHERE name = 'premium';

INSERT INTO public.subscription_tiers (name, display_name, price_monthly, price_yearly, max_quality, features, is_active, sort_order)
SELECT 'basic', 'Basic', 29900, 299000, '720p', '["720p streaming", "1 device", "Ad-free"]'::jsonb, true, 1
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_tiers WHERE name = 'basic');
