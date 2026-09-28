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
};

export const coas: Coa[] = [];

export const coaFor = (compound: string, strength?: string) =>
  coas
    .filter((c) => c.compound === compound && (!strength || c.strength === strength))
    .sort((a, b) => b.tested.localeCompare(a.tested));

export const latestCoa = (compound: string, strength?: string) => coaFor(compound, strength)[0];

export const findBatch = (batch: string) =>
  coas.find((c) => c.batch.toLowerCase() === batch.trim().toLowerCase());
