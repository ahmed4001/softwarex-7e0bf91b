UPDATE public.deals d
SET slug = regexp_replace(d.slug, '-[0-9]+$', '')
WHERE d.slug ~ '-[0-9]+$'
  AND NOT EXISTS (
    SELECT 1 FROM public.deals d2
    WHERE d2.slug = regexp_replace(d.slug, '-[0-9]+$', '')
      AND d2.id <> d.id
  );