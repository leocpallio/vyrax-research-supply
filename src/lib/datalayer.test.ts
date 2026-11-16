import { describe, expect, test } from "bun:test";
import {
  buildAddToCart,
  buildBeginCheckout,
  buildPurchase,
  buildViewItem,
  claimPurchase,
  dlEventId,
  dlItem,
  dlItemId,
  mayPushPurchase,
  purchaseGuardKey,
  pushDataLayer,
  type DlLine,
} from "./datalayer";
import { deliveryPenceFor, publicOrderLines } from "./order-lines";

const reta: DlLine = {
  slug: "retatrutide",
  name: "Retatrutide",
  strength: "10mg",
  category: "Metabolic",
  price: 89.5,
  quantity: 1,
};
const bpc: DlLine = {
  slug: "bpc-157",
  name: "BPC-157",
  strength: "5mg",
  category: "Regenerative",
  price: 24.99,
  quantity: 2,
};
const ids = { now: 1700000000000, random: () => 0 };

const memStore = () => {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
  };
};

describe("datalayer item mapping", () => {
  test("item_id is lower-case slug-strength", () => {
    expect(dlItemId("retatrutide", "10mg")).toBe("retatrutide-10mg");
    expect(dlItemId("Tb-500", "5+5mg")).toBe("tb-500-5-5mg");
    expect(dlItemId("bacteriostatic-water", "")).toBe("bacteriostatic-water");
  });
  test("item fields match the spec mapping, 2dp numbers, no pound sign", () => {
    expect(dlItem(reta)).toEqual({
      item_id: "retatrutide-10mg",
      item_name: "Retatrutide 10mg",
      item_category: "Metabolic",
      item_variant: "10mg",
      price: 89.5,
      quantity: 1,
    });
    expect(dlItem({ ...bpc, price: 24.994, quantity: 0 }).price).toBe(24.99);
    expect(dlItem({ ...bpc, quantity: 0 }).quantity).toBe(1);
  });
});

describe("event_id", () => {
  test("<event>_<now>_<random9>", () => {
    expect(dlEventId("view_item", 1700000000000, () => 0)).toBe(
      "view_item_1700000000000_aaaaaaaaa",
    );
    expect(dlEventId("view_item")).toMatch(/^view_item_\d{13}_[a-z0-9]{9}$/);
  });
});

describe("builders", () => {
  test("view_item", () => {
    const p = buildViewItem(reta, ids);
    expect(p.event).toBe("view_item");
    expect(p.event_id).toBe("view_item_1700000000000_aaaaaaaaa");
    expect(p.ecommerce).toEqual({ currency: "GBP", value: 89.5, items: [dlItem(reta)] });
  });
  test("add_to_cart carries every line in one event, value is the sum", () => {
    const p = buildAddToCart([reta, bpc], ids);
    expect(p.event).toBe("add_to_cart");
    expect(p.ecommerce.items).toHaveLength(2);
    expect(p.ecommerce.value).toBe(139.48);
  });
  test("begin_checkout", () => {
    const p = buildBeginCheckout([reta, bpc], ids);
    expect(p.event).toBe("begin_checkout");
    expect(p.event_id).toBe("begin_checkout_1700000000000_aaaaaaaaa");
    expect(p.ecommerce.value).toBe(139.48);
    expect(p.ecommerce.transaction_id).toBeUndefined();
  });
  test("purchase: real order id, deterministic event_id, value is what was paid", () => {
    const p = buildPurchase({
      order: "0b9f1c1e-aaaa-bbbb-cccc-1234567890ab",
      lines: [reta, bpc],
      totalPence: 12948,
      shippingPence: 0,
    });
    expect(p.event).toBe("purchase");
    expect(p.event_id).toBe("purchase_0b9f1c1e-aaaa-bbbb-cccc-1234567890ab");
    expect(p.ecommerce.transaction_id).toBe("0b9f1c1e-aaaa-bbbb-cccc-1234567890ab");
    expect(p.ecommerce.value).toBe(129.48);
    expect(p.ecommerce.currency).toBe("GBP");
    expect(p.ecommerce.shipping).toBe(0);
    expect(p.ecommerce.discount).toBe(10);
  });
  test("purchase: shipping known and no discount", () => {
    const p = buildPurchase({ order: "o", lines: [reta], totalPence: 9350, shippingPence: 400 });
    expect(p.ecommerce.shipping).toBe(4);
    expect(p.ecommerce.value).toBe(93.5);
    expect(p.ecommerce.discount).toBeUndefined();
  });
  test("purchase: unknown shipping omits shipping and discount", () => {
    const p = buildPurchase({ order: "o", lines: [reta], totalPence: 8950, shippingPence: null });
    expect(p.ecommerce.shipping).toBeUndefined();
    expect(p.ecommerce.discount).toBeUndefined();
  });
  test("no customer PII keys in any payload", () => {
    const all = JSON.stringify([
      buildViewItem(reta),
      buildAddToCart([reta]),
      buildBeginCheckout([reta]),
      buildPurchase({ order: "o", lines: [reta], totalPence: 8950, shippingPence: 0 }),
    ]);
    for (const k of ["email", '"name"', "phone", "address", "postcode", "token", '"customer'])
      expect(all.includes(k)).toBe(false);
  });
});

describe("purchase single-fire guard", () => {
  test("first claim true, refresh false, other order true", () => {
    const s = memStore();
    expect(claimPurchase(s, "A")).toBe(true);
    expect(s.getItem(purchaseGuardKey("A"))).toBe("1");
    expect(claimPurchase(s, "A")).toBe(false);
    expect(claimPurchase(s, "B")).toBe(true);
  });
  test("storage failure does not block", () => {
    const broken = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {},
    };
    expect(claimPurchase(broken, "A")).toBe(true);
  });
  test("only paid, non-test orders with lines may push", () => {
    expect(mayPushPurchase("paid", false, 2)).toBe(true);
    expect(mayPushPurchase("paid", true, 2)).toBe(false);
    expect(mayPushPurchase("processing", false, 2)).toBe(false);
    expect(mayPushPurchase("failed", false, 2)).toBe(false);
    expect(mayPushPurchase("paid", false, 0)).toBe(false);
  });
});

describe("pushDataLayer", () => {
  test("clears ecommerce, then pushes the event", () => {
    const w: { dataLayer?: unknown[] } = {};
    const p = buildViewItem(reta, ids);
    pushDataLayer(p, w);
    expect(w.dataLayer).toEqual([{ ecommerce: null }, p]);
  });
});

describe("order-status lines", () => {
  const stored = [
    {
      slug: "retatrutide",
      name: "Retatrutide",
      strength: "10mg",
      quantity: 1,
      unitPence: 8950,
      linePence: 8950,
    },
    {
      slug: "gift",
      name: "Gift",
      strength: "x",
      quantity: 1,
      unitPence: 0,
      linePence: 0,
      gift: true,
    },
    { slug: "bad", name: 1 },
  ];
  test("keeps paid lines only, with no extra fields", () => {
    expect(publicOrderLines(stored)).toEqual([
      { slug: "retatrutide", name: "Retatrutide", strength: "10mg", unit_pence: 8950, quantity: 1 },
    ]);
    expect(publicOrderLines(null)).toEqual([]);
  });
  test("delivery is re-derived from lines and null when it cannot be", () => {
    expect(deliveryPenceFor([])).toBeNull();
    expect(
      deliveryPenceFor([{ slug: "nope", name: "n", strength: "1mg", unit_pence: 1, quantity: 1 }]),
    ).toBeNull();
  });
});
