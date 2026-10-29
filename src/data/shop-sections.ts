import type { Compound } from "./types";

// Shop browsing groups. A compound belongs to one section; the original research
// categories remain available at their existing URLs for older links.
export const shopSections = [
  {
    slug: "weight-metabolic",
    name: "Metabolic",
    seoName: "Metabolic Research Peptides",
    products: [
      "retatrutide",
      "tirzepatide",
      "semaglutide",
      "cagrilintide",
      "aod-9604",
      "5-amino-1mq",
      "mots-c",
      "hgh-fragment-176-191",
      "l-carnitine",
    ],
  },
  {
    slug: "copper-blends",
    name: "Copper & Copper Blends",
    seoName: "Copper Peptides for Skin",
    products: ["ghk-cu", "glow", "klow"],
  },
  {
    slug: "brain-focus",
    name: "Brain & Focus",
    seoName: "Nootropic Peptides",
    products: ["semax", "selank", "selank-semax"],
  },
  {
    slug: "growth-hormone",
    name: "Growth Hormone",
    seoName: "Growth Hormone Peptides",
    products: [
      "cjc-1295-no-dac",
      "cjc-1295-dac",
      "ipamorelin",
      "tesamorelin",
      "ghrp-2",
      "ghrp-6",
      "hexarelin",
      "sermorelin",
      "igf-1-lr3",
      "hulk-stack",
      "cjc-1295-ipamorelin",
      "kisspeptin-10",
      "mgf",
      "peg-mgf",
    ],
  },
  {
    slug: "recovery-repair",
    name: "Recovery & Repair",
    seoName: "Recovery & Repair Peptides",
    products: ["bpc-157", "tb-500", "kpv", "ll-37", "ara-290", "wolverine-stack", "snap-8"],
  },
  {
    slug: "longevity-cellular",
    name: "Longevity & Cellular",
    seoName: "Longevity & Anti-Ageing Peptides",
    products: [
      "nad-plus",
      "epithalon",
      "ss-31",
      "thymosin-alpha-1",
      "thymalin",
      "adamax",
      "glutathione",
      "oxytocin",
      "pinealon",
    ],
  },
  {
    slug: "tanning-libido",
    name: "Tanning & Libido",
    seoName: "Tanning & Libido Peptides",
    products: ["melanotan-1", "melanotan-2", "pt-141"],
  },
  { slug: "sleep", name: "Sleep", seoName: "Sleep Peptides", products: ["dsip"] },
  {
    slug: "bacteriostatic-water",
    name: "Bacteriostatic Water",
    seoName: "Bacteriostatic Water",
    products: ["bacteriostatic-water"],
  },
] as const;

// Sections listed above are the only ones browsable. An empty section (e.g. laboratory accessories,
// left out on purpose because syringes and wipes undercut the research-only positioning) must not be
// published: a tile that opens "not listed yet" reads as an unfinished shop on every page it appears.

export const sectionFor = (compound: Compound) =>
  shopSections.find((section) => (section.products as readonly string[]).includes(compound.slug));

export const productsInSection = (compounds: Compound[], slug: string) =>
  compounds.filter((compound) => sectionFor(compound)?.slug === slug);
