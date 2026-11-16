import { test, expect, describe } from "bun:test";
import { createCheckout } from "../src/lib/checkout.server";
import { resetRateLimits } from "../src/lib/rate-limit";
import {
  cleanAttribution,
  isUnrenderedMacro,
  mayPersistAttribution,
  readAttribution,
  readUtm,
  sanitizeProperties,
  siteEnvFor,
} from "../src/lib/analytics-events";

const SRC = {
  utm_source: "facebook",
  utm_medium: "paid-social",
  utm_campaign: "retatrutide-launch",
  utm_term: "peptides",
  utm_content: "video-3",
  gclid: "G123",
  fbclid: "F123",
  ttclid: "T123",
  landing_path: "/shop",
};

test("every attribution field and both PostHog ids land in the order row at insert", async () => {
  resetRateLimits();
  const originalFetch = globalThis.fetch;
  const vars: Record<string, string> = {
    VYRAX_SPICEPAY_CHECKOUT_ENABLED: "true",
    VYRAX_SPICEPAY_SECRET_KEY: "k",
    VYRAX_SPICEPAY_PROFILE_ID: "shop_vyrax",
    VYRAX_SPICEPAY_MERCHANT_ID: "merchant_vyrax",
    VYRAX_SPICEPAY_WEBHOOK_SECRET: "w",
    VYRAX_SPICEPAY_MODE: "test",
    VYRAX_CHECKOUT_ORIGIN: "https://vyraxlabs.co.uk",
    SUPABASE_URL: "https://vyrax-test.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "fake",
  };
  const previous = Object.fromEntries(Object.keys(vars).map((k) => [k, process.env[k]]));
  Object.assign(process.env, vars);
  let inserted: Record<string, unknown> = {};
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    const payload = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {};
    const ok = (v: unknown, status = 200) =>
      new Response(JSON.stringify(v), { status, headers: { "Content-Type": "application/json" } });
    if (url === "https://api.spicepay.net/payments")
      return ok({
        payment_id: "pay_x",
        merchant_id: "merchant_vyrax",
        amount: payload["amount"],
        currency: "GBP",
        test_mode: true,
        payment_link: {
          link: "https://checkout.spicepay.net/pay/51eb087f-eb16-42d5-8ee1-5aeec8433b22",
        },
      });
    if (url.includes("/rest/v1/orders")) {
      if (init?.method === "POST") {
        inserted = payload;
        return ok({ id: "11111111-1111-4111-8111-111111111111" }, 201);
      }
      return ok({ id: "11111111-1111-4111-8111-111111111111" });
    }
    throw new Error(`Unexpected endpoint ${url}`);
  }) as typeof fetch;
  try {
    const res = await createCheckout(
      new Request("https://vyraxlabs.co.uk/api/checkout", {
        method: "POST",
        headers: { origin: "https://vyraxlabs.co.uk", "content-type": "application/json" },
        body: JSON.stringify({
          items: [{ slug: "bpc-157", strength: "5mg", quantity: 2 }],
          name: "Researcher",
          email: "researcher@example.org",
          address: "1 Lab Road",
          address2: "",
          city: "London",
          postcode: "SW1A 1AA",
          researchAgreement: true,
          attribution: SRC,
          ph_distinct_id: "019abc-distinct",
          ph_session_id: "019abc-session",
        }),
      }),
    );
    expect(res.status).toBe(200);
    for (const [k, v] of Object.entries(SRC)) expect(inserted[k]).toBe(v);
    expect(inserted["ph_distinct_id"]).toBe("019abc-distinct");
    expect(inserted["ph_session_id"]).toBe("019abc-session");
  } finally {
    globalThis.fetch = originalFetch;
    for (const [k, v] of Object.entries(previous)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
});

describe("unrendered ad macros are never stored", () => {
  for (const m of [
    "{{campaign.name}}",
    "{{ad.name}}",
    "{campaign_name}",
    "__CAMPAIGN__",
    "%7B%7Bcampaign.name%7D%7D",
  ])
    test(`macro ${m}`, () =>
      expect(isUnrenderedMacro(decodeURIComponent(m)) || isUnrenderedMacro(m)).toBe(true));
  test("real campaign names pass", () => {
    for (const v of ["retatrutide-launch", "spring_2026", "Black Friday", "video-3"])
      expect(isUnrenderedMacro(v)).toBe(false);
  });
  test("readAttribution, readUtm, cleanAttribution and sanitizeProperties drop the macro", () => {
    const url =
      "https://vyraxlabs.co.uk/shop?utm_source=facebook&utm_campaign=%7B%7Bcampaign.name%7D%7D&utm_content=%7B%7Bad.name%7D%7D";
    expect(readAttribution(url)).toEqual({ utm_source: "facebook", landing_path: "/shop" });
    expect(readUtm(url)).toEqual({ utm_source: "facebook", landing_path: "/shop" });
    expect(cleanAttribution({ utm_source: "facebook", utm_campaign: "{{campaign.name}}" })).toEqual(
      {
        utm_source: "facebook",
      },
    );
    expect(
      sanitizeProperties({
        utm_campaign: "{{campaign.name}}",
        utm_source: "facebook",
        initial_utm_content: "{{ad.name}}",
      }),
    ).toEqual({ utm_source: "facebook" });
  });
});

test("landing_path is recorded for an untagged first visit", () => {
  expect(readAttribution("https://vyraxlabs.co.uk/product/bpc-157")).toEqual({
    landing_path: "/product/bpc-157",
  });
});

test("non-production hosts are tagged", () => {
  expect(siteEnvFor("vyraxlabs.co.uk")).toBe("production");
  expect(siteEnvFor("www.vyraxlabs.co.uk")).toBe("production");
  for (const h of [
    "localhost",
    "127.0.0.1",
    "vyrax.workers.dev",
    "abc.lovable.app",
    "x.lovableproject.com",
  ])
    expect(siteEnvFor(h)).toBe("non_production");
});

describe("session copy of attribution is consent-gated, flag off by default", () => {
  test("accepted always, declined never, undecided only with the flag", () => {
    expect(mayPersistAttribution("accepted", false)).toBe(true);
    expect(mayPersistAttribution("declined", true)).toBe(false);
    expect(mayPersistAttribution(null, false)).toBe(false);
    expect(mayPersistAttribution(null, true)).toBe(true);
  });
});
