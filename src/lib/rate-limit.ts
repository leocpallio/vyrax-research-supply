/**
 * Fixed-window rate limiter for the money endpoints.
 *
 * Deliberately dependency-free: the checkout and order-status handlers run in
 * Cloudflare Workers, where a module-level Map persists for the life of an
 * isolate. That bounds abuse from a single edge location, which is the
 * documented risk: without it one client can create unlimited SpicePay
 * invoices. It is not a distributed limiter, so an attacker spread across many
 * isolates is only slowed, not stopped. An edge rate-limiting rule in front of
 * /api/checkout is still required for that; this is the floor, not the ceiling.
 */

export type LimitOptions = {
  /** Requests permitted per window, per key. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
};

export type LimitResult = {
  allowed: boolean;
  /** Requests left in the current window. */
  remaining: number;
  /** Milliseconds until the current window resets. */
  resetMs: number;
};

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Hard cap on tracked keys so a spoofed-IP flood cannot grow memory without bound. */
const MAX_KEYS = 10_000;

function evictIfNeeded(now: number): void {
  if (buckets.size < MAX_KEYS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  // Still full and every entry is live: drop the oldest insertions.
  while (buckets.size >= MAX_KEYS) {
    const first = buckets.keys().next();
    if (first.done) break;
    buckets.delete(first.value);
  }
}

/**
 * Record one request against `key` and report whether it is allowed.
 * Pure in the sense that it touches only the module-level store, so tests can
 * reset it with `resetRateLimits()`.
 */
export function takeRateLimit(
  key: string,
  options: LimitOptions,
  now: number = Date.now(),
): LimitResult {
  evictIfNeeded(now);
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + options.windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: Math.max(options.limit - 1, 0), resetMs: options.windowMs };
  }

  existing.count += 1;
  const remaining = Math.max(options.limit - existing.count, 0);
  return {
    allowed: existing.count <= options.limit,
    remaining,
    resetMs: existing.resetAt - now,
  };
}

/** Test helper: clear all buckets. */
export function resetRateLimits(): void {
  buckets.clear();
}

/**
 * Best-effort client identity. Cloudflare sets CF-Connecting-IP on every
 * request reaching a Worker; fall back to X-Forwarded-For's first hop, then to
 * a constant so a missing header degrades to a shared bucket rather than
 * failing open.
 */
export function clientKey(request: Request): string {
  const cf = request.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0];
    if (first) return first.trim();
  }
  return "unknown-client";
}

/** Limits applied by the money endpoints. */
export const LIMITS = {
  /** Invoice creation is expensive and abusable: 5 per minute per client. */
  checkout: { limit: 5, windowMs: 60_000 },
  /** Status polling is cheap but still worth bounding: 60 per minute. */
  orderStatus: { limit: 60, windowMs: 60_000 },
} as const;

/**
 * Build a 429 response with the standard Retry-After header.
 */
export function tooManyRequests(result: LimitResult): Response {
  const seconds = Math.max(1, Math.ceil(result.resetMs / 1000));
  return new Response(JSON.stringify({ error: "Too many requests. Please wait a moment." }), {
    status: 429,
    headers: {
      "content-type": "application/json",
      "retry-after": String(seconds),
    },
  });
}
