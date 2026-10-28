import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Calculator, ArrowRight } from "lucide-react";
import { StoreShell, Disclaimer, Breadcrumbs } from "@/components/Store";
import { guides } from "@/data/guides";
import { breadcrumbListJsonLd, buildHead, collectionPageJsonLd } from "@/lib/seo";

export const Route = createFileRoute("/guides/")({
  head: () =>
    buildHead({
      title: "Peptide Guides UK | Vyrax Labs",
      description:
        "Guides to peptides: how to reconstitute a lyophilised vial, storage temperatures, reading a certificate of analysis and compound comparisons.",
      path: "/guides",
      jsonLd: [
        breadcrumbListJsonLd([
          { name: "Home", path: "/" },
          { name: "Guides", path: "/guides" },
        ]),
        collectionPageJsonLd({
          name: "Guides",
          description: "Practical guides to peptides from Vyrax Labs.",
          path: "/guides",
          items: guides.map((g) => ({ name: g.title, path: `/guides/${g.slug}` })),
        }),
      ],
    }),
  component: Guides,
});

function Guides() {
  return (
    <StoreShell>
      <div className="container-main py-8 md:py-12">
        <Breadcrumbs items={[{ name: "Home", to: "/" }, { name: "Guides" }]} />
        <p className="eyebrow">GUIDES</p>
        <h1 className="page-title">Guides</h1>
        <p className="text-muted-foreground mt-4 max-w-2xl">
          Practical notes on handling peptides. No dosing: we do not provide dosing or
          administration guidance.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
          {[...guides]
            .sort((a, b) => b.updated.localeCompare(a.updated))
            .map((g) => (
              <Link
                key={g.slug}
                to="/guides/$slug"
                params={{ slug: g.slug }}
                className="category-tile flex flex-col"
              >
                <BookOpen className="text-primary mb-4" size={22} />
                <h2 className="font-heading text-xl font-semibold leading-snug">{g.title}</h2>
                <p className="text-sm text-muted-foreground mt-2 flex-1">{g.description}</p>
                <p className="text-xs text-muted-foreground mt-4">{g.readMins} min read</p>
              </Link>
            ))}
          <Link to="/calculator" className="category-tile flex flex-col bg-tint">
            <Calculator className="text-primary mb-4" size={22} />
            <h2 className="font-heading text-xl font-semibold leading-snug">
              Reconstitution calculator
            </h2>
            <p className="text-sm text-muted-foreground mt-2 flex-1">
              Work out stock concentration, molarity and C1V1 = C2V2 working dilutions for any vial.
            </p>
            <p className="text-sm text-primary font-semibold mt-4">
              Open calculator <ArrowRight className="inline" size={14} />
            </p>
          </Link>
        </div>
      </div>
      <Disclaimer />
    </StoreShell>
  );
}
