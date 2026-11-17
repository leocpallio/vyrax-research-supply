import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/unsubscribe")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        (await import("@/lib/unsubscribe.server")).unsubscribeGet(request),
      POST: async ({ request }) =>
        (await import("@/lib/unsubscribe.server")).unsubscribePost(request),
    },
  },
});
