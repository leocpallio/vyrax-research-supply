// Run: bun src/lib/email/v4/render-all-v4.ts [output-directory]   (default: preview-all)
// Renders EVERY v4 email into one folder and writes a simple index.html. Offline fixtures only:
// never calls Resend, never reads recipients, sends nothing.
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { lineMedia } from "../order-email.server";
import { escapeHtml, renderEmail, type EmailEvent } from "../templates";
import { SITE_URL, site } from "../../../data/site";
import { authAdminIndex, type PreviewEntry } from "./index-auth";

type Rendered = { subject: string; html: string; text: string };
type Group = { group: string; entries: PreviewEntry[] };

// Same fixtures as src/lib/email/render-previews.ts (that file renders on import, so it is mirrored here).
const who = {
  name: "Alex Buyer",
  reference: "VX-PREVIEW",
  address: "12 Example Road, London, SW1A 1AA",
  orderDate: "2026-10-06",
};
const optOut = { unsubscribeUrl: `mailto:${site.email}` };
const existing: EmailEvent[] = [
  {
    kind: "orderConfirmation",
    ...who,
    lines: [
      { name: "Retatrutide", strength: "10mg", quantity: 2, lineTotal: 120, ...lineMedia("retatrutide", "10mg") },
      { name: "BPC-157", strength: "10mg", quantity: 1, lineTotal: 25, ...lineMedia("bpc-157", "10mg") },
      { name: "Bacteriostatic Water", strength: "10ml", quantity: 1, lineTotal: 6, ...lineMedia("bacteriostatic-water", "10ml") },
    ],
    delivery: 4.99,
    total: 155.99,
  },
  { kind: "paymentPending", ...who },
  { kind: "paymentFailed", ...who },
  { kind: "paymentExpired", ...who },
  { kind: "packed", ...who },
  { kind: "dispatched", ...who, trackingNumber: "EXAMPLE123" },
  { kind: "guideWelcome", name: who.name, ...optOut },
  { kind: "postPurchase", ...who, ...optOut },
  { kind: "reviewAsk", ...who, ...optOut },
  { kind: "reorder", ...who, ...optOut },
  { kind: "paymentRecovery", ...who, checkoutUrl: `${SITE_URL}/checkout`, ...optOut },
];

/** Import a sibling index defensively: a missing or broken file is skipped, never fatal. */
async function loadIndex(file: string): Promise<PreviewEntry[]> {
  try {
    const mod: Record<string, unknown> = await import(file);
    const found: PreviewEntry[] = [];
    for (const value of Object.values(mod)) {
      if (!Array.isArray(value)) continue;
      for (const item of value) {
        const entry = item as { id?: unknown; render?: unknown };
        if (typeof entry?.id === "string" && typeof entry.render === "function")
          found.push(entry as PreviewEntry);
      }
    }
    // `default` and a named export usually point at the same array.
    return [...new Map(found.map((x) => [x.id, x])).values()];
  } catch (error) {
    console.warn(`skipped ${file}: ${error instanceof Error ? error.message : "not available"}`);
    return [];
  }
}

const directory = resolve(process.argv[2] ?? "preview-all");
await mkdir(directory, { recursive: true });

const groups: Group[] = [
  {
    group: "Existing order and notification emails",
    entries: existing.map((fixture) => ({
      id: fixture.kind,
      render: (): Rendered => renderEmail(fixture),
    })),
  },
  { group: "Welcome", entries: await loadIndex("./index-welcome") },
  { group: "Lifecycle", entries: await loadIndex("./index-lifecycle") },
  { group: "Auth and admin", entries: authAdminIndex },
];

const seen = new Set<string>();
const sections: string[] = [];
let total = 0;
for (const { group, entries } of groups) {
  const items: string[] = [];
  for (const entry of entries) {
    if (seen.has(entry.id)) {
      console.warn(`skipped duplicate id ${entry.id}`);
      continue;
    }
    seen.add(entry.id);
    const mail = (await entry.render()) as Rendered;
    await Promise.all([
      writeFile(resolve(directory, `${entry.id}.html`), mail.html, "utf8"),
      writeFile(resolve(directory, `${entry.id}.txt`), `Subject: ${mail.subject}\n\n${mail.text}`, "utf8"),
    ]);
    items.push(
      `<li><a href="${escapeHtml(entry.id)}.html">${escapeHtml(entry.id)}</a> <span>${escapeHtml(mail.subject)}</span> <a class="t" href="${escapeHtml(entry.id)}.txt">text</a></li>`,
    );
    total += 1;
  }
  if (items.length) sections.push(`<h2>${escapeHtml(group)} (${items.length})</h2><ul>${items.join("")}</ul>`);
  else console.warn(`no emails for group: ${group}`);
}

const index = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Vyrax v4 email previews</title><style>body{font:16px/1.5 system-ui,sans-serif;max-width:760px;margin:32px auto;padding:0 16px;color:#14213D}h2{margin:28px 0 8px;font-size:18px}ul{padding:0;list-style:none}li{padding:8px 0;border-bottom:1px solid #E1E6EF}li span{display:block;color:#4A5568;font-size:13px}a{color:#14213D}a.t{font-size:12px}</style></head><body><h1>Vyrax v4 email previews</h1><p>${total} emails. Offline fixtures only. Nothing is sent.</p>${sections.join("")}</body></html>`;
await writeFile(resolve(directory, "index.html"), index, "utf8");
console.log(`Rendered ${total} v4 email previews in ${directory}. No messages sent.`);
