// Below-grid long-form copy for /shop, /collections/<slug> and /category/<slug>.
// Human-facing: what the compounds are, how they are grouped, how to compare listings.
// No dosing, no condition-to-product mapping, no testing assertions (those come from
// src/lib/claims.ts). No em-dashes.

import type { QA } from "./faq";

export type ContentBlock = { heading: string; paragraphs: string[] };
export type CategoryContent = {
  /** One or two sentences under the H1. */
  lede: string;
  blocks: ContentBlock[];
  faqs: QA[];
};

const RUO =
  "Everything listed is sold for research use only. Not a licensed medicine, food, cosmetic or supplement, and no dose is on the label.";

const COMMON_FAQS: QA[] = [
  [
    "Who can order these compounds?",
    "Anyone aged 18 or over in the UK. Most buyers use them themselves. They are sold for research use only rather than as licensed medicines, so the label carries no dose. See the Research use policy for the full terms.",
  ],
  [
    "How are prices shown?",
    "Each card shows the lowest vial price for the compound and the product page lists every strength with its cost per mg, so like-for-like comparison is straightforward. Multi-buy tiers are applied in the basket and the final total is confirmed before payment.",
  ],
  [
    "What does the stock pill on a card mean?",
    "It reflects the current listing state for that compound. Where availability has not yet been confirmed the pill says so rather than implying stock on the shelf. Nothing is reserved until an order is paid.",
  ],
  [
    "How should a lyophilised vial be stored on arrival?",
    "Sealed lyophilised vials are normally held refrigerated or frozen and protected from light. The handling guides cover storage and reconstitution; follow the storage note on the vial.",
  ],
];

const shopContent: CategoryContent = {
  lede: "Every peptide and lab supply we list, in one grid: weight loss, recovery, growth hormone, skin, sleep and more.",
  blocks: [
    {
      heading: "Browsing the full catalogue",
      paragraphs: [
        "The shop lists every compound in a single grid so you can compare across ranges without moving between pages. Use the pill row to narrow to a range, or sort by price or name. Each card shows the stock state, the lowest vial price and a quick-add button; choosing an amount adds that strength straight to the basket.",
        "Compounds are grouped into ranges by the receptor system or biological process they act on. The same compound page is reached from any range it belongs to, so there is no duplication of specifications.",
      ],
    },
    {
      heading: "What is on each product page",
      paragraphs: [
        "Product pages carry the CAS number, molecular formula and molecular weight, an overview written from the published literature, PubMed references and the full list of vial strengths with cost per mg. Where a certificate of analysis is held for a batch it is linked from the page and from the Lab Reports hub.",
      ],
    },
  ],
  faqs: COMMON_FAQS,
};

