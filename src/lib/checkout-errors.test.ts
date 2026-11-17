import { describe, expect, test } from "bun:test";
import { checkoutFailProps, maskPiiInText, scrubExceptionEvent } from "./analytics-events";

describe("checkout_payment_failed props", () => {
  test("carries site, step, provider and a short code only", () => {
    expect(checkoutFailProps({ step: "start_payment", errorCode: "http_502" })).toEqual({
      site: "vyrax",
      step: "start_payment",
      provider: "spicepay",
      error_code: "http_502",
    });
  });
  test("a message, email or empty value never becomes error_code", () => {
    for (const bad of ["Could not charge jo@example.com", "", null, undefined, "x".repeat(60)]) {
      expect(checkoutFailProps({ step: "create_order", errorCode: bad }).error_code).toBe("unknown");
    }
  });
  test("an odd provider name collapses to unknown", () => {
    expect(checkoutFailProps({ step: "create_order", provider: "Some Provider!", errorCode: "network" }).provider).toBe(
      "unknown",
    );
  });
});

describe("exception scrubbing", () => {
  test("masks emails, phones and long digit runs in $exception strings", () => {
    const out = scrubExceptionEvent({
      event: "$exception",
      properties: {
        $exception_list: [{ type: "Error", value: "failed for jo@example.com 4111 1111 1111 1111 07700 900123" }],
        $current_url: "https://x.test/checkout",
      },
    });
    const v = JSON.stringify(out!.properties);
    expect(v).not.toContain("jo@example.com");
    expect(v).not.toContain("4111");
    expect(v).not.toContain("07700");
    expect(v).toContain("[email]");
    expect(out!.properties!.$current_url).toBe("https://x.test/checkout");
  });
  test("drops PII-named keys inside the exception payload", () => {
    const out = scrubExceptionEvent({ event: "$exception", properties: { $exception_list: [{ email: "a@b.co", type: "E" }] } });
    expect(JSON.stringify(out)).not.toContain("a@b.co");
  });
  test("other events pass through untouched", () => {
    const evt = { event: "payment_initiated", properties: { order_id: "o1" } };
    expect(scrubExceptionEvent(evt)).toBe(evt);
    expect(maskPiiInText("plain text")).toBe("plain text");
  });
});
