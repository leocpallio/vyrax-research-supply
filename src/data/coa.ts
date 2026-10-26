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
  verifyUrl?: string; // lab's own public verification page
  expiry?: string; // 'YYYY-MM', only when the supplier states one; otherwise tested + SHELF_LIFE_MONTHS
};

// Shelf life for the EXP date on the vial label and the /verify page: a POLICY constant (the common
// assignment for lyophilised peptide held sealed at -20°C, the same rule UK Peptide Lab uses), not a
// measured stability result. The label generator (peptide-pro-uk labels/label-4821.mjs) reads this file,
// so the vial and /verify/<batch> always show the same date.
export const SHELF_LIFE_MONTHS = 24;

// Takedown 2026-10-08: the previous entries were built from site numbers, not lab reports.
// Add rows back only for real independent lab reports (Janoshik). Methods HPLC-UV + LC-MS confirmed by the owner (client of the test order); the report image itself prints only "Common GLP-1 peptide blind test".
export const coas: Coa[] = [
  // Janoshik task #244685, key IFY9PLTLISZE. Report printed: Retatrutide 11.27 mg, purity 99.330%.
  { compound: "retatrutide", strength: "10mg", batch: "RET-6121", purity: 99.33, measuredMg: 11.27, lab: "Janoshik", method: "HPLC-UV and LC-MS (Janoshik)", tested: "2026-10-23", file: "/coa/retatrutide-10mg-RET-6121.png", verifyUrl: "https://verify.janoshik.com/tests/244685-Retatrutide_10mg_IFY9PLTLISZE" },
  // Janoshik task #244686, key TKTNYTAA8JRH. Report printed: Retatrutide 21.51 mg, purity 99.910%.
  { compound: "retatrutide", strength: "20mg", batch: "RET-3599", purity: 99.91, measuredMg: 21.51, lab: "Janoshik", method: "HPLC-UV and LC-MS (Janoshik)", tested: "2026-10-23", file: "/coa/retatrutide-20mg-RET-3599.png", verifyUrl: "https://verify.janoshik.com/tests/244686-Retatrutide_20mg_TKTNYTAA8JRH" },
  // Janoshik task #244687, key Q7BBKBYNDAWK. Report printed: Retatrutide 32.78 mg, purity 99.684%.
  { compound: "retatrutide", strength: "30mg", batch: "RET-3610", purity: 99.684, measuredMg: 32.78, lab: "Janoshik", method: "HPLC-UV and LC-MS (Janoshik)", tested: "2026-10-23", file: "/coa/retatrutide-30mg-RET-3610.png", verifyUrl: "https://verify.janoshik.com/tests/244687-Retatrutide_30mg_Q7BBKBYNDAWK" },
  // Janoshik task #244684, key 319C2R5VVVCH. Report printed: Tesamorelin 10.54 mg, purity 97.700% (below 99: shown as measured, never as a pass).
  { compound: "tesamorelin", strength: "10mg", batch: "TES-9776", purity: 97.7, measuredMg: 10.54, lab: "Janoshik", method: "Janoshik Tesamorelin analysis", tested: "2026-10-26", file: "/coa/tesamorelin-10mg-TES-9776.png", verifyUrl: "https://verify.janoshik.com/tests/244684-Tesamorelin_10mg_319C2R5VVVCH" },
  // Janoshik task #244682, key RMC38B3KZP2V. Report printed: Melanotan 2 10.77 mg, purity 99.957%.
  { compound: "melanotan-2", strength: "10mg", batch: "MEL-9906", purity: 99.957, measuredMg: 10.77, lab: "Janoshik", method: "Janoshik Melanotan 2 analysis", tested: "2026-10-26", file: "/coa/melanotan-2-10mg-MEL-9906.png", verifyUrl: "https://verify.janoshik.com/tests/244682-Melanotan_II_10mg_RMC38B3KZP2V" },
];

// True once at least one real certificate exists. Copy that asserts testing has happened, or that
// certificates are published, is switched on this flag so the site can never claim a report it does
// not hold. Adding the first real entry flips every gated string at once.
export const testingPublished = coas.length > 0;

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
