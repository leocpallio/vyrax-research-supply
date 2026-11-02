import { expect, test } from "bun:test";
import { buildWelcomeEmail } from "./welcome-image";
import { welcomeOffer } from "./welcome-offer";
import { promos } from "../../data/promos";
import { site } from "../../data/site";

const email = buildWelcomeEmail({
  code: promos[0].code,
  shopUrl: "https://vyraxlabs.co.uk/shop",
  contactEmail: "support@vyraxlabs.co.uk",
});
const all = email.html + "\n" + email.text.join("\n");

test("welcome email states the one code checkout honours", () => {
  const codes = new Set(all.match(/\b(?:FIRST\d+|WELCOME-[A-Z0-9]+)\b/g));
  expect([...codes]).toEqual([promos[0].code]);
});

test("welcome email never claims what checkout does not do", () => {
  expect(all).not.toMatch(/up to 20%/i);
  expect(all).not.toMatch(/no minimum/i);
  expect(all).not.toMatch(/any order size/i);
  expect(all).not.toMatch(/expir/i);
});

test("welcome offer thresholds come from checkout data", () => {
  const o = welcomeOffer();
  expect(o.min).toBe(`£${promos[0].minSpend}`);
  expect(o.delivery).toBe(`£${site.freeDeliveryThreshold}`);
  expect(o.giftOver).toBe(`£${site.firstOrderGift!.over}`);
  expect(all).toContain(`free over £${site.firstOrderGift!.over}`);
  expect(all).toContain(`delivery over £${site.freeDeliveryThreshold}`);
  expect(o.exampleText).toContain("£145.80");
});
