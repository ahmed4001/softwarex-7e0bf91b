
CREATE TABLE public.website_url_review_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  candidate_url TEXT NOT NULL,
  candidate_domain TEXT,
  confidence NUMERIC,
  source TEXT,
  candidates JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_wurq_status_created ON public.website_url_review_queue (status, created_at DESC);
CREATE INDEX idx_wurq_product ON public.website_url_review_queue (product_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.website_url_review_queue TO authenticated;
GRANT ALL ON public.website_url_review_queue TO service_role;

ALTER TABLE public.website_url_review_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage website url review queue"
ON public.website_url_review_queue
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'superadmin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'superadmin'::app_role));

CREATE TRIGGER update_wurq_updated_at
BEFORE UPDATE ON public.website_url_review_queue
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
