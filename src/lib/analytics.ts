// Two-stage PostHog (Leo/chief decision, 6 Nov 2026).
//   Before consent (and if declined): cookieless. persistence "memory", so no cookie and no
//   localStorage; pageviews, $pageleave, autocapture and UTM are captured for every visitor. No replay.
//   After "Allow analytics": persistence switches to "localStorage+cookie", the visitor is identified
//   and session replay starts. Decline drops back to cookieless memory mode and stops replay.
//
// Public API (stable for other lanes):
//   capture(name, props?)            fire an event (dropped before consent, queued while SDK loads)
//   trackPage(path)                  manual $pageview + view events for approved paths
//   trackBasketChange(before, after) add_to_cart / basket_removed per changed SKU
//   trackList(list, compounds)       product_list_viewed
//   trackCheckoutStep("address"|"payment", items)
//   onFeatureFlags(cb) / featureFlag(key) / featureFlagPayload(key)
//   productProps / itemsProps / listProps  (from ./analytics-events) for custom payloads
import type { PostHog } from "posthog-js";
import {
  categories,
  compounds,
  getCompound,
  readCart,
  resolveProductSlug,
  type CartItem,
  type Compound,
} from "./catalog";
import { shopSections } from "../data/shop-sections";
import { site } from "../data/site";
import {
  firstTouchSetOnce,
  itemsProps,
  listProps,
  productProps,
  readUtm,
  readAttribution,
  type Attribution,
  sanitizeProperties,
  stripQuery,
  type FirstTouch,
  type LineLike,
  type ListProps,
} from "./analytics-events";

export * from "./analytics-events";

// The public project token and capture host must BOTH belong to Vyrax. Never use a different brand's token.
// Public Vyrax project token (project 291775, EU). Fallback because .env.production is untracked and Lovable builds omit it.
const key =
  import.meta.env["VITE_POSTHOG_KEY"]?.trim() || "phc_mgjmEQUYX3pQE3rs7t9WjMRfAtG234oZxMoHa4HKsuVU";
const host = import.meta.env["VITE_POSTHOG_HOST"]?.trim() || "https://eu.i.posthog.com";
const captureHost = (() => {
  try {
    const url = new URL(host || "");
    return url.protocol === "https:" && !url.username && !url.password && !url.search && !url.hash
      ? url.origin
      : null;
  } catch {
    return null;
  }
})();
export const analyticsConfigured = Boolean(key && captureHost);
export const consentKey = "vyrax-analytics-consent";
export const firstTouchKey = "vyrax-first-touch";
export type AnalyticsConsent = "accepted" | "declined" | null;

export function analyticsConsent(): AnalyticsConsent {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(consentKey);
    return value === "accepted" || value === "declined" ? value : null;
  } catch {
    return null;
  }
}

export function setAnalyticsConsent(value: Exclude<AnalyticsConsent, null>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(consentKey, value);
  } catch {
    // Storage blocked: no durable consent; fail closed.
    return;
  }
  if (value === "declined") void shutdown();
  else void upgrade();
  window.dispatchEvent(new Event("vyrax-analytics-consent"));
}

// ------------------------------------------------------------------ SDK lifecycle
let client: PostHog | null = null;
let loading: Promise<PostHog | null> | null = null;
let queue: { event: string; properties: Record<string, unknown> }[] = [];
const MAX_QUEUE = 50;

async function ensureClient(): Promise<PostHog | null> {
  if (typeof window === "undefined" || !analyticsConfigured) return null;
  if (client) return client;
  if (loading) return loading;
  loading = (async () => {
    try {
      const { default: posthog } = await import("posthog-js");
      posthog.init(key!, {
        api_host: `${window.location.origin}/ingest`, // first-party proxy, src/routes/ingest.$.ts
        ui_host: "https://eu.posthog.com",
        person_profiles: "identified_only",
        autocapture: true,
        capture_pageview: false, // manual via trackPage()/router subscribe (sanitised paths)
        capture_pageleave: true,
        capture_dead_clicks: false,
        capture_performance: false,
        disable_session_recording: analyticsConsent() !== "accepted",
        disable_surveys: true,
        disable_web_experiments: true,
        rageclick: false,
        persistence: analyticsConsent() === "accepted" ? "localStorage+cookie" : "memory",
        cross_subdomain_cookie: false,
        secure_cookie: true,
        ip: false,
        mask_all_text: true,
        mask_all_element_attributes: true,
        session_recording: { maskAllInputs: true, maskTextSelector: "*" },
        enable_heatmaps: false,
        sanitize_properties: (props) => sanitizeProperties(props),
        property_denylist: [
          "$referrer",
          "$referring_domain",
          "$initial_referrer",
          "$initial_referring_domain",
        ],
        loaded: (ph) => {
          const ft = firstTouch();
          const once = firstTouchSetOnce(ft);
          if (Object.keys(once).length) ph.capture("$set", { $set_once: once });
          if (analyticsConsent() === "accepted") identifyConsented(ph);
        },
      });
      client = posthog;
      const pending = queue;
      queue = [];
      for (const q of pending) client.capture(q.event, q.properties);
      return client;
    } catch {
      // Analytics must never break the shop.
      return null;
    } finally {
      loading = null;
    }
  })();
  return loading;
}

