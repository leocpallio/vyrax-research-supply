import { quoteCheckout } from "../checkout-pricing";
import { orderRef } from "../checkout-form";
import { sendTransactional } from "./send.server";
import { renderEmail, type EmailEvent } from "./templates";

type Item = { slug: string; name: string; strength: string; quantity: number; linePence: number };
export type OrderRow = {
  id: string;
  name: string;
  email: string;
  items: unknown;
  total_pence: number;
  address?: string;
  address2?: string | null;
  city?: string | null;
  postcode?: string;
  created_at?: string;
};

/** Build the itemised summary. Discount and delivery are shown only when they reproduce the paid total exactly. */
export function summarise(order: OrderRow) {
  const items = (Array.isArray(order.items) ? order.items : []) as Item[];
  const lines = items.map((i) => ({
    name: i.name,
    strength: i.strength,
    quantity: i.quantity,
    lineTotal: i.linePence / 100,
  }));
  const total = order.total_pence / 100;
  try {
    const q = quoteCheckout(
      items.map((i) => ({ slug: i.slug, strength: i.strength, quantity: i.quantity })),
    );
    if (q.totalPence === order.total_pence)
      return {
        lines,
        total,
        delivery: q.deliveryPence / 100,
        ...(q.subtotalPence - (q.totalPence - q.deliveryPence) > 0
          ? { discount: (q.subtotalPence - (q.totalPence - q.deliveryPence)) / 100 }
          : {}),
      };
  } catch {
    /* catalogue changed since purchase: fall back to totals only */
  }
  return { lines, total };
}

export type OrderEmailKind =
  | "orderConfirmation"
  | "paymentPending"
  | "paymentFailed"
  | "paymentExpired"
  | "packed"
  | "dispatched";

/**
 * Best effort. Never throws: gated off without RESEND_API_KEY, and any failure is logged and swallowed
 * so the order stays paid. Idempotency key makes webhook retries safe.
 */
export async function sendOrderEmail(
  kind: OrderEmailKind,
  order: OrderRow,
  eventId: string,
  extra: { trackingNumber?: string } = {},
): Promise<"sent" | "skipped" | "failed"> {
  try {
    if (!process.env["RESEND_API_KEY"]) return "skipped";
    const address = [order.address, order.address2, order.city, order.postcode]
      .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
      .join(", ");
    const base = {
      name: order.name,
      reference: orderRef(order.id),
      ...(address ? { address } : {}),
      ...(order.created_at ? { orderDate: order.created_at.slice(0, 10) } : {}),
    };
    const event: EmailEvent =
      kind === "orderConfirmation"
        ? { kind, ...base, ...summarise(order) }
        : kind === "dispatched"
          ? { kind, ...base, ...extra }
          : { kind, ...base };
    await sendTransactional({
      to: order.email,
      mail: renderEmail(event),
      key: `${kind}:${eventId}`.replace(/[^a-zA-Z0-9:_-]/g, "_").slice(0, 256),
    });
    return "sent";
  } catch (error) {
    console.error("[vyrax email]", error instanceof Error ? error.message : "unknown error");
    return "failed";
  }
}
