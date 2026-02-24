
-- Table to cache pre-generated UI translations
CREATE TABLE public.ui_translations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lang_code text NOT NULL UNIQUE,
  translations jsonb NOT NULL DEFAULT '{}'::jsonb,
  version text NOT NULL DEFAULT '1',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ui_translations ENABLE ROW LEVEL SECURITY;

-- Anyone can read translations (public cache)
CREATE POLICY "Translations are publicly readable"
  ON public.ui_translations FOR SELECT
  USING (true);

-- Only admins can manage translations
CREATE POLICY "Admins can manage translations"
  ON public.ui_translations FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_ui_translations_updated_at
  BEFORE UPDATE ON public.ui_translations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for fast lookup
CREATE INDEX idx_ui_translations_lang ON public.ui_translations (lang_code);
