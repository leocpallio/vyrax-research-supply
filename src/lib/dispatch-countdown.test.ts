import { describe, expect, it } from "bun:test";
import { dispatchText } from "@/components/pdp/DispatchCountdown";

describe("dispatch countdown copy", () => {
  it("states the cut-off before the clock is known", () => {
    expect(dispatchText(null, 3)).toBe("Order before 2pm for same-day dispatch");
  });

  it("counts down in hours and padded minutes", () => {
    expect(dispatchText((4 * 60 + 12) * 60_000, 3)).toBe("Order within 4h 12m, dispatched today");
    expect(dispatchText(5 * 60_000, 3)).toBe("Order within 0h 05m, dispatched today");
  });

  it("never promises same-day dispatch after the cut-off", () => {
    expect(dispatchText(0, 3)).toBe("Order now, dispatched tomorrow");
    expect(dispatchText(-1, 3)).toBe("Order now, dispatched tomorrow");
  });

  it("rolls weekend orders to Monday instead of claiming tomorrow", () => {
    expect(dispatchText(null, 6)).toBe("Orders placed now are dispatched Monday");
    expect(dispatchText(3_600_000, 0)).toBe("Orders placed now are dispatched Monday");
  });
});
