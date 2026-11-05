// Vyrax v4 admin/owner email: the paid-order alert in the card-inset look.
//
// This is a NEW render function. It does not touch admin-alert.server.ts. When the owner is ready,
// swap `saleAlert(order)` for `adminPaidOrderAlert(order)` in sendSaleAlert: same input shape,
// same { subject, html, text } output, same subject format. Render only; nothing here sends mail.
//
// Internal-only mail, so processor names (SpicePay) are fine here. They must never appear in customer mail.
import { SITE_URL, site } from "../../../data/site";
import { orderRef } from "../../checkout-form";
import { dispatchCutoffLabel } from "../../delivery";
import { summarise, type OrderRow } from "../order-email.server";
import { escapeHtml, gbp, oneLine, safeUrl, thumb, wrap, type Line } from "../templates";

export type AdminAlertOrder = OrderRow & {
  payment_id?: string | null;
  test_mode?: boolean | null;
  phone?: string | null;
  /** When the payment was confirmed (ISO). Falls back to created_at, then to `now`. */
  paid_at?: string | null;
};

export type AdminAlertMail = { subject: string; html: string; text: string };

const e = escapeHtml;
const CELL = "padding:12px 0;border-bottom:1px solid #E1E6EF;vertical-align:middle";
const LABEL =
  "font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#6B7688;margin:0 0 5px";

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** UK wall-clock parts for an instant. */
function ukParts(d: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      hourCycle: "h23",
      weekday: "short",
    })
      .formatToParts(d)
      .map((p) => [p.type, p.value]),
  );
  return {
    y: Number(parts["year"]),
    m: Number(parts["month"]),
    d: Number(parts["day"]),
    hour: Number(parts["hour"]),
    weekday: String(parts["weekday"]),
  };
}

/**
 * Dispatch-by day from the site cut-off: paid before the cut-off on a working day means today,
 * otherwise the next working day. Weekends only; UK bank holidays are not modelled.
 */
export function dispatchBy(paidAt: Date): { label: string; sameDay: boolean } {
  const cutoff = site.dispatchCutoffHour;
  const p = ukParts(paidAt);
  const working = (w: string) => w !== "Sat" && w !== "Sun";
  let day = new Date(Date.UTC(p.y, p.m - 1, p.d, 12));
  const sameDay = working(p.weekday) && p.hour < cutoff;
  if (!sameDay) {
    do day = new Date(day.getTime() + 86_400_000);
    while (!working(WEEKDAY[day.getUTCDay()] as string));
  }
  const label = day.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
  return { label, sameDay };
}

const kv = (label: string, value: string, mono = false) =>
  `<tr><td class="mute rule" style="${CELL};width:34%;padding-right:12px;font-size:13px;color:#4A5568">${e(label)}</td><td class="tx rule" style="${CELL};font-size:15px;word-break:break-word;overflow-wrap:anywhere${mono ? ";font-family:'SF Mono',Menlo,Consolas,monospace;font-size:13px" : ""}">${value}</td></tr>`;

function itemRow(l: Line): string {
  const unit =
    l.quantity > 1 ? `${e(gbp(l.lineTotal / l.quantity))} each` : "";
  const strength = e(oneLine(l.strength).replace(/(\d)(mg|ml)\b/gi, "$1 $2"));
  return `<tr>${thumb(l)}<td class="rule tx" align="left" style="${CELL};text-align:left;padding-right:8px"><span class="tx" style="font-weight:600;text-align:left">${e(oneLine(l.name))}</span><br><span class="mute" style="color:#4A5568;font-size:13px">${strength}${unit ? ` · ${unit}` : ""}</span></td><td class="rule tx" align="center" style="${CELL};white-space:nowrap;padding:12px 8px;font-size:15px;font-weight:600">${e(`× ${l.quantity}`)}</td><td class="rule tx" align="right" style="${CELL};white-space:nowrap;padding-left:8px;font-size:15px;font-weight:600">${e(gbp(l.lineTotal))}</td></tr>`;
}

function itemsTable(lines: readonly Line[], extras: Array<[string, string]>, total: number) {
  const extra = (label: string, v: string) =>
    `<tr><td colspan="3" class="mute" style="padding:8px 0 0;font-size:14px;color:#4A5568">${e(label)}</td><td class="tx" align="right" style="padding:8px 0 0;font-size:14px;white-space:nowrap">${e(v)}</td></tr>`;
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 24px;font-size:15px"><tbody>${lines.map(itemRow).join("")}${extras.map(([a, b]) => extra(a, b)).join("")}<tr><td colspan="3" class="tx" style="padding:14px 0 0;font-size:16px;font-weight:700">Total paid</td><td class="tx" align="right" style="padding:14px 0 0;font-size:16px;font-weight:700;white-space:nowrap">${e(gbp(total))}</td></tr></tbody></table>`;
}

