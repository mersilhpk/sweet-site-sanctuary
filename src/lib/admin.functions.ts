import { createServerFn } from "@tanstack/react-start";

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((data: { username: string; password: string }) => data)
  .handler(async ({ data }) => {
    const { getAdminSession, matches } = await import("./admin-session.server");
    const user = process.env.ADMIN_USERNAME ?? "";
    const pass = process.env.ADMIN_PASSWORD ?? "";
    if (!user || !pass) return { ok: false as const };
    const ok =
      matches((data.username ?? "").trim().toLowerCase(), user.trim().toLowerCase()) &&
      matches(data.password ?? "", pass);
    if (!ok) return { ok: false as const };
    const session = await getAdminSession();
    await session.update({ admin: true });
    return { ok: true as const };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const { getAdminSession } = await import("./admin-session.server");
  const session = await getAdminSession();
  await session.clear();
  return { ok: true as const };
});

export const adminStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { getAdminSession } = await import("./admin-session.server");
  const session = await getAdminSession();
  return { admin: Boolean(session.data.admin) };
});

export const requestUpload = createServerFn({ method: "POST" })
  .inputValidator((data: { slot: string; ext: string }) => data)
  .handler(async ({ data }) => {
    const { assertAdmin } = await import("./admin-session.server");
    await assertAdmin();
    const slot = data.slot.replace(/[^a-z0-9_-]/gi, "").slice(0, 40);
    const ext = (data.ext || "bin").replace(/[^a-z0-9]/gi, "").slice(0, 5).toLowerCase();
    if (!slot) throw new Error("Slot inválido");
    const bucket = "site-media";
    const path = `${slot}/${Date.now()}.${ext}`;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUploadUrl(path);
    if (error || !signed) throw new Error(error?.message ?? "Falha ao preparar upload");
    return { path: signed.path, token: signed.token, bucket };
  });

export const saveMedia = createServerFn({ method: "POST" })
  .inputValidator((data: { slot: string; path: string; mediaType: "image" | "video" }) => data)
  .handler(async ({ data }) => {
    const { assertAdmin } = await import("./admin-session.server");
    await assertAdmin();
    const slot = data.slot.replace(/[^a-z0-9_-]/gi, "").slice(0, 40);
    if (!slot || !data.path) throw new Error("Dados inválidos");
    const mediaType = data.mediaType === "video" ? "video" : "image";
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: previous } = await supabaseAdmin
      .from("site_media")
      .select("url")
      .eq("slot", slot)
      .maybeSingle();
    const { error } = await supabaseAdmin
      .from("site_media")
      .upsert(
        { slot, url: data.path, media_type: mediaType, updated_at: new Date().toISOString() },
        { onConflict: "slot" },
      );
    if (error) throw new Error(error.message);
    if (previous?.url && previous.url !== data.path) {
      const { error: removeError } = await supabaseAdmin.storage
        .from("site-media")
        .remove([previous.url]);
      if (removeError) console.error("Falha ao remover mídia substituída", removeError.message);
    }
    return { ok: true as const, slot, url: `/api/public/media/${data.path}`, mediaType };
  });

export const removeMedia = createServerFn({ method: "POST" })
  .inputValidator((data: { slot: string }) => data)
  .handler(async ({ data }) => {
    const { assertAdmin } = await import("./admin-session.server");
    await assertAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: previous } = await supabaseAdmin
      .from("site_media")
      .select("url")
      .eq("slot", data.slot)
      .maybeSingle();
    const { error } = await supabaseAdmin.from("site_media").delete().eq("slot", data.slot);
    if (error) throw new Error(error.message);
    if (previous?.url) {
      const { error: removeError } = await supabaseAdmin.storage
        .from("site-media")
        .remove([previous.url]);
      if (removeError) throw new Error(removeError.message);
    }
    return { ok: true as const };
  });
type ProjectInput = {
  id?: string;
  name: string;
  image_url?: string | null;
  media_type?: string;
  site_url?: string | null;
  description?: string | null;
  extra_info?: string | null;
  sort_order?: number;
  active?: boolean;
};

