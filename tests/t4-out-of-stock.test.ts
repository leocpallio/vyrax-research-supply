import { describe, expect, it } from "bun:test";
import { quoteCheckout } from "@/lib/checkout-pricing";
import { readFileSync } from "node:fs";
import { metabolicAndRegenerative } from "@/data/compounds-a";
import { secretagoguesToSupplies } from "@/data/compounds-b";
import { ukplAdditions } from "@/data/ukpl-additions";
import { site } from "@/data/site";
// catalog.ts needs vite import.meta.glob (not available in bun), so use the same data + same stockOf rule.
const all = [...metabolicAndRegenerative, ...secretagoguesToSupplies, ...ukplAdditions];
const getCompound = (slug: string) => all.find((c) => c.slug === slug);
const stockOf = (s: any) => s.stock ?? site.defaultStock;
const isLineUnavailable = (i: any) => { const st = getCompound(i.slug)?.strengths.find((x) => x.label === i.strength); return !st || stockOf(st) === "out" || stockOf(st) === "preorder"; };
const src = (f: string) => readFileSync(f, "utf8");

const SIX = [
  ["aod-9604", "10mg", 44.99], ["ghrp-6", "10mg", 14.99], ["hexarelin", "2mg", 12.99],
  ["sermorelin", "2mg", 12.99], ["hulk-stack", "20mg", 69.99], ["l-carnitine", "600mg/ml, 10ml", 29.99],
] as const;
describe("six uncosted T4 variants", () => {
  for (const [slug, strength, price] of SIX) {
    it(`${slug} ${strength}`, () => {
      const c = getCompound(slug); expect(c).toBeDefined();
      const s = c!.strengths.find((x) => x.label === strength)!; expect(s).toBeDefined();
      expect(s.stock).toBe("out");               // data flag
      expect(stockOf(s)).toBe("out");             // PDP/card use stockOf -> button disabled, label "Out of stock"
      expect(s.price).toBe(price);                // price unchanged
      expect(isLineUnavailable({ slug, strength, quantity: 1 } as any)).toBe(true); // basket guard
      expect(() => quoteCheckout([{ slug, strength, quantity: 1 }])).toThrow("Unavailable item"); // server pricing
      expect(() => quoteCheckout([{ slug: "bpc-157", strength: "5mg", quantity: 1 }, { slug, strength, quantity: 2 }])).toThrow("Unavailable item");
    });
  }
  it("UI wiring: PDP, card and basket derive orderability from stockOf", () => {
    expect(src("src/routes/product.$slug.tsx")).toMatch(/const orderable = stock !== "out" && stock !== "preorder"/);
    expect(src("src/routes/product.$slug.tsx")).toMatch(/disabled=\{!orderable\}/);
    expect(src("src/components/ProductCard.tsx")).toMatch(/disabled=\{!orderable\(x\)\}/);
    expect(src("src/lib/catalog.ts")).toMatch(/stockOf\(st\) === "out"/);
    expect(src("src/lib/checkout-pricing.ts")).toMatch(/variant\.stock === "out"/);
  });
  it("control: sibling in-stock variants still quote", () => {
    for (const [slug, strength] of [["aod-9604","5mg"],["ghrp-6","5mg"],["sermorelin","5mg"],["sermorelin","10mg"],["bpc-157","5mg"]] as const)
      expect(() => quoteCheckout([{ slug, strength, quantity: 1 }])).not.toThrow();
  });
  it("exactly six out-of-stock strengths in catalogue", () => {
    const out = [] as string[];
    for (const [slug] of SIX) for (const s of getCompound(slug)!.strengths) if (s.stock === "out") out.push(slug + "|" + s.label);
    expect(out.length).toBe(6);
  });
});
