import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => (await import("@/lib/checkout.server")).createCheckout(request),
    },
  },
});
