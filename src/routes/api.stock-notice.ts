import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/stock-notice")({
  server: {
    handlers: {
      POST: async ({ request }) =>
        (await import("@/lib/contact-capture.server")).requestStockNotice(request),
    },
  },
});
