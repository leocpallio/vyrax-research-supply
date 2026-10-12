import { coas, type Coa } from "../data/coa";

/**
 * What the product page may say about purity for one strength.
 *  - "report": a real certificate exists for this exact strength (newest by test date).
 *  - "pending": nothing on file, so no number is shown. A certificate for a different strength
 *    of the same compound is never borrowed: the vial on the page is not the vial that was tested.
 */
export type PurityStat =
  | { kind: "report"; coa: Coa; purityLabel: string; ariaLabel: string }
  | { kind: "pending"; label: string };

export const PURITY_PENDING_LABEL = "Lab report pending";

/** Format a purity figure as printed on the certificate, e.g. 99.4 -> "99.40%". */
export const purityLabel = (purity: number) => `${purity.toFixed(2)}%`;

export function purityStat(
  compound: string,
  strength: string,
  list: readonly Coa[] = coas,
): PurityStat {
  const coa = list
    .filter((c) => c.compound === compound && c.strength === strength)
    .sort((a, b) => b.tested.localeCompare(a.tested))[0];
  if (!coa || !(coa.purity > 0)) return { kind: "pending", label: PURITY_PENDING_LABEL };
  const label = purityLabel(coa.purity);
  return {
    kind: "report",
    coa,
    purityLabel: label,
    ariaLabel: `Purity ${label} by ${coa.method}. View the lab report for batch ${coa.batch}`,
  };
}

/** Link target for the certificate: the PDF when held, else the batch verification page. */
export const coaHref = (coa: Coa) => coa.file || `/verify/${coa.batch}`;

/** "2026-10-01" -> "01 Oct 2026" */
export const testedDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
