
-- 1. Extend webhook events log
ALTER TABLE public.paddle_webhook_events
  ADD COLUMN IF NOT EXISTS payload jsonb,
  ADD COLUMN IF NOT EXISTS signature_valid boolean NOT NULL DEFAULT true;

-- Admin SELECT on paddle_webhook_events
DROP POLICY IF EXISTS "Admins can view webhook events" ON public.paddle_webhook_events;
CREATE POLICY "Admins can view webhook events" ON public.paddle_webhook_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

GRANT SELECT ON public.paddle_webhook_events TO authenticated;

-- 2. Drift events
CREATE TABLE IF NOT EXISTS public.paddle_drift_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  paddle_subscription_id text,
  fields_changed text[] NOT NULL DEFAULT '{}',
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS paddle_drift_events_user_id_idx ON public.paddle_drift_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS paddle_drift_events_sub_idx ON public.paddle_drift_events (paddle_subscription_id, created_at DESC);

GRANT SELECT ON public.paddle_drift_events TO authenticated;
GRANT ALL ON public.paddle_drift_events TO service_role;
ALTER TABLE public.paddle_drift_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view drift events" ON public.paddle_drift_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

-- 3. Alerts
CREATE TABLE IF NOT EXISTS public.paddle_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,                -- 'signature_failure' | 'repeated_drift' | 'reconcile_error'
  severity text NOT NULL DEFAULT 'warning',  -- 'info'|'warning'|'critical'
  user_id uuid,
  paddle_subscription_id text,
  message text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS paddle_alerts_unresolved_idx
  ON public.paddle_alerts (created_at DESC) WHERE resolved_at IS NULL;

GRANT SELECT, UPDATE ON public.paddle_alerts TO authenticated;
GRANT ALL ON public.paddle_alerts TO service_role;
ALTER TABLE public.paddle_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view alerts" ON public.paddle_alerts
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));
CREATE POLICY "Admins can resolve alerts" ON public.paddle_alerts
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

-- 4. Checkout attempts (concurrent-checkout lock)
CREATE TABLE IF NOT EXISTS public.paddle_checkout_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS paddle_checkout_attempts_active_idx
  ON public.paddle_checkout_attempts (user_id, plan);
GRANT ALL ON public.paddle_checkout_attempts TO service_role;
ALTER TABLE public.paddle_checkout_attempts ENABLE ROW LEVEL SECURITY;
-- No user policies — only service role (edge functions) touches this table.
