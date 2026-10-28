import { createFileRoute, Link } from "@tanstack/react-router";
import { FileCheck2, FlaskConical, Truck, ShieldCheck, type LucideIcon } from "lucide-react";
import { StoreShell, Disclaimer, Breadcrumbs } from "@/components/Store";
import { pageHead } from "@/components/InfoPage";
import { compounds } from "@/lib/catalog";
import { coas } from "@/data/coa";
import { site } from "@/data/site";
import lab from "@/assets/vyrax-lab.jpg";

export const Route = createFileRoute("/about")({
  head: () =>
    pageHead(
      "/about",
      "About Vyrax Labs | UK Peptide Supplier",
      "Who Vyrax Labs is, how we supply peptides from the UK with same-day dispatch, and where to find published lab reports.",
      { crumb: "About" },
    ),
  component: About,
});

function About() {
  const count = compounds.filter((c) => c.kind !== "supply").length;
  const tiles: [LucideIcon, string, string][] = [
    [
      FileCheck2,
      "Published reports",
      coas.length
        ? `${coas.length} certificate entries in the lab reports register.`
        : "No certificates published yet. Check the live register before relying on a batch claim.",
    ],
    [
      FlaskConical,
      "Specifications",
      "Review each product page for available compound information; a specification is not a batch test result.",
    ],
    [
      Truck,
      "UK delivery",
      `${site.carrier}, free over £${site.freeDeliveryThreshold}. See the delivery page for details.`,
    ],
    [
      ShieldCheck,
      "Batch documentation",
      "A certificate for every batch, published and searchable by batch number.",
    ],
  ];
  return (
    <StoreShell>
      <div className="container-main py-8 md:py-12">
        <Breadcrumbs items={[{ name: "Home", to: "/" }, { name: "About us" }]} />
        <p className="eyebrow">ABOUT VYRAX LABS</p>
        <h1 className="page-title max-w-3xl">Peptides, documented by batch.</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Check the specification and the certificate for a batch before you buy. Browsing or saving
          a basket does not reserve stock.
        </p>
        <div className="flex flex-wrap gap-4 mt-6 text-sm font-semibold">
          <Link
            to="/shop"
            className="inline-flex min-h-11 items-center text-primary underline underline-offset-2"
          >
            Browse the catalogue
          </Link>
          <Link
            to="/lab-reports"
            className="inline-flex min-h-11 items-center text-primary underline underline-offset-2"
          >
            Check report status
          </Link>
        </div>
        <div className="grid md:grid-cols-2 gap-12 mt-10 items-center">
          <div className="text-muted-foreground leading-relaxed space-y-4">
            <p>
              Vyrax Labs supplies peptides and lab supplies with UK delivery, for people who want
              the specification and the certificate before they buy.
            </p>
            <p>
              Product pages show the listed specification. A specification is not a certificate of
              analysis. Certificates are published in the{" "}
              <Link to="/lab-reports" className="text-primary underline">
                lab reports register
              </Link>
              , and each one applies only to the batch it names.
            </p>
            <p>
              Browse {count} compounds and the supplies that go with them. Everything we sell is a
              research compound: sold for research use only, not a licensed medicine, and not sold
              with a dose on the label.
            </p>
          </div>
          <img
            src={lab}
            alt="Analytical laboratory bench"
            loading="lazy"
            width={1200}
            height={800}
            className="w-full rounded-2xl"
          />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-16">
          {tiles.map(([I, t, b]) => (
            <div key={t} className="border border-border rounded-2xl p-6">
              <I className="text-primary mb-4" size={24} />
              <h2 className="font-heading font-semibold">{t}</h2>
              <p className="text-sm text-muted-foreground mt-2">{b}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 border border-border rounded-2xl p-6 space-y-3 text-sm text-muted-foreground">
          <h2 className="font-heading font-semibold text-foreground text-lg">Trading details</h2>
          <p>Trading name: {site.name}.</p>
          <p>
            Email:{" "}
            <a href={`mailto:${site.email}`} className="text-primary underline">
              {site.email}
            </a>
            .
          </p>
          <p>
            <Link to="/terms" className="text-primary underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link to="/contact" className="text-primary underline">
              contact page
            </Link>{" "}
            have the details.
          </p>
        </div>
        <p className="mt-12">
          <Link to="/research-use-policy" className="text-primary underline">
            Read our research use policy
          </Link>
        </p>
      </div>
      <Disclaimer />
    </StoreShell>
  );
}
