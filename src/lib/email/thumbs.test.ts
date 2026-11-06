import { describe, expect, test } from "bun:test";
import { lineMedia, summarise } from "./order-email.server";
import { renderEmail } from "./templates";

describe("email product thumbnails", () => {
  test("known catalogue line gets a store-origin thumb and product link", () => {
    const m = lineMedia("adamax", "5mg");
    expect(m.image).toBe("https://vyraxlabs.co.uk/email-thumbs/adamax__5mg.jpg");
    expect(m.url).toBe("https://vyraxlabs.co.uk/product/adamax");
  });
  test("unknown strength has no thumb (no broken image)", () => {
    expect(lineMedia("adamax", "999mg")).toEqual({});
  });
  test("order confirmation embeds the img once per line and never a foreign host", () => {
    const s = summarise({
      id: "00000000-0000-4000-8000-000000000001",
      name: "A",
      email: "a@b.c",
      items: [{ slug: "adamax", name: "Adamax", strength: "5mg", quantity: 2, linePence: 4000 }],
      total_pence: 4000,
    });
    const r = renderEmail({ kind: "orderConfirmation", name: "A", reference: "VX-1", ...s });
    expect(r.html).toContain('src="https://vyraxlabs.co.uk/email-thumbs/adamax__5mg.jpg"');
    expect(r.html.match(/<img class="thumb"/g)?.length).toBe(1);
    const foreign = renderEmail({
      kind: "orderConfirmation",
      name: "A",
      reference: "VX-1",
      lines: [
        {
          name: "X",
          strength: "5mg",
          quantity: 1,
          lineTotal: 1,
          image: "https://evil.example/x.jpg",
        },
      ],
      total: 1,
    });
    expect(foreign.html).not.toContain("evil.example");
  });
});
