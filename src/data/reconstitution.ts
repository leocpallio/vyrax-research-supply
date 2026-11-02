import { metabolicAndRegenerative } from "./compounds-a";
import { secretagoguesToSupplies } from "./compounds-b";
import { ukplAdditions } from "./ukpl-additions";
import { chem } from "./research";
import { STABILITY } from "./stability";
import type { Compound, Strength } from "./types";

/**
 * Laboratory dilution reference: one record per catalogue item.
 *
 * SCOPE. This module describes dilution of a lyophilised vial for laboratory work: solvent,
 * resulting concentration (mg/ml), aliquoting, storage and handling. It deliberately contains no
 * dose, no per-use amount and no administration route. "Suggested volumes" are arithmetic options
 * chosen so the stock lands in a useful concentration band, not a protocol.
 *
 * SOURCING RULE. Every claim in the rendered page comes from one of four places:
 *   1. the catalogue specification for the item (form and appearance, held in data/compounds-*.ts),
 *   2. a peer-reviewed paper, cited in the record's own `sources` list,
 *   3. unverified supplier guidance, which is always labelled as unverified rather than presented
 *      as a finding, and
 *   4. the lab's own general handling guidance in the reconstitution guide.
 * Where no aqueous stability study for a compound has been published, `stability` is
 * `{ status: "none" }` and the page prints no shelf-life figure rather than a guess. Where
 * a relevant study exists but studied a different molecule, a non-aqueous matrix, or the same
 * molecule without yielding a shelf-life figure, it is carried as
 * a labelled note so it cannot be read as a shelf life for this item.
 */

// ------------------------------------------------------------------ general sources
export const SOURCES = {
  manning:
    "Manning MC, Chou DK, Murphy BM, Payne RW, Katayama DS. Stability of protein pharmaceuticals: an update. Pharmaceutical Research, 2010. PMID 20143256",
  wang: "Wang W. Instability, stabilization, and formulation of liquid protein pharmaceuticals. International Journal of Pharmaceutics, 1999. PMID 10460913",
  meyer:
    "Meyer BK, Ni A, Hu B, Shi L. Antimicrobial preservative use in parenteral products: past and present. Journal of Pharmaceutical Sciences, 2007. PMID 17722087",
} as const;

// ------------------------------------------------------------------ solvents
export type SolventId = "bacteriostatic-water" | "sterile-water" | "acetic-acid-0.1m" | "dmso";

export type Solvent = {
  id: SolventId;
  name: string;
  short: string;
  composition: string;
  /** Why this solvent is used at all. */
  reason: string;
  /** Where it must not be used. */
  caveat: string;
};

export const solvents: Record<SolventId, Solvent> = {
  "bacteriostatic-water": {
    id: "bacteriostatic-water",
    name: "Bacteriostatic water",
    short: "Bacteriostatic water",
    composition: "Sterile water with 0.9% benzyl alcohol",
    reason:
      "The default solvent for a lyophilised vial that will be opened more than once. Benzyl alcohol at 0.9% is bacteriostatic, which limits microbial growth in a multi-access vial (Meyer 2007). It does not stabilise the peptide chemically.",
    caveat:
      "Benzyl alcohol absorbs in the ultraviolet around 257 nm, so it is the wrong solvent for any spectrophotometric measurement at or near 260 nm, and it is not used where a preservative would interfere with an assay.",
  },
  "sterile-water": {
    id: "sterile-water",
    name: "Sterile water, no preservative",
    short: "Sterile water",
    composition: "Water for laboratory use, sterile, without a preservative",
    reason:
      "Used where a preservative would interfere with the measurement or the chemistry, and where the preparation is a single-use stock rather than a multi-access vial. Plain water supports microbial growth, so a sterile-water stock is prepared fresh and either used the same day or aliquoted and frozen.",
    caveat:
      "No antimicrobial protection at all. One access, one aliquot, and no return to the vial days later.",
  },
  "acetic-acid-0.1m": {
    id: "acetic-acid-0.1m",
    name: "Dilute acetic acid, 0.1 M",
    short: "0.1 M acetic acid",
    composition: "0.1 mol/l acetic acid in sterile water, filtered",
    reason:
      "Some peptides are poorly soluble at neutral pH and are handled as an acidic stock; the stock is then diluted into the assay buffer on the day (Wang 1999).",
    caveat:
      "Acidic stocks are not neutralised before storage. Prepare 0.1 M acetic acid by dilution of glacial acetic acid in sterile water, filter it, and record the preparation date on the label.",
  },
  dmso: {
    id: "dmso",
    name: "Dimethyl sulfoxide, anhydrous",
    short: "DMSO",
    composition: "Anhydrous dimethyl sulfoxide, 99.9% or better",
    reason:
      "Used only where the material will not reach a workable concentration in water. The powder is pre-dissolved in the minimum volume of DMSO and an aliquot of that concentrate is diluted into aqueous buffer. No aqueous stock is claimed, and none of the water-only arithmetic applies.",
    caveat:
      "DMSO is not interchangeable with water. It freezes at about 18.5°C, so it crystallises if it is stored cold; it is hygroscopic, so keep the bottle sealed; and it carries solutes through many plastics, so use glass or polypropylene. Record the final DMSO percentage, because a co-solvent changes the behaviour of most assays.",
  },
};

