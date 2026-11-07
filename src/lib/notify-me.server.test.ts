import { expect, test } from "bun:test";
import { metabolicAndRegenerative } from "@/data/compounds-a";
import { site } from "@/data/site";
import { purityStat } from "./pdp-coa";
import { submitNotification } from "./notify-me.server";

const variant = metabolicAndRegenerative.find((item) => item.slug === "tirzepatide")!.strengths[0]!;
const strength = variant.label;
const source = purityStat("tirzepatide", strength).kind === "pending" ? "lab_report" : "stock";
const body = {
  email: "LAB@example.com",
  product_slug: "tirzepatide",
  strength,
  source,
  website: "",
  consent: true,
};
const env = { VYRAX_NOTIFY_ME_ENABLED: "true", VYRAX_NOTIFY_RATE_SALT: "test-only-salt" };
const request = (data: unknown, origin = "https://vyraxlabs.co.uk") =>
  new Request("https://vyraxlabs.co.uk/api/notify-me", {
    method: "POST",
    headers: { origin, "cf-connecting-ip": "198.51.100.1", "content-type": "application/json" },
    body: JSON.stringify(data),
  });

test("rejects foreign origin and missing consent before writing", async () => {
  let writes = 0;
  const save = async () => {
    writes++;
    return true;
  };
  expect(
    (await submitNotification(request(body, "https://attacker.example"), { env, save })).status,
  ).toBe(403);
  expect(
    (await submitNotification(request({ ...body, consent: false }), { env, save })).status,
  ).toBe(400);
  expect(writes).toBe(0);
});

test("rejects other products, bogus strengths and unavailable notification types", async () => {
  let writes = 0;
  const save = async () => {
    writes++;
    return true;
  };
  expect(
    (await submitNotification(request({ ...body, product_slug: "retatrutide" }), { env, save }))
      .status,
  ).toBe(400);
  expect(
    (await submitNotification(request({ ...body, strength: "999mg" }), { env, save })).status,
  ).toBe(400);
  if ((variant.stock ?? site.defaultStock) === "in")
    expect(
      (await submitNotification(request({ ...body, source: "stock" }), { env, save })).status,
    ).toBe(400);
  expect(writes).toBe(0);
});

test("disabled flag, honeypot, failing storage and rate limit", async () => {
  const save = async () => true;
  expect((await submitNotification(request(body), { env: {}, save })).status).toBe(503);
  expect(
    (await submitNotification(request({ ...body, website: "bot" }), { env, save })).status,
  ).toBe(200);
  expect(
    (
      await submitNotification(request(body), {
        env,
        save: async () => {
          throw Error("db");
        },
      })
    ).status,
  ).toBe(503);
  expect((await submitNotification(request(body), { env, save: async () => false })).status).toBe(
    429,
  );
});

test("valid request normalises address and records only a salted IP digest", async () => {
  let saved: Record<string, string> | undefined;
  const response = await submitNotification(request(body), {
    env,
    save: async (input) => {
      saved = input;
      return true;
    },
  });
  expect(response.status).toBe(200);
  expect(saved?.email).toBe("lab@example.com");
  expect(saved?.ip_digest).toMatch(/^[a-f0-9]{64}$/);
  expect(JSON.stringify(saved)).not.toContain("198.51.100.1");
});
