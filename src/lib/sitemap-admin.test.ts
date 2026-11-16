import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

test("sitemap source never lists /admin and security.txt is well formed", () => {
  const src = readFileSync("src/lib/sitemap-entries.ts", "utf8");
  expect(src).not.toMatch(/["'`]\/admin/);
  const sec = readFileSync("public/.well-known/security.txt", "utf8");
  expect(sec).toContain("Contact: mailto:support@vyraxlabs.co.uk");
  expect(sec).toMatch(/^Expires: \d{4}-\d{2}-\d{2}T/m);
  expect(sec).not.toMatch(/leo|kallio|gmail/i);
});
