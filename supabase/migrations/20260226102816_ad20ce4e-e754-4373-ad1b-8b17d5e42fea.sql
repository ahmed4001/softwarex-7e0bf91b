
-- Normalized pricing tiers table
CREATE TABLE public.product_pricing_tiers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric DEFAULT 0,
  period text DEFAULT 'month',
  description text,
  is_popular boolean DEFAULT false,
  is_enterprise boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  cta_label text,
  cta_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Pricing features table (each feature row can be linked to specific tiers)
CREATE TABLE public.pricing_features (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Junction: which features are included in which tiers
CREATE TABLE public.pricing_tier_features (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tier_id uuid NOT NULL REFERENCES public.product_pricing_tiers(id) ON DELETE CASCADE,
  feature_id uuid NOT NULL REFERENCES public.pricing_features(id) ON DELETE CASCADE,
  value text DEFAULT 'true',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tier_id, feature_id)
);

-- Indexes
CREATE INDEX idx_pricing_tiers_product ON public.product_pricing_tiers(product_id);
CREATE INDEX idx_pricing_features_product ON public.pricing_features(product_id);
CREATE INDEX idx_pricing_tier_features_tier ON public.pricing_tier_features(tier_id);
CREATE INDEX idx_pricing_tier_features_feature ON public.pricing_tier_features(feature_id);

-- RLS
ALTER TABLE public.product_pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_tier_features ENABLE ROW LEVEL SECURITY;

-- Public read for all three
CREATE POLICY "Pricing tiers are publicly readable" ON public.product_pricing_tiers FOR SELECT USING (true);
CREATE POLICY "Pricing features are publicly readable" ON public.pricing_features FOR SELECT USING (true);
CREATE POLICY "Pricing tier features are publicly readable" ON public.pricing_tier_features FOR SELECT USING (true);

-- Admin manage for all three
CREATE POLICY "Admins can manage pricing tiers" ON public.product_pricing_tiers FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));
CREATE POLICY "Admins can manage pricing features" ON public.pricing_features FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));
CREATE POLICY "Admins can manage pricing tier features" ON public.pricing_tier_features FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- Updated_at trigger for pricing tiers
CREATE TRIGGER update_pricing_tiers_updated_at
  BEFORE UPDATE ON public.product_pricing_tiers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
