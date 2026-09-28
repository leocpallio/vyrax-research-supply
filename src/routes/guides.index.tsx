import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Calculator, ArrowRight } from "lucide-react";
import { StoreShell, Disclaimer, Breadcrumbs } from "@/components/Store";
import { guides } from "@/data/guides";
import { abs } from "@/data/site";

export const Route = createFileRoute("/guides/")({
  head: () => {
    const title = "Peptide Research Guides UK | Reconstitution & CoAs | Vyrax Labs";
    const desc =
      "Laboratory guides for research peptides: how to reconstitute lyophilised peptides, storage temperatures, reading a certificate of analysis and compound comparisons.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { property: "og:url", content: abs("/guides") },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: abs("/guides") }],
    };
  },
  component: Guides,
});

function Guides() {
  return (
    <StoreShell>
      <div className="container-main py-8 md:py-12">
        <Breadcrumbs items={[{ name: "Home", to: "/" }, { name: "Guides" }]} />
        <p className="eyebrow">LABORATORY NOTES</p>
        <h1 className="page-title">Research guides</h1>
        <p className="text-muted-foreground mt-4 max-w-2xl">
          Practical laboratory notes on handling research peptides. Research register only: we do
          not provide dosing or administration guidance.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
          {guides.map((g) => (
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
