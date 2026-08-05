import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/media/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = (params as { _splat?: string })._splat ?? "";
        if (!path || path.includes("..")) return new Response("Not found", { status: 404 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage
          .from("site-media")
          .createSignedUrl(path, 60 * 60);
        if (error || !data?.signedUrl) return new Response("Not found", { status: 404 });
        return new Response(null, {
          status: 307,
          headers: {
            location: data.signedUrl,
            "cache-control": "public, max-age=300, stale-while-revalidate=3600",
          },
        });
      },
    },
  },
});