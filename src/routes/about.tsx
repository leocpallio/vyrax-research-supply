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
      "About Vyrax Labs | UK Research Peptide Supplier",
      "Learn about Vyrax Labs research products, published documentation and enquiry-only ordering.",
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
    [Truck, "Enquiry first", "No payment, confirmed order or dispatch is created by an enquiry."],
    [
      ShieldCheck,
      "Research only",
      "Supplied strictly for laboratory research, never for human use.",
    ],
  ];
  return (
    <StoreShell>
      <div className="container-main py-8 md:py-12">
        <Breadcrumbs items={[{ name: "Home", to: "/" }, { name: "About us" }]} />
        <p className="eyebrow">ABOUT VYRAX LABS</p>
        <h1 className="page-title max-w-3xl">Research compounds for laboratory use.</h1>
        <div className="grid md:grid-cols-2 gap-12 mt-10 items-center">
          <div className="text-muted-foreground leading-relaxed space-y-4">
            <p>
              Vyrax Labs lists research peptides for laboratory, analytical and educational
              research. The catalogue is open for browsing, but enquiry intake and paid orders are
              not currently available.
            </p>
            <p>
              Product pages show available specifications and indicative prices. Those details are
              not a certificate of analysis. Check the{" "}
              <Link to="/lab-reports" className="text-primary underline">
                lab reports register
              </Link>{" "}
              for published batch documents; none are listed until an actual report is available.
            </p>
            <p>
              Browse {count} listed research compounds and the accompanying catalogue supplies.
              Availability and final terms require separate confirmation before an order can
              proceed.
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
          <p>
            Trading name: {site.name}. Legal entity: {site.legalName ?? "not yet published"}.
          </p>
          <p>
            Company number: {site.companyNumber ?? "not yet published"}. Registered office:{" "}
            {site.registeredOffice ?? "not yet published"}.
          </p>
          <p>
            Support contact: {site.email ?? "inbox not live yet"}. Do not send parcels to an
            unconfirmed address.
          </p>
          <p>
            <Link to="/terms" className="text-primary underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link to="/contact" className="text-primary underline">
              contact options
            </Link>{" "}
            show the current position.
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
