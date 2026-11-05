import { describe, expect, it } from "bun:test";
import { SITE_URL, site, spendTierLine } from "../../../data/site";
import { promos } from "../../../data/promos";
import { welcomeEntries } from "./index-welcome";

const BANNED = [/discreet/i, /vat included/i, /enquir/i, /guaranteed/i, /act now/i, /last chance/i, /hurry/i];
const code = promos[0]!.code;

describe("Vyrax v4 welcome, cart and back-in-stock", () => {
  it("renders all nine", () => {
    expect(welcomeEntries.map((e) => e.id)).toEqual([
      "welcome-code", "welcome-d0", "welcome-d1", "welcome-d2", "welcome-d3",
      "cart-1-code", "cart-1-nocode", "cart-2", "back-in-stock",
    ]);
  });

  for (const entry of welcomeEntries) {
    describe(entry.id, () => {
      const m = entry.render();
      const plain = m.html.replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ");

      it("has support email, research notice and unsubscribe", () => {
        expect(m.html).toContain(site.email);
        expect(m.text).toContain(site.email);
        expect(m.html.toLowerCase()).toContain("not a licensed medicine");
        expect(m.text.toLowerCase()).toContain("not a licensed medicine");
        expect(m.html).toContain("Unsubscribe");
        expect(m.text).toContain("Unsubscribe:");
        expect(m.listUnsubscribe).toBeTruthy();
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
        expect(m.html).toContain("tx");
      });

      it("keeps every image accessible, sized and on a coloured cell", () => {
        const imgs = m.html.match(/<img\b[^>]*>/g) ?? [];
        for (const img of imgs) {
          expect(img).toMatch(/\balt="[^"]+"/);
          expect(img).toMatch(/\bwidth="\d+"/);
          expect(img).toMatch(/\bheight="\d+"/);
        }
      });

      it("never lays separate product images in one row", () => {
        for (const row of m.html.match(/<tr>[\s\S]*?<\/tr>/g) ?? []) {
          if (row.includes("<tr>", 4)) continue; // outer row wrapping nested tables
          const productImgs = (row.match(/email-thumbs\//g) ?? []).length;
          expect(productImgs).toBeLessThanOrEqual(1);
        }
      });

      it("only links to the store, the carrier or mailto/tel", () => {
        for (const href of [...m.html.matchAll(/href="([^"]+)"/g)].map((x) => x[1]!)) {
          expect(href.startsWith(SITE_URL) || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("https://verify.janoshik.com/")).toBe(true);
        }
      });
    });
  }

  it("states the offer from site data, never a hard-coded number", () => {
    const d0 = welcomeEntries.find((e) => e.id === "welcome-d0")!.render();
    expect(d0.text).toContain(code);
    expect(d0.text).toContain(spendTierLine());
    expect(d0.text).toContain("Buy two, get the third free");
    expect(d0.text).toContain("5 free bacteriostatic water vials");
    expect(d0.html).toContain("/email/combo/welcome-popular.jpg");
  });

  it("cart emails list a basket and take no payment claim beyond saved", () => {
    const c1 = welcomeEntries.find((e) => e.id === "cart-1-code")!.render();
    const c2 = welcomeEntries.find((e) => e.id === "cart-2")!.render();
    expect(c1.text).toContain(code);
    expect(c1.text).toContain("Total:");
    expect(c2.text).toContain("No charge has been taken");
    expect(c2.text).not.toContain(code);
    const nocode = welcomeEntries.find((e) => e.id === "cart-1-nocode")!.render();
    expect(nocode.text).not.toContain(code);
  });

  it("back in stock is a single notification", () => {
    const b = welcomeEntries.find((e) => e.id === "back-in-stock")!.render();
    expect(b.subject).toContain("back in stock");
    expect(b.text).toContain("we will not email you about it again");
  });

  it("reviewAsk already exists in templates.ts and obeys the same rules", async () => {
    const { renderEmail } = await import("../templates");
    const m = renderEmail({ kind: "reviewAsk", name: "Alex", reference: "VX-1", unsubscribeUrl: `mailto:${site.email}` });
    expect(m.html).toContain(site.email);
    expect(m.text.toLowerCase()).toContain("not a licensed medicine");
    expect(m.html + m.text).not.toMatch(/[\u2013\u2014]|discreet|enquir/i);
    expect(m.text).toContain("Unsubscribe:");
  });
});
