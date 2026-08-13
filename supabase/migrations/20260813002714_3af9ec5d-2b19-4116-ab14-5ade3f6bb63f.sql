CREATE TABLE public.site_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  image_url text,
  media_type text NOT NULL DEFAULT 'image',
  site_url text,
  description text,
  extra_info text,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_projects TO anon, authenticated;
GRANT ALL ON public.site_projects TO service_role;
ALTER TABLE public.site_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active projects are publicly readable" ON public.site_projects FOR SELECT TO anon, authenticated USING (active = true);

CREATE TABLE public.site_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  media_type text NOT NULL DEFAULT 'image',
  site_url text,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_clients TO anon, authenticated;
GRANT ALL ON public.site_clients TO service_role;
ALTER TABLE public.site_clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active clients are publicly readable" ON public.site_clients FOR SELECT TO anon, authenticated USING (active = true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_site_projects_updated_at BEFORE UPDATE ON public.site_projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_site_clients_updated_at BEFORE UPDATE ON public.site_clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();