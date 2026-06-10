
CREATE TABLE public.paddle_reprocess_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  admin_email text,
  event_id text NOT NULL,
  event_type text,
  target_user_id uuid,
  plan text,
  status text NOT NULL,
  actions jsonb,
  error text,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.paddle_reprocess_audit TO authenticated;
GRANT ALL ON public.paddle_reprocess_audit TO service_role;

ALTER TABLE public.paddle_reprocess_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view reprocess audit log"
ON public.paddle_reprocess_audit
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'superadmin'::app_role));

CREATE INDEX idx_paddle_reprocess_audit_admin_created
  ON public.paddle_reprocess_audit (admin_user_id, created_at DESC);
CREATE INDEX idx_paddle_reprocess_audit_event_created
  ON public.paddle_reprocess_audit (event_id, created_at DESC);
CREATE INDEX idx_paddle_reprocess_audit_created
  ON public.paddle_reprocess_audit (created_at DESC);
