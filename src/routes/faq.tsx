import { createFileRoute, Link } from "@tanstack/react-router";
import { StoreShell, Disclaimer, FAQ, Breadcrumbs } from "@/components/Store";
import { faqGroups, allFaqs, faqJsonLd } from "@/data/faq";
import { abs } from "@/data/site";

export const Route = createFileRoute("/faq")({
  head: () => {
    const title = "Research Peptide FAQs UK | Ordering, Testing, Delivery | Vyrax Labs";
    const desc =
      "Answers to common questions about buying research peptides in the UK: legality, purity testing, certificates, storage, delivery times, payment and returns.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { property: "og:url", content: abs("/faq") },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: abs("/faq") }],
      scripts: [{ type: "application/ld+json", children: JSON.stringify(faqJsonLd(allFaqs)) }],
    };
  },
  component: FaqPage,
});

const anchor = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-");

function FaqPage() {
  return (
    <StoreShell>
      <div className="container-main py-8 md:py-12 min-h-[60vh]">
        <Breadcrumbs items={[{ name: "Home", to: "/" }, { name: "FAQ" }]} />
        <p className="eyebrow">HELP CENTRE</p>
        <h1 className="page-title">Frequently asked questions</h1>
        <div className="flex flex-wrap gap-2 mt-8">
          {faqGroups.map((g) => (
            <a key={g.title} href={`#${anchor(g.title)}`} className="chip">
              {g.title}
            </a>
          ))}
        </div>
        <div className="max-w-4xl mt-12 space-y-14">
          {faqGroups.map((g) => (
            <section key={g.title} id={anchor(g.title)} className="scroll-mt-28">
              <h2 className="font-heading text-2xl font-semibold mb-4">{g.title}</h2>
              <FAQ items={g.items} />
            </section>
          ))}
        </div>
        <p className="mt-14 text-muted-foreground">
          Still have a question?{" "}
          <Link to="/contact" className="text-primary underline">
            Contact us
          </Link>
          .
        </p>
      </div>
      <Disclaimer />
    </StoreShell>
  );
}
