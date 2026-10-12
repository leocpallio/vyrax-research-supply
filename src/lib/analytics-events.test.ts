import { describe, expect, test } from "bun:test";
import {
  ecommerceItem,
  firstTouchSetOnce,
  itemsProps,
  listProps,
  productId,
  productProps,
  readUtm,
  sanitizeProperties,
  stripQuery,
} from "./analytics-events";

const bpc = {
  slug: "bpc-157",
  name: "BPC-157",
  category: "regenerative-research",
  strength: "5mg",
  price: 24.99,
};
const tb = {
  slug: "tb-500",
  name: "TB-500",
  category: "regenerative-research",
  strength: "10mg",
  price: 39.5,
  quantity: 2,
};

describe("ecommerce payloads", () => {
  test("item has standard props, GBP, quantity >= 1", () => {
    expect(ecommerceItem(bpc)).toEqual({
      product_id: "bpc-157|5mg",
      name: "BPC-157",
      category: "regenerative-research",
      variant: "5mg",
      price: 24.99,
      currency: "GBP",
      quantity: 1,
    });
    expect(ecommerceItem({ ...bpc, quantity: 0 }).quantity).toBe(1);
    expect(productId("x")).toBe("x");
  });
  test("productProps value = price * quantity", () => {
    expect(productProps(tb).value).toBe(79);
  });
  test("itemsProps sums value and count, rounds to pence", () => {
    const p = itemsProps([bpc, tb]);
    expect(p.item_count).toBe(3);
    expect(p.value).toBe(103.99);
    expect(p.currency).toBe("GBP");
    expect(p.items).toHaveLength(2);
    expect(itemsProps([])).toEqual({ items: [], item_count: 0, value: 0, currency: "GBP" });
  });
  test("listProps caps items but keeps full count", () => {
    const many = Array.from({ length: 40 }, (_, i) => ({ ...bpc, slug: `p${i}` }));
    const p = listProps({ id: "shop", name: "All", type: "shop" }, many);
    expect(p.item_count).toBe(40);
    expect(p.items).toHaveLength(24);
    expect(p.listing_type).toBe("shop");
  });
});

describe("first-touch UTM", () => {
  test("reads utm_* only, never gclid/fbclid", () => {
    const ft = readUtm(
      "https://vyraxlabs.co.uk/shop?utm_source=tiktok&utm_medium=social&utm_campaign=oct&gclid=XYZ&fbclid=ABC",
    );
    expect(ft).toEqual({
      utm_source: "tiktok",
      utm_medium: "social",
      utm_campaign: "oct",
      landing_path: "/shop",
    });
    expect(JSON.stringify(ft)).not.toMatch(/gclid|fbclid|XYZ|ABC/);
  });
  test("no utm, no landing_path; bad URL is empty", () => {
    expect(readUtm("https://vyraxlabs.co.uk/")).toEqual({});
    expect(readUtm("not a url")).toEqual({});
  });
  test("caps value length", () => {
    expect(readUtm(`https://x.test/?utm_term=${"a".repeat(300)}`).utm_term?.length).toBe(100);
  });
  test("$set_once keys are prefixed initial_", () => {
    expect(firstTouchSetOnce({ utm_source: "ig", landing_path: "/" })).toEqual({
      initial_utm_source: "ig",
      initial_landing_path: "/",
    });
  });
});

describe("sanitizeProperties", () => {
  test("drops referrers and strips query strings, recursing into $set_once", () => {
    const out = sanitizeProperties({
      $current_url: "https://vyraxlabs.co.uk/shop?q=secret#frag",
      $referrer: "https://evil.example/page",
      $referring_domain: "evil.example",
      $set_once: {
        $initial_referrer: "x",
        $initial_current_url: "https://vyraxlabs.co.uk/?utm_source=a",
      },
      keep: 1,
    });
    expect(out).toEqual({
      $current_url: "https://vyraxlabs.co.uk/shop",
      $set_once: { $initial_current_url: "https://vyraxlabs.co.uk/" },
      keep: 1,
    });
    expect(stripQuery("/a?b=c")).toBe("/a");
  });
});
