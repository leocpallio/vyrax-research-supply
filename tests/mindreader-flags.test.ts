import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { flags } from "@/lib/flags";
import { planGap, GAP_MAX_QTY, type GapContext } from "@/lib/gap-filler";
import { priceBasket, type CartItem } from "@/lib/basket-pricing";
import { site } from "@/data/site";

// Checkout mind-reader build (card t_af9531d1). Every flag defaults OFF; the gap filler never
// changes a price or a discount and only ever offers the existing diluent line at its own price.

const BAC: CartItem = {
  slug: "bacteriostatic-water",
  name: "Bacteriostatic Water",
  strength: "10ml",
  price: 5.99,
  quantity: 1,
};
const ctx: GapContext = { diluent: BAC, needsDiluent: (i) => i.slug.startsWith("vial-") };
const vial = (price: number, quantity = 1): CartItem => ({
  slug: "vial-x",
  name: "Vial X",
  strength: "5mg",
  price,
  quantity,
});

describe("mind-reader flags", () => {
  it("are all OFF unless the env var is exactly true", () => {
    for (const v of Object.values(flags)) expect(v).toBe(false);
  });
});

describe("gap filler", () => {
  it("offers nothing for an empty basket, a missing diluent, or a basket already at the threshold", () => {
    expect(planGap([], null, ctx)).toBeNull();
    expect(planGap([vial(30)], null, { ...ctx, diluent: null })).toBeNull();
    expect(planGap([vial(site.freeDeliveryThreshold)], null, ctx)).toBeNull();
  });

  it("offers nothing when no line needs a diluent", () => {
    expect(planGap([{ ...vial(40), slug: "supply-y" }], null, ctx)).toBeNull();
  });

  it("returns the smallest quantity that clears the threshold, at the diluent's own price", () => {
    const items = [vial(site.freeDeliveryThreshold - 5.99)];
    const plan = planGap(items, null, ctx)!;
    expect(plan.quantity).toBe(1);
    expect(plan.unit).toBe(5.99);
    expect(priceBasket([...items, plan.line]).freeDeliveryGap).toBe(0);

    const items2 = [vial(site.freeDeliveryThreshold - 17.97)];
    const plan2 = planGap(items2, null, ctx)!;
    expect(plan2.quantity).toBe(3);
    expect(priceBasket([...items2, plan2.line]).freeDeliveryGap).toBe(0);
    expect(priceBasket([...items2, { ...plan2.line, quantity: 2 }]).freeDeliveryGap).toBeGreaterThan(0);
  });

  it("stays quiet when more than GAP_MAX_QTY vials would be needed", () => {
    expect(planGap([vial(site.freeDeliveryThreshold - 6 * (GAP_MAX_QTY + 1))], null, ctx)).toBeNull();
  });

  it("does not alter the quote of the basket as it stands", () => {
    const items = [vial(30)];
    const before = JSON.stringify(priceBasket(items));
    planGap(items, null, ctx);
    expect(JSON.stringify(priceBasket(items))).toBe(before);
  });
});

describe("copy rules for the new surfaces", () => {
  const files = [
    "src/lib/flags.ts",
    "src/lib/gap-filler.ts",
    "src/lib/gap-filler-live.ts",
    "src/components/shell/GapFiller.tsx",
    "src/components/shell/DocsPack.tsx",
  ].map((f) => [f, readFileSync(f, "utf8")] as const);

  it("has no worth-figures, dosing words, Oraxis or syringes", () => {
    for (const [f, src] of files) {
      expect(src, f).not.toMatch(/worth\s*£|oraxis|syringe|dosing|\bdose\b|inject/i);
    }
  });
});
