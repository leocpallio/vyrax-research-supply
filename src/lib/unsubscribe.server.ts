// Public marketing opt-out. One suppression table (public.marketing_suppression) is shared by site
// email, cold email (Smartlead export) and SMS export. Order and service mail is not affected.
// Handlers take injected deps so they are testable without a network. Nothing here sends mail.
import { cleanEmail, reply, serviceDb, type Env } from "./email/contact-shared.server";
import type { Rpc } from "./email/outbox.server";
import { clientKey, takeRateLimit, tooManyRequests } from "./rate-limit";

export type UnsubscribeDeps = { env?: Env; db?: Rpc };

const LIMIT = { limit: 10, windowMs: 60_000 } as const;
const MAX_BODY = 1024;

const redirect = (request: Request, query: string) =>
  new Response(null, {
    status: 303,
    headers: {
      location: new URL(`/unsubscribe${query}`, request.url).toString(),
      "cache-control": "no-store",
    },
  });

/** GET never writes: link scanners must not unsubscribe anyone. It only hands over to the page. */
export function unsubscribeGet(request: Request): Response {
  const email = cleanEmail(new URL(request.url).searchParams.get("email"));
  return redirect(request, email ? `?email=${encodeURIComponent(email)}` : "");
}

/**
 * POST /api/unsubscribe. Two callers:
 *  - the page form (application/x-www-form-urlencoded, field "email"), answered with a 303 back to the page;
 *  - RFC 8058 one-click (mail client posts "List-Unsubscribe=One-Click" to a URL that carries
 *    ?email=...), answered with plain 200. Mail clients send no Origin, so none is required.
 * The reply never says whether the address was already on a list.
 */
export async function unsubscribePost(
  request: Request,
  deps: UnsubscribeDeps = {},
): Promise<Response> {
  const limit = takeRateLimit(`unsubscribe:${clientKey(request)}`, LIMIT);
  if (!limit.allowed) return tooManyRequests(limit);
  const type = request.headers.get("content-type")?.split(";")[0]?.trim();
  if (type !== "application/x-www-form-urlencoded") return reply({ error: "Invalid request" }, 415);
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY)
    return reply({ error: "Request too large" }, 413);
  const raw = await request.text();
  if (raw.length > MAX_BODY) return reply({ error: "Request too large" }, 413);
  const form = new URLSearchParams(raw);
  const oneClick = form.get("List-Unsubscribe") === "One-Click";
  const email = cleanEmail(
    oneClick ? new URL(request.url).searchParams.get("email") : form.get("email"),
  );
  if (!email) {
    return oneClick ? reply({ error: "Invalid email" }, 400) : redirect(request, "?error=invalid");
  }
  const source = oneClick ? "one_click" : "unsubscribe_page";
  try {
    const db = deps.db ?? serviceDb(deps.env ?? process.env);
    const { data, error } = await db.rpc("suppress_marketing_email", {
      p_email: email,
      p_source: source,
    });
    if (error || data !== true) throw new Error("suppress failed");
  } catch (error) {
    console.error("[vyrax unsubscribe]", error instanceof Error ? error.message : "failed");
    return oneClick
      ? reply({ error: "Unavailable" }, 503)
      : redirect(request, "?error=unavailable");
  }
  return oneClick ? reply({ ok: true }) : redirect(request, "?done=1");
}
