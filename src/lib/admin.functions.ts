import { createServerFn } from "@tanstack/react-start";

const BUCKET = "site-media";

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
    const path = `${slot}/${Date.now()}.${ext}`;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUploadUrl(path);
    if (error || !signed) throw new Error(error?.message ?? "Falha ao preparar upload");
    return { path: signed.path, token: signed.token, bucket: BUCKET };
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
    const { error } = await supabaseAdmin
      .from("site_media")
      .upsert(
        { slot, url: data.path, media_type: mediaType, updated_at: new Date().toISOString() },
        { onConflict: "slot" },
      );
    if (error) throw new Error(error.message);
    return { ok: true as const, slot, url: `/api/public/media/${data.path}`, mediaType };
  });

export const removeMedia = createServerFn({ method: "POST" })
  .inputValidator((data: { slot: string }) => data)
  .handler(async ({ data }) => {
    const { assertAdmin } = await import("./admin-session.server");
    await assertAdmin();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("site_media").delete().eq("slot", data.slot);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });