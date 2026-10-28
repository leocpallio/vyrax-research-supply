import { describe, expect, test } from "bun:test";
import { site } from "../data/site";
import { dispatchCutoffLabel } from "./delivery";
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
