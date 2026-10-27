import { describe, expect, test } from "bun:test";
import {
  BANNED_SCHEMA_KEYS,
  breadcrumbListJsonLd,
  buildHead,
  clampText,
  collectionPageJsonLd,
  faqPageJsonLd,
  howToJsonLd,
  imageAltAudit,
  organizationJsonLd,
  serializeJsonLd,
  titles,
  webSiteJsonLd,
  withRuoTail,
  ogImageFor,
} from "./seo";
import { site } from "../data/site";

const meta = (
  head: ReturnType<typeof buildHead>,
  key: string,
  attr: "name" | "property" = "name",
) => head.meta.find((m) => m[attr] === key)?.["content"];

describe("buildHead", () => {
  const head = buildHead({
    title: "Buy BPC-157 5mg UK | Research Peptide | Vyrax Labs",
    description: "BPC-157 5mg vial for laboratory research. Research use only.",
    path: "/product/bpc-157",
    type: "product",
    image: "/assets/bpc.webp",
    jsonLd: [{ "@type": "Thing" }, { "@type": "Other", x: "</script><b>" }],
  });
  test("title, description, canonical", () => {
    expect(head.meta[0]).toEqual({ title: "Buy BPC-157 5mg UK | Research Peptide | Vyrax Labs" });
    expect(meta(head, "description")).toContain("Research use only.");
    expect(head.links).toEqual([
      { rel: "canonical", href: "https://vyraxlabs.co.uk/product/bpc-157" },
      { rel: "alternate", hrefLang: "en-GB", href: "https://vyraxlabs.co.uk/product/bpc-157" },
      { rel: "alternate", hrefLang: "x-default", href: "https://vyraxlabs.co.uk/product/bpc-157" },
    ]);
  });
  test("og and twitter", () => {
    expect(meta(head, "og:type", "property")).toBe("product");
    expect(meta(head, "og:url", "property")).toBe("https://vyraxlabs.co.uk/product/bpc-157");
    expect(meta(head, "og:image", "property")).toBe("https://vyraxlabs.co.uk/assets/bpc.webp");
    expect(meta(head, "og:locale", "property")).toBe("en_GB");
    expect(meta(head, "og:site_name", "property")).toBe("Vyrax Labs");
    expect(meta(head, "twitter:card")).toBe("summary_large_image");
    expect(meta(head, "twitter:image")).toBe("https://vyraxlabs.co.uk/assets/bpc.webp");
  });
  test("robots, googlebot, theme-color", () => {
    expect(meta(head, "robots")).toBe("index, follow, max-image-preview:large");
    expect(meta(head, "googlebot")).toBe("index, follow, max-image-preview:large");
    expect(meta(head, "theme-color")).toBe("#F5F0E5");
  });
  test("noindex", () => {
    const h = buildHead({ title: "x", description: "y", path: "/verify/ABC", noindex: true });
    expect(meta(h, "robots")).toBe("noindex, follow");
    expect(meta(h, "googlebot")).toBe("noindex, follow");
  });
  test("defaults: website type and og image", () => {
    const h = buildHead({ title: "x", description: "y", path: "/faq" });
    expect(meta(h, "og:type", "property")).toBe("website");
    expect(meta(h, "og:image", "property")).toBe("https://vyraxlabs.co.uk/og/page/faq.jpg");
  });
  test("json-ld scripts, one per object, script-safe", () => {
    expect(head.scripts).toHaveLength(2);
    expect(head.scripts[0]?.type).toBe("application/ld+json");
    expect(head.scripts[1]?.children).not.toContain("</script>");
    expect(JSON.parse(head.scripts[1]!.children)["x"]).toBe("</script><b>");
  });
});

describe("text helpers", () => {
  test("clampText keeps whole words", () => {
    const t = clampText("word ".repeat(100), 60);
    expect(t.length).toBeLessThanOrEqual(60);
    expect(t.endsWith("\u2026")).toBe(true);
  });
  test("withRuoTail", () => {
    expect(withRuoTail("A guide.")).toBe("A guide. Research use only.");
    expect(withRuoTail("Already. Research use only.")).toBe("Already. Research use only.");
  });
  test("title patterns", () => {
    expect(titles.product("BPC-157", "5mg")).toBe(
      "Buy BPC-157 5mg UK | Research Peptide | Vyrax Labs",
    );
    expect(titles.category("Metabolic Research Peptides")).toBe(
      "Buy Metabolic Research Peptides UK | Research Grade | Vyrax Labs",
    );
    expect(titles.info("Returns & Replacements")).toBe("Returns & Replacements | Vyrax Labs UK");
    for (const t of [titles.home(), titles.shop(), titles.labReports()])
      expect(t.length).toBeLessThanOrEqual(70);
  });
});

