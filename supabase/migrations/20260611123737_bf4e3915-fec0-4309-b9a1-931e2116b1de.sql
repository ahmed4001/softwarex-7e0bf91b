
CREATE TABLE IF NOT EXISTS public.route_redirects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_path text NOT NULL UNIQUE,
  to_path text NOT NULL,
  status_code integer NOT NULL DEFAULT 301,
  source text,
  hit_count integer NOT NULL DEFAULT 0,
  last_hit_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS route_redirects_from_path_idx ON public.route_redirects (from_path);

GRANT SELECT ON public.route_redirects TO anon, authenticated;
GRANT ALL ON public.route_redirects TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.route_redirects TO authenticated;

ALTER TABLE public.route_redirects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read redirects"
  ON public.route_redirects FOR SELECT
  USING (true);

CREATE POLICY "Admins manage redirects"
  ON public.route_redirects FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'superadmin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'superadmin'::app_role));

CREATE TRIGGER trg_route_redirects_updated_at
  BEFORE UPDATE ON public.route_redirects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RPC to increment hits (callable by anyone, restricted to the matching row only)
CREATE OR REPLACE FUNCTION public.increment_redirect_hit(_from_path text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.route_redirects
  SET hit_count = hit_count + 1, last_hit_at = now()
  WHERE from_path = _from_path;
END;
$$;
