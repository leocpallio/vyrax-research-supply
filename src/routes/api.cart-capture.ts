import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/cart-capture")({
  server: {
    handlers: {
      POST: async ({ request }) =>
        (await import("@/lib/contact-capture.server")).captureCart(request),
    },
  },
});
