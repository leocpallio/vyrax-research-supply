import { describe, expect, test } from "bun:test";
import { site } from "../data/site";
import { dispatchCutoffLabel, deliveryTimeJsonLd, transitAimSource, transitAimValues } from "./delivery";
import { claimFilled, claimText } from "./claims";
import { renderEmail } from "./email/templates";

describe("Vyrax fulfilment copy", () => {
  test("uses the configured UK dispatch cut-off and names the stock/working-day conditions", () => {
    expect(dispatchCutoffLabel()).toBe("2pm UK time");
    const copy = claimFilled("delivery.same-day-dispatch", { cutoff: dispatchCutoffLabel() });
    expect(copy).toContain("before 2pm UK time on working days");
    expect(copy).toContain("subject to stock");
  });
  test("describes cold-chain packing without promising a transit temperature", () => {
    expect(claimText("delivery.cold-chain-packing")).toContain("cold-chain protection");
    const email = renderEmail({
      kind: "orderConfirmation",
      name: "Research customer",
      reference: "VX-TEST",
      lines: [{ name: "Test", strength: "5mg", quantity: 1, lineTotal: 20 }],
      total: 20,
    });
    expect(email.text).toContain("cold-chain protection");
    expect(email.text).toContain("transit temperature is not monitored");
    expect(email.text).toContain("before 2pm UK time on working days");
    expect(email.text).toContain(site.phone!);
  });
});

describe("delivery window and the offer schema", () => {
  test("the claim states the carrier's aim and never presents it as a promise", () => {
    const copy = claimFilled("delivery.transit-aim", transitAimValues())!;
    expect(copy).toContain("Royal Mail Tracked 24");
    expect(copy).toContain("next working day");
    expect(copy).toContain("1 to 2 working days");
    expect(copy).toContain("not a guarantee");
  });
  test("schema emits the same window the page shows, on working days only", () => {
    const t = deliveryTimeJsonLd() as {
      handlingTime: Record<string, unknown>;
      transitTime: Record<string, unknown>;
    };
    expect(t.handlingTime).toMatchObject({ minValue: 0, maxValue: 1, unitCode: "DAY" });
    expect(t.transitTime).toMatchObject({
      minValue: site.carrierTransitAim.minDays,
      maxValue: site.carrierTransitAim.maxDays,
      unitCode: "DAY",
    });
    expect(t.transitTime["businessDays"]).toEqual([
      "https://schema.org/Monday",
      "https://schema.org/Tuesday",
      "https://schema.org/Wednesday",
      "https://schema.org/Thursday",
      "https://schema.org/Friday",
    ]);
    expect(String(t.transitTime["businessDays"])).not.toContain("Saturday");
  });
  test("the aim cites a carrier page a reader can check", () => {
    expect(transitAimSource()).toBe("https://www.royalmail.com/sending/uk/tracked-24");
  });
});
