
-- Feature 2: Review Verification Badges
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin_verified boolean DEFAULT false;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS verification_method text;

-- Feature 4: Weekly Email Digest
CREATE TABLE IF NOT EXISTS public.digest_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  recipient_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'sent'
);

ALTER TABLE public.digest_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage digest logs"
  ON public.digest_logs FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- Feature 5: Product Watchlists
CREATE TABLE IF NOT EXISTS public.product_watches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
  watch_type text NOT NULL DEFAULT 'product',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

ALTER TABLE public.product_watches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own watches"
  ON public.product_watches FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watches"
  ON public.product_watches FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own watches"
  ON public.product_watches FOR DELETE USING (auth.uid() = user_id);

-- Trigger: notify watchers when a new review is posted
CREATE OR REPLACE FUNCTION public.notify_product_watchers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, link)
  SELECT pw.user_id,
    'New review on a watched product',
    'A new review was posted on a product you are watching.',
    'product_watch',
    '/product/' || (SELECT slug FROM products WHERE id = NEW.product_id)
  FROM product_watches pw
  WHERE pw.product_id = NEW.product_id
    AND pw.user_id != NEW.user_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_watchers_on_review
  AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.notify_product_watchers();

-- Feature 8: Annual Awards / Voting
CREATE TABLE IF NOT EXISTS public.award_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  year integer NOT NULL DEFAULT 2026,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.award_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Award categories are publicly readable"
  ON public.award_categories FOR SELECT USING (true);

CREATE POLICY "Admins can manage award categories"
  ON public.award_categories FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

CREATE TABLE IF NOT EXISTS public.award_nominations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  award_category_id uuid NOT NULL REFERENCES public.award_categories(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  nominated_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (award_category_id, product_id)
);

ALTER TABLE public.award_nominations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nominations are publicly readable"
  ON public.award_nominations FOR SELECT USING (true);

CREATE POLICY "Authenticated users can nominate"
  ON public.award_nominations FOR INSERT
  WITH CHECK (auth.uid() = nominated_by);

CREATE POLICY "Admins can manage nominations"
  ON public.award_nominations FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

CREATE TABLE IF NOT EXISTS public.award_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  award_category_id uuid NOT NULL REFERENCES public.award_categories(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (award_category_id, user_id)
);

ALTER TABLE public.award_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Votes are publicly readable"
  ON public.award_votes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote"
  ON public.award_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes"
  ON public.award_votes FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage votes"
  ON public.award_votes FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));
