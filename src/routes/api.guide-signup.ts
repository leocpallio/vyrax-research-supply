import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/guide-signup")({
  server: {
    handlers: {
      POST: async ({ request }) =>
        (await import("@/lib/guide-signup.server")).subscribeToGuide(request),
    },
  },
});
