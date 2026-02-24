
-- Add rich comparison content columns
ALTER TABLE public.comparisons
  ADD COLUMN slug text,
  ADD COLUMN summary text,
  ADD COLUMN winner_verdict text,
  ADD COLUMN winner_product_id uuid REFERENCES public.products(id),
  ADD COLUMN category_id uuid REFERENCES public.categories(id),
  ADD COLUMN product_a_score numeric DEFAULT 0,
  ADD COLUMN product_b_score numeric DEFAULT 0,
  ADD COLUMN feature_scores jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN pros_a jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN cons_a jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN pros_b jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN cons_b jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN best_for_a text,
  ADD COLUMN best_for_b text,
  ADD COLUMN seo_title text,
  ADD COLUMN seo_description text;

-- Backfill slugs with unique suffix to prevent duplicates
WITH slugged AS (
  SELECT 
    id,
    LOWER(
      REGEXP_REPLACE(
        REGEXP_REPLACE(COALESCE(title, id::text), '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      )
    ) as base_slug,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(
        REGEXP_REPLACE(
          REGEXP_REPLACE(COALESCE(title, id::text), '[^a-zA-Z0-9\s-]', '', 'g'),
          '\s+', '-', 'g'
        )
      )
      ORDER BY created_at
    ) as rn
  FROM public.comparisons
)
UPDATE public.comparisons c
SET slug = CASE 
  WHEN s.rn = 1 THEN s.base_slug
  ELSE s.base_slug || '-' || s.rn
END
FROM slugged s
WHERE c.id = s.id;

-- Now add unique constraint
ALTER TABLE public.comparisons ADD CONSTRAINT comparisons_slug_key UNIQUE (slug);

-- Index for fast lookups
CREATE INDEX idx_comparisons_slug ON public.comparisons(slug);
