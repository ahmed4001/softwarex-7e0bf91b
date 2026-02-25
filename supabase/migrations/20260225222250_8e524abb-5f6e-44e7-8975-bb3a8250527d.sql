
-- Add missing SEO columns to pages table
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS seo_keywords text;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS canonical_url text;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS og_image text;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS robots text DEFAULT 'index, follow';
