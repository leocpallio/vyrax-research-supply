import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { StoreShell, Disclaimer, Breadcrumbs, ProductGrid, SectionTitle } from "@/components/Store";
import { guideBySlug, guides, type Block } from "@/data/guides";
import { getCompound, productPath, type Compound } from "@/lib/catalog";
import { ORG_ID, breadcrumbListJsonLd, buildHead, titles, withRuoTail } from "@/lib/seo";
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
    const path = `/guides/${g.slug}`;
    const article = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: g.title,
      description: g.description,
      dateModified: g.updated,
      datePublished: g.published ?? g.updated,
      inLanguage: "en-GB",
      author: { "@id": ORG_ID },
      publisher: { "@id": ORG_ID },
      mainEntityOfPage: abs(path),
      about: g.compounds
        .map(getCompound)
        .filter((c): c is Compound => Boolean(c))
        .map((c) => ({ "@type": "Thing", name: c.name, url: abs(productPath(c.slug)) })),
    };
    return buildHead({
      title: titles.guide(g.seoTitle),
      description: withRuoTail(g.description),
      path,
      type: "article",
      jsonLd: [
        breadcrumbListJsonLd([
          { name: "Home", path: "/" },
          { name: "Guides", path: "/guides" },
          { name: g.title, path },
        ]),
        article,
      ],
    });
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

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

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
          <p className="text-sm text-muted-foreground mt-4 tabular-nums" data-testid="guide-dates">
            Published {fmt(g.published ?? g.updated)}
            {(g.published ?? g.updated) !== g.updated ? (
              <> · Updated {fmt(g.updated)}</>
            ) : null} · {g.readMins} min read ·{" "}
            <a
              href={`/guides-md/${g.slug}`}
              className="underline underline-offset-4 hover:text-foreground"
              data-testid="guide-markdown-link"
            >
              View as Markdown
            </a>
          </p>
          {g.changed && (
            <p className="mt-3 text-sm border-l-2 border-border pl-3" data-testid="guide-changed">
              <span className="font-semibold">What changed:</span> {g.changed}
            </p>
          )}
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
