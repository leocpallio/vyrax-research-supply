import { test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { faqGroups } from "../src/data/faq";

const here = dirname(fileURLToPath(import.meta.url));

const customerCopyFiles = [
  "src/components/PaymentCheckout.tsx",
  "src/components/Store.tsx",
  "src/data/site.ts",
  "src/routes/admin.tsx",
  "src/routes/index.tsx",
  "src/routes/terms.tsx",
  "src/routes/privacy.tsx",
];

test("customer-facing payment copy does not name the gateway", () => {
  for (const file of customerCopyFiles) {
    expect(readFileSync(resolve(here, "..", file), "utf8")).not.toContain("SpicePay");
  }
  expect(JSON.stringify(faqGroups).toLowerCase()).not.toContain("spicepay");
});