describe("json-ld builders", () => {
  test("organization: OnlineStore, phone from site, no entity fields", () => {
    const org = organizationJsonLd();
    expect(org["@type"]).toEqual(["Organization", "OnlineStore"]);
    expect(org["name"]).toBe("Vyrax Labs");
    expect(org["url"]).toBe("https://vyraxlabs.co.uk/");
    expect((org["contactPoint"] as Record<string, unknown>)["telephone"]).toBe(site.phone);
    const json = serializeJsonLd(org);
    for (const k of BANNED_SCHEMA_KEYS) expect(json).not.toContain(`"${k}"`);
    expect(json).not.toMatch(/company number|companies house|VAT/i);
  });
  test("website has SearchAction", () => {
    const w = webSiteJsonLd();
    const action = w["potentialAction"] as Record<string, unknown>;
    expect(action["@type"]).toBe("SearchAction");
    expect((action["target"] as Record<string, string>)["urlTemplate"]).toContain(
      "{search_term_string}",
    );
  });
  test("breadcrumbs positions and absolute items", () => {
    const b = breadcrumbListJsonLd([{ name: "Home", path: "/" }, { name: "FAQ" }]);
    const items = b["itemListElement"] as Record<string, unknown>[];
    expect(items.map((i) => i["position"])).toEqual([1, 2]);
    expect(items[0]?.["item"]).toBe("https://vyraxlabs.co.uk/");
    expect(items[1]?.["item"]).toBeUndefined();
  });
  test("faq, collection, howto", () => {
    const f = faqPageJsonLd([["Q?", "A."]]);
    expect((f["mainEntity"] as unknown[]).length).toBe(1);
    const c = collectionPageJsonLd({
      name: "Guides",
      description: "d",
      path: "/guides",
      items: [{ name: "A", path: "/guides/a" }],
    });
    expect((c["mainEntity"] as Record<string, unknown>)["numberOfItems"]).toBe(1);
    const h = howToJsonLd({
      name: "n",
      description: "d",
      path: "/calculator",
      steps: [
        { name: "s1", text: "t1" },
        { name: "s2", text: "t2" },
      ],
    });
    const steps = h["step"] as Record<string, unknown>[];
    expect(steps[1]?.["url"]).toBe("https://vyraxlabs.co.uk/calculator#step-2");
  });
  test("no schema mentions a payment gateway", () => {
    const json = serializeJsonLd(organizationJsonLd()) + serializeJsonLd(webSiteJsonLd());
    expect(json.toLowerCase()).not.toContain("spicepay");
  });
});

describe("imageAltAudit", () => {
  test("flags missing and empty alt, skips presentational", () => {
    const img = (attrs: Record<string, string>) => ({
      getAttribute: (n: string) => (n in attrs ? attrs[n]! : null),
    });
    const doc = {
      querySelectorAll: () => [
        img({ src: "a.webp", alt: "BPC-157 5mg vial" }),
        img({ src: "b.webp" }),
        img({ src: "c.webp", alt: "" }),
        img({ src: "d.webp", alt: "", role: "presentation" }),
      ],
    };
    expect(imageAltAudit(doc)).toEqual([
      { src: "b.webp", reason: "missing" },
      { src: "c.webp", reason: "empty" },
    ]);
  });
});

describe("ogImageFor", () => {
  test("maps each route type to its card", () => {
    expect(ogImageFor("/")).toBe("/og/page/home.jpg");
    expect(ogImageFor("/product/retatrutide", "10mg")).toBe("/og/p/retatrutide__10mg.jpg");
    expect(ogImageFor("/category/metabolic-research")).toBe("/og/c/metabolic-research.jpg");
    expect(ogImageFor("/collections/weight-metabolic")).toBe("/og/s/weight-metabolic.jpg");
    expect(ogImageFor("/guides/peptide-storage-guide")).toBe("/og/g/peptide-storage-guide.jpg");
    expect(ogImageFor("/shop")).toBe("/og/page/shop.jpg");
    expect(ogImageFor("/something-else")).toBe("/og/default.jpg");
  });
});
