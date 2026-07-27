import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/media/$")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const path = (params as { _splat?: string })._splat ?? "";
        if (!path || path.includes("..")) return new Response("Not found", { status: 404 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage
          .from("site-media")
          .createSignedUrl(path, 60 * 60);
        if (error || !data?.signedUrl) return new Response("Not found", { status: 404 });
        const range = request.headers.get("range");
        const upstream = await fetch(data.signedUrl, {
          headers: range ? { range } : undefined,
        });
        const headers = new Headers();
        const copy = ["content-type", "content-length", "content-range", "accept-ranges", "etag"];
        copy.forEach((h) => {
          const v = upstream.headers.get(h);
          if (v) headers.set(h, v);
        });
        headers.set("cache-control", "public, max-age=300");
        return new Response(upstream.body, { status: upstream.status, headers });
      },
    },
  },
});