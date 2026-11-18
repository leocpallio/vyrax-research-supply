import { describe, expect, test } from "bun:test";
import { clampDescription, clauseCut } from "./seo";

describe("clauseCut / clampDescription never end in an ellipsis", () => {
  test("keeps a sentence that already fits, adding only the full stop", () => {
    expect(clauseCut("A short sentence", 80)).toBe("A short sentence.");
  });

  test("cuts at a clause opener, not mid-clause", () => {
    const t =
      "Retatrutide (LY3437943) is a synthetic triple agonist peptide acting at the GIP, GLP-1 and glucagon receptors";
    expect(clauseCut(t, 70)).toBe("Retatrutide (LY3437943) is a synthetic triple agonist peptide.");
  });

  test("drops a trailing parenthetical rather than cutting inside it", () => {
    const t =
      "Sermorelin is the 29-amino-acid N-terminal fragment of growth hormone-releasing hormone (GHRH 1-29 amide)";
    expect(clauseCut(t, 95)).toBe(
      "Sermorelin is the 29-amino-acid N-terminal fragment of growth hormone-releasing hormone.",
    );
  });

  test("never leaves an unbalanced bracket or a dangling word", () => {
    const t =
      "Epithalon (Ala-Glu-Asp-Gly) is a synthetic tetrapeptide based on the pineal gland extract";
    const out = clauseCut(t, 60);
    expect(out).toBe("Epithalon (Ala-Glu-Asp-Gly) is a synthetic tetrapeptide.");
  });

  test("clampDescription: long input is <=155 chars and has no ellipsis", () => {
    const long =
      "Free peptide reconstitution calculator: stock concentration in mg/ml and \u00b5g/ml, molar concentration from molecular weight, and C1V1 = C2V2 working dilutions for lyophilised vials.";
    const out = clampDescription(long);
    expect(out.length).toBeLessThanOrEqual(155);
    expect(out.includes("\u2026")).toBe(false);
    expect(out.endsWith(".")).toBe(true);
  });
});
