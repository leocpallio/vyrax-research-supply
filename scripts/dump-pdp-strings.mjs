// Dumps every PDP H1, title, meta description and FAQ as JSON, one row per compound x strength,
// for before/after copy-compliance reviews. Run: node scripts/dump-pdp-strings.mjs > out.json
import { createServer } from "vite";

const server = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "error" });
try {
  const { compounds } = await server.ssrLoadModule("/src/lib/catalog.ts");
  const schema = await server.ssrLoadModule("/src/lib/pdp-schema.ts");
  const rows = compounds.flatMap((c) =>
    c.strengths.map((s) => ({
      slug: c.slug,
      useCase: c.useCases?.[0] ?? "",
      strength: s.label,
      h1: schema.productHeading(c, s),
      title: schema.productTitle(c, s),
      description: schema.productDescription(c, s),
      faqs: schema.productFaqs(c, s).map(([q, a]) => `${q} || ${a}`),
    })),
  );
  console.log(JSON.stringify(rows, null, 1));
} finally {
  await server.close();
}