export function adminPaidOrderAlert(
  order: AdminAlertOrder,
  opts: { now?: Date } = {},
): AdminAlertMail {
  const summary = summarise(order);
  const ref = orderRef(order.id);
  const lines = summary.lines;
  const count = lines.reduce((n, l) => n + l.quantity, 0);
  const total = order.total_pence / 100;
  const name = oneLine(order.name);
  const address = [order.address, order.address2, order.city, order.postcode]
    .map((x) => oneLine(x))
    .filter(Boolean)
    .join(", ");
  const paid = order.paid_at ?? order.created_at;
  const paidAt = paid ? new Date(paid) : (opts.now ?? new Date());
  const when = Number.isNaN(paidAt.getTime()) ? (opts.now ?? new Date()) : paidAt;
  const due = dispatchBy(when);
  const adminUrl = safeUrl(`${SITE_URL}/admin`);
  const extras: Array<[string, string]> = [];
  if ("delivery" in summary && summary.delivery !== undefined) {
    const sub = lines.reduce((s, l) => s + l.lineTotal, 0);
    extras.push(["Subtotal", gbp(sub)]);
    if ("discount" in summary && summary.discount) extras.push(["Discount", `-${gbp(summary.discount)}`]);
    extras.push(["Delivery", summary.delivery === 0 ? "Free" : gbp(summary.delivery)]);
  }
  const payment = order.payment_id ? oneLine(order.payment_id) : "n/a";
  const subject = `Vyrax sale · ${gbp(total)} · ${count} ${count === 1 ? "item" : "items"} · ${name}`;
  const dueText = due.sameDay
    ? `Today (${due.label}), paid before ${dispatchCutoffLabel()}`
    : `${due.label}, paid after ${dispatchCutoffLabel()} or on a non-working day`;

  const details =
    `<div class="mute" style="${LABEL}">Items</div>` +
    itemsTable(lines, extras, total) +
    `<div class="mute" style="${LABEL}">Customer and payment</div>` +
    `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 24px"><tbody>` +
    kv("Customer", e(name)) +
    kv("Email", `<a class="lk" href="mailto:${e(oneLine(order.email))}" style="color:#14213D;text-decoration:underline">${e(oneLine(order.email))}</a>`) +
    (order.phone ? kv("Phone", e(oneLine(order.phone))) : "") +
    kv("Payment", `SpicePay card payment${order.test_mode ? " (TEST MODE)" : ""}`) +
    kv("Payment ID", e(payment), true) +
    `</tbody></table>` +
    `<div class="tx" style="border-left:2px solid #5B8DEF;padding:1px 0 1px 14px;margin:0 0 24px;font-size:15px"><span class="mute" style="display:block;${LABEL}">Ship to</span>${e(name)}<br>${e(address)}</div>` +
    `<div class="tint rule" style="margin:0 0 24px;padding:16px 18px;background:#EEF2F9;border:1px solid #E1E6EF;border-radius:14px"><span class="mute" style="display:block;${LABEL}">Dispatch by</span><span class="tx" style="font-size:16px;font-weight:700">${e(due.label)}</span><br><span class="mute" style="color:#4A5568;font-size:13px">${e(due.sameDay ? `Paid before the ${dispatchCutoffLabel()} cut-off, so it goes today.` : `Paid after the ${dispatchCutoffLabel()} cut-off or on a non-working day, so it goes next working day.`)}</span></div>`;

  const detailText = [
    "Items",
    ...lines.map(
      (l) => `${l.quantity} x ${oneLine(l.name)}${l.strength ? ` ${oneLine(l.strength)}` : ""}: ${gbp(l.lineTotal)}`,
    ),
    ...extras.map(([a, b]) => `${a}: ${b}`),
    `Total paid: ${gbp(total)}`,
    "",
    `Customer: ${name}`,
    `Email: ${oneLine(order.email)}`,
    ...(order.phone ? [`Phone: ${oneLine(order.phone)}`] : []),
    `Payment: SpicePay card payment${order.test_mode ? " (TEST MODE)" : ""}`,
    `Payment ID: ${payment}`,
    "",
    `Ship to: ${name}, ${address}`,
    `Dispatch by: ${dueText}`,
  ];

  const mail = wrap({
    heading: `New paid order, ${gbp(total)}`,
    preheader: `${name} paid ${gbp(total)} for ${count} ${count === 1 ? "item" : "items"}. Dispatch by ${due.label}.`,
    subject,
    reference: ref,
    orderDate: (order.created_at ?? when.toISOString()).slice(0, 10),
    paragraphs: [
      `${name} has paid for ${count} ${count === 1 ? "item" : "items"}. Pack it, add the label, then mark it packed and dispatched in admin.`,
    ],
    detail: { html: details, text: detailText },
    lines: ["Internal alert for the owner. Do not forward to customers."],
    action: { label: "Open admin", url: adminUrl },
  });
  return { subject: mail.subject, html: mail.html, text: mail.text };
}
