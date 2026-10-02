import { categories, compounds, readCart, resolveProductSlug, type CartItem } from "./catalog";
import { shopSections } from "../data/shop-sections";
import { site } from "../data/site";

// The public project token and capture host must BOTH belong to Vyrax. Never use a different brand's token.
const key = import.meta.env["VITE_POSTHOG_KEY"]?.trim();
const host = import.meta.env["VITE_POSTHOG_HOST"]?.trim();
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
export type AnalyticsConsent = "accepted" | "declined" | null;
let anonymousId: string | null = null;

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
  if (value === "declined") anonymousId = null;
  window.dispatchEvent(new Event("vyrax-analytics-consent"));
}

type EventName =
  | "$pageview"
  | "product_viewed"
  | "collection_viewed"
  | "shop_viewed"
  | "search"
  | "basket_added"
  | "basket_removed"
  | "basket_viewed"
  | "checkout_started"
  | "enquiry_submitted"
  | "enquiry_error"
  | "page_error";
type SafeProperties = Record<string, string | number | boolean>;

export function capture(event: EventName, properties: SafeProperties = {}) {
  if (typeof window === "undefined" || !analyticsConfigured || analyticsConsent() !== "accepted")
    return;
  anonymousId ??= crypto.randomUUID(); // Session-only; never identify a person or persist an ID.
  const payload = {
    api_key: key,
    distinct_id: anonymousId,
    event,
    properties: { ...properties, $process_person_profile: false, $ip: null },
  };
  // No SDK/autocapture, cookies, session replay, form values, URL query, referrer or person profile.
  void fetch(`${captureHost}/i/v0/e/`, {
    method: "POST",
    mode: "cors",
    credentials: "omit",
    referrerPolicy: "no-referrer",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {
    /* Analytics must never break the shop. */
  });
}

export function trackPage(path: string) {
  // Only approved paths, never arbitrary URL segments, query, fragment or user-supplied search.
  const staticPaths = new Set([
    "/",
    "/shop",
    "/basket",
    "/checkout",
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
  capture("$pageview", { $current_url: `${window.location.origin}${safePath}` });
  if (path === "/shop") capture("shop_viewed");
  else if (path === "/basket")
    capture("basket_viewed", { item_count: readCart().reduce((n, i) => n + i.quantity, 0) });
  else if (path === "/checkout") {
    if (site.enquiriesLive && site.email && readCart().length)
      capture("checkout_started", { checkout_type: "enquiry" });
  } else if (path.startsWith("/product/")) {
    const product = resolveProductSlug(path.slice("/product/".length));
    if (product && !product.redirectTo)
      capture("product_viewed", {
        product_slug: product.compound.slug,
        ...(product.isHub
          ? {}
          : { strength: product.strength.label, unit_price: product.strength.price }),
        currency: "GBP",
      });
  } else if (path.startsWith("/collections/")) {
    const slug = path.slice("/collections/".length);
    if (shopSections.some((section) => section.slug === slug))
      capture("collection_viewed", { collection_slug: slug, listing_type: "collection" });
  } else if (path.startsWith("/category/")) {
    const slug = path.slice("/category/".length);
    if (categories.some((category) => category.slug === slug))
      capture("collection_viewed", { collection_slug: slug, listing_type: "category" });
  }
}

// Compare actual persisted quantities. One mutation produces one event per changed SKU, including +/- controls.
export function trackBasketChange(before: CartItem[], after: CartItem[]) {
  for (const item of [...before, ...after]) {
    if (
      !compounds.some(
        (p) => p.slug === item.slug && p.strengths.some((s) => s.label === item.strength),
      )
    )
      continue;
    const oldQuantity =
      before.find((i) => i.slug === item.slug && i.strength === item.strength)?.quantity ?? 0;
    const newQuantity =
      after.find((i) => i.slug === item.slug && i.strength === item.strength)?.quantity ?? 0;
    if (
      item !==
      (newQuantity > oldQuantity ? after : before).find(
        (i) => i.slug === item.slug && i.strength === item.strength,
      )
    )
      continue;
    const difference = newQuantity - oldQuantity;
    if (!difference) continue;
    capture(difference > 0 ? "basket_added" : "basket_removed", {
      product_slug: item.slug,
      strength: item.strength,
      quantity: Math.abs(difference),
      unit_price: item.price,
      currency: "GBP",
    });
  }
}
