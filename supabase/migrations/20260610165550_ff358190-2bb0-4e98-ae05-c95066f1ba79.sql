
-- 1. Add Paddle tracking columns
ALTER TABLE public.vendor_subscriptions
  ADD COLUMN IF NOT EXISTS paddle_subscription_id text,
  ADD COLUMN IF NOT EXISTS paddle_customer_id text,
  ADD COLUMN IF NOT EXISTS paddle_price_id text,
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS canceled_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_event_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS vendor_subscriptions_paddle_sub_id_idx
  ON public.vendor_subscriptions (paddle_subscription_id)
  WHERE paddle_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS vendor_subscriptions_user_status_idx
  ON public.vendor_subscriptions (user_id, status);

-- 2. Lock down RLS: drop user INSERT/UPDATE policies. Only service_role
--    (which bypasses RLS) and admins (via existing policy) may write.
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.vendor_subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.vendor_subscriptions;

-- 3. Index for paddle_webhook_events retention queries
CREATE INDEX IF NOT EXISTS paddle_webhook_events_received_at_idx
  ON public.paddle_webhook_events (received_at);

-- 4. Enable pg_cron + pg_net for scheduled reconciliation
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
