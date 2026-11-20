import { expect, test } from "bun:test";
import { isProductionHost, checkoutIsTestMode } from "../src/lib/production-host";

test("only the two exact Vyrax production hostnames can emit analytics", () => {
  expect(isProductionHost("vyraxlabs.co.uk")).toBe(true);
  expect(isProductionHost("www.vyraxlabs.co.uk")).toBe(true);
  for (const host of [
    "127.0.0.1",
    "localhost",
    "vyrax-research-supply.lovable.app",
    "dratercool-debug-vyrax-research-supply.workers.dev",
    "preview.vyraxlabs.co.uk",
    "vyraxlabs.co.uk.evil.test",
    "VYRAXLABS.CO.UK",
  ]) {
    expect(isProductionHost(host)).toBe(false);
  }
});

test("non-production checkout hosts are test even when the processor mode is live", () => {
  expect(
    checkoutIsTestMode("live", "https://vyraxlabs.co.uk/api/checkout", "https://vyraxlabs.co.uk"),
  ).toBe(false);
  expect(
    checkoutIsTestMode(
      "live",
      "https://www.vyraxlabs.co.uk/api/checkout",
      "https://www.vyraxlabs.co.uk",
    ),
  ).toBe(false);
  expect(
    checkoutIsTestMode("test", "https://vyraxlabs.co.uk/api/checkout", "https://vyraxlabs.co.uk"),
  ).toBe(true);
  expect(
    checkoutIsTestMode("live", "http://127.0.0.1:4791/api/checkout", "http://127.0.0.1:4791"),
  ).toBe(true);
  expect(
    checkoutIsTestMode(
      "live",
      "https://preview.example.dev/api/checkout",
      "https://preview.example.dev",
    ),
  ).toBe(true);
  expect(
    checkoutIsTestMode(
      "live",
      "https://preview.example.dev/api/checkout",
      "https://vyraxlabs.co.uk",
    ),
  ).toBe(true);
});
