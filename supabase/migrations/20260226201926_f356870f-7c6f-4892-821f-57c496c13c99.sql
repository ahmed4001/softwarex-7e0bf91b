
-- Fix overly permissive policies: use service_role check instead of true
DROP POLICY IF EXISTS "Service can insert recommendations" ON public.user_recommendations;
DROP POLICY IF EXISTS "Service can delete recommendations" ON public.user_recommendations;

-- The edge function uses service_role key which bypasses RLS entirely,
-- so we don't need these permissive policies at all.
-- Recommendations are inserted by edge function (service role bypasses RLS).
-- Only users reading own + admins managing remain.
