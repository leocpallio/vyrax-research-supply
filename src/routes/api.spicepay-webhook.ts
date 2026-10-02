import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/spicepay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => (await import("@/lib/checkout.server")).spicepayWebhook(request),
    },
  },
});
