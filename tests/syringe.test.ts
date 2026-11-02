import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  SYRINGES,
  compute,
  concentrationMgPerMl,
  graduations,
  mgToMcg,
  mlToUnits,
  nearestGraduationMl,
  parsePositive,
  round,
  smallestSyringeFor,
  syringeById,
  toMg,
  unitsToMl,
  volumeMlForMass,
} from "../src/lib/syringe";
import { dilutionRecords } from "../src/data/reconstitution";
import { metabolicAndRegenerative } from "../src/data/compounds-a";
import { secretagoguesToSupplies } from "../src/data/compounds-b";
import { ukplAdditions } from "../src/data/ukpl-additions";

const here = dirname(fileURLToPath(import.meta.url));
const s1 = syringeById("1")!;
const s03 = syringeById("0.3")!;
const s05 = syringeById("0.5")!;
const s3 = syringeById("3")!;

describe("parsing", () => {
  test.each([
    ["10", 10],
    ["2.5", 2.5],
    ["2,5", 2.5],
    [" 0.25 ", 0.25],
    [".5", 0.5],
    ["5.", 5],
  ])("parses %p", (raw, n) => expect(parsePositive(raw)).toBe(n));
  test.each(["", " ", "0", "0.0", "-1", "abc", "1e3", "1.2.3", "NaN", "Infinity", "5mg"])(
    "rejects %p",
    (raw) => expect(parsePositive(raw)).toBeNull(),
  );
});

describe("unit conversion", () => {
  test("mcg to mg and back", () => {
    expect(toMg(250, "mcg")).toBe(0.25);
    expect(toMg(2, "mg")).toBe(2);
    expect(mgToMcg(0.25)).toBe(250);
  });
  test("U-100: 100 units per ml", () => {
    expect(mlToUnits(1)).toBe(100);
    expect(mlToUnits(0.1)).toBeCloseTo(10, 12);
    expect(unitsToMl(25)).toBe(0.25);
    expect(unitsToMl(mlToUnits(0.37))).toBeCloseTo(0.37, 12);
  });
});

describe("rounding", () => {
  test("half away from zero, float-noise safe", () => {
    expect(round(1.005, 2)).toBe(1.01);
    expect(round(2.675, 2)).toBe(2.68);
    expect(round(0.1 + 0.2, 10)).toBe(0.3);
    expect(round(-1.5, 0)).toBe(-2);
    expect(round(3.33333, 3)).toBe(3.333);
  });
});

describe("concentration and volume", () => {
  test("10 mg in 2 ml is 5 mg/ml", () => expect(concentrationMgPerMl(10, 2)).toBe(5));
  test("5 mg in 3 ml", () => expect(concentrationMgPerMl(5, 3)).toBeCloseTo(1.6667, 4));
  test("volume = mass / concentration", () => {
    expect(volumeMlForMass(1, 5)).toBe(0.2);
    expect(volumeMlForMass(0.25, 2.5)).toBeCloseTo(0.1, 12);
  });
  test("compute: 10 mg / 2 ml, 1 mg target, 1 ml syringe", () => {
    const r = compute({ vialMg: 10, diluentMl: 2, targetMg: 1, syringe: s1 })!;
    expect(r.mgPerMl).toBe(5);
    expect(r.mcgPerMl).toBe(5000);
    expect(r.draw!.ml).toBe(0.2);
    expect(r.draw!.units).toBeCloseTo(20, 10);
    expect(r.draw!.nearestUnits).toBe(20);
    expect(r.warnings).toEqual([]);
  });
  test("compute: mcg target through toMg", () => {
    const r = compute({ vialMg: 5, diluentMl: 2, targetMg: toMg(250, "mcg"), syringe: s1 })!;
    expect(r.draw!.ml).toBeCloseTo(0.1, 12);
    expect(r.draw!.units).toBeCloseTo(10, 10);
  });
  test("no target leaves draw empty and reports mass per graduation", () => {
    const r = compute({ vialMg: 10, diluentMl: 2, targetMg: null, syringe: s05 })!;
    expect(r.draw).toBeNull();
    expect(r.mgPerGraduation).toBeCloseTo(0.05, 12);
  });
  test("invalid inputs return null", () => {
    expect(compute({ vialMg: null, diluentMl: 2, targetMg: 1, syringe: s1 })).toBeNull();
    expect(compute({ vialMg: 10, diluentMl: null, targetMg: 1, syringe: s1 })).toBeNull();
  });
});

describe("graduations and snapping", () => {
  test("barrel scales match real syringes", () => {
    const g03 = graduations(s03);
    expect(g03.length).toBe(61); // 0..30 units in 0.5 unit steps
    expect(g03.filter((t) => t.major).map((t) => t.label)).toEqual([
      "0",
      "5",
      "10",
      "15",
      "20",
      "25",
      "30",
    ]);
    const g05 = graduations(s05);
    expect(g05.length).toBe(51);
    const g1 = graduations(s1);
    expect(g1.length).toBe(51); // 2-unit minor marks
    expect(g1.filter((t) => t.major).map((t) => t.label)).toEqual([
      "0",
      "10",
      "20",
      "30",
      "40",
      "50",
      "60",
      "70",
      "80",
      "90",
      "100",
    ]);
    const g3 = graduations(s3);
    expect(g3.length).toBe(31);
    expect(g3.filter((t) => t.major).map((t) => t.label)).toEqual([
      "0",
      "0.5",
      "1",
      "1.5",
      "2",
      "2.5",
      "3",
    ]);
    for (const s of SYRINGES) {
      const g = graduations(s);
      expect(g.at(-1)!.ml).toBe(s.capacityMl);
      expect(g.at(-1)!.frac).toBe(1);
    }
  });
  test("nearest graduation", () => {
    expect(nearestGraduationMl(0.123, s1)).toBe(0.12);
    expect(nearestGraduationMl(0.131, s1)).toBe(0.14);
    expect(nearestGraduationMl(0.1234, s03)).toBe(0.125);
    expect(nearestGraduationMl(1.26, s3)).toBe(1.3);
  });
});