function identifyConsented(
  ph: Pick<PostHog, "set_config" | "startSessionRecording" | "identify" | "get_distinct_id">,
) {
  try {
    ph.set_config({ disable_session_recording: false });
    ph.startSessionRecording();
    ph.identify(ph.get_distinct_id());
  } catch {
    /* ignore */
  }
}

// Consent given: move from memory-only to cookie + localStorage, identify, start replay.
async function upgrade() {
  const ph = await ensureClient();
  if (!ph) return;
  try {
    ph.set_config({ persistence: "localStorage+cookie" });
    identifyConsented(ph);
  } catch {
    /* ignore */
  }
}

// Declined (or withdrawn): back to cookieless memory mode, replay off, stored identity cleared.
async function shutdown() {
  const ph = client ?? (loading ? await loading : null);
  try {
    ph?.stopSessionRecording();
    ph?.set_config({ persistence: "memory", disable_session_recording: true });
    ph?.reset(true);
    sessionStorage.removeItem(firstTouchKey);
    sessionStorage.removeItem(attributionKey);
    memoryAttribution = null;
  } catch {
    /* ignore */
  }
}

/** First-touch UTM: read from the URL once per tab session, stored in sessionStorage only. */
export function firstTouch(): FirstTouch {
  if (typeof window === "undefined") return {};
  try {
    const stored = sessionStorage.getItem(firstTouchKey);
    if (stored) return JSON.parse(stored) as FirstTouch;
    const ft = readUtm(window.location.href);
    sessionStorage.setItem(firstTouchKey, JSON.stringify(ft));
    return ft;
  } catch {
    return {};
  }
}

/**
 * Order attribution (UTMs + gclid/fbclid/ttclid). Held in module memory from first load (no device
 * storage, nothing sent anywhere); written to sessionStorage only once analytics is accepted, so it
 * survives full page loads for consenting visitors. Sent with the checkout request so the order
 * carries its source (first-party business record).
 */
const attributionKey = "vyrax-attribution";
let memoryAttribution: Attribution | null = null;
export function orderAttribution(): Attribution {
  if (typeof window === "undefined") return {};
  const fresh = readAttribution(window.location.href);
  let stored: Attribution = {};
  if (analyticsConsent() === "accepted") {
    try {
      stored = JSON.parse(sessionStorage.getItem(attributionKey) ?? "{}") as Attribution;
    } catch {
      stored = {};
    }
  }
  // First touch wins: earliest source seen in memory or storage.
  const first = Object.keys(stored).length ? stored : (memoryAttribution ?? fresh);
  if (!memoryAttribution && Object.keys(first).length) memoryAttribution = first;
  if (
    analyticsConsent() === "accepted" &&
    !Object.keys(stored).length &&
    Object.keys(first).length
  ) {
    try {
      sessionStorage.setItem(attributionKey, JSON.stringify(first));
    } catch {
      /* ignore */
    }
  }
  return first;
}
if (typeof window !== "undefined") orderAttribution();

// ------------------------------------------------------------------ capture
export type EventName =
  | "$pageview"
  | "$set"
  | "product_viewed"
  | "view_product"
  | "begin_checkout"
  | "purchase"
  | "product_list_viewed"
  | "collection_viewed" // legacy alias still emitted alongside product_list_viewed
  | "shop_viewed" // legacy alias, kept for other lanes
  | "search"
  | "add_to_cart"
  | "basket_removed"
  | "basket_viewed"
  | "checkout_started"
  | "checkout_step"
  | "hosted_payment_opened"
  | "payment_confirmed"
  | "notify_me_submitted"
  | "page_error";

export type SafeValue = string | number | boolean | null | undefined;
export type SafeProperties = Record<string, SafeValue | SafeValue[] | Record<string, unknown>[]>;

export function capture(event: EventName, properties: SafeProperties = {}) {
  if (typeof window === "undefined" || !analyticsConfigured) return;
  const props: Record<string, unknown> = { ...properties };
  if (client) {
    client.capture(event, props);
    return;
  }
  if (queue.length < MAX_QUEUE) queue.push({ event, properties: props });
  void ensureClient();
}

// ------------------------------------------------------------------ feature flags
export function onFeatureFlags(
  cb: (flags: string[], variants: Record<string, string | boolean>) => void,
) {
  void ensureClient().then((ph) => ph?.onFeatureFlags(cb));
}
export const featureFlag = (flag: string) => client?.getFeatureFlag(flag);
export const featureFlagPayload = (flag: string) => client?.getFeatureFlagPayload(flag);

// ------------------------------------------------------------------ e-commerce helpers
const line = (c: Compound, strength: string, price: number, quantity = 1): LineLike => ({
  slug: c.slug,
  name: c.name,
  category: c.category,
  strength,
  price,
  quantity,
});