// ------------------------------------------------------------------ dilution maths
/** Volumes offered per vial mass, chosen so the stock lands between roughly 1 and 25 mg/ml. */
const VOLUME_LADDER: { maxMass: number; volumes: number[] }[] = [
  { maxMass: 2, volumes: [0.5, 1, 2] },
  { maxMass: 5, volumes: [1, 2, 2.5] },
  { maxMass: 10, volumes: [1, 2, 2.5, 5] },
  { maxMass: 20, volumes: [2, 5] },
  { maxMass: 30, volumes: [3, 5] },
  { maxMass: 40, volumes: [4, 5, 10] },
  { maxMass: 100, volumes: [5, 10] },
  { maxMass: 500, volumes: [10] },
  { maxMass: Number.POSITIVE_INFINITY, volumes: [10, 20] },
];

export type DilutionRow = { ml: number; mgPerMl: number; ugPerMl: number };

/** Arithmetic only: concentration = mass / volume for each offered solvent volume. */
export function dilutionRows(strength: Strength): DilutionRow[] {
  if (strength.unit !== "mg") return [];
  const band = VOLUME_LADDER.find((b) => strength.amount <= b.maxMass) ?? {
    maxMass: 0,
    volumes: [1, 2, 5],
  };
  return band.volumes.map((ml) => {
    const mgPerMl = strength.amount / ml;
    return { ml, mgPerMl, ugPerMl: mgPerMl * 1000 };
  });
}

/** Volume of a stock that contains a given mass, and the concentration that implies. */
export function volumeForMass(massMg: number, stockMgPerMl: number) {
  if (!(massMg > 0) || !(stockMgPerMl > 0)) return null;
  return { ml: massMg / stockMgPerMl, ul: (massMg / stockMgPerMl) * 1000 };
}

// ------------------------------------------------------------------ per-compound records
export type StabilityNote = {
  /** What the evidence actually is, so it cannot be read as a shelf life. */
  label: string;
  text: string;
  cite: string;
};

export type StabilityRecord =
  { status: "published"; text: string; cite: string } | { status: "none"; note?: StabilityNote };

export type DilutionRecord = {
  slug: string;
  name: string;
  solvent: SolventId;
  /** A second solvent the batch form may require, shown alongside the first. */
  alternateSolvent?: SolventId;
  /** Compound-specific reason for the solvent, shown in the reference table. */
  solventReason: string;
  /** Shown under the concentration table, or in its place when the table is withheld. */
  dilutionNote?: string;
  /**
   * True where no validated aqueous stock exists. The volume table is then withheld rather than
   * printing a concentration the compound may not reach.
   */
  withholdConcentrations?: boolean;
  /** Short warning shown in the calculator next to the solvent. */
  preparationCaveat?: string;
  /** True when the item is supplied as a liquid, so there is nothing to dissolve. */
  readyToUse?: boolean;
  /** The item is the diluent itself, not something to be diluted. */
  isDiluent?: boolean;
  /**
   * Highest stock concentration (mg/ml) the cited guidance supports. Only set where a source gives
   * one; `verified` is false when that source is unverified supplier guidance.
   */
  concentrationCeiling?: { mgPerMl: number; verified: boolean; source: string };
  storageDry: string;
  storageSolution: string;
  stability: StabilityRecord;
  cautions: string[];
  sources: string[];
};

