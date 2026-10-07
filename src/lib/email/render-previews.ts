// Run: bun src/lib/email/render-previews.ts [output-directory]
// Offline fixtures only: writes HTML and plain text; never calls Resend or reads recipients.
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { renderEmail, type EmailEvent } from "./templates";
import { SITE_URL, site } from "../../data/site";

const who = {
  name: "Alex Researcher",
  reference: "VX-PREVIEW",
  address: "12 Example Road, London, SW1A 1AA",
  orderDate: "2026-10-06",
};
const optOut = { unsubscribeUrl: `mailto:${site.email}` };
const fixtures: EmailEvent[] = [
  {
    kind: "orderConfirmation",
    ...who,
    lines: [{ name: "Research material", strength: "5mg", quantity: 2, lineTotal: 40 }],
    delivery: 4.99,
    total: 44.99,
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
const directory = resolve(
  process.argv[2] ?? "/home/ubuntu/.hermes/cache/scratch/vyrax-email-previews",
);
await mkdir(directory, { recursive: true });
for (const fixture of fixtures) {
  const mail = renderEmail(fixture);
  await Promise.all([
    writeFile(resolve(directory, `${fixture.kind}.html`), mail.html, "utf8"),
    writeFile(
      resolve(directory, `${fixture.kind}.txt`),
      `Subject: ${mail.subject}\n\n${mail.text}`,
      "utf8",
    ),
  ]);
}
console.log(
  `Rendered ${fixtures.length} offline email previews in ${directory}. No messages sent.`,
);
