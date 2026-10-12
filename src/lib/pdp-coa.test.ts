import { describe, expect, test } from "bun:test";
import type { Coa } from "../data/coa";
import { purityStat, purityLabel, coaHref, PURITY_PENDING_LABEL } from "./pdp-coa";

const fixture: Coa[] = [
  {
    compound: "bpc-157",
    strength: "5mg",
    batch: "VX0001",
    purity: 99.1,
    lab: "Test Lab",
    method: "HPLC + LC-MS",
    tested: "2026-01-10",
    file: "/coa/bpc-157-5mg-VX0001.pdf",
  },
  {
    compound: "bpc-157",
    strength: "5mg",
    batch: "VX0002",
    purity: 99.6,
    lab: "Test Lab",
    method: "HPLC",
    tested: "2026-03-02",
    file: "",
  },
];

describe("purityStat", () => {
  test("picks the newest certificate for the exact strength", () => {
    const s = purityStat("bpc-157", "5mg", fixture);
    expect(s.kind).toBe("report");
    if (s.kind !== "report") return;
    expect(s.coa.batch).toBe("VX0002");
    expect(s.purityLabel).toBe("99.60%");
    expect(s.ariaLabel).toContain("VX0002");
    expect(s.ariaLabel).toContain("99.60%");
  });

  test("never borrows a certificate from another strength of the same compound", () => {
    const s = purityStat("bpc-157", "10mg", fixture);
    expect(s.kind).toBe("pending");
    if (s.kind !== "pending") return;
    expect(s.label).toBe(PURITY_PENDING_LABEL);
    expect(s.label).not.toMatch(/\d/);
  });

  test("is pending for a compound with no report", () => {
    expect(purityStat("tb-500", "5mg", fixture).kind).toBe("pending");
  });

  test("defaults to the live certificate list (no number until a report is held)", () => {
    const s = purityStat("bpc-157", "5mg");
    expect(["report", "pending"]).toContain(s.kind);
  });

  test("formats purity to two decimals", () => {
    expect(purityLabel(99.4)).toBe("99.40%");
    expect(purityLabel(98.123)).toBe("98.12%");
  });

  test("links the PDF when held, else the verify page", () => {
    expect(coaHref(fixture[0]!)).toBe("/coa/bpc-157-5mg-VX0001.pdf");
    expect(coaHref(fixture[1]!)).toBe("/verify/VX0002");
  });
});
