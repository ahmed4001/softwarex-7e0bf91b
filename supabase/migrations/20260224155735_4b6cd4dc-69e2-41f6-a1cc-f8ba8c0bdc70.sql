
-- Create function to recalculate product ratings from approved reviews
CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target_product_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_product_id := OLD.product_id;
  ELSE
    target_product_id := NEW.product_id;
  END IF;

  UPDATE products SET
    avg_rating = COALESCE((SELECT AVG(overall_rating)::numeric FROM reviews WHERE product_id = target_product_id AND status = 'approved'), 0),
    total_reviews = COALESCE((SELECT COUNT(*) FROM reviews WHERE product_id = target_product_id AND status = 'approved'), 0)
  WHERE id = target_product_id;

  -- Handle product change on UPDATE
  IF TG_OP = 'UPDATE' AND OLD.product_id IS DISTINCT FROM NEW.product_id THEN
    UPDATE products SET
      avg_rating = COALESCE((SELECT AVG(overall_rating)::numeric FROM reviews WHERE product_id = OLD.product_id AND status = 'approved'), 0),
      total_reviews = COALESCE((SELECT COUNT(*) FROM reviews WHERE product_id = OLD.product_id AND status = 'approved'), 0)
    WHERE id = OLD.product_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger
CREATE TRIGGER update_product_rating_on_review
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_product_rating();

-- One-time sync of all existing ratings
UPDATE products SET
  avg_rating = COALESCE(sub.avg_r, 0),
  total_reviews = COALESCE(sub.cnt, 0)
FROM (
  SELECT product_id, AVG(overall_rating)::numeric AS avg_r, COUNT(*) AS cnt
  FROM reviews WHERE status = 'approved'
  GROUP BY product_id
) sub
WHERE products.id = sub.product_id;