describe("edge cases", () => {
  test("over capacity suggests the next syringe and a diluent volume", () => {
    const r = compute({ vialMg: 10, diluentMl: 2, targetMg: 4, syringe: s05 })!;
    expect(r.draw!.ml).toBe(0.8);
    expect(r.draw!.shownMl).toBe(0.5);
    const w = r.warnings.find((x) => x.kind === "over-capacity");
    expect(w && w.kind === "over-capacity" && w.nextSyringe?.id).toBe("1");
    // 4 mg in one 0.5 ml barrel needs 8 mg/ml, i.e. 10 mg in 1.25 ml
    expect(w && w.kind === "over-capacity" && w.diluentForFullBarrelMl).toBe(1.25);
    // Less diluent shrinks the draw: 10 mg in 1.25 ml at 4 mg target is exactly 0.5 ml.
    const fixed = compute({ vialMg: 10, diluentMl: 1.25, targetMg: 4, syringe: SYRINGES[1]! })!;
    expect(fixed.draw?.ml).toBeCloseTo(0.5, 9);
    expect(fixed.warnings.some((x) => x.kind === "over-capacity")).toBe(false);
  });
  test("no diluent fix offered when the target exceeds the vial", () => {
    const r = compute({ vialMg: 10, diluentMl: 2, targetMg: 50, syringe: s1 })!;
    const w = r.warnings.find((x) => x.kind === "over-capacity");
    expect(w && w.kind === "over-capacity" && w.diluentForFullBarrelMl).toBeNull();
  });
  test("over every syringe", () => {
    const r = compute({ vialMg: 10, diluentMl: 5, targetMg: 8, syringe: s3 })!;
    const w = r.warnings.find((x) => x.kind === "over-capacity");
    expect(w && w.kind === "over-capacity" && w.nextSyringe).toBeNull();
    expect(smallestSyringeFor(4)).toBeNull();
    expect(smallestSyringeFor(0.3)!.id).toBe("0.3");
    expect(smallestSyringeFor(0.31)!.id).toBe("0.5");
  });
  test("below one graduation", () => {
    const r = compute({ vialMg: 10, diluentMl: 1, targetMg: 0.01, syringe: s1 })!;
    expect(r.draw!.ml).toBeCloseTo(0.001, 12);
    expect(r.warnings.map((w) => w.kind)).toContain("below-graduation");
  });
  test("target larger than vial", () => {
    const r = compute({ vialMg: 2, diluentMl: 1, targetMg: 3, syringe: s3 })!;
    expect(r.warnings.map((w) => w.kind)).toContain("exceeds-vial");
  });
  test("solubility ceiling from repo data", () => {
    const dac = dilutionRecords.find((d) => d.slug === "cjc-1295-dac")!;
    expect(dac.concentrationCeiling).toEqual({
      mgPerMl: 2,
      verified: false,
      source: expect.any(String),
    });
    const r = compute({
      vialMg: 5,
      diluentMl: 1,
      targetMg: null,
      syringe: s1,
      ceiling: dac.concentrationCeiling,
    })!;
    const w = r.warnings.find((x) => x.kind === "over-ceiling");
    expect(w && w.kind === "over-ceiling" && w.minDiluentMl).toBe(2.5);
    const ok = compute({
      vialMg: 5,
      diluentMl: 2.5,
      targetMg: null,
      syringe: s1,
      ceiling: dac.concentrationCeiling,
    })!;
    expect(ok.warnings).toEqual([]);
  });
});

describe("catalogue", () => {
  const all = [...metabolicAndRegenerative, ...secretagoguesToSupplies, ...ukplAdditions];
  test("all 50 compounds have a record and compute or are explicitly blocked", () => {
    expect(all.length).toBe(50);
    expect(dilutionRecords.length).toBe(50);
    for (const c of all) {
      const rec = dilutionRecords.find((d) => d.slug === c.slug);
      expect(rec).toBeDefined();
      if (rec!.withholdConcentrations || rec!.readyToUse || rec!.isDiluent) continue;
      for (const s of c.strengths.filter((x) => x.unit === "mg")) {
        const r = compute({
          vialMg: s.amount,
          diluentMl: 2,
          targetMg: s.amount / 10,
          syringe: s3,
        })!;
        expect(r.mgPerMl).toBeCloseTo(s.amount / 2, 9);
        expect(r.draw!.ml).toBeCloseTo(0.2, 9);
      }
    }
  });
});

describe("compliance copy", () => {
  const src = readFileSync(resolve(here, "../src/components/SyringeTool.tsx"), "utf8");
  test("no dosing or administration wording", () => {
    expect(src).not.toMatch(
      /\b(inject\w*|doses?|dosing|dosage|protocols?|cycles?|human use|injection site)\b/i,
    );
  });
  test("target mass starts empty", () => {
    expect(src).toMatch(/useState\(""\); \/\/ deliberately empty/);
  });
  test("no em-dashes", () => {
    expect(src).not.toContain("\u2014");
    expect(readFileSync(resolve(here, "../docs/syringe-tool-research.md"), "utf8")).not.toContain(
      "\u2014",
    );
  });
});