const STORAGE_DRY =
  "Sealed vial: -20°C for long-term storage, 2 to 8°C for up to a few months. Keep it dark and dry and let the vial reach room temperature before opening, so moisture does not condense on the powder.";
const STORAGE_SOLUTION =
  "2 to 8°C, protected from light. If the preparation has to be kept longer, divide it into single-use aliquots and freeze them at -20°C, then thaw each aliquot once.";

const BASE_CAUTIONS = [
  "Wipe the stopper with a 70% alcohol wipe and let it dry before every access, and work on a clean, low-draught surface.",
  "Run the diluent down the inside wall of the vial rather than onto the powder, then swirl or roll; do not vortex or shake, because foaming and shear promote aggregation (Manning 2010).",
];

/** Degradation risks that follow from the residues actually in the sequence. */
export function sequenceCautions(slug: string): string[] {
  const seq = chem[slug]?.sequence;
  if (!seq) return [];
  const residues = seq.split(/[-,\s]+/).filter(Boolean);
  const out: string[] = [];
  if (residues.includes("Met"))
    out.push(
      "The sequence contains methionine, the usual first site of oxidation; keep the solution cold, dark and with minimal headspace (Manning 2010).",
    );
  if (residues.includes("Cys"))
    out.push(
      "The sequence contains cysteine; free thiols oxidise and can form disulfide-linked dimers in solution, so record the time in solution and avoid neutral pH storage (Wang 1999).",
    );
  if (residues.includes("Trp"))
    out.push(
      "The sequence contains tryptophan, which photo-oxidises; keep the vial in its box or an opaque container (Manning 2010).",
    );
  for (let i = 0; i < residues.length - 1; i += 1) {
    if (residues[i] === "Asn" && residues[i + 1] === "Gly") {
      out.push(
        "The sequence carries an Asn-Gly motif, a deamidation hotspot at neutral and alkaline pH; prepare close to use (Wang 1999).",
      );
      break;
    }
  }
  return out;
}

type Override = Partial<
  Pick<
    DilutionRecord,
    | "solvent"
    | "alternateSolvent"
    | "solventReason"
    | "dilutionNote"
    | "withholdConcentrations"
    | "preparationCaveat"
    | "readyToUse"
    | "isDiluent"
    | "concentrationCeiling"
  >
> & {
  cautions?: string[];
  stability?: StabilityRecord;
  storageSolution?: string;
  /** Compound-specific citations, added to the record's sources so each claim is traceable. */
  evidence?: string[];
};

