import { createFileRoute } from "@tanstack/react-router";

// First-party reverse proxy for PostHog (EU): keeps analytics on our own domain so
// blockers matching posthog.com hosts do not drop events. Strips cookies, forwards client IP.
// https://posthog.com/docs/advanced/proxy
const API_HOST = "eu.i.posthog.com";
const ASSET_HOST = "eu-assets.i.posthog.com";

async function proxy({ request }: { request: Request }): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/ingest/, "") || "/";
  const target = path.startsWith("/static/") ? ASSET_HOST : API_HOST;
  const headers = new Headers(request.headers);
  headers.set("host", target);
  headers.delete("cookie");
  const ip = request.headers.get("CF-Connecting-IP") ?? request.headers.get("x-forwarded-for");
  if (ip) headers.set("X-Forwarded-For", ip);
  const res = await fetch(`https://${target}${path}${url.search}`, {
    method: request.method,
    headers,
    body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
    redirect: "follow",
    // @ts-expect-error duplex is required for streamed bodies in some runtimes
    duplex: "half",
  });
  const out = new Response(res.body, res);
  out.headers.delete("content-encoding");
  out.headers.set("cache-control", path.startsWith("/static/") ? "public, max-age=3600" : "no-store");
  return out;
}

export const Route = createFileRoute("/ingest/$")({
  server: { handlers: { GET: proxy, POST: proxy, OPTIONS: proxy } },
});
