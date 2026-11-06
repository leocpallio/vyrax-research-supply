process.env["WELCOME_CODE_SECRET"] ??= "test-only-welcome-secret";
import { describe, expect, test } from "bun:test";
import { findPromo, promoDiscountPence } from "../src/data/promos";
import { isWellFormedWelcomeCode, isWelcomeCode } from "../src/lib/welcome-code";
import { verifyWelcomeCode, welcomeCodeFor } from "../src/lib/welcome-code.server";

describe("welcome code shape", () => {
  test("only the prefixed, seven-character form is accepted", () => {
    expect(isWellFormedWelcomeCode("WELCOME-ABC12DE")).toBe(true);
    expect(isWellFormedWelcomeCode("welcome-abc12de")).toBe(true);
    expect(isWellFormedWelcomeCode("WELCOME-ABC")).toBe(false);
    expect(isWellFormedWelcomeCode("FIRST10")).toBe(false);
    expect(isWelcomeCode("WELCOME-ABC12DE")).toBe(true);
    expect(isWelcomeCode("FIRST10")).toBe(false);
  });
});

describe("personal codes", () => {
  test("the same address always yields the same code, case and space insensitive", async () => {
    const a = await welcomeCodeFor("Leo@Example.com ");
    const b = await welcomeCodeFor("leo@example.com");
    expect(a).toBe(b);
    expect(a).toMatch(/^WELCOME-[0-9A-HJKMNP-TV-Z]{7}$/);
  });

  test("a different address yields a different code", async () => {
    expect(await welcomeCodeFor("a@example.com")).not.toBe(await welcomeCodeFor("b@example.com"));
  });

  test("verification rejects another address's code and malformed input", async () => {
    const code = await welcomeCodeFor("buyer@example.com");
    expect(await verifyWelcomeCode("buyer@example.com", code)).toBe(true);
    expect(await verifyWelcomeCode("someone-else@example.com", code)).toBe(false);
    expect(await verifyWelcomeCode("buyer@example.com", "WELCOME-ZZZZZZZ")).toBe(false);
  });
});

describe("pricing a welcome code", () => {
  test("it prices at 10% over £50, identical to FIRST10's economics", () => {
    const promo = findPromo("WELCOME-ABC12DE");
    expect(promo?.pct).toBe(10);
    expect(promo?.minSpend).toBe(50);
    expect(promoDiscountPence("WELCOME-ABC12DE", 4999)).toBe(0);
    expect(promoDiscountPence("WELCOME-ABC12DE", 5000)).toBe(500);
    expect(promoDiscountPence("WELCOME-ABC12DE", 12000)).toBe(1200);
  });

  test("a malformed code is worth nothing", () => {
    expect(findPromo("WELCOME-ABC")).toBeUndefined();
    expect(promoDiscountPence("WELCOME-ABC", 12000)).toBe(0);
  });
});
