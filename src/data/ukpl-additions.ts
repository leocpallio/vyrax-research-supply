import type { Compound } from "./types";

// Additional strengths listed from currently sellable UKPL rows on 2 Oct 2026.
// Indicative GBP reference prices below match those rows; Vyrax has no live inventory feed.
// No batch/testing claim is inferred from UKPL stock. New products use a generic image
// until a correctly labelled Vyrax render has been approved.
export const ukplAdditions: Compound[] = [
  {
    slug: "adamax",
    name: "Adamax",
    aliases: [],
    category: "longevity-research",
    tags: ["Peptides"],
    useCases: ["Brain & Focus", "Longevity", "Memory"],
    kind: "peptide",
    strengths: [{ label: "5mg", amount: 5, unit: "mg", price: 39.99 }],
    summary:
      "Adamax is a 5mg Semax derivative in a lyophilised vial. Check the batch specification before ordering.",
    overview: [
      "Batch composition and analytical documentation should be checked for the exact vial supplied.",
    ],
    applications: ["Identification"],
  },
  {
    slug: "cjc-1295-ipamorelin",
    name: "CJC-1295 + Ipamorelin",
    aliases: ["CJC + Ipamorelin"],
    category: "peptide-blends",
    tags: ["Blends"],
    useCases: ["Growth Hormone", "Muscle Growth", "Sleep"],
    kind: "blend",
    composition: ["CJC-1295 5mg", "Ipamorelin 5mg"],
    strengths: [{ label: "5+5mg", amount: 10, unit: "mg", price: 42.99 }],
    summary:
      "A 5+5mg CJC-1295 and ipamorelin blend in one lyophilised vial. Check the CJC form against the batch specification.",
    overview: [
      "The CJC-1295 form is not specified in the source stock listing; it must be confirmed from the batch record. Do not assume this is the same formula as Hulk Stack.",
    ],
    applications: ["Blends"],
  },
  {
    slug: "glutathione",
    name: "Glutathione",
    aliases: ["GSH", "reduced glutathione"],
    category: "longevity-research",
    tags: ["Redox"],
    useCases: ["Skin Brightening", "Antioxidant", "Detox"],
    kind: "small-molecule",
    strengths: [{ label: "1500mg", amount: 1500, unit: "mg", price: 38.99 }],
    summary:
      "Glutathione is a tripeptide of glutamate, cysteine and glycine involved in cellular redox balance. Supplied as a lyophilised powder.",
    overview: [
      "Glutathione is a molecule composed of glutamate, cysteine and glycine. Its reduced and oxidised forms are widely measured in redox research.",
    ],
    applications: ["Cellular redox assays"],
  },
  {
    slug: "hgh-fragment-176-191",
    name: "HGH Fragment 176-191",
    aliases: ["hGH 176-191"],
    category: "metabolic-research",
    tags: ["Growth hormone fragment"],
    useCases: ["Metabolic Research", "Lipolysis Research", "Adipocyte Research"],
    kind: "peptide",
    strengths: [{ label: "5mg", amount: 5, unit: "mg", price: 29.99 }],
    summary:
      "AOD-9604 is a C-terminal fragment of human growth hormone, residues 177 to 191. Supplied as a lyophilised powder.",
    overview: [
      "This stock item is listed separately from modified AOD-9604. Check its exact sequence against the batch specification rather than treating the two names as interchangeable.",
    ],
    applications: ["Structure"],
  },
  {
    slug: "kisspeptin-10",
    name: "Kisspeptin-10",
    aliases: ["KP-10"],
    category: "gh-secretagogues",
    tags: ["Reproductive signalling"],
    useCases: ["Hormones", "Fertility", "Libido"],
    kind: "peptide",
    strengths: [{ label: "10mg", amount: 10, unit: "mg", price: 34.99 }],
    summary:
      "Kisspeptin-10 is a short 10-amino-acid fragment of kisspeptin acting at the KISS1 receptor. Supplied as a lyophilised powder.",
    overview: [
      "Kisspeptin peptides interact with the KISS1 receptor and are studied in neuroendocrine signalling.",
    ],
    applications: ["KISS1 receptor"],
  },
  {
    slug: "l-carnitine",
    name: "L-Carnitine",
    aliases: ["levocarnitine"],
    category: "metabolic-research",
    tags: ["Fatty acid transport"],
    useCases: ["Metabolic Research", "Energy Metabolism", "Recovery Research"],
    kind: "small-molecule",
    form: "Solution; 600mg/ml, 10ml",
    appearance: "Solution",
    strengths: [{ label: "600mg/ml, 10ml", amount: 6000, unit: "mg", price: 29.99 }],
    summary:
      "L-Carnitine solution at 600mg/ml in a 10ml vial, 6,000mg total. Carries long-chain fatty acyl groups into mitochondria.",
    overview: [
      "L-Carnitine transports long-chain fatty acyl groups into mitochondria for metabolic research.",
    ],
    applications: ["Fatty acid transport assays"],
  },
  {
    slug: "mgf",
    name: "MGF",
    aliases: ["mechano growth factor"],
    category: "gh-secretagogues",
    tags: ["Growth factors"],
    useCases: ["Muscle Growth", "Recovery", "Strength"],
    kind: "peptide",
    strengths: [{ label: "2mg", amount: 2, unit: "mg", price: 17.99 }],
    summary:
      "MGF is a 2mg mechano growth factor peptide in a lyophilised vial. Check the sequence and batch specification.",
    overview: [
      "MGF commonly refers to an IGF-1 splice-variant-derived peptide. The exact sequence must be confirmed against batch documentation.",
    ],
    applications: ["Growth factors"],
  },
  {
    slug: "oxytocin",
    name: "Oxytocin",
    aliases: [],
    category: "longevity-research",
    tags: ["Neuropeptides"],
    useCases: ["Libido", "Mood", "Social Bonding"],
    kind: "peptide",
    strengths: [{ label: "5mg", amount: 5, unit: "mg", price: 24.99 }],
    summary:
      "Oxytocin is a cyclic nonapeptide acting on oxytocin receptors in neuroendocrine signalling. Supplied as a lyophilised powder.",
    overview: [
      "Oxytocin is a peptide hormone that is also used as a reference compound in receptor pharmacology.",
    ],
    applications: ["Oxytocin receptor"],
  },
  {
    slug: "peg-mgf",
    name: "PEG-MGF",
    aliases: ["pegylated MGF"],
    category: "gh-secretagogues",
    tags: ["Growth factors"],
    useCases: ["Muscle Growth", "Recovery", "Strength"],
    kind: "peptide",
    strengths: [{ label: "2mg", amount: 2, unit: "mg", price: 24.99 }],
    summary:
      "PEG-MGF is a 2mg pegylated mechano growth factor peptide. Check the peptide and PEG specification for the batch.",
    overview: [
      "Pegylation changes a peptide's physical and analytical properties. The batch documentation should specify the material supplied.",
    ],
    applications: ["PEGylation"],
  },
  {
    slug: "pinealon",
    name: "Pinealon",
    aliases: ["Glu-Asp-Arg", "EDR"],
    category: "longevity-research",
    tags: ["Neuropeptides"],
    useCases: ["Sleep", "Brain & Focus", "Anti-Ageing"],
    kind: "peptide",
    strengths: [{ label: "10mg", amount: 10, unit: "mg", price: 29.99 }],
    summary:
      "Pinealon is a short tripeptide (Ala-Glu-Asp) used in cellular and neurological work. Supplied as a lyophilised powder.",
    overview: [
      "The sequence and identity of the supplied batch should be checked in its analytical record.",
    ],
    applications: ["Cellular peptides"],
  },
  {
    slug: "selank-semax",
    name: "Selank + Semax",
    aliases: ["Selank Semax blend"],
    category: "peptide-blends",
    tags: ["Neuropeptides"],
    useCases: ["Brain & Focus", "Anxiety & Calm", "Memory"],
    kind: "blend",
    composition: ["Selank 10mg", "Semax 10mg"],
    strengths: [{ label: "10+10mg", amount: 20, unit: "mg", price: 34.99 }],
    summary: "A combined 10mg Selank and 10mg Semax preparation in a single lyophilised vial.",
    overview: [
      "The blend combines two distinct heptapeptides in one listed strength; confirm the composition against the supplied batch record.",
    ],
    applications: ["Neuropeptide blends"],
  },
  {
    slug: "snap-8",
    name: "SNAP-8",
    aliases: ["acetyl octapeptide-3"],
    category: "regenerative-research",
    tags: ["Skin"],
    useCases: ["Anti-Ageing", "Skin & Wrinkles", "Cosmetic"],
    kind: "peptide",
    strengths: [{ label: "10mg", amount: 10, unit: "mg", price: 19.99 }],
    summary:
      "SNAP-8 is an acetylated octapeptide used in cosmetic formulation work. Supplied as a lyophilised powder.",
    overview: [
      "The batch specification should confirm the octapeptide identity before use in analytical work.",
    ],
    applications: ["Cosmetic formulation"],
  },
];
