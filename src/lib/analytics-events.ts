// Pure event payload builders for PostHog e-commerce events. No DOM, no SDK, no catalog import, so
// bun test can load this file directly. analytics.ts re-exports everything here.

export const CURRENCY = "GBP";

/** The minimum a line needs to become a standard e-commerce item. Catalog types satisfy this. */
export type LineLike = {
  slug: string;
  name?: string | undefined;
  category?: string | undefined;
  strength?: string | undefined;
  price: number;
  quantity?: number | undefined;
};

export type EcommerceItem = {
  product_id: string;
  name: string;
  category: string;
  variant?: string;
  price: number;
  currency: typeof CURRENCY;
  quantity: number;
};

export type ItemsPayload = {
  items: EcommerceItem[];
  item_count: number;
  value: number;
  currency: typeof CURRENCY;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/** product_id is "<slug>|<strength>" so one SKU is one id across every event. */
export const productId = (slug: string, strength?: string) =>
  strength ? `${slug}|${strength}` : slug;

export function ecommerceItem(line: LineLike): EcommerceItem {
  const quantity = Math.max(1, Math.floor(line.quantity ?? 1));
  const item: EcommerceItem = {
    product_id: productId(line.slug, line.strength),
    name: line.name ?? line.slug,
    category: line.category ?? "unknown",
    price: round2(line.price),
    currency: CURRENCY,
    quantity,
  };
  if (line.strength) item.variant = line.strength;
  return item;
}

/** Flat props for single-product events (product_viewed, basket_added, basket_removed). */
export function productProps(line: LineLike): EcommerceItem & { value: number } {
  const item = ecommerceItem(line);
  return { ...item, value: round2(item.price * item.quantity) };
}

/** Flat props for multi-line events (basket_viewed, checkout_*, payment_*). */
export function itemsProps(lines: LineLike[]): ItemsPayload {
  const items = lines.map(ecommerceItem);
  return {
    items,
    item_count: items.reduce((n, i) => n + i.quantity, 0),
    value: round2(items.reduce((n, i) => n + i.price * i.quantity, 0)),
    currency: CURRENCY,
  };
}

export type ListProps = {
  list_id: string;
  list_name: string;
  listing_type: "shop" | "category" | "collection" | "search" | "featured";
  item_count: number;
  items: EcommerceItem[];
  currency: typeof CURRENCY;
};

/** product_list_viewed: only the first `limit` items are serialised to keep the payload small. */
export function listProps(
  list: { id: string; name: string; type: ListProps["listing_type"] },
  lines: LineLike[],
  limit = 24,
): ListProps {
  return {
    list_id: list.id,
    list_name: list.name,
    listing_type: list.type,
    item_count: lines.length,
    items: lines.slice(0, limit).map(ecommerceItem),
    currency: CURRENCY,
  };
}

export const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;
export type UtmKey = (typeof UTM_KEYS)[number];
export type FirstTouch = Partial<Record<UtmKey, string>> & { landing_path?: string };

/** Read utm_* only (never gclid/fbclid/referrer) from a URL. Values trimmed and capped at 100 chars. */
export function readUtm(url: string): FirstTouch {
  const out: FirstTouch = {};
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return out;
  }
  for (const k of UTM_KEYS) {
    const v = u.searchParams.get(k)?.trim().slice(0, 100);
    if (v) out[k] = v;
  }
  if (Object.keys(out).length) out.landing_path = u.pathname;
  return out;
}

/** $set_once payload: first-touch keys prefixed so they never collide with per-event utm props. */
export function firstTouchSetOnce(ft: FirstTouch): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(ft)) if (v) out[`initial_${k}`] = v;
  return out;
}

const REFERRER_KEYS = new Set([
  "$referrer",
  "$referring_domain",
  "$initial_referrer",
  "$initial_referring_domain",
]);

/** Strip referrers, query strings and non-utm URL params from any outgoing property bag. */
export function sanitizeProperties<T extends Record<string, unknown>>(props: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) {
    if (REFERRER_KEYS.has(k)) continue;
    if ((k === "$current_url" || k === "$initial_current_url") && typeof v === "string") {
      out[k] = stripQuery(v);
      continue;
    }
    if ((k === "$set" || k === "$set_once") && v && typeof v === "object") {
      out[k] = sanitizeProperties(v as Record<string, unknown>);
      continue;
    }
    out[k] = v;
  }
  return out as T;
}

export function stripQuery(url: string): string {
  const i = url.search(/[?#]/);
  return i === -1 ? url : url.slice(0, i);
}
