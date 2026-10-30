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
        `<tr><td style="padding:10px 0;border-bottom:1px solid #EFEAE0;font-size:14px">${l.quantity}× ${l.name}<span style="color:#8C8779">${l.strength ? ` ${l.strength}` : ""}</span></td>` +
        `<td align="right" style="padding:10px 0;border-bottom:1px solid #EFEAE0;font-size:14px">${money(Math.round((l.lineTotal ?? 0) * 100))}</td></tr>`,
    )
    .join("");

  const html = `<div style="margin:0;padding:24px 12px;background:#F5F0E5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#040825">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #E3DDD0;border-radius:14px">
<tr><td style="padding:18px 24px;border-bottom:1px solid #E3DDD0;font-size:13px;font-weight:700;letter-spacing:.22em">VYRAX <span style="color:#AC4821">LABS</span></td></tr>
<tr><td style="padding:24px">
<p style="margin:0 0 8px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8C8779">New paid order</p>
<p style="margin:0 0 4px;font-size:30px;font-weight:700;letter-spacing:-.02em">${money(order.total_pence)}</p>
<p style="margin:0 0 18px;font-size:13px;color:#5B5F73">${ref} - ${count} ${count === 1 ? "item" : "items"}${order.test_mode ? " - TEST MODE" : ""}</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #E3DDD0">${rows}</table>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:12px 0 0;font-size:13px;font-weight:700">Total paid</td><td align="right" style="padding:12px 0 0;font-size:13px;font-weight:700">${money(order.total_pence)}</td></tr></table>
<p style="margin:22px 0 6px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#8C8779">Ship to</p>
<p style="margin:0;font-size:14px;line-height:1.55">${order.name}<br>${address}</p>
<p style="margin:10px 0 0;font-size:13px;color:#5B5F73">${order.email}${order.phone ? ` - ${order.phone}` : ""}</p>
<p style="margin:20px 0 0;padding:11px 14px;background:#AC4821;color:#ffffff;border-radius:8px;font-size:13px;font-weight:600">Needs dispatch - mark packed, then dispatched once the label is on.</p>
<p style="margin:14px 0 0;font-size:12px;color:#8C8779">Payment ${order.payment_id ?? "n/a"}</p>
</td></tr></table></div>`;

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
