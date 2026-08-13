import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SiteProject = {
  id: string;
  name: string;
  image_url: string | null;
  media_type: string;
  site_url: string | null;
  description: string | null;
  extra_info: string | null;
  sort_order: number;
  active: boolean;
};

export type SiteClient = {
  id: string;
  name: string;
  logo_url: string | null;
  media_type: string;
  site_url: string | null;
  sort_order: number;
  active: boolean;
};

export function storageUrl(path: string | null | undefined) {
  return path ? `/api/public/media/${path}` : "";
}

export function useSiteProjects() {
  const [projects, setProjects] = useState<SiteProject[]>([]);
  const load = useCallback(async () => {
    const { data } = await supabase
      .from("site_projects")
      .select("id,name,image_url,media_type,site_url,description,extra_info,sort_order,active")
      .eq("active", true)
      .order("sort_order", { ascending: true });
    setProjects((data as SiteProject[]) ?? []);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  return { projects, reload: load };
}

export function useSiteClients() {
  const [clients, setClients] = useState<SiteClient[]>([]);
  const load = useCallback(async () => {
    const { data } = await supabase
      .from("site_clients")
      .select("id,name,logo_url,media_type,site_url,sort_order,active")
      .eq("active", true)
      .order("sort_order", { ascending: true });
    setClients((data as SiteClient[]) ?? []);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  return { clients, reload: load };
}
