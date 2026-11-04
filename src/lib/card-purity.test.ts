import { describe, expect, test } from "bun:test";
import { cardPurity, coas, CARD_PURITY_MIN } from "@/data/coa";

describe("card purity chip", () => {
  test("retatrutide shows the lowest of its three Janoshik reports, floored", () => {
    expect(cardPurity("retatrutide")).toBe(99.3);
  });
  test("melanotan 2 shows its report figure, floored", () => {
    expect(cardPurity("melanotan-2")).toBe(99.9);
  });
  test("tesamorelin 97.70% is below the gate and never gets a chip", () => {
    expect(cardPurity("tesamorelin")).toBeUndefined();
  });
  test("no report, no chip", () => {
    expect(cardPurity("bpc-157")).toBeUndefined();
  });
  test("every chip value is backed by a real certificate and never exceeds it", () => {
    for (const slug of new Set(coas.map((c) => c.compound))) {
      const v = cardPurity(slug);
      if (v === undefined) continue;
      const list = coas.filter((c) => c.compound === slug);
      expect(v).toBeGreaterThanOrEqual(CARD_PURITY_MIN);
      expect(v).toBeLessThanOrEqual(Math.min(...list.map((c) => c.purity)));
    }
  });
});
