import { createFileRoute } from "@tanstack/react-router";
import { buildLlmsFullTxt } from "@/lib/llm-feeds";

export const Route = createFileRoute("/llms-full.txt")({
  server: {
    handlers: {
      GET: async () =>
        new Response(buildLlmsFullTxt(), {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
            "X-Robots-Tag": "noindex",
          },
        }),
    },
  },
});
