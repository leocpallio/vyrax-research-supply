import { beforeEach, expect, test } from "bun:test";
import { metabolicAndRegenerative } from "../data/compounds-a";
import {
  captureCart,
  recordCheckoutConsent,
  requestStockNotice,
  type CaptureDeps,
} from "./contact-capture.server";
import { resetRateLimits } from "./rate-limit";

const product = metabolicAndRegenerative[0]!;
const variant = product.strengths[0]!;
const item = { slug: product.slug, strength: variant.label, quantity: 1 };
const env = { VYRAX_CONTACT_CAPTURE_ENABLED: "true" };
const CONSENT_ID = "eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee";

const post = (path: string, body: unknown, origin: string | null = "https://vyraxlabs.co.uk") =>
  new Request(`https://vyraxlabs.co.uk${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(origin ? { origin } : {}),
    },
    body: JSON.stringify(body),
  });

function fakeDb(consentResult: string | null = CONSENT_ID) {
  const calls: { name: string; args: Record<string, unknown> }[] = [];
  const db = {
    rpc: async (name: string, args: Record<string, unknown>) => {
      calls.push({ name, args });
      if (name === "record_email_marketing_consent") return { data: consentResult, error: null };
      return { data: true, error: null };
    },
  };
  return { db, calls };
}
const deps = (over: Partial<CaptureDeps> = {}): CaptureDeps => ({
  env,
  fetcher: (async () => new Response("{}", { status: 200 })) as unknown as typeof fetch,
  ...over,
});

beforeEach(() => resetRateLimits());

test("cart capture: wrong or missing origin is rejected before anything runs", async () => {
  const { db, calls } = fakeDb();
  for (const origin of ["https://evil.example", null]) {
    const res = await captureCart(
      post("/api/cart-capture", { email: "lab@lab.co.uk", items: [item] }, origin),
      deps({ db, hasConsent: async () => true }),
    );
    expect(res.status).toBe(403);
  }
  expect(calls).toEqual([]);
});

test("cart capture: disabled flag refuses", async () => {
  const res = await captureCart(
    post("/api/cart-capture", { email: "lab@lab.co.uk", items: [item] }),
    deps({ env: {}, hasConsent: async () => true }),
  );
  expect(res.status).toBe(503);
});

test("cart capture: invalid email and invalid items are rejected", async () => {
  const { db, calls } = fakeDb();
  const d = deps({ db, hasConsent: async () => true });
  const bad = [
    { email: "nope", items: [item] },
    { email: "lab@lab.co.uk", items: [] },
    { email: "lab@lab.co.uk", items: [{ ...item, slug: "not-a-product" }] },
    { email: "lab@lab.co.uk", items: [{ ...item, strength: "999mg" }] },
    { email: "lab@lab.co.uk", items: [{ ...item, quantity: 0 }] },
    { email: "lab@lab.co.uk", items: [{ ...item, quantity: 1.5 }] },
    { email: "lab@lab.co.uk", items: [item, item] },
    { email: "lab@lab.co.uk", items: "x" },
  ];
  for (const body of bad) {
    const res = await captureCart(post("/api/cart-capture", body), d);
    expect(res.status).toBe(400);
  }
  expect(calls).toEqual([]);
});

test("cart capture: no active consent means nothing is saved and consent is never created", async () => {
  const { db, calls } = fakeDb();
  const res = await captureCart(
    post("/api/cart-capture", { email: "lab@lab.co.uk", items: [item] }),
    deps({ db, hasConsent: async () => false }),
  );
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ ok: true, saved: false });
  expect(calls).toEqual([]);
});

test("cart capture: test addresses are skipped even with consent", async () => {
  const { db, calls } = fakeDb();
  for (const email of ["test@gmail.com", "someone@example.com", "x@test.co"]) {
    const res = await captureCart(
      post("/api/cart-capture", { email, items: [item] }),
      deps({ db, hasConsent: async () => true }),
    );
    expect((await res.json()).saved).toBe(false);
  }
  expect(calls).toEqual([]);
});

test("cart capture: consented address saves via save_email_cart and nothing else", async () => {
  const { db, calls } = fakeDb();
  const res = await captureCart(
    post("/api/cart-capture", { email: " Lab@Lab.co.uk ", items: [item] }),
    deps({ db, hasConsent: async (e) => e === "lab@lab.co.uk" }),
  );
  expect(await res.json()).toEqual({ ok: true, saved: true });
  expect(calls).toEqual([
    { name: "save_email_cart", args: { p_email: "lab@lab.co.uk", p_items: [item] } },
  ]);
});

test("cart capture: rate limited", async () => {
  const { db } = fakeDb();
  const d = deps({ db, hasConsent: async () => false });
  let last = 200;
  for (let i = 0; i < 25; i++)
    last = (await captureCart(post("/api/cart-capture", { email: "lab@lab.co.uk", items: [item] }), d))
      .status;
  expect(last).toBe(429);
});

test("stock notice: wrong origin rejected, consent line required, product validated", async () => {
  const { db, calls } = fakeDb();
  const body = { email: "lab@lab.co.uk", slug: item.slug, strength: item.strength, consent: true };
  expect((await requestStockNotice(post("/api/stock-notice", body, "https://evil.example"), deps({ db }))).status).toBe(403);
  expect((await requestStockNotice(post("/api/stock-notice", { ...body, consent: false }), deps({ db }))).status).toBe(400);
  expect((await requestStockNotice(post("/api/stock-notice", { ...body, slug: "nope" }), deps({ db }))).status).toBe(400);
  expect((await requestStockNotice(post("/api/stock-notice", { ...body, email: "test@gmail.com" }), deps({ db }))).status).toBe(400);
  expect(calls).toEqual([]);
});

test("stock notice: records vyrax_stock consent then request_stock_notice", async () => {
  const { db, calls } = fakeDb();
  const res = await requestStockNotice(
    post("/api/stock-notice", {
      email: "Lab@Lab.co.uk",
      slug: item.slug,
      strength: item.strength,
      consent: true,
    }),
    deps({ db }),
  );
  expect(res.status).toBe(200);
  expect(calls.map((c) => c.name)).toEqual(["record_email_marketing_consent", "request_stock_notice"]);
  expect(calls[0]!.args).toEqual({ p_email: "lab@lab.co.uk", p_source: "vyrax_stock" });
  expect(calls[1]!.args).toEqual({ p_email: "lab@lab.co.uk", p_slug: item.slug, p_strength: item.strength });
});

test("stock notice: an address that cannot be given consent is not queued", async () => {
  const { db, calls } = fakeDb(null);
  const res = await requestStockNotice(
    post("/api/stock-notice", { email: "lab@lab.co.uk", slug: item.slug, strength: item.strength, consent: true }),
    deps({ db }),
  );
  expect(res.status).toBe(200);
  expect(calls.map((c) => c.name)).toEqual(["record_email_marketing_consent"]);
});

test("checkout consent: needs origin and explicit consent, records vyrax_checkout", async () => {
  const { db, calls } = fakeDb();
  expect((await recordCheckoutConsent(post("/api/checkout-consent", { email: "lab@lab.co.uk", consent: true }, "https://evil.example"), deps({ db }))).status).toBe(403);
  expect((await recordCheckoutConsent(post("/api/checkout-consent", { email: "lab@lab.co.uk" }), deps({ db }))).status).toBe(400);
  expect(calls).toEqual([]);
  const ok = await recordCheckoutConsent(post("/api/checkout-consent", { email: "lab@lab.co.uk", consent: true }), deps({ db }));
  expect(ok.status).toBe(200);
  expect(calls).toEqual([
    { name: "record_email_marketing_consent", args: { p_email: "lab@lab.co.uk", p_source: "vyrax_checkout" } },
  ]);
});

test("responses and the form copy contain no em or en dashes", async () => {
  const { db } = fakeDb();
  const res = await requestStockNotice(post("/api/stock-notice", { email: "bad" }), deps({ db }));
  expect(await res.text()).not.toMatch(/[\u2013\u2014]/);
  const fs = await import("node:fs");
  for (const f of [
    "src/components/pdp/StockNotice.tsx",
    "src/lib/contact-capture.server.ts",
    "src/lib/email/contact-shared.server.ts",
    "src/lib/email/contact-automation.server.ts",
  ])
    expect(fs.readFileSync(f, "utf8")).not.toMatch(/[\u2013\u2014]/);
});