const SECTION: Record<string, CategoryContent> = {
  "weight-metabolic": {
    lede: "Weight loss, fat loss and appetite control peptides: incretin, amylin and mitochondrial compounds, grouped by the receptors they act on.",
    blocks: [
      {
        heading: "Weight loss peptides and how they differ",
        paragraphs: [
          "This range covers the incretin receptor agonists that dominate the current literature: the GLP-1 receptor agonist semaglutide, the dual GIP and GLP-1 agonist tirzepatide and the triple agonist retatrutide. Alongside them sit the amylin analogue cagrilintide, the growth hormone fragment AOD-9604 and its parent fragment 176-191, the NNMT inhibitor 5-Amino-1MQ and the mitochondrial-derived peptide MOTS-c.",
          "Each compound page sets out which receptors the molecule acts at and how it differs from its nearest relatives, with references to the primary literature, so you can pick the right compound for a comparison.",
        ],
      },
      {
        heading: "Fat loss, appetite and metabolism",
        paragraphs: [
          "The incretins work on appetite signalling and gastric emptying. Cagrilintide acts on the amylin pathway, which is the satiety side of the same picture. AOD-9604 and the 176-191 fragment are growth hormone fragments studied for lipolysis rather than for growth. 5-Amino-1MQ and MOTS-c sit on the metabolic side: NNMT inhibition and mitochondrial peptide signalling respectively.",
          "That split is why the range is listed together. If you want the appetite route, look at the incretins and cagrilintide. If you want the fat oxidation or metabolic route, look at the fragments, 5-Amino-1MQ and MOTS-c.",
        ],
      },
      {
        heading: "Comparing strengths and cost per mg",
        paragraphs: [
          "Most compounds in this range are offered in several vial strengths. The card shows the lowest price; the product page lists every strength and its cost per mg. Larger vials generally have a lower cost per mg and suit anyone drawing repeated aliquots from a single preparation.",
        ],
      },
    ],
    faqs: [
      [
        "What is the difference between semaglutide, tirzepatide and retatrutide?",
        "They differ in receptor coverage. Semaglutide is a single GLP-1 receptor agonist, tirzepatide acts at both GIP and GLP-1 receptors, and retatrutide adds glucagon receptor activity. Each product page describes the receptor profile with references.",
      ],
      [
        "Why is cagrilintide grouped with the incretins?",
        "Cagrilintide is an amylin analogue rather than an incretin, but it acts on the same appetite pathway and is usually bought alongside GLP-1 agonists, so it sits in the same range.",
      ],
      ...COMMON_FAQS,
    ],
  },
  "copper-blends": {
    lede: "Skin, collagen and hair peptides: the copper tripeptide GHK-Cu, on its own and in the GLOW and KLOW combination vials.",
    blocks: [
      {
        heading: "GHK-Cu and copper peptide blends",
        paragraphs: [
          "GHK-Cu is the naturally occurring tripeptide glycyl-L-histidyl-L-lysine complexed with copper. It is used in skin, wound model and gene expression work. GLOW combines GHK-Cu with BPC-157 and TB-500 in a single lyophilised vial; KLOW adds KPV to the same base.",
          "Blends are prepared as one batch, so every component comes from the same preparation. The composition of each vial is printed on the product page and on the batch documentation.",
        ],
      },
      {
        heading: "Choosing between the single compound and a blend",
        paragraphs: [
          "The single-compound vial suits work that isolates copper peptide activity. The blends suit anyone already combining these peptides who wants a fixed ratio. Ratios and total content are stated on each blend page.",
        ],
      },
    ],
    faqs: [
      [
        "Does GHK-Cu need a different solvent?",
        "GHK-Cu is reconstituted with bacteriostatic water in the same way as any other lyophilised peptide. Its solution is blue because of the copper complex. The handling guide covers reconstitution step by step.",
      ],
      ...COMMON_FAQS,
    ],
  },
  "brain-focus": {
    lede: "Focus, memory and mood peptides: the synthetic heptapeptide Semax and the related anxiolytic-class peptide Selank.",
    blocks: [
      {
        heading: "Semax and Selank",
        paragraphs: [
          "Semax is an ACTH(4-10) analogue and Selank is a tuftsin analogue. Both originate in Russian neuropeptide work and act on BDNF expression, enkephalin metabolism and related neurochemistry. The combined Selank and Semax vial supplies both in a fixed ratio for anyone using them together.",
        ],
      },
    ],
    faqs: [
      [
        "What is the difference between Semax and Selank?",
        "Semax is derived from a fragment of ACTH and Selank from the immunomodulatory peptide tuftsin. They act on overlapping but distinct neurochemical pathways; each product page summarises the literature.",
      ],
      ...COMMON_FAQS,
    ],
  },
  "growth-hormone": {
    lede: "Growth hormone, muscle growth and recovery peptides: GHRH analogues, ghrelin receptor agonists, IGF-1 LR3 and related compounds acting on the GH axis.",
    blocks: [
      {
        heading: "Two receptor systems",
        paragraphs: [
          "Growth hormone secretagogues act through two main routes. GHRH receptor agonists include sermorelin, tesamorelin and CJC-1295 with and without DAC. Ghrelin receptor (GHS-R1a) agonists include ipamorelin, GHRP-2, GHRP-6 and hexarelin. The range also carries IGF-1 LR3, a long-acting IGF-1 analogue widely used as a cell culture growth factor, MGF and PEG-MGF, and kisspeptin-10.",
          "The Hulk Stack and the CJC-1295 and ipamorelin blend combine a GHRH analogue with a ghrelin receptor agonist in one vial, the pairing most often used when both routes are wanted at once.",
        ],
      },
      {
        heading: "DAC or no DAC",
        paragraphs: [
          "CJC-1295 is offered with and without the drug affinity complex (DAC). The DAC version binds serum albumin and has a far longer half-life in published pharmacokinetic work; the version without DAC (also called modified GRF 1-29) is short-acting. The two product pages compare them directly.",
        ],
      },
    ],
    faqs: [
      [
        "Is IGF-1 LR3 a peptide?",
        "IGF-1 LR3 is an 83-amino-acid recombinant protein, an analogue of insulin-like growth factor 1 with an extended N-terminus. It is listed here because it is used alongside the GH secretagogues.",
      ],
      ...COMMON_FAQS,
    ],
  },
  "recovery-repair": {
    lede: "Recovery and repair peptides for tendon, joint, muscle and gut work: BPC-157, TB-500, KPV, LL-37, ARA-290 and the Wolverine blend.",
    blocks: [
      {
        heading: "Peptides used in tissue repair work",
        paragraphs: [
          "BPC-157 is a 15-amino-acid fragment of body protection compound, and TB-500 is the active fragment of thymosin beta-4. Both are widely used in tendon, muscle and gut tissue work. KPV is the C-terminal tripeptide of alpha-MSH, LL-37 is the human cathelicidin antimicrobial peptide and ARA-290 is an erythropoietin-derived peptide. SNAP-8 is an octapeptide used in dermal work.",
          "The Wolverine Stack combines BPC-157 and TB-500 in one vial for anyone using the pair together.",
        ],
      },
      {
        heading: "Reading the literature",
        paragraphs: [
          "Most published work on these compounds is preclinical. Each product page summarises the models used and links to the original papers on PubMed so the evidence base can be read directly rather than through a marketing summary.",
        ],
      },
    ],
    faqs: [
      [
        "What is the difference between TB-500 and thymosin beta-4?",
        "Thymosin beta-4 is the full 43-amino-acid protein. TB-500 is the synthetic fragment (residues 17-23) that carries its actin-binding domain and is the form normally supplied.",
      ],
      ...COMMON_FAQS,
    ],
  },
  "longevity-cellular": {
    lede: "Anti-ageing, energy and longevity compounds: NAD+, SS-31, epithalon, the thymic peptides and other compounds in the ageing literature.",
    blocks: [
      {
        heading: "Compounds in the longevity range",
        paragraphs: [
          "The range covers the coenzyme NAD+, the mitochondria-targeted tetrapeptide SS-31 (elamipretide), the pineal tetrapeptide epithalon and pinealon, the thymic peptides thymosin alpha-1 and thymalin, the tripeptide glutathione, the nonapeptide oxytocin and the Semax derivative adamax.",
          "They are grouped here because they appear together in the ageing, mitochondrial function and immunosenescence literature, not because they share a mechanism. Each product page explains the specific pathway the compound acts on.",
        ],
      },
    ],
    faqs: [
      [
        "Is NAD+ a peptide?",
        "No. Nicotinamide adenine dinucleotide is a coenzyme. It is listed in this range because it is used alongside the longevity peptides and arrives in the same lyophilised vial format.",
      ],
      ...COMMON_FAQS,
    ],
  },
  "tanning-libido": {
    lede: "Tanning and libido peptides: Melanotan 1, Melanotan 2 and PT-141, alpha-MSH analogues with different melanocortin receptor profiles.",
    blocks: [
      {
        heading: "Three melanocortin receptor agonists",
        paragraphs: [
          "Melanotan 1 (afamelanotide) is a linear alpha-MSH analogue selective for MC1R. Melanotan 2 is a cyclic analogue active across several melanocortin receptors. PT-141 (bremelanotide) is a metabolite of Melanotan 2 acting mainly at MC4R. They are the three melanocortin receptor agonists in the catalogue.",
        ],
      },
    ],
    faqs: [
      [
        "How do Melanotan 1 and Melanotan 2 differ?",
        "Melanotan 1 is linear and MC1R-selective; Melanotan 2 is cyclic and less selective, with activity at MC3R, MC4R and MC5R in published receptor assays. The product pages compare the two with references.",
      ],
      ...COMMON_FAQS,
    ],
  },
  sleep: {
    lede: "Sleep peptides: delta sleep-inducing peptide (DSIP), a nonapeptide acting on sleep physiology.",
    blocks: [
      {
        heading: "DSIP",
        paragraphs: [
          "DSIP was first isolated from rabbit cerebral venous blood in the 1970s and is used in electroencephalographic sleep models and in work on several neuroendocrine pathways. The product page carries its CAS number, sequence and references.",
        ],
      },
    ],
    faqs: COMMON_FAQS,
  },
  "bacteriostatic-water": {
    lede: "Sterile water with 0.9% benzyl alcohol, the standard solvent for reconstituting a lyophilised vial.",
    blocks: [
      {
        heading: "Reconstitution solvent",
        paragraphs: [
          "Bacteriostatic water is sterile water containing 0.9% benzyl alcohol as a preservative, which lets a reconstituted vial be drawn from more than once. Use the reconstitution calculator to work out the solvent volume for a target concentration.",
        ],
      },
    ],
    faqs: [
      [
        "How much bacteriostatic water does a vial need?",
        "It depends on the concentration you want. The calculator takes the vial content and the target concentration and returns the solvent volume. We do not provide dosing guidance of any kind.",
      ],
      ...COMMON_FAQS,
    ],
  },
};

