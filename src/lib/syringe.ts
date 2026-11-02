/**
 * Laboratory volumetric arithmetic for the syringe measuring tool.
 *
 * Pure functions, no DOM. Every number the tool shows comes from here so it can be unit tested.
 * Scope: concentration of a reconstituted stock, the volume of that stock holding a user-supplied
 * target mass, and where that volume falls on a real syringe scale. Nothing here suggests or
 * defaults a target mass.
 *
 * "Units" means U-100 syringe graduations (100 per ml). It is a volume scale, not IU of biological
 * activity: IU cannot be derived from mass without a compound-specific activity figure.
 */

export type MassUnit = "mg" | "mcg";

export type SyringeSpec = {
  id: "0.3" | "0.5" | "1" | "3";
  label: string;
  capacityMl: number;
  /** True for U-100 unit-marked barrels. */
  unitScale: boolean;
  /** Smallest graduation, in ml. */
  minorMl: number;
  /** Labelled graduation, in ml. */
  majorMl: number;
};

export const UNITS_PER_ML = 100;

export const SYRINGES: SyringeSpec[] = [
  {
    id: "0.3",
    label: "0.3 ml (30 units)",
    capacityMl: 0.3,
    unitScale: true,
    minorMl: 0.005,
    majorMl: 0.05,
  },
  {
    id: "0.5",
    label: "0.5 ml (50 units)",
    capacityMl: 0.5,
    unitScale: true,
    minorMl: 0.01,
    majorMl: 0.05,
  },
  {
    id: "1",
    label: "1 ml (100 units)",
    capacityMl: 1,
    unitScale: true,
    minorMl: 0.02,
    majorMl: 0.1,
  },
  { id: "3", label: "3 ml", capacityMl: 3, unitScale: false, minorMl: 0.1, majorMl: 0.5 },
];

export const syringeById = (id: string) => SYRINGES.find((s) => s.id === id);

/** Parse a user-typed number. Accepts a comma decimal. Returns null for empty, NaN, zero or negative. */
export function parsePositive(raw: string): number | null {
  const t = raw.trim().replace(",", ".");
  if (!/^\d*\.?\d+$|^\d+\.$/.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export const toMg = (value: number, unit: MassUnit) => (unit === "mcg" ? value / 1000 : value);
export const mgToMcg = (mg: number) => mg * 1000;
export const mlToUnits = (ml: number) => ml * UNITS_PER_ML;
export const unitsToMl = (units: number) => units / UNITS_PER_ML;

/** Round half away from zero to `dp` decimals, stable for binary float noise (e.g. 1.005). */
export function round(n: number, dp: number) {
  const f = 10 ** dp;
  const shifted = Math.abs(n) * f;
  const r = Math.round(Number(shifted.toPrecision(12)));
  return (Math.sign(n) * r) / f;
}

export const concentrationMgPerMl = (vialMg: number, diluentMl: number) => vialMg / diluentMl;
export const volumeMlForMass = (targetMg: number, mgPerMl: number) => targetMg / mgPerMl;

/** Snap a volume to the nearest graduation of the syringe. */
export function nearestGraduationMl(ml: number, s: SyringeSpec) {
  const steps = Math.round(Number((ml / s.minorMl).toPrecision(12)));
  return round(steps * s.minorMl, 4);
}

/** Smallest listed syringe whose capacity holds the volume, or null if none does. */
export const smallestSyringeFor = (ml: number) =>
  SYRINGES.find((s) => ml <= s.capacityMl + 1e-9) ?? null;

export type Warning =
  | {
      kind: "over-capacity";
      nextSyringe: SyringeSpec | null;
      diluentForFullBarrelMl: number | null;
    }
  | { kind: "below-graduation"; minorMl: number }
  | { kind: "exceeds-vial" }
  | {
      kind: "over-ceiling";
      ceilingMgPerMl: number;
      verified: boolean;
      source: string;
      minDiluentMl: number;
    };

export type Inputs = {
  vialMg: number | null;
  diluentMl: number | null;
  targetMg: number | null;
  syringe: SyringeSpec;
  ceiling?: { mgPerMl: number; verified: boolean; source: string };
};

export type Result = {
  mgPerMl: number;
  mcgPerMl: number;
  /** mg held in one graduation of the chosen syringe. */
  mgPerGraduation: number;
  draw: null | {
    ml: number;
    units: number;
    /** Volume shown on the barrel: true volume clamped to capacity. */
    shownMl: number;
    nearestMl: number;
    nearestUnits: number;
    /** Mass actually held at the nearest graduation. */
    massAtNearestMg: number;
  };
  warnings: Warning[];
};

export function compute(i: Inputs): Result | null {
  if (i.vialMg === null || i.diluentMl === null) return null;
  const mgPerMl = concentrationMgPerMl(i.vialMg, i.diluentMl);
  const warnings: Warning[] = [];
  if (i.ceiling && mgPerMl > i.ceiling.mgPerMl + 1e-9) {
    warnings.push({
      kind: "over-ceiling",
      ceilingMgPerMl: i.ceiling.mgPerMl,
      verified: i.ceiling.verified,
      source: i.ceiling.source,
      minDiluentMl: i.vialMg / i.ceiling.mgPerMl,
    });
  }
  let draw: Result["draw"] = null;
  if (i.targetMg !== null) {
    const ml = volumeMlForMass(i.targetMg, mgPerMl);
    const nearestMl = nearestGraduationMl(ml, i.syringe);
    draw = {
      ml,
      units: mlToUnits(ml),
      shownMl: Math.min(ml, i.syringe.capacityMl),
      nearestMl,
      nearestUnits: round(mlToUnits(nearestMl), 2),
      massAtNearestMg: nearestMl * mgPerMl,
    };
    if (i.targetMg > i.vialMg + 1e-12) warnings.push({ kind: "exceeds-vial" });
    if (ml > i.syringe.capacityMl + 1e-9) {
      warnings.push({
        kind: "over-capacity",
        nextSyringe: smallestSyringeFor(ml),
        // Largest diluent volume that puts the target mass in one full barrel: V = vial x cap / target.
        // Less diluent means a higher concentration and a smaller draw. Meaningless when the target
        // exceeds the vial, so it is null there.
        diluentForFullBarrelMl:
          i.targetMg > i.vialMg ? null : (i.vialMg * i.syringe.capacityMl) / i.targetMg,
      });
    } else if (ml < i.syringe.minorMl - 1e-12) {
      warnings.push({ kind: "below-graduation", minorMl: i.syringe.minorMl });
    }
  }
  return {
    mgPerMl,
    mcgPerMl: mgToMcg(mgPerMl),
    mgPerGraduation: mgPerMl * i.syringe.minorMl,
    draw,
    warnings,
  };
}

/** Tick marks for drawing a barrel: position as a fraction of capacity, major flag and label. */
export function graduations(s: SyringeSpec) {
  const count = Math.round(s.capacityMl / s.minorMl);
  const perMajor = Math.round(s.majorMl / s.minorMl);
  return Array.from({ length: count + 1 }, (_, k) => {
    const ml = round(k * s.minorMl, 4);
    const major = k % perMajor === 0;
    const mid = !major && perMajor % 2 === 0 && k % (perMajor / 2) === 0;
    return {
      k,
      ml,
      frac: k / count,
      major,
      mid,
      label: major ? (s.unitScale ? String(round(mlToUnits(ml), 1)) : String(ml)) : null,
    };
  });
}
