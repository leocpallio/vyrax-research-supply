import { describe, expect, test } from "bun:test";
import { guides } from "@/data/guides";

// Answer-first summaries for AI answer engines. The llms.txt integration is verified
// against the built site output (import.meta.glob in catalog.ts is Vite-only), not here.

describe("guide answer-first summaries (AI citation)", () => {
  test("every guide carries a 40-60 word tldr", () => {
    for (const g of guides) {
      const words = g.tldr.trim().split(/\s+/).length;
      expect(words).toBeGreaterThanOrEqual(40);
      expect(words).toBeLessThanOrEqual(60);
    }
  });

  test("tldr is prose, not a fragment: ends with a period, no em-dash", () => {
    for (const g of guides) {
      expect(g.tldr.endsWith(".")).toBe(true);
      expect(g.tldr).not.toContain("—");
    }
  });

  test("tldr is not just the meta description duplicated", () => {
    for (const g of guides) {
      expect(g.tldr).not.toBe(g.description);
    }
  });
});
