import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, SearchX } from "lucide-react";
import { pageHead } from "@/components/InfoPage";
import { StoreShell, Disclaimer, Breadcrumbs } from "@/components/Store";
import { Button } from "@/components/ui/button";
import { expiryFor, findBatch, monthLabel } from "@/data/coa";
import { getCompound, productPath } from "@/lib/catalog";
import { site } from "@/data/site";

// Reads published certificates in src/data/coa.ts. An unknown batch gets an honest "not found"
// page rather than a 404, because the batch was typed in or scanned by a customer.
export const Route = createFileRoute("/verify/$batch")({
  // params arrive decoded; batch codes are letters, digits and hyphens, so anything longer is junk
  loader: ({ params }) => ({ batch: params.batch.trim().slice(0, 40) }),
  head: ({ loaderData }) => {
    const batch = loaderData?.batch ?? "";
    const hit = findBatch(batch);
    return pageHead(
      `/verify/${encodeURIComponent(hit?.batch ?? batch)}`,
      hit ? `Batch ${hit.batch} verified | Vyrax Labs` : "Batch verification | Vyrax Labs",
      hit
        ? `Certificate of analysis for Vyrax Labs batch ${hit.batch}: laboratory, method, purity and test date.`
        : "Check a Vyrax Labs batch number against its published certificate of analysis.",
      { noindex: true },
    );
  },
  component: Verify,
});

function Verify() {
  const { batch } = Route.useLoaderData();
  const hit = findBatch(batch);
  const compound = hit ? getCompound(hit.compound) : undefined;
  const exp = hit ? expiryFor(hit) : undefined;
  const rows: [string, string][] = hit
    ? [
        ["Product", `${compound?.name ?? hit.compound} ${hit.strength}`],
        ["Batch", hit.batch],
        ["Purity", `${hit.purity}%`],
        ...(hit.method ? ([["Method", hit.method]] as [string, string][]) : []),
        ...(hit.measuredMg != null
          ? ([["Net content found", `${hit.measuredMg} mg`]] as [string, string][])
          : []),
        ...(hit.lab ? ([["Laboratory", hit.lab]] as [string, string][]) : []),
        [
          "Tested",
          new Date(`${hit.tested}T00:00:00Z`).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: "UTC",
          }),
        ],
        ...(exp ? ([["Expiry", monthLabel(exp)]] as [string, string][]) : []),
      ]
    : [];
  return (
    <StoreShell>
      <div className="container-main py-8 md:py-12 min-h-[60vh]">
        <Breadcrumbs
          items={[
            { name: "Home", to: "/" },
            { name: "Lab reports", to: "/lab-reports" },
            { name: "Verify batch" },
          ]}
        />
        <p className="eyebrow">BATCH VERIFICATION</p>
        {hit ? (
          <>
            <h1 className="page-title flex items-center gap-3">
              <BadgeCheck className="text-verify shrink-0" size={36} />
              {/* one flex item; the code itself never splits across lines (it did at the hyphen on phones) */}
              <span>
                Batch <span className="whitespace-nowrap">{hit.batch}</span> verified
              </span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mt-4">
              This batch number matches a certificate in the published register. Compare the
              laboratory, method and document itself before relying on the reported result.
            </p>
            <div className="mt-8 max-w-xl border border-verify/50 bg-verify/5 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-border">
                  {rows.map(([k, v]) => (
                    <tr key={k}>
                      <th scope="row" className="p-4 text-left font-semibold w-44">
                        {k}
                      </th>
                      <td className={k === "Batch" || k === "Purity" ? "p-4 font-mono" : "p-4"}>
                        {v}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {hit.file && (
                <Button asChild className="rounded-full">
                  <a href={hit.file} target="_blank" rel="noreferrer">
                    Open certificate (PDF)
                  </a>
                </Button>
              )}
              <Button asChild variant="outline" className="rounded-full">
                <a href={productPath(hit.compound, hit.strength)}>View product</a>
              </Button>
            </div>
          </>
        ) : (
          <>
            <h1 className="page-title flex items-center gap-3">
              <SearchX className="text-muted-foreground shrink-0" size={36} />
              No certificate found
            </h1>
            <p className="text-muted-foreground max-w-2xl mt-4">
              {site.email ? (
                <>
                  We couldn't find a published certificate for batch{" "}
                  <span className="font-mono text-foreground break-all">{batch || "(blank)"}</span>.
                  Check the number printed on the vial label, or{" "}
                  <Link to="/contact" className="text-primary underline">
                    contact us
                  </Link>{" "}
                  to ask what documentation is available.
                </>
              ) : (
                <>
                  No published certificate matches batch{" "}
                  <span className="font-mono text-foreground break-all">{batch || "(blank)"}</span>.
                  No certificates are published yet, so no batch number can resolve. The Lab Reports
                  page lists published documents only; it does not track unpublished testing. A code
                  printed on a product render or vial is not proof of a tested batch.
                </>
              )}
            </p>
            <p className="mt-6">
              <Link to="/lab-reports" className="text-primary underline">
                See all published lab reports
              </Link>
            </p>
          </>
        )}
      </div>
      <Disclaimer />
    </StoreShell>
  );
}
