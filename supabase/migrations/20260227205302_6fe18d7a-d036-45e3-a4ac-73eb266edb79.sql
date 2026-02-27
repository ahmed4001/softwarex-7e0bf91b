
-- Admin can manage partner_links
CREATE POLICY "Admins can manage partner links"
  ON public.partner_links FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));
