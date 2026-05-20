CREATE TABLE IF NOT EXISTS public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  parent_id uuid REFERENCES public.post_comments(id) ON DELETE CASCADE,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'approved',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post ON public.post_comments(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_comments_user ON public.post_comments(user_id);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments on published posts are publicly readable"
ON public.post_comments FOR SELECT
USING (status = 'approved' AND EXISTS (
  SELECT 1 FROM public.blog_posts bp WHERE bp.id = post_comments.post_id AND bp.status = 'published'
));

CREATE POLICY "Authenticated users can create comments"
ON public.post_comments FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
ON public.post_comments FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
ON public.post_comments FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all comments"
ON public.post_comments FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

CREATE TRIGGER update_post_comments_updated_at
BEFORE UPDATE ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();