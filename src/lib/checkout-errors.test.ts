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
    expect(v).toContain("[redacted]");
    expect(out!.properties!.$current_url).toBe("https://x.test/checkout");
  });
  test("never sends exception free text: names, addresses and non-UK contact formats", () => {
    const texts = [
      "Jane Smith at Flat Seven, London",
      "Hans Müller, Königsallee 12, 40212 Düsseldorf",
      "+49 170 1234567 call back",
      "+1 (415) 555-0132",
      "Order note: leave with neighbour at No 4 Elm Walk",
    ];
    for (const text of texts) {
      const out = scrubExceptionEvent({
        event: "$exception",
        properties: {
          $exception_message: text,
          $exception_values: [text],
          $exception_personURL: `https://x.test/?q=${encodeURIComponent(text)}`,
          $exception_list: [
            {
              type: "Error",
              value: text,
              mechanism: { handled: false, type: "onerror", extra: text },
              stacktrace: { type: "raw", frames: [{ filename: `https://x.test/assets/a.js?${text}`, function: text, lineno: 10, colno: 4 }] },
            },
          ],
          $current_url: `https://vyraxlabs.co.uk/checkout?name=${encodeURIComponent(text)}`,
        },
      });
      const dump = JSON.stringify(out!.properties);
      for (const word of ["Jane", "Smith", "Flat Seven", "Müller", "Königsallee", "1234567", "555", "neighbour", "Elm"]) {
        expect(dump).not.toContain(word);
      }
      expect(out!.properties!.$exception_message).toBe("[redacted]");
      const first = (out!.properties!.$exception_list as Array<Record<string, any>>)[0];
      expect(first.type).toBe("Error");
      expect(first.value).toBe("[redacted]");
      expect(first.stacktrace.frames[0].filename).toBeUndefined();
      expect(first.stacktrace.frames[0].source).toBe("other");
      expect(first.stacktrace.frames[0].lineno).toBe(10);
      expect(first.stacktrace.frames[0].function).toBeUndefined();
    }
  });
  test("emits no untrusted string from any exception field (webqa round 2: JaneSmithPrivate)", () => {
    const P = "JaneSmithPrivate";
    const out = scrubExceptionEvent({
      event: "$exception",
      properties: {
        $exception_message: P,
        $exception_values: [P],
        $exception_types: [P],
        $exception_sources: [`https://x.test/${P}.js`],
        $exception_functions: [P],
        $exception_level: P,
        $exception_fingerprint: P,
        $exception_list: [
          {
            type: P,
            value: P,
            module: P,
            mechanism: { handled: true, synthetic: false, type: P, description: P },
            stacktrace: {
              type: "raw",
              frames: [{ filename: `https://x.test/${P}.js`, abs_path: `https://x.test/${P}.js`, function: P, module: P, chunk_id: P, platform: P, lineno: 3, colno: 9, in_app: true }],
            },
          },
        ],
      },
    });
    expect(JSON.stringify(out!.properties)).not.toContain(P);
    const first = (out!.properties!.$exception_list as Array<Record<string, any>>)[0];
    expect(first.type).toBe("Error");
    expect(first.stacktrace.frames[0].lineno).toBe(3);
    expect(first.stacktrace.frames[0].colno).toBe(9);
    expect(first.stacktrace.frames[0].function).toBeUndefined();
    expect(first.stacktrace.frames[0].filename).toBeUndefined();
    const typed = scrubExceptionEvent({ event: "$exception", properties: { $exception_list: [{ type: "TypeError", value: "x" }] } });
    expect((typed!.properties!.$exception_list as Array<Record<string, any>>)[0].type).toBe("TypeError");
  });
  test("keeps the PostHog project token and distinct id so the event is still ingested", () => {
    const out = scrubExceptionEvent({ event: "$exception", properties: { token: "phc_x", distinct_id: "abc", $exception_list: [{ type: "E", value: "x" }] } });
    expect(out!.properties!.token).toBe("phc_x");
    expect(out!.properties!.distinct_id).toBe("abc");
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