type ClientInput = {
  id?: string;
  name: string;
  logo_url?: string | null;
  media_type?: string;
  site_url?: string | null;
  sort_order?: number;
  active?: boolean;
};

export const listProjectsAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const { assertAdmin } = await import("./admin-session.server");
  await assertAdmin();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("site_projects")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return { items: data ?? [] };
});

export const saveProject = createServerFn({ method: "POST" })
  .inputValidator((data: ProjectInput) => data)
  .handler(async ({ data }) => {
    const { assertAdmin } = await import("./admin-session.server");
    await assertAdmin();
    if (!data.name?.trim()) throw new Error("Nome obrigatório");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const row = {
      name: data.name.trim(),
      image_url: data.image_url ?? null,
      media_type: data.media_type === "video" ? "video" : "image",
      site_url: data.site_url ?? null,
      description: data.description ?? null,
      extra_info: data.extra_info ?? null,
      sort_order: Number.isFinite(data.sort_order) ? Number(data.sort_order) : 0,
      active: data.active !== false,
    };
    if (data.id) {
      const { data: prev } = await supabaseAdmin
        .from("site_projects")
        .select("image_url")
        .eq("id", data.id)
        .maybeSingle();
      const { error } = await supabaseAdmin.from("site_projects").update(row).eq("id", data.id);
      if (error) throw new Error(error.message);
      if (prev?.image_url && row.image_url && prev.image_url !== row.image_url) {
        await supabaseAdmin.storage.from("site-media").remove([prev.image_url]);
      }
      return { ok: true as const, id: data.id };
    }
    const { data: inserted, error } = await supabaseAdmin
      .from("site_projects")
      .insert(row)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true as const, id: inserted.id };
  });

export const deleteProject = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const { assertAdmin } = await import("./admin-session.server");
    await assertAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prev } = await supabaseAdmin
      .from("site_projects")
      .select("image_url")
      .eq("id", data.id)
      .maybeSingle();
    const { error } = await supabaseAdmin.from("site_projects").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    if (prev?.image_url) await supabaseAdmin.storage.from("site-media").remove([prev.image_url]);
    return { ok: true as const };
  });

export const listClientsAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const { assertAdmin } = await import("./admin-session.server");
  await assertAdmin();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("site_clients")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return { items: data ?? [] };
});

export const saveClient = createServerFn({ method: "POST" })
  .inputValidator((data: ClientInput) => data)
  .handler(async ({ data }) => {
    const { assertAdmin } = await import("./admin-session.server");
    await assertAdmin();
    if (!data.name?.trim()) throw new Error("Nome obrigatório");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const row = {
      name: data.name.trim(),
      logo_url: data.logo_url ?? null,
      media_type: data.media_type === "video" ? "video" : "image",
      site_url: data.site_url ?? null,
      sort_order: Number.isFinite(data.sort_order) ? Number(data.sort_order) : 0,
      active: data.active !== false,
    };
    if (data.id) {
      const { data: prev } = await supabaseAdmin
        .from("site_clients")
        .select("logo_url")
        .eq("id", data.id)
        .maybeSingle();
      const { error } = await supabaseAdmin.from("site_clients").update(row).eq("id", data.id);
      if (error) throw new Error(error.message);
      if (prev?.logo_url && row.logo_url && prev.logo_url !== row.logo_url) {
        await supabaseAdmin.storage.from("site-media").remove([prev.logo_url]);
      }
      return { ok: true as const, id: data.id };
    }
    const { data: inserted, error } = await supabaseAdmin
      .from("site_clients")
      .insert(row)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true as const, id: inserted.id };
  });

export const deleteClient = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const { assertAdmin } = await import("./admin-session.server");
    await assertAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prev } = await supabaseAdmin
      .from("site_clients")
      .select("logo_url")
      .eq("id", data.id)
      .maybeSingle();
    const { error } = await supabaseAdmin.from("site_clients").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    if (prev?.logo_url) await supabaseAdmin.storage.from("site-media").remove([prev.logo_url]);
    return { ok: true as const };
  });
