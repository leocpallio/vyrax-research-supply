import { createFileRoute } from "@tanstack/react-router";
import { buildPricingMd } from "@/lib/llm-feeds";

export const Route = createFileRoute("/pricing.md")({
  server: {
    handlers: {
      GET: async () =>
        new Response(buildPricingMd(), {
          headers: {
            "Content-Type": "text/markdown; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
            "X-Robots-Tag": "noindex",
          },
        }),
    },
  },
});
