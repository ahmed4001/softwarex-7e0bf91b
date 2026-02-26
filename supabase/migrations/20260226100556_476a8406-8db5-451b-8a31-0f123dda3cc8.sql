
-- 1. Create review_qa table
CREATE TABLE public.review_qa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  user_id uuid NOT NULL,
  parent_id uuid REFERENCES public.review_qa(id) ON DELETE CASCADE,
  body text NOT NULL,
  is_vendor_answer boolean NOT NULL DEFAULT false,
  upvote_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Create review_qa_votes table
CREATE TABLE public.review_qa_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qa_id uuid NOT NULL REFERENCES public.review_qa(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(qa_id, user_id)
);

-- 3. Add pros_tags and cons_tags to reviews
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS pros_tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS cons_tags jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 4. Enable RLS
ALTER TABLE public.review_qa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_qa_votes ENABLE ROW LEVEL SECURITY;

-- 5. RLS for review_qa
CREATE POLICY "Active Q&A publicly readable"
  ON public.review_qa FOR SELECT
  USING (status = 'active');

CREATE POLICY "Users can create Q&A"
  ON public.review_qa FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own Q&A"
  ON public.review_qa FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own Q&A"
  ON public.review_qa FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage Q&A"
  ON public.review_qa FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- 6. RLS for review_qa_votes
CREATE POLICY "Q&A votes publicly readable"
  ON public.review_qa_votes FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own Q&A votes"
  ON public.review_qa_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own Q&A votes"
  ON public.review_qa_votes FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Trigger to sync upvote_count
CREATE OR REPLACE FUNCTION public.update_qa_upvote_count()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE review_qa SET upvote_count = (SELECT COUNT(*) FROM review_qa_votes WHERE qa_id = OLD.qa_id) WHERE id = OLD.qa_id;
    RETURN OLD;
  ELSE
    UPDATE review_qa SET upvote_count = (SELECT COUNT(*) FROM review_qa_votes WHERE qa_id = NEW.qa_id) WHERE id = NEW.qa_id;
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER trg_update_qa_upvote_count
  AFTER INSERT OR DELETE ON public.review_qa_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_qa_upvote_count();

-- 8. Updated_at trigger on review_qa
CREATE TRIGGER update_review_qa_updated_at
  BEFORE UPDATE ON public.review_qa
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
