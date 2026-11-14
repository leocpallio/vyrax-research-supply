// Server-side PostHog capture for paid orders (Vyrax EU project 291775). Consent-independent
// aggregate event: order id, value, currency, items and first-touch source only. No name, email,
// address or IP. Idempotent: the event uuid is derived from the order id, and the caller only fires
// on the database paid transition.
import { site } from "../data/site";

const FALLBACK_KEY = "phc_mgjmEQUYX3pQE3rs7t9WjMRfAtG234oZxMoHa4HKsuVU";
const FALLBACK_HOST = "https://eu.i.posthog.com";

export type PaidOrder = {
  id: string;
  total_pence: number;
  currency: string;
  test_mode?: boolean | null;
  items?: unknown;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
  ttclid?: string | null;
  landing_path?: string | null;
  ph_distinct_id?: string | null;
  ph_session_id?: string | null;
};

export type PaidContext = {
  /** Paid time from the webhook event (falls back to now). */
  paidAt?: Date | null;
  /** True when no other paid order exists for this email. Omitted when the lookup failed. */
  isFirstOrder?: boolean | null;
  /** Event name override, used only by the manual proof script (`tracking_probe`). */
  eventName?: string;
};

/**
 * True when the order total is not the plain sum of its lines (+ the standard delivery fee):
 * a promo code, spend tier or buy-2-get-1 reduced it. Orders do not store the code itself.
 */
export function discountUsed(
  items: unknown,
  totalPence: number,
  deliveryFeePence: number,
): boolean | null {
  if (!Array.isArray(items) || !items.length) return null;
  const lines = items.reduce<number>(
    (n, i) => n + Number((i as Record<string, unknown>)["linePence"] ?? 0),
    0,
  );
  if (!(lines > 0)) return null;
  return totalPence !== lines && totalPence !== lines + deliveryFeePence;
}

/** Deterministic RFC 4122 v5-style UUID from the order id (SHA-1 over a fixed namespace + id). */
export async function orderEventUuid(orderId: string): Promise<string> {
  const data = new TextEncoder().encode(`vyrax-payment_confirmed:${orderId}`);
  const h = new Uint8Array(await crypto.subtle.digest("SHA-1", data)).slice(0, 16);
  h[6] = (h[6]! & 0x0f) | 0x50;
  h[8] = (h[8]! & 0x3f) | 0x80;
  const x = Array.from(h, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`;
}

export async function capturePaymentConfirmed(
  order: PaidOrder,
  ctx: PaidContext = {},
): Promise<boolean> {
  try {
    if (order.test_mode) return false; // keep test payments out of revenue reporting
    const key = process.env["POSTHOG_PROJECT_KEY"]?.trim() || FALLBACK_KEY;
    const host = process.env["POSTHOG_HOST"]?.trim() || FALLBACK_HOST;
    const items = (Array.isArray(order.items) ? order.items : []).slice(0, 30).map((i) => {
      const l = i as Record<string, unknown>;
      return {
        slug: String(l["slug"] ?? ""),
        strength: String(l["strength"] ?? ""),
        quantity: Number(l["quantity"] ?? 0),
        price: Number(l["unitPence"] ?? 0) / 100,
        gift: l["gift"] === true,
      };
    });
    const attr: Record<string, string> = {};
    for (const k of [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "gclid",
      "fbclid",
      "ttclid",
      "landing_path",
    ] as const) {
      const v = order[k];
      if (v) attr[k] = v;
    }
    const hasVisitor = Boolean(order.ph_distinct_id);
    const paidAt = ctx.paidAt && !Number.isNaN(ctx.paidAt.getTime()) ? ctx.paidAt : new Date();
    const discount = discountUsed(
      order.items,
      order.total_pence,
      Math.round(site.standardDeliveryFee * 100),
    );
    const res = await fetch(`${host}/capture/`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        event: ctx.eventName ?? "payment_confirmed",
        uuid: await orderEventUuid(order.id),
        timestamp: paidAt.toISOString(),
        distinct_id: order.ph_distinct_id ?? `order:${order.id}`,
        properties: {
          // Person profile stays off only for the order-id fallback identity.
          ...(hasVisitor ? {} : { $process_person_profile: false }),
          ...(order.ph_session_id ? { $session_id: order.ph_session_id } : {}),
          $ip: null,
          order_id: order.id,
          value: order.total_pence / 100,
          value_gbp: order.total_pence / 100,
          method: "card",
          ...(typeof ctx.isFirstOrder === "boolean" ? { is_first_order: ctx.isFirstOrder } : {}),
          ...(discount === null ? {} : { discount_used: discount }),
          currency: order.currency,
          item_count: items.reduce((n, i) => n + i.quantity, 0),
          items,
          source: "server",
          provider: "spicepay",
          ...attr,
        },
      }),
    });
    if (!res.ok) console.error("[vyrax posthog]", res.status);
    return res.ok;
  } catch (error) {
    console.error("[vyrax posthog]", error instanceof Error ? error.message : "unknown");
    return false;
  }
}
