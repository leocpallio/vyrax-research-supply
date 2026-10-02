// Pure email rendering: no secrets, network calls or customer data access.
// These messages are templates, not evidence that a payment or fulfilment integration exists.
export type Line = { name: string; strength: string; quantity: number; lineTotal: number };
type Named = { name: string };
type Referenced = Named & { reference: string };
export type EmailEvent =
  | ({
      kind: "enquiry" | "ownerAlert";
      lines: readonly Line[];
      indicativeTotal: number;
    } & Referenced & { email?: string })
  | ({ kind: "paymentPending" | "paymentConfirmed" | "refunded"; amount: number } & Referenced)
  | ({ kind: "packed" | "cancelled" } & Referenced)
  | ({
      kind: "dispatched";
      carrier?: string;
      trackingNumber?: string;
      trackingUrl?: string;
    } & Referenced)
  | ({ kind: "support" } & Named)
  | { kind: "authConfirm" | "authReset"; actionUrl: string };
export type RenderedEmail = { subject: string; html: string; text: string };

export const escapeHtml = (value: unknown) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character] ?? character,
  );
const gbp = (value: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(value);
const researchNotice = "For laboratory research use only. Not for human or veterinary use.";
const siteUrl = "https://vyraxlabs.co.uk";
const safeSiteUrl = (raw: string) => {
  try {
    const url = new URL(raw);
    return url.origin === siteUrl && url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
};

/** All dynamic content enters via escaped text nodes or allowlisted URLs. */
function wrap(
  heading: string,
  preheader: string,
  blocks: string[],
  textLines: string[],
): { html: string; text: string } {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f4f6fa;color:#172238;font-family:Arial,Helvetica,sans-serif"><div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 14px"><table role="presentation" width="600" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #dfe5ed;border-radius:12px" cellspacing="0" cellpadding="0"><tr><td style="background:#203eab;color:#ffffff;padding:24px 28px;font-size:22px;font-weight:bold">Vyrax Labs</td></tr><tr><td style="padding:28px;line-height:1.6;font-size:16px"><h1 style="margin:0 0 16px;font-size:24px;color:#172238">${escapeHtml(heading)}</h1>${blocks.map((b) => `<p style="margin:0 0 16px">${b}</p>`).join("")}</td></tr><tr><td style="padding:20px 28px;border-top:1px solid #dfe5ed;font-size:13px;color:#4b5563">${escapeHtml(researchNotice)}<br>Vyrax Labs &bull; <a href="${siteUrl}" style="color:#203eab">vyraxlabs.co.uk</a></td></tr></table></td></tr></table></body></html>`;
  return {
    html,
    text: [heading, "", ...textLines, "", researchNotice, "Vyrax Labs | vyraxlabs.co.uk"].join(
      "\n",
    ),
  };
}
const p = (value: unknown) => escapeHtml(value);
const linesOf = (lines: readonly Line[]) =>
  lines.map((line) => `${line.name} ${line.strength} x ${line.quantity}: ${gbp(line.lineTotal)}`);

export function renderEmail(event: EmailEvent): RenderedEmail {
  let subject: string;
  let heading: string;
  let copy: string[];
  let htmlCopy: string[] | undefined;
  switch (event.kind) {
    case "enquiry":
    case "ownerAlert": {
      const owner = event.kind === "ownerAlert";
      heading = owner ? "New research product enquiry" : "Your enquiry was recorded";
      subject = `${heading} | Vyrax Labs`;
      copy = [
        owner
          ? `Enquiry from ${event.name}${event.email ? ` (${event.email})` : ""}.`
          : `Hello ${event.name},`,
        `Enquiry reference: ${event.reference}.`,
        ...linesOf(event.lines),
        `Indicative total: ${gbp(event.indicativeTotal)}.`,
        "No payment has been taken. This is an enquiry, not a confirmed order. Availability, final pricing and any next steps must be agreed separately. No dispatch is scheduled or response time guaranteed.",
      ];
      break;
    }
    case "paymentPending":
      heading = "Payment is pending";
      subject = `Payment pending | Vyrax Labs`;
      copy = [
        `Hello ${event.name},`,
        `Reference: ${event.reference}.`,
        `Amount: ${gbp(event.amount)}.`,
        "Payment has not been confirmed. Do not treat this message as a receipt. We will confirm separately if payment completes.",
      ];
      break;
    case "paymentConfirmed":
      heading = "Payment confirmed";
      subject = `Payment confirmed | Vyrax Labs`;
      copy = [
        `Hello ${event.name},`,
        `Reference: ${event.reference}.`,
        `Amount received: ${gbp(event.amount)}.`,
        "This confirms payment only. We will update you separately if your order is packed or dispatched.",
      ];
      break;
    case "packed":
      heading = "Your order is packed";
      subject = `Order packed | Vyrax Labs`;
      copy = [
        `Hello ${event.name},`,
        `Reference: ${event.reference}.`,
        "Your order is packed but has not been dispatched. We will send dispatch details when available.",
      ];
      break;
    case "dispatched":
      heading = "Your order has been dispatched";
      subject = `Order dispatched | Vyrax Labs`;
      copy = [
        `Hello ${event.name},`,
        `Reference: ${event.reference}.`,
        "Your order has been dispatched.",
        ...(event.carrier ? [`Carrier: ${event.carrier}.`] : []),
        ...(event.trackingNumber ? [`Tracking number: ${event.trackingNumber}.`] : []),
      ];
      // External tracking links are not inserted blindly; only the reference is shown.
      break;
    case "cancelled":
      heading = "Your order was cancelled";
      subject = `Order cancelled | Vyrax Labs`;
      copy = [
        `Hello ${event.name},`,
        `Reference: ${event.reference}.`,
        "Your order was cancelled. If a payment was taken, any refund will be communicated separately after it is processed.",
      ];
      break;
    case "refunded":
      heading = "Your refund was processed";
      subject = `Refund processed | Vyrax Labs`;
      copy = [
        `Hello ${event.name},`,
        `Reference: ${event.reference}.`,
        `Refund amount: ${gbp(event.amount)}.`,
        "Your payment provider determines when the funds appear in your account.",
      ];
      break;
    case "support":
      heading = "We received your message";
      subject = `Message received | Vyrax Labs`;
      copy = [
        `Hello ${event.name},`,
        "Your message has been recorded. This is an automatic acknowledgement, not an answer. We cannot guarantee a response time.",
      ];
      break;
    case "authConfirm":
    case "authReset": {
      const url = safeSiteUrl(event.actionUrl);
      if (!url) throw new Error("Auth action URL must use the Vyrax site origin");
      heading = event.kind === "authConfirm" ? "Confirm your account" : "Reset your password";
      subject = `${heading} | Vyrax Labs`;
      copy = [
        "Use this link only if you requested it:",
        url,
        "If you did not request this, you can ignore this message. No order or payment was created.",
      ];
      htmlCopy = [
        `Use this link only if you requested it:`,
        `<a href="${p(url)}" style="color:#203eab">${p(url)}</a>`,
        copy[2] ?? "",
      ];
      break;
    }
  }
  const rendered = wrap(
    heading,
    copy[0] ?? heading,
    (htmlCopy ?? copy).map((line) =>
      htmlCopy?.includes(line) && line.startsWith("<a ") ? line : p(line),
    ),
    copy,
  );
  return { subject, ...rendered };
}
