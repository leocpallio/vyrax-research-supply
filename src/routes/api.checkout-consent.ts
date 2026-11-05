import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/checkout-consent")({
  server: {
    handlers: {
      POST: async ({ request }) =>
        (await import("@/lib/contact-capture.server")).recordCheckoutConsent(request),
    },
  },
});
