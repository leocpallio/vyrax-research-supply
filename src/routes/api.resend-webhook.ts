import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/resend-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) =>
        (await import("@/lib/email/resend-webhook.server")).resendWebhook(request),
    },
  },
});
