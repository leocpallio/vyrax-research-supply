import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/notify-me")({
  server: {
    handlers: {
      POST: async ({ request }) =>
        (await import("@/lib/notify-me.server")).submitNotification(request),
    },
  },
});