const cartLines = (items: CartItem[]): LineLike[] =>
  items.flatMap((i) => {
    const c = getCompound(i.slug);
    return c ? [line(c, i.strength, i.price, i.quantity)] : [];
  });

const basketValue = () => itemsProps(cartLines(readCart()));

export function trackList(
  list: { id: string; name: string; type: ListProps["listing_type"] },
  items: Compound[],
) {
  capture(
    "product_list_viewed",
    listProps(
      list,
      items.map((c) => line(c, c.strengths[0]?.label ?? "", c.strengths[0]?.price ?? 0)),
    ),
  );
}

export function trackCheckoutStep(step: "address" | "payment", items: CartItem[] = readCart()) {
  capture("checkout_step", { step, ...itemsProps(cartLines(items)) });
}

export function trackPage(path: string) {
  // Only approved paths, never arbitrary URL segments, query, fragment or user-supplied search.
  const staticPaths = new Set([
    "/",
    "/shop",
    "/basket",
    "/checkout",
    "/checkout/return",
    "/cookies",
    "/privacy",
    "/contact",
    "/account",
    "/about",
    "/shipping",
    "/returns",
    "/terms",
    "/faq",
    "/calculator",
    "/guides",
    "/lab-reports",
    "/research-use-policy",
  ]);
  const product = path.startsWith("/product/")
    ? resolveProductSlug(path.slice("/product/".length))
    : null;
  const collectionSlug = path.startsWith("/collections/")
    ? path.slice("/collections/".length)
    : null;
  const categorySlug = path.startsWith("/category/") ? path.slice("/category/".length) : null;
  const safePath = staticPaths.has(path)
    ? path
    : product && !product.redirectTo
      ? path
      : collectionSlug && shopSections.some((section) => section.slug === collectionSlug)
        ? path
        : categorySlug && categories.some((category) => category.slug === categorySlug)
          ? path
          : path.startsWith("/guides/")
            ? "/guides/:slug"
            : path.startsWith("/verify/")
              ? "/verify/:batch"
              : null;
  if (!safePath) return;
  capture("$pageview", {
    $current_url: stripQuery(`${window.location.origin}${safePath}`),
    $pathname: safePath,
  });
  if (path === "/shop") {
    capture("shop_viewed");
    trackList({ id: "shop", name: "All products", type: "shop" }, compounds);
  } else if (path === "/basket") capture("basket_viewed", basketValue());
  else if (path === "/checkout") {
    if (site.checkoutOpen && readCart().length) {
      capture("checkout_started", { checkout_type: "hosted_payment", ...basketValue() });
      capture("begin_checkout", { ...basketValue() });
    }
  } else if (product && !product.redirectTo) {
    const viewProps = {
      ...productProps(line(product.compound, product.strength.label, product.strength.price)),
      product_slug: product.compound.slug,
      is_hub: product.isHub,
    };
    capture("product_viewed", viewProps);
    capture("view_product", viewProps);
  } else if (collectionSlug) {
    const section = shopSections.find((s) => s.slug === collectionSlug);
    if (section) {
      capture("collection_viewed", { collection_slug: collectionSlug, listing_type: "collection" });
      trackList(
        { id: `collection:${section.slug}`, name: section.name, type: "collection" },
        section.products.map(getCompound).filter((c): c is Compound => Boolean(c)),
      );
    }
  } else if (categorySlug) {
    const category = categories.find((c) => c.slug === categorySlug);
    if (category) {
      capture("collection_viewed", { collection_slug: categorySlug, listing_type: "category" });
      trackList(
        { id: `category:${category.slug}`, name: category.name, type: "category" },
        compounds.filter((c) => c.category === category.slug),
      );
    }
  }
}

// Compare actual persisted quantities. One mutation produces one event per changed SKU, including +/- controls.
export function trackBasketChange(before: CartItem[], after: CartItem[]) {
  const seen = new Set<string>();
  for (const item of [...before, ...after]) {
    const id = `${item.slug}|${item.strength}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const compound = compounds.find(
      (p) => p.slug === item.slug && p.strengths.some((s) => s.label === item.strength),
    );
    if (!compound) continue;
    const oldQuantity =
      before.find((i) => i.slug === item.slug && i.strength === item.strength)?.quantity ?? 0;
    const newQuantity =
      after.find((i) => i.slug === item.slug && i.strength === item.strength)?.quantity ?? 0;
    const difference = newQuantity - oldQuantity;
    if (!difference) continue;
    capture(difference > 0 ? "add_to_cart" : "basket_removed", {
      ...productProps(line(compound, item.strength, item.price, Math.abs(difference))),
      product_slug: item.slug,
      basket_quantity: newQuantity,
      basket_value: itemsProps(cartLines(after)).value,
    });
  }
}

// Cookieless capture for every visitor from first load (memory persistence until consent).
if (typeof window !== "undefined" && analyticsConfigured) void ensureClient();
