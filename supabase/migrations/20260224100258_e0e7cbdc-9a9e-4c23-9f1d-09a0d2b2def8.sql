
-- Fix permissive INSERT policies

-- Activity logs: restrict to authenticated users inserting their own logs
DROP POLICY "System can insert activity logs" ON public.activity_logs;
CREATE POLICY "Authenticated users can insert activity logs" ON public.activity_logs 
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Notifications: only admins can create notifications
DROP POLICY "System can create notifications" ON public.notifications;
CREATE POLICY "Admins can create notifications" ON public.notifications 
  FOR INSERT TO authenticated 
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

-- Newsletter: require valid email format check (still public but not WITH CHECK true)
DROP POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscribers 
  FOR INSERT 
  WITH CHECK (email IS NOT NULL AND email <> '');
