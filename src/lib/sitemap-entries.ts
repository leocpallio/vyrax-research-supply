// Sitemap body builder. Free of filesystem, git and catalogue imports (catalog.ts uses
// import.meta.glob, which only resolves under Vite) so the date logic can be unit tested with
// synthetic input. The route passes the real catalogue; scripts/gen-sitemap-lastmod.mjs produces
// the date maps at prebuild time.
//
// Two kinds of date, because they answer different questions:
//   files   - a shared route template or catalogue helper. A commit there changes every page in
//             that group, so its date applies to all of them.
//   records - one catalogue record (a compound, category or collection), dated from git blame over
//             its own lines. Editing one compound moves only that compound's URLs.
//
// No date at all means no <lastmod> element. The sitemap never falls back to a blanket constant:
// a lastmod Google cannot trust is worse than none.
export type SitemapDates = {
  files?: Record<string, string>;
  records?: Record<string, string>;
};

/** One indexable product URL. `record` is the catalogue record it renders (the compound slug). */
export type ProductUrl = {
  loc: string;
  record: string;
  hub: boolean;
  image?: string | undefined;
};

export type SitemapInput = {
  dates?: SitemapDates;
  products: readonly ProductUrl[];
  categories: readonly { slug: string }[];
  collections: readonly { slug: string }[];
  guides: readonly { slug: string; updated: string }[];
  trustPages: readonly (readonly [string, string, string])[];
  siteUrl: string;
};

export type SitemapEntry = {
  loc: string;
  priority: string;
  changefreq: string;
  lastmod?: string | undefined;
  image?: string | undefined;
};

/** Source files per page group. Kept in step with SHARED_FILES in scripts/gen-sitemap-lastmod.mjs. */
export const FILES = {
  home: ["src/routes/index.tsx"],
  shop: ["src/routes/shop.tsx"],
  category: ["src/routes/category.$slug.tsx"],
  collection: ["src/routes/collections.$slug.tsx"],
  product: ["src/routes/product.$slug.tsx", "src/lib/catalog.ts"],
} as const;

const newest = (dates: SitemapDates, keys: readonly string[]): string | undefined =>
  keys.reduce<string | undefined>((acc, key) => {
    const d = dates.files?.[key] ?? dates.records?.[key];
    return d && (!acc || d > acc) ? d : acc;
  }, undefined);

/** Trust pages are one route file each; the file name matches the path, with these exceptions. */
const TRUST_ROUTE: Record<string, string> = {
  "/guides": "src/routes/guides.index.tsx",
};
const trustLastmod = (dates: SitemapDates, path: string) =>
  newest(dates, [TRUST_ROUTE[path] ?? `src/routes${path}.tsx`]);

export function sitemapEntries({
  dates = {},
  products,
  categories,
  collections,
  guides,
  trustPages,
}: SitemapInput): SitemapEntry[] {
  const urls: SitemapEntry[] = [
    { loc: "/", priority: "1.0", changefreq: "daily", lastmod: newest(dates, FILES.home) },
    { loc: "/shop", priority: "0.9", changefreq: "daily", lastmod: newest(dates, FILES.shop) },
  ];
  for (const [path, priority, changefreq] of trustPages)
    urls.push({ loc: path, priority, changefreq, lastmod: trustLastmod(dates, path) });
  for (const c of categories)
    urls.push({
      loc: `/category/${c.slug}`,
      priority: "0.8",
      changefreq: "weekly",
      lastmod: newest(dates, [...FILES.category, `category:${c.slug}`]),
    });
  // Collection pages are the listing pages the site links to from the nav, footer and product
  // pages, so they belong in the sitemap alongside the category hubs.
  for (const s of collections)
    urls.push({
      loc: `/collections/${s.slug}`,
      priority: "0.7",
      changefreq: "weekly",
      lastmod: newest(dates, [...FILES.collection, `collection:${s.slug}`]),
    });
  for (const p of products)
    urls.push({
      loc: p.loc,
      priority: p.hub ? "0.9" : "0.7",
      changefreq: "weekly",
      // A strength page lives inside its compound's record, so the record date covers both.
      lastmod: newest(dates, [...FILES.product, p.record]),
      image: p.image,
    });
  for (const g of guides)
    urls.push({
      loc: `/guides/${g.slug}`,
      priority: "0.6",
      changefreq: "monthly",
      lastmod: g.updated,
    });
  const seen = new Set<string>();
  return urls.filter((u) => (seen.has(u.loc) ? false : (seen.add(u.loc), true)));
}

export const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function buildSitemap(input: SitemapInput): string {
  const body = sitemapEntries(input)
    .map((u) => {
      const image = u.image
        ? `<image:image><image:loc>${esc(input.siteUrl + u.image)}</image:loc></image:image>`
        : "";
      const lastmod = u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : "";
      return `  <url><loc>${esc(input.siteUrl + u.loc)}</loc>${lastmod}<changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority>${image}</url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${body}\n</urlset>\n`;
}
