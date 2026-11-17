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

/** Flat props for single-product events (viewed_product, added_to_cart, removed_from_cart). */
export function productProps(line: LineLike): EcommerceItem & { value: number } {
  const item = ecommerceItem(line);
  return { ...item, value: round2(item.price * item.quantity) };
}

/** Flat props for multi-line events (cart_viewed, began_checkout, payment_*). */
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
  list_type: "shop" | "category" | "collection" | "search" | "featured";
  item_count: number;
  out_of_stock_count: number;
};

/** viewed_product_list: counts only, no item array. */
export function listProps(
  list: { id: string; type: ListProps["list_type"] },
  count: number,
  outOfStockCount = 0,
): ListProps {
  return {
    list_id: list.id,
    list_type: list.type,
    item_count: count,
    out_of_stock_count: outOfStockCount,
  };
}

/** Browser PostHog ids sent with the checkout request so the server purchase joins the visit. */
export type PhIds = { ph_distinct_id?: string; ph_session_id?: string };
const PH_ID = /^[\w.:@|-]{1,80}$/;
export function cleanPhIds(raw: unknown): PhIds {
  const out: PhIds = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  const r = raw as Record<string, unknown>;
  for (const k of ["ph_distinct_id", "ph_session_id"] as const) {
    const v = r[k];
    if (typeof v === "string" && PH_ID.test(v.trim())) out[k] = v.trim();
  }
  return out;
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
    if (v && !isUnrenderedMacro(v)) out[k] = v;
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
    // PostHog reads utm_* from the URL itself; drop an unrendered ad macro such as {{campaign.name}}.
    if (/(^|_)utm_/.test(k) && typeof v === "string" && isUnrenderedMacro(v)) continue;
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

// ---- Order attribution (first touch). UTMs plus ad click ids, validated and length-capped.
export const CLICK_ID_KEYS = ["gclid", "fbclid", "ttclid"] as const;
export type Attribution = Partial<
  Record<UtmKey | (typeof CLICK_ID_KEYS)[number] | "landing_path", string>
>;
const ATTR_KEYS = [...UTM_KEYS, ...CLICK_ID_KEYS, "landing_path"] as const;
const SAFE_ATTR = /^[\w .:/+~%@-]{1,200}$/;

/**
 * An ad platform that did not fill its dynamic parameter leaves the literal macro in the URL, for
 * example `{{campaign.name}}` or `{campaign_name}` or `__CAMPAIGN__`. Store nothing rather than the macro.
 */
export function isUnrenderedMacro(v: string): boolean {
  return /\{\{.*\}\}|\{[a-z_.]+\}|%7B%7B|%7Bcampaign|^__[A-Z_]+__$|^\[[A-Z_]+\]$/i.test(v);
}

/**
 * Read utm_* and gclid/fbclid/ttclid from a URL. Anything not matching a conservative charset, or
 * an unrendered ad macro, is dropped. `landing_path` is the path of the first page of the visit,
 * recorded whether or not the URL carried any campaign tag.
 */
export function readAttribution(url: string): Attribution {
  const out: Attribution = {};
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return out;
  }
  for (const k of [...UTM_KEYS, ...CLICK_ID_KEYS]) {
    const v = u.searchParams.get(k)?.trim().slice(0, 200);
    if (v && SAFE_ATTR.test(v) && !isUnrenderedMacro(v)) out[k] = v;
  }
  out.landing_path = u.pathname.slice(0, 200);
  return out;
}

/** Server-side: accept only known keys with safe string values. */
export function cleanAttribution(raw: unknown): Attribution {
  const out: Attribution = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (const k of ATTR_KEYS) {
    const v = (raw as Record<string, unknown>)[k];
    if (typeof v === "string" && SAFE_ATTR.test(v.trim()) && !isUnrenderedMacro(v.trim()))
      out[k] = v.trim();
  }
  return out;
}

/** Hosts that carry real customers. Anything else (localhost, preview, workers.dev, lovable) is non-production. */
const PRODUCTION_HOSTS = new Set(["vyraxlabs.co.uk", "www.vyraxlabs.co.uk"]);
export function siteEnvFor(hostname: string): "production" | "non_production" {
  return PRODUCTION_HOSTS.has(hostname.toLowerCase()) ? "production" : "non_production";
}

/** Whether the first-touch order attribution may be copied to sessionStorage. Declined always wins. */
export const mayPersistAttribution = (
  consent: "accepted" | "declined" | null,
  flag: boolean,
): boolean => consent === "accepted" || (flag && consent !== "declined");

// ---- Exception autocapture and checkout failure codes.

const EXC_EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const EXC_PHONE = /(?:\+44\s?|0)\d{3,4}\s?\d{3}\s?\d{3,4}/g;
const EXC_DIGITS = /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{0,4}\b/g;
const EXC_PII_KEY =
  /(email|e_mail|phone|tel|mobile|address|postcode|post_code|zip|full_?name|first_?name|last_?name|customer_?name|user_?name|contact_?name|card|iban|account_?number|dob|birth|token)/i;

/** Blank email addresses, phone numbers and long digit runs in a string. */
export function maskPiiInText(text: string): string {
  return text.replace(EXC_EMAIL, "[email]").replace(EXC_PHONE, "[phone]").replace(EXC_DIGITS, "[digits]");
}

