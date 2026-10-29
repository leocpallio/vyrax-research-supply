import { sendTransactional } from "./send.server";
import { summarise, type OrderRow } from "./order-email.server";
import { orderRef } from "../checkout-form";

/**
 * Admin sale alert.
 *
 * Mirrors the UKPL wiring: every confirmed card payment emails the admin inbox straight away, so a
 * sale never sits unnoticed behind an admin dashboard. Deliberately NOT queued through the outbox:
 * the alert is an operational signal, not customer mail, and must not depend on the drain cron.
 */
export function adminEmail(env: Record<string, string | undefined> = process.env): string {
  return env["VYRAX_ADMIN_EMAIL"] || "leo.k.kallio@gmail.com";
}

const money = (pence: number) => `£${(pence / 100).toFixed(2)}`;

type AlertOrder = OrderRow & {
  payment_id?: string | null;
  test_mode?: boolean | null;
  phone?: string | null;
  city?: string | null;
  address2?: string | null;
};

export function saleAlert(order: AlertOrder): { subject: string; html: string; text: string } {
  const summary = summarise(order);
  const ref = orderRef(order.id);
  const lines = summary.lines ?? [];
  const count = lines.reduce((n, l) => n + (l.quantity ?? 0), 0);
  const subject = `Vyrax sale · ${money(order.total_pence)} · ${count} ${count === 1 ? "item" : "items"} · ${order.name}`;
  const address = [order.address, order.address2, order.city, order.postcode].filter(Boolean).join(", ");

  const rows = lines
    .map(
      (l) =>
        `<tr><td style="padding:6px 0">${l.quantity}× ${l.name}${l.strength ? ` ${l.strength}` : ""}</td>` +
        `<td style="padding:6px 0;text-align:right">${money(Math.round((l.lineTotal ?? 0) * 100))}</td></tr>`,
    )
    .join("");

  const html = `<div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#15191E;line-height:1.5">
<p style="margin:0 0 4px"><strong>Paid order ${ref}</strong></p>
<p style="margin:0 0 16px;font-size:22px"><strong>${money(order.total_pence)}</strong></p>
<table style="width:100%;border-collapse:collapse;margin:0 0 16px">${rows}
<tr><td style="padding:10px 0 0;border-top:1px solid #ddd"><strong>Total paid</strong></td>
<td style="padding:10px 0 0;border-top:1px solid #ddd;text-align:right"><strong>${money(order.total_pence)}</strong></td></tr></table>
<p style="margin:0 0 4px"><strong>Ship to</strong><br>${order.name}<br>${address}</p>
<p style="margin:0 0 4px">${order.email}${order.phone ? ` · ${order.phone}` : ""}</p>
<p style="margin:16px 0 0;color:#666;font-size:13px">Payment ${order.payment_id ?? "n/a"}${order.test_mode ? " · TEST MODE" : ""}. Mark it packed, then dispatched once the label is on.</p>
</div>`;

  const text = [
    `Paid order ${ref} · ${money(order.total_pence)}`,
    "",
    ...lines.map(
      (l) => `${l.quantity}× ${l.name}${l.strength ? ` ${l.strength}` : ""}  ${money(Math.round((l.lineTotal ?? 0) * 100))}`,
    ),
    "",
    `Total paid ${money(order.total_pence)}`,
    `Ship to: ${order.name}, ${address}`,
    `${order.email}${order.phone ? ` · ${order.phone}` : ""}`,
    `Payment ${order.payment_id ?? "n/a"}${order.test_mode ? " · TEST MODE" : ""}`,
  ].join("\n");

  return { subject, html, text };
}

/** Sends the alert. Returns the Resend id, or null when it was skipped. Never throws. */
export async function sendSaleAlert(
  order: AlertOrder,
  eventId: string,
  deps: { env?: Record<string, string | undefined>; fetcher?: typeof fetch } = {},
): Promise<string | null> {
  if (order.test_mode) return null;
  const env = deps.env ?? process.env;
  try {
    return await sendTransactional(
      { to: adminEmail(env), mail: saleAlert(order), key: `admin-sale-${eventId}`.slice(0, 256) },
      { env, ...(deps.fetcher ? { fetcher: deps.fetcher } : {}) },
    );
  } catch (error) {
    console.error("[vyrax admin alert]", error instanceof Error ? error.message : "unknown error");
    return null;
  }
}
