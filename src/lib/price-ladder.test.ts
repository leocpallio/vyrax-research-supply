import { describe, expect, test } from "bun:test";
import { bestLadderPct, ladderSaving, perActiveLabel } from "./price-ladder";
import type { Compound } from "../data/types";

const gbp = (n: number) => `£${n.toFixed(2)}`;

const reta: Compound = {
  slug: "x",
  name: "X",
  aliases: [],
  category: "metabolic-research",
  tags: [],
  kind: "peptide",
  strengths: [
    { label: "10mg", amount: 10, unit: "mg", price: 59.99 },
    { label: "20mg", amount: 20, unit: "mg", price: 79.99 },
    { label: "30mg", amount: 30, unit: "mg", price: 109.99 },
    { label: "25mg", amount: 25, unit: "mg", price: 95 },
  ],
  summary: "",
  overview: [],
  applications: [],
};

describe("ladderSaving", () => {
  test("base strength has no saving", () => {
    expect(ladderSaving(reta, reta.strengths[0]!)).toBeNull();
  });
  test("20mg compares with 2 x 10mg from real prices", () => {
    const l = ladderSaving(reta, reta.strengths[1]!)!;
    expect(l.was).toBe(119.98);
    expect(l.save).toBe(39.99);
    expect(l.pct).toBe(33);
    expect(l.basis).toBe("2 x 10mg");
  });
  test("non-integer ratio is skipped", () => {
    expect(ladderSaving(reta, reta.strengths[3]!)).toBeNull();
  });
  test("no saving when the bigger vial costs more per mg", () => {
    const c = {
      ...reta,
      strengths: [reta.strengths[0]!, { label: "20mg", amount: 20, unit: "mg", price: 130 }],
    } as Compound;
    expect(ladderSaving(c, c.strengths[1]!)).toBeNull();
  });
  test("explicit wasPrice field wins", () => {
    const s = {
      label: "5mg",
      amount: 5,
      unit: "mg",
      price: 30,
      wasPrice: 40,
    } as Compound["strengths"][number];
    const l = ladderSaving({ ...reta, strengths: [s] }, s)!;
    expect(l.save).toBe(10);
    expect(l.pct).toBe(25);
  });
  test("bestLadderPct and perActiveLabel", () => {
    expect(bestLadderPct(reta)).toBe(39);
    expect(perActiveLabel(reta.strengths[0]!, gbp)).toBe("£6.00 per mg of active per vial");
  });
});
