
-- Table: vendor_subscriptions
CREATE TABLE public.vendor_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  plan text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view own subscription"
  ON public.vendor_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owners can update own subscription"
  ON public.vendor_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage vendor subscriptions"
  ON public.vendor_subscriptions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- Table: vendor_leads
CREATE TABLE public.vendor_leads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL,
  vendor_user_id uuid NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  company text,
  message text,
  source text NOT NULL DEFAULT 'product_page',
  status text NOT NULL DEFAULT 'new',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view own leads"
  ON public.vendor_leads FOR SELECT
  USING (auth.uid() = vendor_user_id);

CREATE POLICY "Vendors can update own leads"
  ON public.vendor_leads FOR UPDATE
  USING (auth.uid() = vendor_user_id);

CREATE POLICY "Anyone can submit a lead"
  ON public.vendor_leads FOR INSERT
  WITH CHECK (email IS NOT NULL AND email <> '');

CREATE POLICY "Admins can manage vendor leads"
  ON public.vendor_leads FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

CREATE TRIGGER update_vendor_leads_updated_at
  BEFORE UPDATE ON public.vendor_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Table: vendor_sponsored_requests
CREATE TABLE public.vendor_sponsored_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  tier text NOT NULL,
  start_date date,
  end_date date,
  status text NOT NULL DEFAULT 'pending',
  budget numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_sponsored_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view own sponsored requests"
  ON public.vendor_sponsored_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Owners can create sponsored requests"
  ON public.vendor_sponsored_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage sponsored requests"
  ON public.vendor_sponsored_requests FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));
