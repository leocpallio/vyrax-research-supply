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
 * SOURCING RULE. Every claim in the rendered page comes from one of three places:
 *   1. the catalogue specification for the item (form and appearance, held in data/compounds-*.ts),
 *   2. a peer-reviewed paper (PMID listed in `sources`),
 *   3. the lab's own general handling guidance in the reconstitution guide.
 * Where no aqueous stability study for a compound has been published, `stability` is
 * `{ status: "none" }` and the page prints "No published stability data" rather than a guess.
 */

// ------------------------------------------------------------------ general sources
export const SOURCES = {
  manning:
    "Manning MC, Chou DK, Murphy BM, Payne RW, Katayama DS. Stability of protein pharmaceuticals: an update. Pharmaceutical Research, 2010. PMID 20143256",
  wang:
    "Wang W. Instability, stabilization, and formulation of liquid protein pharmaceuticals. International Journal of Pharmaceutics, 1999. PMID 10460913",
  meyer:
    "Meyer BK, Ni A, Hu B, Shi L. Antimicrobial preservative use in parenteral products: past and present. Journal of Pharmaceutical Sciences, 2007. PMID 17722087",
} as const;

// ------------------------------------------------------------------ solvents
export type SolventId = "bacteriostatic-water" | "sterile-water" | "acetic-acid-0.1m";

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
export type StabilityRecord =
  | { status: "published"; text: string; cite: string }
  | { status: "none" };

