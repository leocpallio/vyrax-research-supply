import type { StabilityRecord } from "./reconstitution";

/**
 * Aqueous stability evidence, one entry per compound where a primary study exists.
 *
 * Rule: an entry exists only where the paper actually measures the stability of that
 * molecule in aqueous solution. A review statement, a protease-sensitivity experiment or
 * a metabolite assay is not an aqueous stability dataset, and where that is all that has
 * been published the record stays "none" and the page says so.
 *
 * Every DOI and PMID here was resolved against Crossref or PubMed before it was written
 * down. Re-verify before editing.
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
    text: "Free NAD+ is hydrolytically unstable in aqueous solution, with a half-life measured in hours at 37 degrees; tethering the cofactor to silica is what extends it, which locates the fragility in the free dinucleotide rather than the buffer.",
    cite: "McDonough 2025, ACS Synthetic Biology, PMID 40468472",
  },
  glutathione: {
    status: "published",
    text: "Reduced glutathione oxidises to the disulfide in aerated solution, and peroxide drives more than 95% of it across in three hours; the reaction follows pseudo-first order kinetics.",
    cite: "Tsiasioti 2020, Separations, doi:10.3390/separations7010016",
  },
  "l-carnitine": {
    status: "published",
    text: "Degradation in aqueous solution is thermal and follows Arrhenius behaviour, so heat, not pH, sets the working window and heat sterilisation of a stock is the wrong move.",
    cite: "Goula 2018, Journal of Food Engineering, doi:10.1016/j.jfoodeng.2018.03.011",
  },
  "ghk-cu": {
    status: "published",
    text: "The free tripeptide GHK held its integrity in water and in pH 4.5 to 7.4 buffers for at least two weeks at 60 degrees. That is the peptide, not the copper complex sold here, and no equivalent dataset for the complex was found.",
    cite: "Badenhorst 2016, Pharmaceutical Development and Technology, PMID 25384620",
  },
  kpv: {
    status: "published",
    text: "Under acid, alkali and peroxide stress KPV yields lys-pro-diketopiperazine as its main degradation product, so the cyclisation route is the one to design around.",
    cite: "Pawar 2015, Biomedical Chromatography, PMID 25298219",
  },
  "ll-37": {
    status: "published",
    text: "No aqueous pH-rate dataset has been published. What is published is enzymatic loss: LL-37 is degraded by serine proteases in wound fluid within hours while a matrix metalloproteinase leaves it alone.",
    cite: "Gronberg 2011, Acta Dermato-Venereologica, PMID 21547341",
  },
  "snap-8": {
    status: "published",
    text: "SNAP-8 held its integrity for at least 96 hours in distilled water when refrigerated at 4 degrees. That is the documented bench life, and it is short.",
    cite: "Ji 2020, Journal of Analytical Science and Technology, doi:10.1186/s40543-020-00232-8",
  },
  "ghrp-6": {
    status: "published",
    text: "Heating GHRP-6 in the dark at 60 degrees across pH 3 to 8 produced a family of modified species; pH 6 to 7 and phosphate buffer are the conditions that drive them.",
    cite: "Santana 2021, Journal of Pharmaceutical and Biomedical Analysis, PMID 33272786",
  },
  sermorelin: {
    status: "published",
    text: "GRF is most stable at pH 4 to 5. Below that, cleavage at the aspartic acid residue dominates; above it, deamidation of the asparagine residue takes over.",
    cite: "Bongers 1992, International Journal of Peptide and Protein Research, PMID 1428526",
  },
  "igf-1-lr3": {
    status: "published",
    text: "For IGF-I in acetate buffer at low pH, oxidation of the methionine residue and formation of reducible dimer and trimer were the observed routes, and a histidine buffer held the protein together better. The LR3 variant sold here has no dataset of its own.",
    cite: "Germershaus 2013, European Journal of Pharmaceutics and Biopharmaceutics, PMID 23958318",
  },
  "kisspeptin-10": {
    status: "published",
    text: "Kisspeptin-10 degrades fast enough that the half-life is measured in minutes: 6.8 minutes at 4 degrees, 2.9 at 25 and 1.7 at 37 in the reported system.",
    cite: "Liu 2013, Journal of Chromatography B, PMID 23524040",
  },
  "ss-31": {
    status: "published",
    text: "A review describes SS-31 as water-soluble, stable in solution and resistant to peptidases. That is a review statement, not a pH-rate dataset, so treat the working window as short.",
    cite: "Zhu 2022, Oxidative Medicine and Cellular Longevity, PMID 35707274",
  },
  dsip: {
    status: "published",
    text: "DSIP was fairly stable across pH 4 to 9 buffers; the loss observed in that work came from enzymes, not from hydrolysis.",
    cite: "Chiang 1998, Drug Development and Industrial Pharmacy, PMID 9876605",
  },
  "melanotan-2": {
    status: "published",
    text: "The pH-rate profile puts maximum stability at about pH 5, phosphate buffer accelerates degradation, and the reported shelf life at 25 degrees was around 27 hours.",
    cite: "Ugwu 1994, International Journal of Pharmaceutics, doi:10.1016/0378-5173(94)90055-8",
  },
  "melanotan-1": {
    status: "published",
    text: "MT-I is relatively stable under acidic conditions and degrades faster as the pH rises; the reported room-temperature shelf life at pH 7.4 was about 40 days.",
    cite: "Surendran 1996, International Journal of Pharmaceutics, doi:10.1016/0378-5173(95)04394-2",
  },
  "pt-141": {
    status: "published",
    text: "Bremelanotide degrades less under acidic than under basic conditions and is markedly susceptible to oxidation; epimerisation is the other route the forced-degradation work resolves.",
    cite: "Yuvaraaj 2026, Analytical Methods, PMID 42485063",
  },
  oxytocin: {
    status: "published",
    text: "Aqueous oxytocin is stabilised by 5 to 10 mM citrate buffer at pH 4.5 together with a divalent metal ion; loss near neutral pH runs through disulfide chemistry.",
    cite: "Avanti 2011, The AAPS Journal, PMID 21448747",
  },
};
