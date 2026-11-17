// What /api/order-status may return about an order's contents for the browser purchase event:
// slug, name, strength, unit price and quantity only. Never name, email, address or phone.
import { quoteCheckout } from "./checkout-pricing";

export type OrderStatusLine = {
  slug: string;
  name: string;
  strength: string;
  unit_pence: number;
  quantity: number;
};

/** Paid lines from the stored order items. Free-gift lines (GBP 0) are dropped. */
export function publicOrderLines(items: unknown): OrderStatusLine[] {
  if (!Array.isArray(items)) return [];
  const out: OrderStatusLine[] = [];
  for (const raw of items) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const unit = r["unitPence"];
    const qty = r["quantity"];
    if (
      typeof r["slug"] !== "string" ||
      typeof r["name"] !== "string" ||
      typeof r["strength"] !== "string" ||
      typeof unit !== "number" ||
      typeof qty !== "number" ||
      !Number.isInteger(unit) ||
      !Number.isInteger(qty) ||
      unit <= 0 ||
      qty < 1
    )
      continue;
    out.push({
      slug: r["slug"],
      name: r["name"],
      strength: r["strength"],
      unit_pence: unit,
      quantity: qty,
    });
  }
  return out;
}

/**
 * Delivery charged, re-derived from the stored lines (it depends on goods value only, not on the
 * promo code). Null when the basket can no longer be re-quoted, e.g. a line has since sold out.
 */
export function deliveryPenceFor(lines: OrderStatusLine[]): number | null {
  if (!lines.length) return null;
  try {
    return quoteCheckout(
      lines.map((l) => ({ slug: l.slug, strength: l.strength, quantity: l.quantity })),
    ).deliveryPence;
  } catch {
    return null;
  }
}
