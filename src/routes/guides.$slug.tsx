import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { StoreShell, Disclaimer, Breadcrumbs, ProductGrid, SectionTitle } from "@/components/Store";
import { guideBySlug, guides, type Block } from "@/data/guides";
import { getCompound, type Compound } from "@/lib/catalog";
import { abs, site } from "@/data/site";

export const Route = createFileRoute("/guides/$slug")({
  loader: ({ params }) => {
    const g = guideBySlug(params.slug);
    if (!g) throw notFound();
    return { slug: g.slug };
  },
  head: ({ loaderData }) => {
    const g = loaderData ? guideBySlug(loaderData.slug) : undefined;
    if (!g) return {};
    const url = abs(`/guides/${g.slug}`);
    const article = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: g.title,
      description: g.description,
      dateModified: g.updated,
      datePublished: g.updated,
      author: { "@type": "Organization", name: site.name },
      publisher: { "@type": "Organization", name: site.name },
      mainEntityOfPage: url,
    };
    const crumbs = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: abs("/") },
        { "@type": "ListItem", position: 2, name: "Guides", item: abs("/guides") },
        { "@type": "ListItem", position: 3, name: g.title, item: url },
      ],
    };
    return {
      meta: [
        { title: `${g.seoTitle} | Vyrax Labs` },
        { name: "description", content: g.description },
        { property: "og:title", content: g.seoTitle },
        { property: "og:description", content: g.description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(article) },
        { type: "application/ld+json", children: JSON.stringify(crumbs) },
      ],
    };
  },
  component: GuidePage,
});

function Render({ b }: { b: Block }) {
  switch (b.type) {
    case "h":
      return <h2>{b.text}</h2>;
    case "p":
      return <p>{b.text}</p>;
    case "note":
      return <div className="note-box my-6">{b.text}</div>;
    case "list":
      return b.ordered ? (
        <ol>
          {b.items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ol>
      ) : (
        <ul>
          {b.items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      );
    case "table":
      return (
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                {b.head.map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((r) => (
                <tr key={r.join("|")}>
                  {r.map((cell, i) => (
                    <td key={i}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

function GuidePage() {
  const { slug } = Route.useLoaderData();
  const g = guideBySlug(slug);
  if (!g) return null;
  const related = g.compounds.map(getCompound).filter((c): c is Compound => Boolean(c));
  const more = guides.filter((x) => x.slug !== g.slug).slice(0, 3);
  return (
    <StoreShell>
      <article className="container-main py-8 md:py-12">
        <div className="max-w-3xl mx-auto">
          <Breadcrumbs
            items={[
              { name: "Home", to: "/" },
              { name: "Guides", to: "/guides" },
              { name: g.title },
            ]}
          />
          <p className="eyebrow">LABORATORY GUIDE</p>
          <h1 className="page-title">{g.title}</h1>
          <p className="text-sm text-muted-foreground mt-4">
            Updated{" "}
            {new Date(g.updated).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}{" "}
            · {g.readMins} min read
          </p>
          <div className="prose-guide mt-8">
            {g.body.map((b, i) => (
              <Render key={i} b={b} />
            ))}
          </div>
          <div className="note-box mt-10">
            This guide is for laboratory research purposes. Vyrax Labs products are not for human or
            veterinary use, and nothing here is medical advice.
          </div>
        </div>
        {related.length > 0 && (
          <section className="mt-20">
            <SectionTitle title="Compounds in this guide" />
            <ProductGrid list={related} />
          </section>
        )}
        <section className="mt-16 max-w-3xl mx-auto">
          <h2 className="font-heading text-xl font-semibold mb-4">More guides</h2>
          <ul className="space-y-2">
            {more.map((m) => (
              <li key={m.slug}>
                <Link
                  to="/guides/$slug"
                  params={{ slug: m.slug }}
                  className="text-primary underline"
                >
                  {m.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </article>
      <Disclaimer />
    </StoreShell>
  );
}