/** Compound-specific entries. Anything not listed uses the water-soluble peptide defaults. */
const OVERRIDES: Record<string, Override> = {
  "igf-1-lr3": {
    solvent: "acetic-acid-0.1m",
    solventReason:
      "The acidic stock is the standard laboratory handling for this protein family. For IGF-I in acetate buffer the documented loss routes were methionine oxidation and reducible dimer and trimer, and a histidine buffer held the protein together better (Germershaus 2013). No solvent study of the LR3 variant itself is published, so this is best practice applied from the parent molecule, not an LR3-specific finding.",
    dilutionNote:
      "Keep the stock acidic. Neutralising it drives aggregation, which is why the stock is diluted into buffer rather than titrated to pH 7.",
    cautions: [
      "Do not neutralise the stock: solubility and stability are both pH dependent for this protein.",
      "Adsorbs to some plastics; use low-binding tubes for aliquots.",
    ],
    evidence: [
      "Germershaus 2013, European Journal of Pharmaceutics and Biopharmaceutics, PMID 23958318 (IGF-I, not the LR3 variant)",
    ],
  },
  mgf: {
    dilutionNote:
      "If the powder does not clear in water at neutral pH, 0.1 M acetic acid is the documented alternative. Record which solvent was used on the vial label, because the concentration arithmetic is the same but the solution is not interchangeable.",
  },
  "peg-mgf": {
    dilutionNote:
      "PEGylation makes the powder slower to wet out. Add the diluent, leave it two to three minutes, then swirl; do not heat or sonicate.",
  },
  "ll-37": {
    solventReason:
      "Water-soluble, but cationic and amphipathic: it foams and self-associates readily, so it is handled gently rather than jetted or vortexed.",
    cautions: [
      "Do not vortex or shake: this peptide foams and aggregates at the air-water interface (Manning 2010).",
      "In low-ionic-strength water it self-associates; if the assay needs a defined ionic strength, record the buffer used.",
    ],
  },
  "ghk-cu": {
    solventReason:
      "The copper-peptide complex is water-soluble and gives a characteristic blue solution; the colour is the complex, not degradation.",
    cautions: [
      "A blue solution is expected. Do not read colour as a fault, and do not add a chelator such as EDTA to the stock, which strips the copper.",
      "Record the appearance at reconstitution so a later colour change can be judged against it.",
    ],
    evidence: [
      "Badenhorst 2016, Pharmaceutical Development and Technology, PMID 25384620 (preformulation study of the GHK-Cu complex itself: stable in water and pH 4.5 to 7.4 buffers for at least two weeks at 60 degrees, first-order hydrolysis only under basic and oxidative stress)",
    ],
  },
  "nad-plus": {
    solvent: "sterile-water",
    solventReason:
      "NAD+ is measured at 260 nm and 340 nm, where the benzyl alcohol in a preserved diluent absorbs (Meyer 2007), so a preservative-free sterile water stock is used instead. The free dinucleotide is hydrolytically labile, with a half-life measured in tens of hours at 37 degrees (McDonough 2025), so the stock is prepared fresh and kept cold.",
    dilutionNote:
      "Prepare the stock on the day of use and keep it on ice. A preserved multi-access vial is the wrong container here.",
    cautions: [
      "Hydrolysis accelerates as pH rises; do not make the stock in an alkaline buffer.",
      "Prepare fresh, keep cold, protect from light, and discard the remainder rather than storing it.",
    ],
  },
  glutathione: {
    solvent: "sterile-water",
    solventReason:
      "Reduced glutathione oxidises to the disulfide dimer, and forced-degradation work on glutathione formulations shows oxidation is the dominant loss route in aerated solution (Tsiasioti 2020). A preservative-free sterile water stock, made fresh in single-use aliquots, keeps the preparation simple and the loss visible.",
    cautions: [
      "Oxidation to the disulfide is the main loss route; keep the solution cold, minimise headspace and prepare close to use.",
      "Some colorimetric thiol assays are sensitive to the age of the solution; run a fresh blank with each preparation.",
    ],
  },
  "5-amino-1mq": {
    solventReason:
      "Catalogue specification: red-brown to dark brown iodide salt. No compound-specific solvent or solubility data is published; bacteriostatic water is the default for a small-molecule laboratory standard.",
    cautions: [
      "Keep the solid away from strong oxidisers, which can liberate iodine from the iodide salt.",
    ],
  },
  "bacteriostatic-water": {
    isDiluent: true,
    solventReason:
      "This item is the diluent, not a lyophilised powder. It is supplied as a sterile solution containing 0.9% benzyl alcohol and is used to reconstitute other vials in the catalogue.",
    cautions: [
      "Do not freeze: the vial is a solution and freezing serves no purpose.",
      "Swipe the stopper before each access and keep the vial at 2 to 8°C once opened; a multi-access vial has a limited working life after first use.",
      "Not for spectrophotometry at or near 260 nm, where benzyl alcohol absorbs.",
    ],
    stability: {
      status: "published",
      text: "Benzyl alcohol at 0.9% is a recognised antimicrobial preservative for multi-dose parenteral preparations, which is the basis for its use in a multi-access laboratory vial.",
      cite: "Meyer 2007 (PMID 17722087)",
    },
  },
  "melanotan-2": {
    solvent: "dmso",
    withholdConcentrations: true,
    solventReason:
      "No primary aqueous solubility dataset could be found for this peptide, so the reference does not print an aqueous stock. Published work on MT-II measures its degradation in aqueous solution (Ugwu 1994), which shows it dissolves at low concentration but gives no workable stock figure. It is therefore handled as a DMSO pre-dissolve: dissolve the powder in the minimum volume of DMSO that clears it, then dilute an aliquot of that concentrate into the buffer the experiment needs.",
    dilutionNote:
      "There is no aqueous concentration table for this compound. A figure of about 0.2 mg/ml is quoted in supplier material but could not be traced to a primary study, so it is unverified: test a small quantity before committing the vial, record what actually dissolved, and record the final DMSO percentage, which changes the assay. The aqueous degradation kinetics themselves are published (Ugwu 1994).",
    preparationCaveat:
      "No aqueous stock is validated for this compound. The arithmetic below does not establish that the powder will dissolve.",
    cautions: [
      "Light-sensitive in solution; store in the dark and wrap the vial if it is kept on the bench.",
      "Keep the solution near the reported pH of maximum stability rather than assuming neutral is safest (Ugwu 1994).",
      "DMSO freezes at about 18.5°C: keep the concentrate at room temperature, not in the fridge.",
    ],
    evidence: [
      "Ugwu 1994, International Journal of Pharmaceutics, doi:10.1016/0378-5173(94)90055-8 (aqueous degradation kinetics of MT-II)",
    ],
  },
  adamax: {
    solvent: "dmso",
    withholdConcentrations: true,
    solventReason:
      "No aqueous solubility, stability or solvent dataset is published for adamax, and the only handling note available is an unverified supplier statement that it dissolves in DMSO. The reference therefore offers no aqueous stock and no concentration table for it.",
    dilutionNote:
      "Pre-dissolve in the minimum volume of DMSO only if you have your own solubility data for the batch, dilute an aliquot into buffer, and record the final DMSO percentage, because a co-solvent changes the assay.",
    preparationCaveat:
      "No validated preparation exists for this compound: no aqueous stock, no concentration table.",
    cautions: [
      "Unverified handling: no primary source covers adamax, so treat every step as provisional and record what was done.",
    ],
  },
  "cjc-1295-no-dac": {
    alternateSolvent: "acetic-acid-0.1m",
    solventReason:
      "Salt form decides the solvent here. The acetate salt is the water-soluble one; the free base has limited water solubility and is handled in dilute acetic acid. The catalogue does not state which form a batch is, so the record shows both options and the batch record has to settle it.",
  },
  "melanotan-1": {
    cautions: [
      "Light-sensitive in solution; store in the dark and wrap the vial if it is kept on the bench.",
    ],
  },
  oxytocin: {
    cautions: [
      "Light-sensitive in solution; keep it dark and cold.",
      "Supplied as the acetate salt; the counter-ion is not removed by reconstitution.",
    ],
  },
  "l-carnitine": {
    readyToUse: true,
    solventReason:
      "Supplied as a solution at 600 mg/ml in a 10 ml vial, so there is nothing to reconstitute. Concentration arithmetic for a solution works the other way: volume = mass / concentration.",
  },
  glow: {
    dilutionNote:
      "The table gives total blend mass per ml. Per-component concentration is the component mass on the label divided by the same volume, so 70 mg in 5 ml is 14 mg/ml of total peptide and 10 mg/ml of GHK-Cu.",
    cautions: [
      "Co-lyophilised blend: the components wet out at different rates. Swirl until the last of the cake has gone; do not filter or try to separate the components.",
      "The blue colour comes from GHK-Cu and is expected.",
    ],
  },
  klow: {
    dilutionNote:
      "The table gives total blend mass per ml. Per-component concentration is the component mass on the label divided by the same volume.",
    cautions: [
      "Co-lyophilised blend: swirl until fully dissolved, and do not filter it.",
      "The blue colour comes from GHK-Cu and is expected.",
    ],
  },
  "wolverine-stack": {
    dilutionNote:
      "The table gives total blend mass per ml. Each component is half the stated total, so 10 mg total in 2 ml is 5 mg/ml of BPC-157 and 5 mg/ml of TB-500.",
    cautions: [
      "Co-lyophilised blend: do not separate or filter; record the total mass not the component masses.",
    ],
  },
  "hulk-stack": {
    dilutionNote:
      "The table gives total blend mass per ml. Per-component concentration is the component mass on the label divided by the same volume.",
    cautions: [
      "Co-lyophilised blend: do not separate or filter; record the total mass not the component masses.",
    ],
  },
  "cjc-1295-ipamorelin": {
    dilutionNote:
      "The table gives total blend mass per ml. With a 5 + 5 mg vial, 2 ml gives 5 mg/ml in total, which is 2.5 mg/ml of each component.",
    cautions: [
      "Co-lyophilised blend: do not separate or filter; record the total mass not the component masses.",
    ],
  },
  "selank-semax": {
    dilutionNote:
      "The table gives total blend mass per ml. With a 10 + 10 mg vial, 4 ml gives 5 mg/ml in total, which is 2.5 mg/ml of each component.",
    cautions: [
      "Co-lyophilised blend: do not separate or filter; record the total mass not the component masses.",
    ],
  },
};

