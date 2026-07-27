CREATE TABLE public.site_media (
  slot TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_media TO anon;
GRANT SELECT ON public.site_media TO authenticated;
GRANT ALL ON public.site_media TO service_role;
ALTER TABLE public.site_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Site media is publicly readable" ON public.site_media FOR SELECT TO anon, authenticated USING (true);