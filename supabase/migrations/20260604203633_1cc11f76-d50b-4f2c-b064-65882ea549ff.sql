
-- DEALS TABLE
CREATE TABLE public.deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  description text,
  deal_url text NOT NULL,
  discount_amount text,
  discount_type text DEFAULT 'percent',
  coupon_code text,
  category text,
  start_date timestamptz,
  end_date timestamptz,
  is_featured boolean NOT NULL DEFAULT false,
  is_trending boolean NOT NULL DEFAULT false,
  is_visible boolean NOT NULL DEFAULT true,
  click_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.deals TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deals TO authenticated;
GRANT ALL ON public.deals TO service_role;

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view visible deals"
ON public.deals FOR SELECT
USING (is_visible = true OR public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'superadmin'::app_role));

CREATE POLICY "Admins manage deals"
ON public.deals FOR ALL
TO authenticated
USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'superadmin'::app_role))
WITH CHECK (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'superadmin'::app_role));

CREATE TRIGGER deals_updated_at BEFORE UPDATE ON public.deals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_deals_visible ON public.deals(is_visible);
CREATE INDEX idx_deals_featured ON public.deals(is_featured);
CREATE INDEX idx_deals_end_date ON public.deals(end_date);
CREATE INDEX idx_deals_category ON public.deals(category);

-- DEAL ALERT SUBSCRIBERS
CREATE TABLE public.deal_alert_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.deal_alert_subscribers TO anon, authenticated;
GRANT SELECT, DELETE ON public.deal_alert_subscribers TO authenticated;
GRANT ALL ON public.deal_alert_subscribers TO service_role;

ALTER TABLE public.deal_alert_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe"
ON public.deal_alert_subscribers FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins view subscribers"
ON public.deal_alert_subscribers FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'superadmin'::app_role));

CREATE POLICY "Admins delete subscribers"
ON public.deal_alert_subscribers FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'superadmin'::app_role));
