import { SITE_URL } from "../../data/site";

const IMG = (n: number, alt: string, href: string) =>
  `<tr><td style="padding:0;font-size:0;line-height:0"><a href="${href}" style="text-decoration:none"><img src="${SITE_URL}/email/welcome-${n}.png" width="600" alt="${alt}" style="width:100%;max-width:600px;height:auto;display:block;border:0;outline:none;text-decoration:none"></a></td></tr>`;
export function buildWelcomeEmail(o: {
  code: string;
  shopUrl: string;
  contactEmail: string;
  unsubscribe?: string;
}) {
  const foot = o.unsubscribe
    ? `<a href="${o.unsubscribe}" style="color:#040825">Unsubscribe</a>`
    : "";
  const imgs =
    IMG(1, "Up to 20% off your first order, plus free goods", o.shopUrl) +
    IMG(2, "Free delivery 50, free water 75, 10% off 150, 15% off 250, 20% off 400", o.shopUrl) +
    IMG(3, "Most requested: BPC-157, retatrutide, GHK-Cu", o.shopUrl) +
    IMG(4, "Every report we publish is the lab's own", o.shopUrl);
  const head = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your code</title></head><body style="margin:0;padding:0;background:#F5F0E5"><div style="display:none;font-size:1px;color:#F5F0E5;max-height:0;overflow:hidden">Your code is inside, plus the free goods you unlock as the basket grows.</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#F5F0E5"><tr><td align="center"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#F5F0E5">`;
  const bits = `<tr><td style="padding:18px 28px 26px;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;text-align:center"><p style="margin:0 0 8px;font-size:14px;color:#040825">Code <strong>${o.code}</strong>. Free delivery over 50, free water over 75, 10% over 150, 15% over 250, 20% over 400.</p>`;
  const legal = `Sold for research use only. Not a licensed medicine. No dose is on the label.`;
  const links = `<a href="${o.shopUrl}" style="color:#040825">Shop</a> · <a href="mailto:${o.contactEmail}" style="color:#040825">${o.contactEmail}</a>${foot ? ` · ${foot}` : ""}`;
  const tail = `<p style="margin:0;font-size:12px;line-height:1.7;color:#8C8779">${legal}<br>${links}</p></td></tr></table></td></tr></table></body></html>`;
  const html = head + imgs + bits + tail;
  const text = [`Your code: ${o.code}`, "", "Up to 20% off your first order.", "Free delivery over 50, free water over 75, 10% over 150, 15% over 250, 20% over 400.", "", legal, o.shopUrl, o.contactEmail];
  return { html, text };
}
