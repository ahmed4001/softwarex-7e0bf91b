
-- Track affiliate outbound clicks
CREATE TABLE public.affiliate_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID,
  referrer_url TEXT,
  destination_url TEXT NOT NULL,
  ip_hash TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (tracking clicks)
CREATE POLICY "Anyone can log affiliate clicks"
  ON public.affiliate_clicks FOR INSERT
  WITH CHECK (true);

-- Admins can read all clicks
CREATE POLICY "Admins can manage affiliate clicks"
  ON public.affiliate_clicks FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- Add affiliate_url column to products for custom affiliate links
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS affiliate_url TEXT;

-- Create index for analytics queries
CREATE INDEX idx_affiliate_clicks_product ON public.affiliate_clicks(product_id);
CREATE INDEX idx_affiliate_clicks_created ON public.affiliate_clicks(created_at);

-- Increment click_count on products when affiliate click is logged
CREATE OR REPLACE FUNCTION public.increment_product_click()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE products SET click_count = COALESCE(click_count, 0) + 1 WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_increment_product_click
  AFTER INSERT ON public.affiliate_clicks
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_product_click();