const catalogue: Compound[] = [
  ...metabolicAndRegenerative,
  ...secretagoguesToSupplies,
  ...ukplAdditions,
];

const isWaterSolubleNote = (c: Compound) => {
  const spec = c.appearance ? `Catalogue specification: ${c.appearance.toLowerCase()}. ` : "";
  return `${spec}No compound-specific solvent or solubility data is published for this material. Bacteriostatic water is the default for a lyophilised preparation.`;
};

/**
 * Evidence-led notes gathered from primary literature and supplier datasheets.
 * Merged under OVERRIDES, so a compound listed in both keeps its OVERRIDES entry.
 */
const EXTRA: Record<string, Partial<Override>> = {
  "cjc-1295-dac": {
    concentrationCeiling: {
      mgPerMl: 2,
      verified: false,
      source: "Unverified supplier guidance puts the soluble range near 2 mg/ml.",
    },
    dilutionNote:
      "No primary solubility dataset is published for the DAC form. Supplier guidance puts the soluble range near 2 mg/ml, which is unverified, so start at the lower concentrations in the table and record what actually dissolved before making a more concentrated stock.",
  },
  "cjc-1295-no-dac": {
    dilutionNote:
      "If the batch is the acetate salt, water is the solvent. If it is the free base, the stock is made in 0.1 M acetic acid. The catalogue does not state which form is in the vial, so confirm it from the batch record and record what was used.",
  },
  "kisspeptin-10": {
    cautions: [
      "Half-life figures published for kisspeptin-10 come from rat plasma, not from an aqueous buffer stock, so they bound handling in that matrix and are not a time in solution; do not carry them over to a stock. Prepare the working dilution immediately before use and do not hold it across a session.",
    ],
  },
  "ghrp-6": {
    cautions: [
      "Avoid phosphate buffer and a working pH of 6 to 7: both drive formation of modified species in this hexapeptide.",
    ],
  },
  "ara-290": {
    dilutionNote:
      "Solubility is pH dependent and the alkaline end is the soluble one. No primary solubility dataset is on file, so do not assume a neutral-pH stock will clear at the concentrations in the table: test a small quantity first, adjust the pH, and record the pH used.",
  },
  epithalon: {
    dilutionNote:
      "Unverified supplier guidance limits aqueous storage of a stock to one day. Prepare it for the session rather than the week, and record the preparation time.",
    storageSolution:
      "Prepared for the session: the quoted working life of a stock is one day, and no primary dataset was found to extend it. Keep it at 2 to 8°C and protected from light in the meantime.",
  },
  semax: {
    dilutionNote:
      "Unverified supplier guidance limits aqueous storage of a stock to one day, so a stock is prepared for the session rather than the week.",
    storageSolution:
      "Prepared for the session: the quoted working life of a stock is one day, and no primary dataset was found to extend it. Keep it at 2 to 8°C and protected from light in the meantime.",
  },
  selank: {
    dilutionNote:
      "Unverified supplier guidance limits aqueous storage of a stock to one day, so a stock is prepared for the session rather than the week.",
    storageSolution:
      "Prepared for the session: the quoted working life of a stock is one day, and no primary dataset was found to extend it. Keep it at 2 to 8°C and protected from light in the meantime.",
  },
};

