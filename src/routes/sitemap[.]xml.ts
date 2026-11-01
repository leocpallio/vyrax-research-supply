import { createFileRoute } from "@tanstack/react-router";
import { compounds, productImage, variantSlug } from "@/lib/catalog";
import { categories } from "@/data/categories";
import { guides } from "@/data/guides";
import { SITE_URL } from "@/data/site";
import { shopSections } from "@/data/shop-sections";
import { TRUST_PAGES } from "@/lib/seo";
import sitemapLastmod from "@/data/sitemap-lastmod.json";
import { buildSitemap, type ProductUrl } from "@/lib/sitemap-entries";

// XML sitemap: every indexable URL with lastmod. Product hubs and per-strength pages are listed
// separately because each has its own title, H1 and canonical. Product entries carry an image
// extension so Google Images indexes the vial renders.
//
// lastmod comes from src/data/sitemap-lastmod.json, written by scripts/gen-sitemap-lastmod.mjs at
// prebuild time from git history: shared templates per page group, one date per catalogue record.
// A URL with no provable date is emitted without <lastmod> rather than with a blanket constant.
// The body builder lives in src/lib/sitemap-entries.ts so the date logic is unit tested.
const products: ProductUrl[] = compounds.flatMap((c) => {
  const img = productImage(c.slug);
  return c.strengths.map((s) => {
    const slug = variantSlug(c, s);
    return {
      loc: `/product/${slug}`,
      record: `product:${c.slug}`,
      hub: slug === c.slug,
      image: img?.isRender ? img.src : undefined,
    };
  });
});

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () =>
        new Response(
          buildSitemap({
            dates: sitemapLastmod,
            products,
            categories,
            collections: shopSections,
            guides,
            trustPages: TRUST_PAGES,
            siteUrl: SITE_URL,
          }),
          {
            headers: {
              "Content-Type": "application/xml; charset=utf-8",
              "Cache-Control": "public, max-age=3600",
            },
          },
        ),
    },
  },
});
