import { createFileRoute, Link } from "@tanstack/react-router";
import { FileCheck2, FlaskConical, Truck, ShieldCheck } from "lucide-react";
import { StoreShell, Disclaimer, Breadcrumbs } from "@/components/Store";
import { pageHead } from "@/components/InfoPage";
import { compounds } from "@/lib/catalog";
import lab from "@/assets/vyrax-lab.jpg";

export const Route = createFileRoute("/about")({
  head: () =>
    pageHead(
      "/about",
      "About Vyrax Labs | UK Research Peptide Supplier",
      "Vyrax Labs supplies independently tested research peptides from the UK. Batch certificates, clear specifications and fast tracked dispatch for laboratory research.",
    ),
  component: About,
});

function About() {
  const count = compounds.filter((c) => c.kind !== "supply").length;
  return (
    <StoreShell>
      <div className="container-main py-8 md:py-12">
        <Breadcrumbs items={[{ name: "Home", to: "/" }, { name: "About us" }]} />
        <p className="eyebrow">ABOUT VYRAX LABS</p>
        <h1 className="page-title max-w-3xl">Research peptides, documented properly.</h1>
        <div className="grid md:grid-cols-2 gap-12 mt-10 items-center">
          <div className="text-muted-foreground leading-relaxed space-y-4">
            <p>
              Vyrax Labs is a UK supplier of research peptides for laboratory, analytical and
              educational research. We started with a simple view: a researcher should be able to
              see exactly what they are buying before they buy it.
            </p>
            <p>
              That means every compound page carries its CAS number, molecular formula, molecular
              weight and peer-reviewed references, every batch is independently tested for purity
              and identity, and the certificate for that batch is public. It also means clear
              pricing with cost per mg shown, so vial sizes are easy to compare.
            </p>
            <p>
              Our catalogue covers {count} research compounds across metabolic, regenerative, growth
              hormone secretagogue, longevity and pigmentation research, plus the supplies needed to
              prepare them.
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
          {(
            [
              [
                FileCheck2,
                "Public certificates",
                "Batch certificates of analysis are published in our lab reports hub.",
              ],
              [
                FlaskConical,
                "Independent testing",
                "HPLC purity and mass spectrometry identity by third-party laboratories.",
              ],
              [
                Truck,
                "Fast UK dispatch",
                "Same-day dispatch on working days before 2pm, tracked delivery.",
              ],
              [
                ShieldCheck,
                "Research only",
                "Supplied strictly for laboratory research, never for human use.",
              ],
            ] as const
          ).map(([I, t, b]) => (
            <div key={t} className="border border-border rounded-2xl p-6">
              <I className="text-primary mb-4" size={24} />
              <h2 className="font-heading font-semibold">{t}</h2>
              <p className="text-sm text-muted-foreground mt-2">{b}</p>
            </div>
          ))}
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
