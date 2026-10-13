import { createFileRoute } from "@tanstack/react-router";
import { guideMdBySlug } from "@/lib/guide-md";

/** Markdown twin of a guide page: /guides-md/<slug> returns text/markdown. */
export const Route = createFileRoute("/guides-md/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const md = guideMdBySlug(params.slug);
        if (!md) return new Response("Not found", { status: 404 });
        return new Response(md, {
          headers: {
            "Content-Type": "text/markdown; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
            "X-Robots-Tag": "noindex",
          },
        });
      },
    },
  },
});
