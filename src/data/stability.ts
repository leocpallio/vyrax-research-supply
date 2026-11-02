import type { StabilityRecord } from "./reconstitution";

/**
 * Aqueous stability evidence, one entry per compound where a primary study exists.
 *
 * Rule: an entry is `published` only where the paper measures the stability of the molecule sold,
 * in aqueous solution. A review statement, a protease-sensitivity experiment, a metabolite assay
 * or a plasma incubation is not an aqueous formulation dataset; where that is all that exists, the
 * record stays `none` and the evidence is carried as a labelled note so it cannot be read as a
 * bracketed shelf life.
 *
 * Every DOI and PMID here was resolved against Crossref or PubMed, and the molecule in each paper
 * was checked against the catalogue item, on 2 November 2026. Re-verify before editing.
 */
export const STABILITY: Record<string, StabilityRecord> = {
  tirzepatide: {
    status: "published",
    text: "Acid hydrolysis, base hydrolysis, oxidation and photolysis are the documented degradation routes in aqueous solution, and a stability-indicating HPLC method separates each stress condition from the intact peak.",
    cite: "Khalil 2026, BMC Chemistry, PMID 41588418",
  },
  semaglutide: {
    status: "published",
    text: "Degradation is fastest between pH 4.5 and 5.5, around the peptide's isoelectric point, and falls away as the pH moves above 7.",
    cite: "Malgave 2025, Journal of Peptide Science, PMID 40635175",
  },
  "nad-plus": {
    status: "published",
    text: "Free NAD+ is hydrolytically unstable in aqueous solution, with a half-life of about 34 hours at 37 degrees; tethering the cofactor to silica is what extends it, which locates the fragility in the free dinucleotide rather than the buffer.",
    cite: "McDonough 2025, ACS Synthetic Biology, PMID 40468472",
  },
  glutathione: {
    status: "published",
    text: "Reduced glutathione oxidises to the disulfide in aerated solution, and 3% peroxide drives more than 95% of it across in three hours; the reaction follows pseudo-first order kinetics.",
    cite: "Tsiasioti 2020, Separations, doi:10.3390/separations7010016",
  },
  "l-carnitine": {
    status: "published",
    text: "Degradation of L-carnitine in aqueous solution is thermal and follows Arrhenius kinetics, so temperature and time in solution, not pH, set the working window. This is a food-matrix kinetics study rather than a sterile-product study, so it describes the shape of the risk rather than a shelf life.",
    cite: "Goula 2018, Journal of Food Engineering, doi:10.1016/j.jfoodeng.2018.03.011",
  },
  "ghk-cu": {
    status: "published",
    text: "GHK-Cu held its integrity in water and in pH 4.5 to 7.4 buffers for at least two weeks at 60 degrees. Hydrolysis appeared only under basic and oxidative stress, and a stability-indicating HPLC method separated the degradants from the intact complex.",
    cite: "Badenhorst 2016, Pharmaceutical Development and Technology, PMID 25384620",
  },
  kpv: {
    status: "published",
    text: "Under acid, alkali and peroxide stress KPV yields lys-pro-diketopiperazine as its main degradation product, so the cyclisation route is the one to design around.",
    cite: "Pawar 2015, Biomedical Chromatography, PMID 25298219",
  },
  "ll-37": {
    status: "none",
    note: {
      label: "Same molecule, non-aqueous matrix",
      text: "LL-37 is degraded by serine proteases in wound fluid within hours while a matrix metalloproteinase leaves it alone. That is enzymatic loss in a biological matrix, not an aqueous pH-rate dataset, so it is not used here as a solution shelf life.",
      cite: "Gronberg 2011, Acta Dermato-Venereologica, PMID 21547341",
    },
  },
  "snap-8": {
    status: "published",
    text: "SNAP-8 held its integrity for at least 96 hours in distilled water when refrigerated at 4 degrees. That is the documented bench life, and it is short.",
    cite: "Ji 2020, Journal of Analytical Science and Technology, doi:10.1186/s40543-020-00232-8",
  },
  "ghrp-6": {
    status: "published",
    text: "Heating GHRP-6 in the dark at 60 degrees across pH 3 to 8 produced a family of modified species: C-terminal deamidation peaked at pH 3 and 8, while hydrolysis and head-to-tail cyclisation were favoured between pH 6 and 7 in phosphate buffers.",
    cite: "Santana 2021, Journal of Pharmaceutical and Biomedical Analysis, PMID 33272786",
  },
  sermorelin: {
    status: "published",
    text: "GRF(1-29)-NH2, the fragment sold as sermorelin, is most stable at pH 4 to 5. Below that, cleavage at the aspartic acid residue dominates; above it, deamidation of the asparagine residue takes over.",
    cite: "Bongers 1992, International Journal of Peptide and Protein Research, PMID 1428526",
  },
  "igf-1-lr3": {
    status: "none",
    note: {
      label: "Related molecule only (IGF-I, not LR3)",
      text: "For IGF-I in acetate buffer, oxidation of the methionine residue and reducible dimer and trimer were the loss routes, and a histidine buffer held the protein together better. The LR3 variant sold here has no dataset of its own, so this is context for the acidic stock, not a shelf life.",
      cite: "Germershaus 2013, European Journal of Pharmaceutics and Biopharmaceutics, PMID 23958318",
    },
  },
  "kisspeptin-10": {
    status: "none",
    note: {
      label: "Same molecule, plasma matrix",
      text: "Kisspeptin-10 incubated in rat plasma decomposed with an initial half-life of 6.8 minutes at 4 degrees, 2.9 at 25 and 1.7 at 37, losing the N-terminal tyrosine as its main product, and more than 90% was gone within 30 minutes. Plasma is an enzyme-rich matrix, so this bounds handling rather than giving a buffer shelf life.",
      cite: "Liu 2013, Journal of Chromatography B, PMID 23524040",
    },
  },
  "ss-31": {
    status: "none",
    note: {
      label: "Review statement, not a dataset",
      text: "A review describes SS-31 as water-soluble, stable in solution and resistant to peptidases. No primary pH-rate or shelf-life study is cited for that statement, so the working window is treated as short.",
      cite: "Zhu 2022, Oxidative Medicine and Cellular Longevity, PMID 35707274",
    },
  },
  dsip: {
    status: "published",
    text: "DSIP was fairly stable across pH 4 to 9 buffers; the loss observed in that work came from enzymes, not from hydrolysis.",
    cite: "Chiang 1998, Drug Development and Industrial Pharmacy, PMID 9876605",
  },
  "melanotan-2": {
    status: "published",
    text: "Degradation of MT-II in aqueous solution follows apparent first-order kinetics, and the pH-rate profile puts maximum stability at about pH 5. Away from that pH the loss is faster, so the working pH is a deliberate choice rather than a default.",
    cite: "Ugwu 1994, International Journal of Pharmaceutics, doi:10.1016/0378-5173(94)90055-8",
  },
  "melanotan-1": {
    status: "none",
    note: {
      label: "Same molecule, no shelf-life figure",
      text: "A dedicated preformulation study measured the solution stability and partitioning of MT-I, so its degradation in aqueous solution was characterised, but the published record does not give a shelf life that can be quoted here. No numeric stability claim is made.",
      cite: "Surendran 1996, International Journal of Pharmaceutics, doi:10.1016/0378-5173(95)04394-2",
    },
  },
  "pt-141": {
    status: "published",
    text: "Bremelanotide degrades less under acidic than under basic conditions and is markedly susceptible to oxidation; epimerisation is the other route the forced-degradation work resolves.",
    cite: "Yuvaraaj 2026, Analytical Methods, PMID 42485063",
  },
  oxytocin: {
    status: "published",
    text: "Aqueous oxytocin was stabilised by 5 to 10 mM citrate buffer at pH 4.5 combined with at least 2 mM of a divalent metal ion; acetate buffer with the same ions did not give the same improvement.",
    cite: "Avanti 2011, The AAPS Journal, PMID 21448747",
  },
};