export type DilutionRecord = {
  slug: string;
  name: string;
  solvent: SolventId;
  /** Compound-specific reason for the solvent, shown in the reference table. */
  solventReason: string;
  /** Shown under the concentration table. */
  dilutionNote?: string;
  /** True when the item is supplied as a liquid, so there is nothing to dissolve. */
  readyToUse?: boolean;
  /** The item is the diluent itself, not something to be diluted. */
  isDiluent?: boolean;
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
  Pick<DilutionRecord, "solvent" | "solventReason" | "dilutionNote" | "readyToUse" | "isDiluent">
> & {
  cautions?: string[];
  stability?: StabilityRecord;
  storageSolution?: string;
};

/** Compound-specific entries. Anything not listed uses the water-soluble peptide defaults. */
const OVERRIDES: Record<string, Override> = {
  "igf-1-lr3": {
    solvent: "acetic-acid-0.1m",
    solventReason:
      "IGF-1 LR3 is poorly stable at neutral pH, and the established laboratory practice is to dissolve the lyophilised powder in 0.1 M acetic acid and dilute into buffer on the day of the experiment (Wang 1999).",
    dilutionNote:
      "Keep the stock acidic. Neutralising it drives aggregation, which is why the stock is diluted into buffer rather than titrated to pH 7.",
    cautions: [
      "Do not neutralise the stock: solubility and stability are both pH dependent for this peptide.",
      "Adsorbs to some plastics; use low-binding tubes for aliquots.",
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
  },
  "nad-plus": {
    solvent: "sterile-water",
    solventReason:
      "NAD+ is measured spectrophotometrically at 260 nm and 340 nm, where the benzyl alcohol in bacteriostatic water absorbs, so a preservative-free sterile water stock is used instead. NAD+ is also hydrolytically labile, so the stock is prepared fresh (Wang 1999).",
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
      "Reduced glutathione oxidises to the disulfide dimer in aqueous solution. A preservative-free sterile water stock, made fresh in single-use aliquots, keeps the oxidation chemistry visible and the preparation simple (Wang 1999).",
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
    cautions: [
      "Light-sensitive in solution; store in the dark and wrap the vial if it is kept on the bench.",
      "Phosphate buffer accelerates degradation of this peptide, so it is the wrong choice for a working stock.",
    ],
  },
  "melanotan-1": {
    cautions: ["Light-sensitive in solution; store in the dark and wrap the vial if it is kept on the bench."],
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
  "glow": {
    dilutionNote:
      "The table gives total blend mass per ml. Per-component concentration is the component mass on the label divided by the same volume, so 70 mg in 5 ml is 14 mg/ml of total peptide and 10 mg/ml of GHK-Cu.",
    cautions: [
      "Co-lyophilised blend: the components wet out at different rates. Swirl until the last of the cake has gone; do not filter or try to separate the components.",
      "The blue colour comes from GHK-Cu and is expected.",
    ],
  },
  "klow": {
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
    cautions: ["Co-lyophilised blend: do not separate or filter; record the total mass not the component masses."],
  },
  "hulk-stack": {
    dilutionNote:
      "The table gives total blend mass per ml. Per-component concentration is the component mass on the label divided by the same volume.",
    cautions: ["Co-lyophilised blend: do not separate or filter; record the total mass not the component masses."],
  },
  "cjc-1295-ipamorelin": {
    dilutionNote:
      "The table gives total blend mass per ml. With a 5 + 5 mg vial, 2 ml gives 5 mg/ml in total, which is 2.5 mg/ml of each component.",
    cautions: ["Co-lyophilised blend: do not separate or filter; record the total mass not the component masses."],
  },
  "selank-semax": {
    dilutionNote:
      "The table gives total blend mass per ml. With a 10 + 10 mg vial, 4 ml gives 5 mg/ml in total, which is 2.5 mg/ml of each component.",
    cautions: ["Co-lyophilised blend: do not separate or filter; record the total mass not the component masses."],
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
    dilutionNote:
      "The reference product dissolves in plain water at about 2 mg/mL. The DAC unit adds mass and albumin binding, not ionisable charge, so no acid co-solvent is needed.",
  },
  "cjc-1295-no-dac": {
    dilutionNote:
      "Salt form decides the solvent here. The acetate dissolves in water to about 5 mg/mL; the free base has limited water solubility and is handled in 1% acetic acid. Read the datasheet before choosing, and record what was used.",
  },
  "melanotan-2": {
    dilutionNote:
      "Sparingly soluble in aqueous buffer, in the region of 0.2 mg/mL. Pre-dissolve in the minimum volume of DMF or DMSO, then dilute into buffer; a straight 5 mg/mL aqueous stock is not achievable with this peptide.",
    cautions: [
      "Light-sensitive in solution; store in the dark and wrap the vial if it is kept on the bench.",
      "Phosphate buffer accelerates degradation of this peptide, so it is the wrong choice for a working stock.",
    ],
  },
  "kisspeptin-10": {
    cautions: [
      "Half-life in solution is measured in minutes at bench temperature. Prepare the working dilution immediately before use and do not hold it across a session.",
    ],
  },
  "ghrp-6": {
    cautions: [
      "Avoid phosphate buffer and a working pH of 6 to 7: both drive formation of modified species in this hexapeptide.",
    ],
  },
  "ara-290": {
    dilutionNote:
      "Solubility is pH dependent. The supplier datasheet reaches about 66 mg/mL only after the solution is adjusted to pH 8, so do not assume a neutral-pH stock will clear.",
  },
  adamax: {
    dilutionNote:
      "The supplier datasheet publishes a DMSO solubility only. Pre-dissolve in DMSO, then dilute into aqueous buffer, and record the final DMSO percentage because it changes the assay.",
  },
  epithalon: {
    dilutionNote:
      "The supplier datasheet limits aqueous storage of a stock to one day. Weigh, dissolve and use within the session rather than storing a stock.",
  },
  semax: {
    dilutionNote:
      "The supplier datasheet limits aqueous storage of a stock to one day, so a stock is prepared for the session rather than the week.",
  },
  selank: {
    dilutionNote:
      "The supplier datasheet limits aqueous storage of a stock to one day, so a stock is prepared for the session rather than the week.",
  },
};

function buildRecord(c: Compound): DilutionRecord {
  const o = { ...EXTRA[c.slug], ...OVERRIDES[c.slug] } as Override;
  const solvent = o.solvent ?? "bacteriostatic-water";
  const labels: string[] = [];
  if (c.composition?.length) labels.push(`composition ${c.composition.join(", ")}`);
  if (c.form) labels.push(c.form.toLowerCase());
  if (c.appearance) labels.push(c.appearance.toLowerCase());

  const sources = [
    `Catalogue specification for ${c.name}${labels.length ? ` (${labels.join("; ")})` : ""}, held in the product data for this site.`,
    SOURCES.manning,
    SOURCES.wang,
  ];
  if (solvent === "bacteriostatic-water") sources.push(SOURCES.meyer);

  return {
    slug: c.slug,
    name: c.name,
    solvent,
    solventReason:
      o.solventReason ??
      (solvent === "bacteriostatic-water"
        ? isWaterSolubleNote(c)
        : "See the solvent note in the guide."),
    ...(o.dilutionNote ? { dilutionNote: o.dilutionNote } : {}),
    ...(o.readyToUse ? { readyToUse: true } : {}),
    ...(o.isDiluent ? { isDiluent: true } : {}),
    storageDry: o.isDiluent ? "Store the unopened vial at 2 to 8°C; do not freeze." : STORAGE_DRY,
    storageSolution: o.storageSolution ?? STORAGE_SOLUTION,
    stability: o.stability ?? STABILITY[c.slug] ?? { status: "none" },
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
