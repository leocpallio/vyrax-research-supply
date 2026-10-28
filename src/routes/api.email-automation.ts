import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/email-automation")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        (await import("@/lib/email/automation.server")).emailAutomationGet(request),
      POST: async ({ request }) =>
        (await import("@/lib/email/automation.server")).emailAutomationPost(request),
    },
  },
});
