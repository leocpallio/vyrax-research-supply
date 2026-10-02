import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/admin/orders")({
  server: {
    handlers: {
      GET: async ({ request }) => (await import("@/lib/admin.server")).adminGet(request),
      POST: async ({ request }) => (await import("@/lib/admin.server")).adminPost(request),
      PATCH: async ({ request }) => (await import("@/lib/admin.server")).adminPatch(request),
    },
  },
});
