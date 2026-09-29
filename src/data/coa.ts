// Certificates of Analysis. ONLY add entries for real, independent lab reports you hold.
// Put the PDF in /public/coa/<file>.pdf and add a row here. Product pages, the Lab Reports hub, batch
// verification and page titles all read from this list: a compound only shows ">99% HPLC Tested" in its
// title once it has a certificate here with purity >= 99.
export type Coa = {
  compound: string; // compound slug, e.g. 'bpc-157'
  strength: string; // label as sold, e.g. '5mg'
  batch: string; // batch number printed on the vial
  purity: number; // HPLC purity %, e.g. 99.42
  measuredMg?: number; // net content found by the lab, if reported
  lab: string; // testing laboratory
  method: string; // e.g. 'HPLC + LC-MS'
  tested: string; // ISO date, e.g. '2026-10-01'
  file: string; // e.g. '/coa/bpc-157-5mg-VX0001.pdf'
  expiry?: string; // 'YYYY-MM', only when the supplier states one; otherwise tested + SHELF_LIFE_MONTHS
};

// Shelf life for the EXP date on the vial label and the /verify page: a POLICY constant (the common
// assignment for lyophilised peptide held sealed at -20°C, the same rule UK Peptide Lab uses), not a
// measured stability result. The label generator (peptide-pro-uk labels/label-4821.mjs) reads this file,
// so the vial and /verify/<batch> always show the same date.
export const SHELF_LIFE_MONTHS = 24;

export const coas: Coa[] = [];

export const coaFor = (compound: string, strength?: string) =>
  coas
    .filter((c) => c.compound === compound && (!strength || c.strength === strength))
    .sort((a, b) => b.tested.localeCompare(a.tested));

export const latestCoa = (compound: string, strength?: string) => coaFor(compound, strength)[0];

export const findBatch = (batch: string) =>
  coas.find((c) => c.batch.toLowerCase() === batch.trim().toLowerCase());

/** Expiry as 'YYYY-MM': the certificate's own date if it states one, else tested + SHELF_LIFE_MONTHS.
 * Undefined when neither is usable: the label then refuses to print rather than invent a date. */
export const expiryFor = (c: Coa): string | undefined => {
  if (c.expiry) return /^\d{4}-(0[1-9]|1[0-2])$/.test(c.expiry) ? c.expiry : undefined;
  const m = /^(\d{4})-(\d{2})-\d{2}$/.exec(c.tested);
  if (!m) return undefined;
  const total = Number(m[1]) * 12 + (Number(m[2]) - 1) + SHELF_LIFE_MONTHS;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
};

/** "2028-10" -> "October 2028" */
export const monthLabel = (ym: string) =>
  new Date(`${ym}-01T00:00:00Z`).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
