
-- One-time backfill: set product_count to the real number of products
UPDATE public.categories c
SET product_count = sub.cnt
FROM (
  SELECT category_id, COUNT(*)::int AS cnt
  FROM public.products
  WHERE category_id IS NOT NULL
  GROUP BY category_id
) sub
WHERE c.id = sub.category_id;

-- Zero out categories with no products
UPDATE public.categories
SET product_count = 0
WHERE id NOT IN (SELECT DISTINCT category_id FROM public.products WHERE category_id IS NOT NULL);

-- Keep counts in sync automatically
CREATE OR REPLACE FUNCTION public.sync_category_product_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.category_id IS NOT NULL THEN
      UPDATE public.categories
      SET product_count = (SELECT COUNT(*) FROM public.products WHERE category_id = NEW.category_id)
      WHERE id = NEW.category_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.category_id IS NOT NULL THEN
      UPDATE public.categories
      SET product_count = (SELECT COUNT(*) FROM public.products WHERE category_id = OLD.category_id)
      WHERE id = OLD.category_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.category_id IS DISTINCT FROM OLD.category_id THEN
      IF OLD.category_id IS NOT NULL THEN
        UPDATE public.categories
        SET product_count = (SELECT COUNT(*) FROM public.products WHERE category_id = OLD.category_id)
        WHERE id = OLD.category_id;
      END IF;
      IF NEW.category_id IS NOT NULL THEN
        UPDATE public.categories
        SET product_count = (SELECT COUNT(*) FROM public.products WHERE category_id = NEW.category_id)
        WHERE id = NEW.category_id;
      END IF;
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_category_product_count ON public.products;
CREATE TRIGGER trg_sync_category_product_count
AFTER INSERT OR UPDATE OF category_id OR DELETE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.sync_category_product_count();