const CATEGORY: Record<string, CategoryContent> = {
  "metabolic-research": SECTION["weight-metabolic"]!,
  "regenerative-research": {
    lede: "BPC-157, TB-500, GHK-Cu and related peptides used in tissue repair work.",
    blocks: [
      {
        heading: "The regenerative range",
        paragraphs: [
          "This category groups the peptides most widely used in tissue repair work: BPC-157, TB-500, the copper tripeptide GHK-Cu, KPV, LL-37 and ARA-290. Most published work uses cell culture and animal models; each product page summarises the models and links to the primary literature.",
          "For combination work see the GLOW, KLOW and Wolverine blends in the peptide blends category.",
        ],
      },
    ],
    faqs: SECTION["recovery-repair"]!.faqs,
  },
  "gh-secretagogues": SECTION["growth-hormone"]!,
  "longevity-research": {
    lede: "NAD+, SS-31, epithalon, thymic peptides and neuropeptides in the ageing literature.",
    blocks: [
      ...SECTION["longevity-cellular"]!.blocks.slice(0, 1),
      {
        heading: "Neuropeptides",
        paragraphs: [
          "The category also includes DSIP, Semax and Selank, which act on sleep physiology and neurochemistry rather than ageing directly but are catalogued here for historical reasons. They are also browsable in the Brain and Focus and Sleep ranges.",
        ],
      },
    ],
    faqs: SECTION["longevity-cellular"]!.faqs,
  },
  "pigmentation-research": SECTION["tanning-libido"]!,
  "peptide-blends": {
    lede: "Two or more peptides in one lyophilised vial, prepared as a single batch.",
    blocks: [
      {
        heading: "Why blends",
        paragraphs: [
          "A blend puts a fixed ratio of peptides into one vial so every component comes from the same preparation and batch. GLOW combines GHK-Cu, BPC-157 and TB-500; KLOW adds KPV; the Wolverine Stack pairs BPC-157 and TB-500; the Hulk Stack pairs CJC-1295 DAC with ipamorelin. Composition and total content are printed on each product page.",
        ],
      },
    ],
    faqs: [
      [
        "Can I see the ratio of each component?",
        "Yes. Each blend page lists the components and the amount of each per vial. Where a blend is offered in more than one total strength, the composition is stated for each.",
      ],
      ...COMMON_FAQS,
    ],
  },
  "lab-supplies": SECTION["bacteriostatic-water"]!,
};

export const shopSeo = shopContent;
export const sectionSeo = (slug: string): CategoryContent => SECTION[slug] ?? shopContent;
export const categorySeo = (slug: string): CategoryContent => CATEGORY[slug] ?? shopContent;
