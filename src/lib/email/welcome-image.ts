import { SITE_URL } from "../../data/site";

const IMG = (n: number, alt: string, href: string) =>
  `<tr><td style="padding:0;font-size:0;line-height:0"><a href="${href}" style="text-decoration:none"><img src="${SITE_URL}/email/welcome-${n}.png" width="600" alt="${alt}" style="width:100%;max-width:600px;height:auto;display:block;border:0;outline:none;text-decoration:none"></a></td></tr>`;
export function buildWelcomeEmail(o: {
  code: string;
  shopUrl: string;
  contactEmail: string;
  unsubscribe?: string;
  guideUrl?: string;
}) {
  const foot = o.unsubscribe
    ? `<a href="${o.unsubscribe}" style="color:#14213D">Unsubscribe</a>`
    : "";
  const imgs =
    IMG(1, "Up to 20% off your first order, plus free goods", o.shopUrl) +
    IMG(2, "Free delivery 50, free water 75, 10% off 150, 15% off 250, 20% off 400", o.shopUrl) +
    IMG(3, "Most requested: BPC-157, retatrutide, GHK-Cu", o.shopUrl) +
    IMG(4, "Every report we publish is the lab's own", o.shopUrl);
  const head = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Your code</title><style>@media (prefers-color-scheme:dark){body{background:#0E1730!important}table{background:#0E1730!important}}</style></head><body style="margin:0;padding:0;background:#FFFFFF"><div style="display:none;font-size:1px;color:#FFFFFF;max-height:0;overflow:hidden">Your code is inside, plus the free goods you unlock as the basket grows.</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#FFFFFF"><tr><td align="center"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;background:#FFFFFF">`;
  const bits = `<tr><td style="padding:18px 28px 26px;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;text-align:center"><p style="margin:0 0 8px;font-size:14px;color:#14213D">Code <strong>${o.code}</strong>. Free delivery over 50, free water over 75, 10% over 150, 15% over 250, 20% over 400.</p>`;
  const legal = `Sold for research use only. Not a licensed medicine. No dose is on the label.`;
  const policy = `Research use policy: ${SITE_URL}/research-use-policy`;
  const links = `<a href="${o.shopUrl}" style="color:#14213D">Shop</a> · <a href="mailto:${o.contactEmail}" style="color:#14213D">${o.contactEmail}</a>${foot ? ` · ${foot}` : ""}`;
  const tail = `<p style="margin:0;font-size:12px;line-height:1.7;color:#6B7688">${legal}<br><a href="${SITE_URL}/research-use-policy" style="color:#14213D">Research use policy</a><br>${links}</p></td></tr></table></td></tr></table></body></html>`;
  const brand = `<tr><td align="center" style="padding:22px 0 14px"><a href="${o.shopUrl}" style="text-decoration:none"><span style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;letter-spacing:.22em;color:#14213D">VYRAX</span><span style="display:inline-block;width:44px;height:2px;background:#5B8DEF;vertical-align:middle;margin:0 10px"></span><span style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:.34em;color:#5B8DEF">LABS</span></a><div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:.16em;color:#6B7688;margin-top:8px">Vyrax Labs &middot; vyraxlabs.co.uk</div></td></tr>`;
  const guide = o.guideUrl
    ? `<tr><td align="center" style="padding:0 28px 16px;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif"><p style="margin:0;font-size:13px;line-height:1.6;color:#4A5568">Your reconstitution guide is ready: <a href="${o.guideUrl}" style="color:#14213D;font-weight:700">download the PDF</a></p></td></tr>`
    : "";
  const html = head + brand + guide + imgs + bits + tail;
  const text = [`Vyrax Labs`, ``, `Your code: ${o.code}`, "", "Up to 20% off your first order.", "Free delivery over 50, free water over 75, 10% over 150, 15% over 250, 20% over 400.", o.guideUrl ? `Guide: ${o.guideUrl}` : "", "", legal, policy, o.unsubscribe ? `Unsubscribe: ${o.unsubscribe}` : "Unsubscribe: mailto:"+o.contactEmail, o.shopUrl, o.contactEmail];
  return { html, text };
}
