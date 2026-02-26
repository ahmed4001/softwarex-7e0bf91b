
-- Function to sync upvote_count on lists
CREATE OR REPLACE FUNCTION public.update_list_upvote_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE lists SET upvote_count = (SELECT COUNT(*) FROM list_votes WHERE list_id = OLD.list_id) WHERE id = OLD.list_id;
    RETURN OLD;
  ELSE
    UPDATE lists SET upvote_count = (SELECT COUNT(*) FROM list_votes WHERE list_id = NEW.list_id) WHERE id = NEW.list_id;
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER update_list_upvote_count_trigger
  AFTER INSERT OR DELETE ON public.list_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_list_upvote_count();
