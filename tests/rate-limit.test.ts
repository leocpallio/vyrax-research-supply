import { describe, expect, test, beforeEach } from "bun:test";
import {
  takeRateLimit,
  resetRateLimits,
  clientKey,
  LIMITS,
  tooManyRequests,
} from "../src/lib/rate-limit";

beforeEach(() => resetRateLimits());

describe("takeRateLimit", () => {
  test("allows up to the limit then blocks", () => {
    const now = 1_000_000;
    const opts = { limit: 3, windowMs: 60_000 };
    expect(takeRateLimit("a", opts, now).allowed).toBe(true);
    expect(takeRateLimit("a", opts, now).allowed).toBe(true);
    expect(takeRateLimit("a", opts, now).allowed).toBe(true);
    const blocked = takeRateLimit("a", opts, now);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  test("remaining counts down and never goes negative", () => {
    const now = 2_000_000;
    const opts = { limit: 2, windowMs: 1_000 };
    expect(takeRateLimit("b", opts, now).remaining).toBe(1);
    expect(takeRateLimit("b", opts, now).remaining).toBe(0);
    expect(takeRateLimit("b", opts, now).remaining).toBe(0);
  });

  test("window resets after it expires", () => {
    const opts = { limit: 1, windowMs: 1_000 };
    expect(takeRateLimit("c", opts, 1_000).allowed).toBe(true);
    expect(takeRateLimit("c", opts, 1_500).allowed).toBe(false);
    expect(takeRateLimit("c", opts, 2_001).allowed).toBe(true);
  });

  test("keys are isolated from each other", () => {
    const opts = { limit: 1, windowMs: 60_000 };
    expect(takeRateLimit("ip-1", opts, 5_000).allowed).toBe(true);
    expect(takeRateLimit("ip-2", opts, 5_000).allowed).toBe(true);
    expect(takeRateLimit("ip-1", opts, 5_000).allowed).toBe(false);
  });

  test("checkout ceiling is five invoices per minute", () => {
    expect(LIMITS.checkout.limit).toBe(5);
    expect(LIMITS.checkout.windowMs).toBe(60_000);
  });
});

describe("clientKey", () => {
  test("prefers CF-Connecting-IP", () => {
    const req = new Request("https://x.test/api/checkout", {
      headers: { "cf-connecting-ip": "1.2.3.4", "x-forwarded-for": "9.9.9.9" },
    });
    expect(clientKey(req)).toBe("1.2.3.4");
  });

  test("falls back to the first X-Forwarded-For hop", () => {
    const req = new Request("https://x.test/api/checkout", {
      headers: { "x-forwarded-for": "8.8.8.8, 7.7.7.7" },
    });
    expect(clientKey(req)).toBe("8.8.8.8");
  });

  test("degrades to a shared bucket when no client header exists", () => {
    const req = new Request("https://x.test/api/checkout");
    expect(clientKey(req)).toBe("unknown-client");
  });
});

describe("tooManyRequests", () => {
  test("is a 429 with Retry-After in whole seconds", () => {
    const res = tooManyRequests({ allowed: false, remaining: 0, resetMs: 2_400 });
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("3");
  });
});
