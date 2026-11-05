import { describe, expect, it } from "bun:test";
import { SITE_URL, site, spendTierLine } from "../../../data/site";
import { lifecycleEntries } from "./index-lifecycle";

const BANNED = [
  /discreet/i, /vat included/i, /enquir/i, /reconciled/i, /settled via/i, /spicepay/i, /fena/i,
  /guaranteed/i, /act now/i, /last chance/i, /hurry/i, /urgent/i, /-\s?20\s?°?\s?c/i, /2\s?(to|-)\s?8\s?°?\s?c/i,
];
const byId = (id: string) => lifecycleEntries.find((e) => e.id === id)!.render();

describe("Vyrax v4 lifecycle: post-purchase, reorder, pending payment, contact", () => {
  it("renders all twelve", () => {
    expect(lifecycleEntries.map((e) => e.id)).toEqual([
      "postpurchase-d7-storage", "reorder-reminder-0", "reorder-reminder-1", "reorder-reminder-2",
      "reorder-nudge", "reorder-v2-product", "reorder-v2-water",
      "pending-1h-card", "pending-24h", "pending-72h", "contact-auto-reply", "contact-owner",
    ]);
  });

  for (const entry of lifecycleEntries) {
    describe(entry.id, () => {
      const m = entry.render();
      const plain = m.html.replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ");

      it("has support email and research notice", () => {
        expect(m.html).toContain(site.email);
        expect(m.text).toContain(site.email);
        expect(m.html.toLowerCase()).toContain("not a licensed medicine");
        expect(m.text.toLowerCase()).toContain("not a licensed medicine");
      });

      it("has unsubscribe on marketing kinds and postal address when one is configured", () => {
        if (entry.marketing) {
          expect(m.html).toContain("Unsubscribe");
          expect(m.text).toContain("Unsubscribe:");
          expect(m.listUnsubscribe).toBeTruthy();
          if (site.registeredOffice) expect(m.text).toContain(site.registeredOffice);
        }
      });

      it("has no em or en dash and no banned words", () => {
        for (const part of [m.subject, m.html, m.text]) {
          expect(part).not.toMatch(/[\u2013\u2014]|&mdash;|&ndash;|&#8211;|&#8212;/);
          for (const re of BANNED) expect(part).not.toMatch(re);
        }
      });

      it("has a plain-text part, live text and dark-mode classes", () => {
        expect(m.text.length).toBeGreaterThan(200);
        expect(plain.replace(/\s+/g, " ").length).toBeGreaterThan(300);
        expect(m.html).toContain("prefers-color-scheme:dark");
        expect(m.html).toContain('class="card');
      });

      it("keeps every image accessible and sized, on a coloured cell", () => {
        for (const img of m.html.match(/<img\b[^>]*>/g) ?? []) {
          expect(img).toMatch(/\balt="[^"]+"/);
          expect(img).toMatch(/\bwidth="\d+"/);
          expect(img).toMatch(/\bheight="\d+"/);
        }
      });

      it("never lays separate product images in one row", () => {
        for (const row of m.html.match(/<tr>[\s\S]*?<\/tr>/g) ?? []) {
          if (row.includes("<tr>", 4)) continue;
          expect((row.match(/email-thumbs\//g) ?? []).length).toBeLessThanOrEqual(1);
        }
      });

      it("has no /account link and only safe link targets", () => {
        expect(m.html).not.toMatch(/href="[^"]*\/account/);
        expect(m.text).not.toMatch(/\/account/);
        for (const href of [...m.html.matchAll(/href="([^"]+)"/g)].map((x) => x[1]!)) {
          expect(href.startsWith(SITE_URL) || href.startsWith("mailto:") || href.startsWith("tel:")).toBe(true);
        }
      });

      it("does not repeat a sentence or say reply-to-this-email twice", () => {
        const sentences = m.text.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter((s) => s.length > 25);
        expect(new Set(sentences).size).toBe(sentences.length);
        expect((m.text.match(/reply to this email/gi) ?? []).length).toBeLessThanOrEqual(1);
      });
    });
  }

  it("storage email uses only the approved storage wording", () => {
    const t = byId("postpurchase-d7-storage").text;
    expect(t).toContain("Keep sealed vials cool and dry, out of the light.");
    expect(t).toContain("Refrigerate once reconstituted.");
    expect(t).not.toMatch(/°|degrees|freezer|frozen/i);
  });

  it("reorder emails take offers from site data", () => {
    const r1 = byId("reorder-reminder-1").text;
    expect(r1).toContain(spendTierLine());
    expect(r1).toContain("Buy two, get the third free");
    expect(r1).toContain(`${site.firstOrderGift!.quantity} free bacteriostatic water vials`);
    expect(byId("reorder-v2-product").text).toContain("Buy two, get the third free");
    expect(byId("reorder-v2-water").text).toContain("free bacteriostatic water vials");
    expect(byId("reorder-reminder-0").text).toContain("Total at today's prices");
  });

  it("no reorder email offers the welcome code", () => {
    for (const e of lifecycleEntries) expect(e.render().text).not.toContain("FIRST10");
  });

  it("pending emails are card only, say no payment was received and never promise held stock", () => {
    for (const id of ["pending-1h-card", "pending-24h", "pending-72h"]) {
      const m = byId(id);
      expect(m.text).toContain("VX-5E6F7A8B");
      expect(m.text).toContain("do not pay again");
      expect(m.text).toContain(`${SITE_URL}/checkout`);
      expect(m.text).not.toMatch(/bank transfer|pay by bank|reserved|held for|stock is held|cancelled|expire/i);
    }
  });

  it("contact auto-reply confirms receipt and quotes the message", () => {
    const m = byId("contact-auto-reply");
    expect(m.text).toContain("certificate for the BPC-157 batch");
    expect(m.text).toContain("We aim to reply within one working day.");
  });

  it("contact-owner is internal and carries a reply link", () => {
    const m = lifecycleEntries.find((e) => e.id === "contact-owner")!.render() as { html: string; text: string; replyTo?: string };
    expect(m.replyTo).toBe("alex@example.com");
    expect(m.html).toContain("mailto:alex@example.com");
    expect(m.text).toContain("alex@example.com");
  });

  it("contact-owner drops an unusable address instead of building a link from it", async () => {
    const { contactOwner } = await import("./lifecycle");
    const m = contactOwner({ name: "X", email: 'bad"><script>', message: "hi" });
    expect(m.replyTo).toBeUndefined();
    expect(m.html).not.toContain("<script>");
    expect(m.html).not.toContain("mailto:bad");
  });
});