function buildRecord(c: Compound): DilutionRecord {
  const o = { ...EXTRA[c.slug], ...OVERRIDES[c.slug] } as Override;
  const solvent = o.solvent ?? "bacteriostatic-water";
  const stability: StabilityRecord = o.stability ?? STABILITY[c.slug] ?? { status: "none" };
  const labels: string[] = [];
  if (c.composition?.length) labels.push(`composition ${c.composition.join(", ")}`);
  if (c.form) labels.push(c.form.toLowerCase());
  if (c.appearance) labels.push(c.appearance.toLowerCase());

  // Every compound-specific claim on the page is traceable: the citation for the stability entry
  // or the labelled note goes into that record's own source list, not just into a page footer.
  // When the record already carries its own annotated citation, that one is enough, so the plain
  // duplicate is dropped rather than printed twice.
  const cited = o.evidence ?? [];
  const evidence = [
    ...cited,
    ...(cited.length
      ? []
      : stability.status === "published"
        ? [stability.cite]
        : stability.note
          ? [`${stability.note.cite} (${stability.note.label.toLowerCase()})`]
          : []),
  ];

  const sources = Array.from(
    new Set([
      `Catalogue specification for ${c.name}${labels.length ? ` (${labels.join("; ")})` : ""}, held in the product data for this site.`,
      ...evidence,
      SOURCES.manning,
      SOURCES.wang,
      ...(solvent === "bacteriostatic-water" ? [SOURCES.meyer] : []),
    ]),
  );

  return {
    slug: c.slug,
    name: c.name,
    solvent,
    ...(o.alternateSolvent ? { alternateSolvent: o.alternateSolvent } : {}),
    solventReason:
      o.solventReason ??
      (solvent === "bacteriostatic-water"
        ? isWaterSolubleNote(c)
        : "See the solvent note in the guide."),
    ...(o.dilutionNote ? { dilutionNote: o.dilutionNote } : {}),
    ...(o.withholdConcentrations ? { withholdConcentrations: true } : {}),
    ...(o.preparationCaveat ? { preparationCaveat: o.preparationCaveat } : {}),
    ...(o.readyToUse ? { readyToUse: true } : {}),
    ...(o.isDiluent ? { isDiluent: true } : {}),
    ...(o.concentrationCeiling ? { concentrationCeiling: o.concentrationCeiling } : {}),
    storageDry: o.isDiluent ? "Store the unopened vial at 2 to 8°C; do not freeze." : STORAGE_DRY,
    storageSolution: o.storageSolution ?? STORAGE_SOLUTION,
    stability,
    cautions: [
      ...(o.cautions ?? []),
      ...(o.readyToUse || o.isDiluent ? [] : BASE_CAUTIONS),
      ...sequenceCautions(c.slug),
    ],
    sources,
  };
}

export const dilutionRecords: DilutionRecord[] = catalogue.map(buildRecord);

const bySlug = new Map(dilutionRecords.map((r) => [r.slug, r]));
export const dilutionFor = (slug: string) => bySlug.get(slug);

/** Catalogue order, grouped as the shop groups them, for the reference page. */
export const dilutionGroups = [
  { id: "metabolic-research", label: "Metabolic research" },
  { id: "regenerative-research", label: "Regenerative research" },
  { id: "gh-secretagogues", label: "Growth hormone secretagogues" },
  { id: "longevity-research", label: "Longevity research" },
  { id: "pigmentation-research", label: "Pigmentation research" },
  { id: "peptide-blends", label: "Peptide blends" },
  { id: "lab-supplies", label: "Lab supplies" },
] as const;

export const dilutionRecordCount = () => dilutionRecords.length;
