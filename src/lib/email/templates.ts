// Pure email rendering: no secrets, network calls or customer data access.
// Messages describe a PAID checkout: confirmation after payment, payment failed/expired, dispatch.
export type Line = { name: string; strength: string; quantity: number; lineTotal: number };
export type Summary = {
  lines: readonly Line[];
  /** Optional breakdown. Omit when it cannot be reproduced exactly. */
  discount?: number;
  delivery?: number;
  total: number;
};
type Referenced = { name: string; reference: string };
export type EmailEvent =
  | ({ kind: "orderConfirmation" } & Referenced & Summary)
  | ({ kind: "paymentFailed" | "paymentExpired" } & Referenced)
  | ({ kind: "dispatched"; trackingNumber?: string } & Referenced);
export type RenderedEmail = { subject: string; html: string; text: string };

export const SUPPORT_EMAIL = "support@vyraxlabs.co.uk";
export const LEGAL_FOOTER =
  "Vyrax Labs";
export const RESEARCH_NOTICE = "For laboratory research use only. Not for human or veterinary use.";
const CARRIER = "Royal Mail Tracked 24";

export const escapeHtml = (value: unknown) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );
const gbp = (value: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(value);
const oneLine = (value: unknown) => String(value ?? "").replace(/[\r\n\t]+/g, " ").trim();
const e = escapeHtml;

const css = {
  body: "margin:0;padding:0;background:#f4f6fa;color:#172238;font-family:Arial,Helvetica,sans-serif",
  card: "max-width:600px;width:100%;background:#ffffff;border:1px solid #dfe5ed;border-radius:12px",
  head: "background:#203eab;color:#ffffff;padding:22px 28px;font-size:22px;font-weight:bold",
  main: "padding:28px;line-height:1.6;font-size:16px;color:#172238",
  p: "margin:0 0 16px",
  foot: "padding:20px 28px;border-top:1px solid #dfe5ed;font-size:13px;line-height:1.5;color:#4b5563",
  cell: "padding:10px;border-bottom:1px solid #dfe5ed",
};
// Dark-mode safe: light palette is inline (works everywhere); clients that honour the media query get a dark one.
const darkStyle = `<style>:root{color-scheme:light dark;supported-color-schemes:light dark}@media (prefers-color-scheme:dark){.bg{background:#0f1626!important}.card{background:#172238!important;border-color:#2b3a57!important}.tx{color:#e8edf7!important}.mute{color:#a9b4c8!important}.rule{border-color:#2b3a57!important}.hd{background:#203eab!important}}@media (max-width:620px){.pad{padding:20px!important}}</style>`;

function table(s: Summary): string {
  const rows = s.lines
    .map(
      (l) =>
        `<tr><td class="rule tx" style="${css.cell}">${e(l.name)}<br><span class="mute" style="color:#4b5563">${e(l.strength)}</span></td><td class="rule tx" align="center" style="${css.cell}">${e(l.quantity)}</td><td class="rule tx" align="right" style="${css.cell}">${e(gbp(l.lineTotal))}</td></tr>`,
    )
    .join("");
  const extra = (label: string, v: string) =>
    `<tr><td colspan="2" class="tx" style="padding:6px 10px">${e(label)}</td><td class="tx" align="right" style="padding:6px 10px">${e(v)}</td></tr>`;
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:0 0 16px;font-size:14px"><thead><tr><th class="tx" align="left" style="${css.cell}">Item</th><th class="tx" align="center" style="${css.cell}">Qty</th><th class="tx" align="right" style="${css.cell}">Price</th></tr></thead><tbody>${rows}${s.discount ? extra("Discounts", `-${gbp(s.discount)}`) : ""}${s.delivery !== undefined ? extra(`Delivery (${CARRIER})`, s.delivery === 0 ? "Free" : gbp(s.delivery)) : ""}<tr><td colspan="2" class="tx" style="padding:12px 10px;font-weight:bold">Total paid</td><td class="tx" align="right" style="padding:12px 10px;font-weight:bold">${e(gbp(s.total))}</td></tr></tbody></table>`;
}
function textSummary(s: Summary): string[] {
  return [
    ...s.lines.map((l) => `${oneLine(l.name)} ${oneLine(l.strength)} x ${l.quantity}: ${gbp(l.lineTotal)}`),
    ...(s.discount ? [`Discounts: -${gbp(s.discount)}`] : []),
    ...(s.delivery !== undefined
      ? [`Delivery (${CARRIER}): ${s.delivery === 0 ? "Free" : gbp(s.delivery)}`]
      : []),
    `Total paid: ${gbp(s.total)}`,
  ];
}

function wrap(
  heading: string,
  paras: string[],
  textLines: string[],
  detailHtml = "",
  tail: string[] = [],
) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><title>${e(heading)}</title>${darkStyle}</head><body class="bg" style="${css.body}"><div style="display:none;max-height:0;overflow:hidden;opacity:0">${e(heading)}</div><table class="bg" role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6fa"><tr><td align="center" style="padding:24px 12px"><table class="card" role="presentation" width="600" cellspacing="0" cellpadding="0" style="${css.card}"><tr><td class="hd" style="${css.head}">Vyrax Labs</td></tr><tr><td class="pad tx" style="${css.main}"><h1 class="tx" style="margin:0 0 16px;font-size:24px;color:#172238">${e(heading)}</h1>${paras.map((t) => `<p style="${css.p}">${e(t)}</p>`).join("")}${detailHtml}${tail.map((t) => `<p style="${css.p}">${e(t)}</p>`).join("")}<p style="${css.p}">Questions: <a href="mailto:${SUPPORT_EMAIL}" style="color:#203eab">${SUPPORT_EMAIL}</a></p></td></tr><tr><td class="pad rule mute" style="${css.foot}">${e(RESEARCH_NOTICE)}<br>${e(LEGAL_FOOTER)}</td></tr></table></td></tr></table></body></html>`;
  const text = [
    heading,
    "",
    ...textLines,
    "",
    `Questions: ${SUPPORT_EMAIL}`,
    "",
    RESEARCH_NOTICE,
    LEGAL_FOOTER,
  ].join("\n");
  return { html, text };
}

