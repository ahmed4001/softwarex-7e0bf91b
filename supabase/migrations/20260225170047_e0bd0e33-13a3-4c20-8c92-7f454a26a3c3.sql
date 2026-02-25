
-- Create a view that only includes comparisons where both products are active
CREATE OR REPLACE VIEW public.active_comparisons AS
SELECT c.*
FROM comparisons c
WHERE c.is_published = true
  AND EXISTS (
    SELECT 1 FROM products p
    WHERE p.id = (c.product_ids->>0)::uuid
      AND p.is_active = true
  )
  AND EXISTS (
    SELECT 1 FROM products p
    WHERE p.id = (c.product_ids->>1)::uuid
      AND p.is_active = true
  );
