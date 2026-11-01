import { createFileRoute } from "@tanstack/react-router";
import { compounds, allProductSlugs, productPath, productImage } from "@/lib/catalog";
import { categories } from "@/data/categories";
import { guides } from "@/data/guides";
import { SITE_URL } from "@/data/site";
import { shopSections } from "@/data/shop-sections";
import { CONTENT_UPDATED, TRUST_PAGES } from "@/lib/seo";
import sitemapLastmod from "@/data/sitemap-lastmod.json";

// XML sitemap: every indexable URL with lastmod. Product hubs and per-strength pages are listed
// separately because each has its own title, H1 and canonical. Product entries carry an image
// extension so Google Images indexes the vial renders.
type Entry = {
  loc: string;
  priority: string;
  changefreq: string;
  lastmod: string;
  image?: string | undefined;
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Real lastmod: the newest commit date among the source files a page group renders.
 * scripts/gen-sitemap-lastmod.mjs writes src/data/sitemap-lastmod.json at prebuild time; anything
 * missing from that map falls back to CONTENT_UPDATED, so the sitemap never invents a date.
 * A request date is not a content change date, so nothing here is set to "today".
 */
const fileDates: Record<string, string> = sitemapLastmod.files;
const newest = (files: readonly string[]): string =>
  files.reduce((acc, f) => {
    const d = fileDates[f];
    return d && d > acc ? d : acc;
  }, CONTENT_UPDATED);

/** Source files per page group. Kept in step with scripts/gen-sitemap-lastmod.mjs FILES. */
const FILES = {
  home: ["src/routes/index.tsx"],
  shop: ["src/routes/shop.tsx"],
  category: ["src/routes/category.$slug.tsx", "src/data/categories.ts", "src/data/category-content.ts"],
  collection: ["src/routes/collections.$slug.tsx", "src/data/shop-sections.ts"],
  product: [
    "src/routes/product.$slug.tsx",
    "src/data/compounds-a.ts",
    "src/data/compounds-b.ts",
    "src/data/coa.ts",
    "src/lib/catalog.ts",
  ],
} as const;

/** Trust pages are one route file each; the file name matches the path. */
const trustLastmod = (path: string) => newest([`src/routes${path}.tsx`]);

export function sitemapEntries(): Entry[] {
  const urls: Entry[] = [
    { loc: "/", priority: "1.0", changefreq: "daily", lastmod: newest(FILES.home) },
    { loc: "/shop", priority: "0.9", changefreq: "daily", lastmod: newest(FILES.shop) },
  ];
  for (const [path, priority, changefreq] of TRUST_PAGES)
    urls.push({ loc: path, priority, changefreq, lastmod: trustLastmod(path) });
  for (const c of categories)
    urls.push({
      loc: `/category/${c.slug}`,
      priority: "0.8",
      changefreq: "weekly",
      lastmod: newest(FILES.category),
    });
  // Collection pages are the listing pages the site links to from the nav, footer and product
  // pages, so they belong in the sitemap alongside the category hubs.
  for (const s of shopSections)
    urls.push({
      loc: `/collections/${s.slug}`,
      priority: "0.7",
      changefreq: "weekly",
      lastmod: newest(FILES.collection),
    });
  const hubs = new Set(compounds.map((c) => productPath(c.slug)));
  for (const slug of allProductSlugs()) {
    const loc = `/product/${slug}`;
    const compound = compounds.find((c) => loc.startsWith(productPath(c.slug)));
    const img = compound ? productImage(compound.slug) : null;
    urls.push({
      loc,
      priority: hubs.has(loc) ? "0.9" : "0.7",
      changefreq: "weekly",
      lastmod: newest(FILES.product),
      image: img?.isRender ? img.src : undefined,
    });
  }
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

export function buildSitemap(): string {
  const body = sitemapEntries()
    .map((u) => {
      const image = u.image
        ? `<image:image><image:loc>${esc(SITE_URL + u.image)}</image:loc></image:image>`
        : "";
      return `  <url><loc>${esc(SITE_URL + u.loc)}</loc><lastmod>${u.lastmod}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority>${image}</url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${body}\n</urlset>\n`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () =>
        new Response(buildSitemap(), {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        }),
    },
  },
});
