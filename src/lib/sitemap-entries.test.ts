import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import sitemapLastmod from "../data/sitemap-lastmod.json";
import { buildSitemap, sitemapEntries, type SitemapInput } from "./sitemap-entries";

const SITE = "https://vyraxlabs.co.uk";

// A miniature shop: one compound with two strengths, a second compound, two categories and one
// collection. Enough to prove the date scoping without loading the real catalogue (catalog.ts uses
// import.meta.glob, which only resolves under Vite).
const base = (recordDate: string, overrides: Record<string, string> = {}): SitemapInput => ({
  dates: {
    files: {
      "src/routes/product.$slug.tsx": "2026-09-01",
      "src/routes/category.$slug.tsx": "2026-09-01",
      "src/routes/collections.$slug.tsx": "2026-09-01",
    },
    records: {
      "product:retatrutide": recordDate,
      "product:tirzepatide": recordDate,
      "category:metabolic-research": recordDate,
      "category:regenerative-research": recordDate,
      "collection:weight-metabolic": recordDate,
      ...overrides,
    },
  },
  products: [
    { loc: "/product/retatrutide", record: "product:retatrutide", hub: true },
    { loc: "/product/retatrutide-20mg", record: "product:retatrutide", hub: false },
    { loc: "/product/tirzepatide", record: "product:tirzepatide", hub: true },
  ],
  categories: [{ slug: "metabolic-research" }, { slug: "regenerative-research" }],
  collections: [{ slug: "weight-metabolic" }],
  guides: [{ slug: "reconstitution", updated: "2026-08-01" }],
  trustPages: [["/about", "0.5", "monthly"]],
  siteUrl: SITE,
});

const bySlug = (input: SitemapInput) => new Map(sitemapEntries(input).map((e) => [e.loc, e.lastmod]));

describe("sitemap lastmod", () => {
  test("changing one compound's record date moves only that compound's URLs", () => {
    const before = bySlug(base("2026-10-01"));
    const after = bySlug(base("2026-10-01", { "product:retatrutide": "2026-10-20" }));

    const moved = [...after.keys()].filter((loc) => before.get(loc) !== after.get(loc));
    expect(moved.sort()).toEqual(["/product/retatrutide", "/product/retatrutide-20mg"]);
    expect(after.get("/product/retatrutide-20mg")).toBe("2026-10-20");
    expect(after.get("/product/tirzepatide")).toBe("2026-10-01");
    expect(after.get("/category/metabolic-research")).toBe("2026-10-01");
    expect(after.get("/collections/weight-metabolic")).toBe("2026-10-01");
  });

  test("one category or collection edit leaves its siblings alone", () => {
    const after = bySlug(base("2026-10-01", { "category:metabolic-research": "2026-10-20" }));
    expect(after.get("/category/metabolic-research")).toBe("2026-10-20");
    expect(after.get("/category/regenerative-research")).toBe("2026-10-01");
    expect(after.get("/collections/weight-metabolic")).toBe("2026-10-01");
    expect(after.get("/product/retatrutide")).toBe("2026-10-01");
  });

  test("a shared template date applies to its whole group only", () => {
    const input = base("2026-10-01");
    input.dates = { ...input.dates, files: { "src/routes/product.$slug.tsx": "2026-10-25" } };
    const entries = bySlug(input);
    expect(entries.get("/product/retatrutide")).toBe("2026-10-25");
    expect(entries.get("/product/tirzepatide")).toBe("2026-10-25");
    expect(entries.get("/category/metabolic-research")).toBe("2026-10-01");
  });

  test("the newest of template and record wins, never an older one", () => {
    const input = base("2026-11-05");
    input.dates = { ...input.dates, files: { "src/routes/product.$slug.tsx": "2026-10-25" } };
    expect(bySlug(input).get("/product/retatrutide")).toBe("2026-11-05");
  });

  test("the /guides hub reads guides.index.tsx, not a route file that does not exist", () => {
    const input = base("2026-10-01");
    input.trustPages = [["/guides", "0.7", "weekly"]];
    input.dates = {
      files: { "src/routes/guides.index.tsx": "2026-10-27" },
      records: {},
    };
    expect(bySlug(input).get("/guides")).toBe("2026-10-27");
  });

  test("no provable date means no lastmod element at all", () => {
    const input = { ...base("2026-10-01"), dates: { files: {}, records: {} } };
    const xml = buildSitemap(input);
    // Guides carry their own declared `updated` date from src/data/guides.ts; every page dated by
    // git history has nothing to claim here.
    const dated = [...xml.matchAll(/<loc>([^<]+)<\/loc><lastmod>/g)].map((m) => m[1]);
    expect(dated).toEqual([`${SITE}/guides/reconstitution`]);
    expect(xml).not.toContain("<lastmod></lastmod>");
    // The URL itself is still listed, just without a date claim.
    expect(xml).toContain(`<loc>${SITE}/product/retatrutide</loc><changefreq>`);
  });

  test("a record missing from the map keeps its siblings' dates", () => {
    const input = base("2026-10-01");
    delete input.dates!.records!["product:retatrutide"];
    const entries = bySlug(input);
    expect(entries.get("/product/retatrutide")).toBe("2026-09-01");
    expect(entries.get("/product/tirzepatide")).toBe("2026-10-01");
  });

  test("well-formed XML with lastmod before changefreq and priority", () => {
    const xml = buildSitemap(base("2026-10-01"));
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml.trimEnd().endsWith("</urlset>")).toBe(true);
    expect(xml).toContain(
      `<url><loc>${SITE}/product/retatrutide</loc><lastmod>2026-10-01</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>`,
    );
    // No duplicated locs.
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(new Set(locs).size).toBe(locs.length);
  });
});

describe("tracked sitemap-lastmod.json", () => {
  const read = (p: string) => readFileSync(resolve(__dirname, "../..", p), "utf8");
  const slugs = (file: string) =>
    [...read(file).matchAll(/^ {4}slug: "([^"]+)",$/gm)].map((m) => m[1]);

  test("covers every compound, category and collection sold on the site", () => {
    const records = sitemapLastmod.records as Record<string, string>;
    const compounds = ["src/data/compounds-a.ts", "src/data/compounds-b.ts", "src/data/ukpl-additions.ts"]
      .flatMap(slugs)
      .filter((slug) => !slug.startsWith("template"));
    const missing = [
      ...compounds.map((s) => `product:${s}`),
      ...slugs("src/data/categories.ts").map((s) => `category:${s}`),
      ...slugs("src/data/shop-sections.ts").map((s) => `collection:${s}`),
    ].filter((key) => !records[key]);
    expect(compounds.length).toBeGreaterThan(40);
    expect(missing).toEqual([]);
  });

  test("holds ISO dates only, with no build timestamp to churn the diff", () => {
    expect(Object.keys(sitemapLastmod).sort()).toEqual(["files", "records"]);
    for (const v of Object.values(sitemapLastmod.files)) expect(v).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    for (const v of Object.values(sitemapLastmod.records)) expect(v).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
