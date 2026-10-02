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
    tags: ["Peptide research"],
    kind: "peptide",
    strengths: [{ label: "5mg", amount: 5, unit: "mg", price: 39.99 }],
    summary:
      "Adamax 5mg research peptide. Confirm the batch specification before requesting this item.",
    overview: [
      "Batch composition and analytical documentation should be checked for the exact vial supplied.",
    ],
    applications: ["Peptide identification and analytical research"],
  },
  {
    slug: "cjc-1295-ipamorelin",
    name: "CJC-1295 + Ipamorelin",
    aliases: ["CJC + Ipamorelin"],
    category: "peptide-blends",
    tags: ["Combination research"],
    kind: "blend",
    composition: ["CJC-1295 5mg", "Ipamorelin 5mg"],
    strengths: [{ label: "5+5mg", amount: 10, unit: "mg", price: 42.99 }],
    summary:
      "A 5+5mg CJC-1295 and ipamorelin research blend. Confirm the CJC form against the batch specification.",
    overview: [
      "The CJC-1295 form is not specified in the source stock listing; it must be confirmed from the batch record. Do not assume this is the same formula as Hulk Stack.",
    ],
    applications: ["Combination peptide research"],
  },
  {
    slug: "glutathione",
    name: "Glutathione",
    aliases: ["GSH", "reduced glutathione"],
    category: "longevity-research",
    tags: ["Redox research"],
    kind: "small-molecule",
    strengths: [{ label: "1500mg", amount: 1500, unit: "mg", price: 38.99 }],
    summary: "Glutathione is a tripeptide involved in cellular redox balance.",
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
    kind: "peptide",
    strengths: [{ label: "5mg", amount: 5, unit: "mg", price: 29.99 }],
    summary: "A C-terminal fragment of human growth hormone for laboratory research.",
    overview: [
      "This stock item is listed separately from modified AOD-9604. Check its exact sequence against the batch specification rather than treating the two names as interchangeable.",
    ],
    applications: ["Peptide sequence and structure research"],
  },
  {
    slug: "kisspeptin-10",
    name: "Kisspeptin-10",
    aliases: ["KP-10"],
    category: "gh-secretagogues",
    tags: ["Reproductive signalling"],
    kind: "peptide",
    strengths: [{ label: "10mg", amount: 10, unit: "mg", price: 34.99 }],
    summary: "Kisspeptin-10 is a short fragment of kisspeptin studied in receptor signalling.",
    overview: [
      "Kisspeptin peptides interact with the KISS1 receptor and are studied in neuroendocrine signalling.",
    ],
    applications: ["KISS1 receptor research"],
  },
  {
    slug: "l-carnitine",
    name: "L-Carnitine",
    aliases: ["levocarnitine"],
    category: "metabolic-research",
    tags: ["Fatty acid transport"],
    kind: "small-molecule",
    form: "Solution; 600mg/ml, 10ml",
    appearance: "Solution",
    strengths: [{ label: "600mg/ml, 10ml", amount: 6000, unit: "mg", price: 29.99 }],
    summary: "L-Carnitine solution at 600mg/ml in a 10ml container (6,000mg total).",
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
    tags: ["Growth factor research"],
    kind: "peptide",
    strengths: [{ label: "2mg", amount: 2, unit: "mg", price: 17.99 }],
    summary:
      "MGF 2mg research peptide; verify the sequence and batch specification for the supplied vial.",
    overview: [
      "MGF commonly refers to an IGF-1 splice-variant-derived peptide. The exact sequence must be confirmed against batch documentation.",
    ],
    applications: ["Growth factor peptide research"],
  },
  {
    slug: "oxytocin",
    name: "Oxytocin",
    aliases: [],
    category: "longevity-research",
    tags: ["Neuropeptide research"],
    kind: "peptide",
    strengths: [{ label: "5mg", amount: 5, unit: "mg", price: 24.99 }],
    summary: "Oxytocin is a cyclic nonapeptide studied in neuroendocrine signalling.",
    overview: [
      "Oxytocin is a peptide hormone that is also used as a reference compound in receptor pharmacology.",
    ],
    applications: ["Oxytocin receptor research"],
  },
  {
    slug: "peg-mgf",
    name: "PEG-MGF",
    aliases: ["pegylated MGF"],
    category: "gh-secretagogues",
    tags: ["Growth factor research"],
    kind: "peptide",
    strengths: [{ label: "2mg", amount: 2, unit: "mg", price: 24.99 }],
    summary:
      "PEG-MGF 2mg research peptide. Verify the peptide and PEG specifications for the batch.",
    overview: [
      "Pegylation changes a peptide's physical and analytical properties. The batch documentation should specify the material supplied.",
    ],
    applications: ["Pegylated peptide research"],
  },
  {
    slug: "pinealon",
    name: "Pinealon",
    aliases: ["Glu-Asp-Arg", "EDR"],
    category: "longevity-research",
    tags: ["Neuropeptide research"],
    kind: "peptide",
    strengths: [{ label: "10mg", amount: 10, unit: "mg", price: 29.99 }],
    summary: "Pinealon is a short peptide studied in cellular and neurological models.",
    overview: [
      "The sequence and identity of the supplied batch should be checked in its analytical record.",
    ],
    applications: ["Cellular peptide research"],
  },
  {
    slug: "selank-semax",
    name: "Selank + Semax",
    aliases: ["Selank Semax blend"],
    category: "peptide-blends",
    tags: ["Neuropeptide research"],
    kind: "blend",
    composition: ["Selank 10mg", "Semax 10mg"],
    strengths: [{ label: "10+10mg", amount: 20, unit: "mg", price: 34.99 }],
    summary: "A combined 10mg Selank and 10mg Semax research preparation.",
    overview: [
      "The blend combines two distinct heptapeptides in one listed strength; confirm the composition against the supplied batch record.",
    ],
    applications: ["Combination neuropeptide research"],
  },
  {
    slug: "snap-8",
    name: "SNAP-8",
    aliases: ["acetyl octapeptide-3"],
    category: "regenerative-research",
    tags: ["Skin research"],
    kind: "peptide",
    strengths: [{ label: "10mg", amount: 10, unit: "mg", price: 19.99 }],
    summary: "SNAP-8 is an acetylated octapeptide studied in cosmetic formulation research.",
    overview: [
      "The batch specification should confirm the octapeptide identity before use in analytical work.",
    ],
    applications: ["Cosmetic peptide formulation research"],
  },
];
