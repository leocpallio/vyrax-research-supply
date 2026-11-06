// Server-side PostHog capture for paid orders (Vyrax EU project 291775). Consent-independent
// aggregate event: order id, value, currency, items and first-touch source only. No name, email,
// address or IP. Idempotent: the event uuid is derived from the order id, and the caller only fires
// on the database paid transition.
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
};

/** Deterministic RFC 4122 v5-style UUID from the order id (SHA-1 over a fixed namespace + id). */
export async function orderEventUuid(orderId: string): Promise<string> {
  const data = new TextEncoder().encode(`vyrax-payment_confirmed:${orderId}`);
  const h = new Uint8Array(await crypto.subtle.digest("SHA-1", data)).slice(0, 16);
  h[6] = (h[6]! & 0x0f) | 0x50;
  h[8] = (h[8]! & 0x3f) | 0x80;
  const x = Array.from(h, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`;
}

export async function capturePaymentConfirmed(order: PaidOrder): Promise<boolean> {
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
    const res = await fetch(`${host}/capture/`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        event: "payment_confirmed",
        uuid: await orderEventUuid(order.id),
        distinct_id: `order:${order.id}`,
        properties: {
          $process_person_profile: false,
          $ip: null,
          order_id: order.id,
          value: order.total_pence / 100,
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
