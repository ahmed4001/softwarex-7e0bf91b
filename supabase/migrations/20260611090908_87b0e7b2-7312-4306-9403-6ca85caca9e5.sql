ALTER TABLE public.affiliate_clicks ADD COLUMN deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.increment_deal_click(_deal_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE deals SET click_count = click_count + 1 WHERE id = _deal_id;
END;
$function$;

GRANT ALL ON public.deals TO service_role;
