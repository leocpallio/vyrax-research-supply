import { createFileRoute } from "@tanstack/react-router";
import { compounds, allProductSlugs, productPath } from "@/lib/catalog";
import { categories } from "@/data/categories";
import { guides } from "@/data/guides";
import { SITE_URL } from "@/data/site";

// XML sitemap: every indexable URL. Product hubs and per-strength pages are listed separately
// because each has its own title, H1 and canonical.
const STATIC = [
  ["/", "1.0", "daily"],
  ["/shop", "0.9", "daily"],
  ["/lab-reports", "0.8", "weekly"],
  ["/calculator", "0.7", "monthly"],
  ["/guides", "0.7", "weekly"],
  ["/faq", "0.6", "monthly"],
  ["/about", "0.5", "monthly"],
  ["/contact", "0.5", "monthly"],
  ["/shipping", "0.5", "monthly"],
  ["/returns", "0.4", "monthly"],
  ["/research-use-policy", "0.4", "yearly"],
  ["/terms", "0.3", "yearly"],
  ["/privacy", "0.3", "yearly"],
  ["/cookies", "0.2", "yearly"],
] as const;

function build() {
  const today = new Date().toISOString().slice(0, 10);
  const urls: { loc: string; priority: string; changefreq: string; lastmod: string }[] = [];
  for (const [path, priority, changefreq] of STATIC)
    urls.push({ loc: path, priority, changefreq, lastmod: today });
  for (const c of categories)
    urls.push({
      loc: `/category/${c.slug}`,
      priority: "0.8",
      changefreq: "weekly",
      lastmod: today,
    });
  const hubs = new Set(compounds.map((c) => productPath(c.slug)));
  for (const slug of allProductSlugs()) {
    const loc = `/product/${slug}`;
    urls.push({
      loc,
      priority: hubs.has(loc) ? "0.9" : "0.7",
      changefreq: "weekly",
      lastmod: today,
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
  const body = urls
    .filter((u) => (seen.has(u.loc) ? false : (seen.add(u.loc), true)))
    .map(
      (u) =>
        `  <url><loc>${SITE_URL}${u.loc === "/" ? "/" : u.loc}</loc><lastmod>${u.lastmod}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () =>
        new Response(build(), {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        }),
    },
  },
});
