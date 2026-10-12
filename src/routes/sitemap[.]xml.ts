import { createFileRoute } from "@tanstack/react-router";
import { compounds, allProductSlugs, productPath, productImage } from "@/lib/catalog";
import { categories } from "@/data/categories";
import { guides } from "@/data/guides";
import { SITE_URL } from "@/data/site";
import { shopSections } from "@/data/shop-sections";
import { CONTENT_UPDATED, TRUST_PAGES } from "@/lib/seo";

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

export function sitemapEntries(): Entry[] {
  const urls: Entry[] = [
    { loc: "/", priority: "1.0", changefreq: "daily", lastmod: CONTENT_UPDATED },
    { loc: "/shop", priority: "0.9", changefreq: "daily", lastmod: CONTENT_UPDATED },
  ];
  for (const [path, priority, changefreq] of TRUST_PAGES)
    urls.push({ loc: path, priority, changefreq, lastmod: CONTENT_UPDATED });
  for (const c of categories)
    urls.push({
      loc: `/category/${c.slug}`,
      priority: "0.8",
      changefreq: "weekly",
      lastmod: CONTENT_UPDATED,
    });
  // Collection pages are the listing pages the site links to from the nav, footer and product
  // pages, so they belong in the sitemap alongside the category hubs.
  for (const s of shopSections)
    urls.push({
      loc: `/collections/${s.slug}`,
      priority: "0.7",
      changefreq: "weekly",
      lastmod: CONTENT_UPDATED,
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
      lastmod: CONTENT_UPDATED,
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
