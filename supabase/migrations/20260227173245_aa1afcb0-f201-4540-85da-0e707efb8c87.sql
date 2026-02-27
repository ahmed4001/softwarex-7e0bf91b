
-- Add info_score column (0-5 scale based on data completeness)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS info_score integer NOT NULL DEFAULT 0;

-- Populate info_score for all existing products
UPDATE public.products SET info_score = 
  (CASE WHEN description IS NOT NULL AND description != '' THEN 1 ELSE 0 END) +
  (CASE WHEN tagline IS NOT NULL AND tagline != '' THEN 1 ELSE 0 END) +
  (CASE WHEN logo_url IS NOT NULL AND logo_url != '' THEN 1 ELSE 0 END) +
  (CASE WHEN website_url IS NOT NULL AND website_url != '' THEN 1 ELSE 0 END) +
  (CASE WHEN screenshots IS NOT NULL AND screenshots != '[]'::jsonb AND screenshots != 'null'::jsonb THEN 1 ELSE 0 END);

-- Create index for efficient sorting
CREATE INDEX idx_products_info_score ON public.products (info_score DESC);

-- Trigger to auto-update info_score on insert/update
CREATE OR REPLACE FUNCTION public.update_product_info_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.info_score := 
    (CASE WHEN NEW.description IS NOT NULL AND NEW.description != '' THEN 1 ELSE 0 END) +
    (CASE WHEN NEW.tagline IS NOT NULL AND NEW.tagline != '' THEN 1 ELSE 0 END) +
    (CASE WHEN NEW.logo_url IS NOT NULL AND NEW.logo_url != '' THEN 1 ELSE 0 END) +
    (CASE WHEN NEW.website_url IS NOT NULL AND NEW.website_url != '' THEN 1 ELSE 0 END) +
    (CASE WHEN NEW.screenshots IS NOT NULL AND NEW.screenshots != '[]'::jsonb AND NEW.screenshots != 'null'::jsonb THEN 1 ELSE 0 END);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_update_product_info_score
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_product_info_score();
