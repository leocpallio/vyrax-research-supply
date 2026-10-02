import { createFileRoute, Link } from "@tanstack/react-router";
import { StoreShell, Disclaimer, Breadcrumbs } from "@/components/Store";
import { faqGroups, allFaqs, faqJsonLd } from "@/data/faq";
import { abs, site } from "@/data/site";

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
const nextSteps = [
  [
    { to: "/terms", label: "Enquiry terms" },
    { to: "/research-use-policy", label: "Research use policy" },
    { to: "/basket", label: "Review basket" },
  ],
  [
    { to: "/shipping", label: "Delivery information" },
    { to: "/returns", label: "Returns and problems" },
  ],
  [
    { to: "/lab-reports", label: "Published lab reports" },
    { to: "/shop", label: "Product specifications" },
  ],
  [
    { to: "/shop", label: "Product information" },
    { to: "/lab-reports", label: "Published documentation" },
  ],
  [
    { to: "/returns", label: "Returns policy" },
    { to: "/about", label: "Trading details" },
    { to: "/contact", label: "Contact availability" },
  ],
] as const;

function FaqPage() {
  return (
    <StoreShell>
      <div className="container-main py-8 md:py-12 min-h-[60vh]">
        <Breadcrumbs items={[{ name: "Home", to: "/" }, { name: "FAQ" }]} />
        <p className="eyebrow">HELP CENTRE</p>
        <h1 className="page-title">Frequently asked questions</h1>
        <p className="text-muted-foreground mt-4 max-w-3xl">
          The site records enquiries only. No payment, confirmed order, automated email or dispatch
          follows a submission. Browse the answers and linked policies below before sharing details.
        </p>
        <div className="flex flex-wrap gap-2 mt-8">
          {faqGroups.map((g) => (
            <a key={g.title} href={`#${anchor(g.title)}`} className="chip">
              {g.title}
            </a>
          ))}
        </div>
        <div className="max-w-4xl mt-12 space-y-14">
          {faqGroups.map((g, groupIndex) => (
            <section key={g.title} id={anchor(g.title)} className="scroll-mt-28">
              <h2 className="font-heading text-2xl font-semibold mb-4">{g.title}</h2>
              <div className="divide-y divide-border border-t border-b border-border">
                {g.items.map(([question, answer]) => (
                  <details key={question} id={anchor(question)} className="group py-5 scroll-mt-28">
                    <summary className="font-heading font-semibold cursor-pointer list-none flex justify-between gap-4">
                      {question}
                      <span className="text-primary group-open:rotate-45 transition-transform">
                        +
                      </span>
                    </summary>
                    <p className="text-muted-foreground leading-relaxed mt-3 max-w-3xl">{answer}</p>
                    <a
                      href={`#${anchor(question)}`}
                      className="text-xs text-primary underline mt-2 inline-block"
                    >
                      Link to this answer
                    </a>
                  </details>
                ))}
              </div>
              <div className="flex flex-wrap gap-3 mt-5 text-sm">
                {nextSteps[groupIndex]?.map(({ to, label }) => (
                  <Link key={to} to={to} className="text-primary underline">
                    {label}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
        <div className="mt-14 border border-border rounded-2xl p-6">
          <h2 className="font-heading font-semibold text-lg">Need another answer?</h2>
          <p className="mt-2 text-muted-foreground">
            {site.email
              ? "Check the contact page for the available email channel; no reply time is guaranteed."
              : "The support inbox is not live yet, so no direct reply is available. Use the linked policies and reports, or browse the product information without submitting payment."}
          </p>
          <div className="flex flex-wrap gap-4 mt-3">
            <Link to="/contact" className="text-primary underline">
              Contact status
            </Link>
            <Link to="/shop" className="text-primary underline">
              Browse products
            </Link>
          </div>
        </div>
      </div>
      <Disclaimer />
    </StoreShell>
  );
}
