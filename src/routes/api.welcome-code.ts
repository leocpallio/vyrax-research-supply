import { createFileRoute } from "@tanstack/react-router";

const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });

export const Route = createFileRoute("/api/welcome-code")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let email = "";
        try {
          const body = (await request.json()) as { email?: unknown };
          email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
        } catch {
          return json({ error: "Invalid request" }, 400);
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254)
          return json({ error: "Check your email address" }, 400);
        const { welcomeCodeFor } = await import("@/lib/welcome-code.server");
        const code = await welcomeCodeFor(email);
        return json({ code, pct: 10, minSpend: 50 });
      },
    },
  },
});