/**
 * posthog `before_send` for `capture_exceptions`: mask every string inside
 * `$exception*` properties and drop PII-looking keys. Other events pass through.
 */
export function scrubExceptionEvent<T extends { event?: string; properties?: Record<string, unknown> } | null>(evt: T): T {
  if (!evt || evt.event !== "$exception" || !evt.properties) return evt;
  // Fail closed: exception free text (message, value, raw stack text) is never
  // sent, because it can echo a name, address or order note that no pattern
  // can recognise. Only structural fields that pass a strict token pattern
  // survive (error type, function name, script path, line and column).
  const TYPE_RE = /^[A-Za-z][A-Za-z0-9_$.]{0,63}$/;
  const SYMBOL_RE = /^[A-Za-z0-9_$.<>\/-]{1,120}$/;
  const PATH_RE = /^[A-Za-z0-9_\-.\/:~%]{1,200}$/;
  const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
  const type = (v: unknown): string => (typeof v === "string" && TYPE_RE.test(v) ? v : "Error");
  const symbol = (v: unknown): string | undefined => (typeof v === "string" && SYMBOL_RE.test(v) ? v : undefined);
  const path = (v: unknown): string | undefined => {
    if (typeof v !== "string") return undefined;
    const p = (v.split(/[?#]/)[0] ?? "");
    return PATH_RE.test(p) ? p : undefined;
  };
  const num = (v: unknown): number | undefined => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
  const bool = (v: unknown): boolean | undefined => (typeof v === "boolean" ? v : undefined);
  const frame = (f: unknown): Record<string, unknown> => {
    const o = isObj(f) ? f : {};
    const out: Record<string, unknown> = {
      filename: path(o["filename"]),
      abs_path: path(o["abs_path"]),
      function: symbol(o["function"]),
      module: symbol(o["module"]),
      chunk_id: symbol(o["chunk_id"]),
      platform: symbol(o["platform"]),
      lineno: num(o["lineno"]),
      colno: num(o["colno"]),
      in_app: bool(o["in_app"]),
      synthetic: bool(o["synthetic"]),
      resolved: bool(o["resolved"]),
    };
    for (const k of Object.keys(out)) if (out[k] === undefined) delete out[k];
    return out;
  };
  const item = (e: unknown): Record<string, unknown> => {
    const o = isObj(e) ? e : {};
    const out: Record<string, unknown> = { type: type(o["type"]), value: "[redacted]" };
    const mech = o["mechanism"];
    if (isObj(mech)) {
      const m: Record<string, unknown> = { handled: bool(mech["handled"]), synthetic: bool(mech["synthetic"]), type: symbol(mech["type"]) };
      for (const k of Object.keys(m)) if (m[k] === undefined) delete m[k];
      out["mechanism"] = m;
    }
    const st = o["stacktrace"];
    const frames = isObj(st) ? st["frames"] : undefined;
    if (Array.isArray(frames)) {
      out["stacktrace"] = { type: "raw", frames: frames.slice(0, 50).map(frame) };
    }
    return out;
  };
  const props: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(evt.properties)) {
    if (k.startsWith("$exception")) {
      if (k === "$exception_list") props[k] = Array.isArray(v) ? v.slice(0, 10).map(item) : [];
      else if (k === "$exception_types") props[k] = Array.isArray(v) ? v.slice(0, 10).map(type) : [];
      else if (k === "$exception_message" || k === "$exception_values") props[k] = "[redacted]";
      else if (k === "$exception_handled") props[k] = bool(v) ?? false;
      else if (k === "$exception_level") props[k] = typeof v === "string" && TYPE_RE.test(v) ? v : "error";
      else if (k === "$exception_sources") props[k] = Array.isArray(v) ? v.slice(0, 10).map(path).filter(Boolean) : [];
      else if (k === "$exception_functions") props[k] = Array.isArray(v) ? v.slice(0, 20).map(symbol).filter(Boolean) : [];
      // Any other $exception* field is unknown free text: drop it.
      continue;
    }
    if (EXC_PII_KEY.test(k)) continue;
    if (typeof v === "string") props[k] = /^https?:\/\//i.test(v) ? v.split(/[?#]/)[0] : maskPiiInText(v);
    else props[k] = v;
  }
  return { ...evt, properties: props };
}

export type CheckoutFailStep = "create_order" | "start_payment" | "confirm_payment";

/**
 * Closed-vocabulary props for `checkout_payment_failed`. `error_code` is a
 * short machine code (`http_502`, `network`, `no_redirect_url`, `declined`),
 * never a message, so no customer text or order reference can ride along.
 */
export function checkoutFailProps(p: { step: CheckoutFailStep; provider?: string; errorCode?: string | null }) {
  const code = (p.errorCode ?? "").trim();
  const provider = (p.provider ?? "spicepay").trim();
  return {
    site: "vyrax",
    step: p.step,
    provider: /^[a-z0-9_]{1,24}$/.test(provider) ? provider : "unknown",
    error_code: /^[A-Za-z0-9_.:-]{1,48}$/.test(code) ? code : "unknown",
  };
}
