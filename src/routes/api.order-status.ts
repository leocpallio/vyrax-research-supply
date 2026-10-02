import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/order-status")({
  server: {
    handlers: {
      GET: async ({ request }) => (await import("@/lib/checkout.server")).orderStatus(request),
    },
  },
});
