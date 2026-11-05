// Request handlers for contact-level email capture: basket save, stock notice, checkout consent.
// Dependency injection (db, env, fetcher) keeps them testable without a network.
// Rules: same-origin only, rate limited, consent is created ONLY by the two handlers that show the
// visitor an explicit consent line (stock notice, checkout box). The basket handler never creates it.
import { recordMarketingConsent, type Rpc } from "./email/outbox.server";
import {
  captureEnabled,
  cleanEmail,
  ensureResendContact,
  findVariant,
  hasActiveConsent,
  isTestAddress,
  originAllowed,
  parseCartItems,
  readJson,
  reply,
  serviceDb,
  type Env,
} from "./email/contact-shared.server";
import { clientKey, takeRateLimit, tooManyRequests } from "./rate-limit";

export type CaptureDeps = {
  env?: Env;
  db?: Rpc;
  fetcher?: typeof fetch;
  /** Replaces the active-consent lookup in tests. */
  hasConsent?: (email: string) => Promise<boolean>;
};

const LIMITS = {
  cart: { limit: 20, windowMs: 60_000 },
  stock: { limit: 6, windowMs: 60_000 },
  consent: { limit: 6, windowMs: 60_000 },
} as const;
const MAX_BODY = 4096;

type Gate = { response: Response } | { body: Record<string, unknown>; env: Env };

async function gate(
  request: Request,
  deps: CaptureDeps,
  bucket: keyof typeof LIMITS,
): Promise<Gate> {
  const env = deps.env ?? process.env;
  if (!originAllowed(request)) return { response: reply({ error: "Invalid request origin" }, 403) };
  if (!captureEnabled(env)) return { response: reply({ error: "Unavailable" }, 503) };
  if (request.headers.get("content-type")?.split(";")[0]?.trim() !== "application/json")
    return { response: reply({ error: "Invalid request" }, 415) };
  const limit = takeRateLimit(`contact-${bucket}:${clientKey(request)}`, LIMITS[bucket]);
  if (!limit.allowed) return { response: tooManyRequests(limit) };
  const body = await readJson(request, MAX_BODY);
  if (body === "too-large") return { response: reply({ error: "Request too large" }, 413) };
  if (!body) return { response: reply({ error: "Invalid request" }, 400) };
  return { body, env };
}

/**
 * POST /api/cart-capture. Saves the basket for an address that ALREADY has active consent.
 * An address without consent gets the same quiet success so the endpoint cannot be used to probe
 * which addresses are on the list. It never creates consent.
 */
export async function captureCart(request: Request, deps: CaptureDeps = {}): Promise<Response> {
  const g = await gate(request, deps, "cart");
  if ("response" in g) return g.response;
  const email = cleanEmail(g.body["email"]);
  const items = parseCartItems(g.body["items"]);
  if (!email) return reply({ error: "Invalid email" }, 400);
  if (!items) return reply({ error: "Invalid basket" }, 400);
  if (isTestAddress(email)) return reply({ ok: true, saved: false });
  try {
    const consented = await (deps.hasConsent ?? ((e: string) => hasActiveConsent(e, g.env)))(email);
    if (!consented) return reply({ ok: true, saved: false });
    const db = deps.db ?? serviceDb(g.env);
    const { data, error } = await db.rpc("save_email_cart", { p_email: email, p_items: items });
    if (error || data !== true) throw new Error("save failed");
    return reply({ ok: true, saved: true });
  } catch (error) {
    console.error("[vyrax cart capture]", error instanceof Error ? error.message : "failed");
    return reply({ error: "Unavailable" }, 503);
  }
}

/** POST /api/stock-notice. The submitted form carries the explicit consent line. */
export async function requestStockNotice(
  request: Request,
  deps: CaptureDeps = {},
): Promise<Response> {
  const g = await gate(request, deps, "stock");
  if ("response" in g) return g.response;
  const email = cleanEmail(g.body["email"]);
  const slug = g.body["slug"];
  const strength = g.body["strength"];
  if (!email || isTestAddress(email)) return reply({ error: "Invalid email" }, 400);
  if (!findVariant(slug, strength)) return reply({ error: "Invalid product" }, 400);
  if (g.body["consent"] !== true) return reply({ error: "Consent is required" }, 400);
  try {
    const db = deps.db ?? serviceDb(g.env);
    const consent = await recordMarketingConsent(db, email, "vyrax_stock");
    // null means the address is not eligible (for example it opted out earlier). Say nothing more.
    if (consent === null) return reply({ ok: true });
    await ensureResendContact(email, g.env, deps.fetcher ?? fetch);
    const { data, error } = await db.rpc("request_stock_notice", {
      p_email: email,
      p_slug: slug,
      p_strength: strength,
    });
    if (error || data !== true) throw new Error("request failed");
    return reply({ ok: true });
  } catch (error) {
    console.error("[vyrax stock notice]", error instanceof Error ? error.message : "failed");
    return reply({ error: "Unavailable" }, 503);
  }
}

/** POST /api/checkout-consent. Called only after the visitor ticks the optional checkout box. */
export async function recordCheckoutConsent(
  request: Request,
  deps: CaptureDeps = {},
): Promise<Response> {
  const g = await gate(request, deps, "consent");
  if ("response" in g) return g.response;
  const email = cleanEmail(g.body["email"]);
  if (!email || isTestAddress(email)) return reply({ error: "Invalid email" }, 400);
  if (g.body["consent"] !== true) return reply({ error: "Consent is required" }, 400);
  try {
    const db = deps.db ?? serviceDb(g.env);
    const consent = await recordMarketingConsent(db, email, "vyrax_checkout");
    if (consent !== null) await ensureResendContact(email, g.env, deps.fetcher ?? fetch);
    return reply({ ok: true });
  } catch (error) {
    console.error("[vyrax checkout consent]", error instanceof Error ? error.message : "failed");
    return reply({ error: "Unavailable" }, 503);
  }
}