export function renderEmail(event: EmailEvent): RenderedEmail {
  const hello = `Hello ${oneLine(event.name)},`;
  const ref = `Order reference: ${oneLine(event.reference)}`;
  const base = [hello, ref];
  switch (event.kind) {
    case "orderConfirmation": {
      const heading = "Payment received, thank you";
      const intro = [
        hello,
        ref,
        "We have received your payment and your order is awaiting review.",
      ];
      const after = `Orders ship by ${CARRIER}. We will email you again when your order is dispatched. No delivery date is promised.`;
      const { html, text } = wrap(
        heading,
        intro,
        [...intro, "", ...textSummary(event), "", after],
        table(event),
        [after],
      );
      return { subject: `Order ${oneLine(event.reference)} confirmed | Vyrax Labs`, html, text };
    }
    case "paymentFailed":
    case "paymentExpired": {
      const failed = event.kind === "paymentFailed";
      const heading = failed ? "Your payment did not complete" : "Your payment session expired";
      const body = [
        ...base,
        failed
          ? "Your payment was not completed and your order has not been placed. Check with your bank or card provider before trying again."
          : "The payment session expired before payment was completed, so your order has not been placed.",
        `If you were charged, email ${SUPPORT_EMAIL} quoting the reference above and do not pay again.`,
      ];
      const { html, text } = wrap(heading, body, body);
      return { subject: `${heading} | Vyrax Labs`, html, text };
    }
    case "dispatched": {
      const heading = "Your order has been dispatched";
      const tracking = event.trackingNumber
        ? [`Tracking number: ${oneLine(event.trackingNumber)}`]
        : [];
      const body = [...base, `Carrier: ${CARRIER}.`, ...tracking];
      const { html, text } = wrap(heading, body, body);
      return { subject: `Order ${oneLine(event.reference)} dispatched | Vyrax Labs`, html, text };
    }
  }
}
