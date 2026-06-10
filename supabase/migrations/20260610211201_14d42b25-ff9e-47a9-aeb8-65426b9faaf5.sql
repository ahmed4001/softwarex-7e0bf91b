CREATE TABLE public.profile_backfill_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_backfill_settings TO authenticated;
GRANT ALL ON public.profile_backfill_settings TO service_role;

ALTER TABLE public.profile_backfill_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own backfill settings"
  ON public.profile_backfill_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own backfill settings"
  ON public.profile_backfill_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own backfill settings"
  ON public.profile_backfill_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own backfill settings"
  ON public.profile_backfill_settings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

INSERT INTO public.profile_backfill_settings (user_id, settings, created_at, updated_at)
SELECT user_id, backfill_runner_settings, now(), now()
FROM public.profiles
WHERE backfill_runner_settings IS NOT NULL
ON CONFLICT (user_id) DO UPDATE SET settings = EXCLUDED.settings, updated_at = now();

CREATE OR REPLACE FUNCTION public.update_profile_backfill_settings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE TRIGGER update_profile_backfill_settings_updated_at
BEFORE UPDATE ON public.profile_backfill_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_profile_backfill_settings_updated_at();