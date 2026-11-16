import { createFileRoute } from "@tanstack/react-router";

// Receives Content-Security-Policy-Report-Only reports. Logs a bounded, URL-stripped summary
// (directive and blocked host) and stores nothing else. Public by design, so size-limited.
const MAX = 8192;

export const Route = createFileRoute("/api/csp-report")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (Number(request.headers.get("content-length") ?? 0) > MAX)
          return new Response(null, { status: 413 });
        try {
          const raw = (await request.text()).slice(0, MAX);
          const body = JSON.parse(raw) as Record<string, Record<string, unknown> | undefined>;
          const r = body["csp-report"] ?? body;
          const host = (v: unknown) => {
            try {
              return new URL(String(v)).host;
            } catch {
              return String(v ?? "").slice(0, 40);
            }
          };
          console.warn(
            "[csp-report]",
            String(r["effective-directive"] ?? r["violated-directive"] ?? "").slice(0, 60),
            host(r["blocked-uri"]),
            new URL(String(r["document-uri"] ?? "https://x/")).pathname.slice(0, 80),
          );
        } catch {
          /* malformed report: ignore */
        }
        return new Response(null, { status: 204 });
      },
    },
  },
});
