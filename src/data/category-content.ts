// Below-grid long-form copy for /shop, /collections/<slug> and /category/<slug>.
// Human-facing: what the compounds are, how they are grouped, how to compare listings.
// No dosing, no condition-to-product mapping, no testing assertions (those come from
// src/lib/claims.ts). No em-dashes.
//
// Paragraphs may carry internal links written as [label](/path). Listing.tsx renders them as
// anchors and only internal paths are allowed, so link targets are checked by the build's
// route list rather than typed here.

import type { QA } from "./faq";

export type ContentBlock = { heading: string; paragraphs: string[] };
export type CategoryContent = {
  /** One or two sentences under the H1. */
  lede: string;
  blocks: ContentBlock[];
  faqs: QA[];
  /** Guide slugs shown under the copy as related reading. Must exist in src/data/guides.ts. */
  relatedGuides?: string[];
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
    "Can I buy more than one vial?",
    "Yes. Every product page has a single vial, 3 pack, 5 pack and 10 pack row with the price per vial for each. The pack rows use the same basket calculation as the rest of the site, so the figure shown is the figure the basket produces. Two strengths also carry a buy two, get one free offer, and spend tiers apply once the basket total reaches the thresholds shown there.",
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
        "Product pages list available compound identifiers and specifications, such as CAS number, molecular formula and molecular weight where recorded. They also show the vial strengths and pricing, with literature references where available. Where a certificate is held for a batch it is linked from the product page and from the [lab reports hub](/lab-reports). The [reconstitution calculator](/calculator) calculates solvent volume for a target laboratory concentration.",
      ],
    },
    {
      heading: "Where to start",
      paragraphs: [
        "If you already know the receptor or pathway you are working on, open the range: [weight loss and metabolic](/collections/weight-metabolic), [recovery and repair](/collections/recovery-repair), [growth hormone](/collections/growth-hormone), [copper peptides](/collections/copper-blends) or [longevity and cellular](/collections/longevity-cellular). Each range page explains how its compounds differ from one another.",
        "If you are deciding between two compounds, the guides do that work first. [Retatrutide against tirzepatide and semaglutide](/guides/retatrutide-vs-tirzepatide-vs-semaglutide) sets out the receptor differences, [BPC-157 and TB-500](/guides/bpc-157-vs-tb-500) covers the repair pair, and [how to read a certificate of analysis](/guides/how-to-read-a-certificate-of-analysis) explains what a batch document does and does not tell you.",
      ],
    },
  ],
  faqs: COMMON_FAQS,
  relatedGuides: [
    "how-to-read-a-certificate-of-analysis",
    "peptide-storage-guide",
    "how-to-reconstitute-peptides",
  ],
};

const SECTION: Record<string, CategoryContent> = {
  "weight-metabolic": {
    lede: "Weight loss, fat loss and appetite control peptides: incretin, amylin and mitochondrial compounds, grouped by the receptors they act on.",
    blocks: [
      {
        heading: "Weight loss peptides and how they differ",
        paragraphs: [
          "This range covers the incretin receptor agonists that dominate the current literature: the GLP-1 receptor agonist [semaglutide](/product/semaglutide), the dual GIP and GLP-1 agonist [tirzepatide](/product/tirzepatide) and the triple agonist [retatrutide](/product/retatrutide). Alongside them sit the amylin analogue [cagrilintide](/product/cagrilintide), the growth hormone fragment [AOD-9604](/product/aod-9604) and its parent fragment [176-191](/product/hgh-fragment-176-191), the NNMT inhibitor [5-Amino-1MQ](/product/5-amino-1mq) and the mitochondrial-derived peptide [MOTS-c](/product/mots-c).",
          "Each compound page sets out which receptors the molecule acts at and how it differs from its nearest relatives, with references to the primary literature, so you can pick the right compound for a comparison.",
        ],
      },
      {
        heading: "Fat loss, appetite and metabolism",
        paragraphs: [
          "The incretins work on appetite signalling and gastric emptying. Cagrilintide acts on the amylin pathway, which is the satiety side of the same picture. AOD-9604 and the 176-191 fragment are growth hormone fragments studied for lipolysis rather than for growth. 5-Amino-1MQ and MOTS-c sit on the metabolic side: NNMT inhibition and mitochondrial peptide signalling respectively.",
          "That split is why the range is listed together. If you want the appetite route, look at the incretins and cagrilintide. If you want the fat oxidation or metabolic route, look at the fragments, 5-Amino-1MQ and MOTS-c. Both routes are also browsable as the [metabolic research category](/category/metabolic-research), which lists the same compounds by receptor family.",
        ],
      },
      {
        heading: "Comparing strengths and cost per mg",
        paragraphs: [
          "Most compounds in this range are offered in several vial strengths. The card shows the lowest price; the product page lists every strength and its cost per mg. Larger vials generally have a lower cost per mg and suit anyone drawing repeated aliquots from a single preparation.",
          "Each strength has its own page as well as a row on the parent page, so a [10mg retatrutide vial](/product/retatrutide-10mg) can be compared with the 20mg and 30mg sizes directly rather than through a price table.",
        ],
      },
      {
        heading: "Choosing between the incretins",
        paragraphs: [
          "The single, dual and triple receptor compounds are the three the literature compares most directly. [Retatrutide against tirzepatide and semaglutide](/guides/retatrutide-vs-tirzepatide-vs-semaglutide) works through the receptor differences and the trial results behind each, and [retatrutide against tirzepatide](/guides/retatrutide-vs-tirzepatide) narrows it to the pair most often weighed against each other.",
          "If you want the background on one compound in detail, [what to check when buying retatrutide in the UK](/guides/buy-retatrutide-uk) covers the strengths listed, the batch documentation and how to verify it.",
        ],
      },
    ],
    faqs: [
      [
        "Which of these is a GLP-1 agonist?",
        "Semaglutide acts at the GLP-1 receptor alone. Tirzepatide adds GIP receptor activity and retatrutide adds glucagon receptor activity as well. The comparison guides set out the three receptor profiles side by side.",
      ],
      ...COMMON_FAQS,
    ],
    relatedGuides: [
      "retatrutide-vs-tirzepatide-vs-semaglutide",
      "retatrutide-vs-tirzepatide",
      "buy-retatrutide-uk",
      "peptide-storage-guide",
    ],
  },
  "copper-blends": {
    lede: "Skin, collagen and hair peptides: the copper tripeptide GHK-Cu, on its own and in the GLOW and KLOW combination vials.",
    blocks: [
      {
        heading: "GHK-Cu and copper peptide blends",
        paragraphs: [
          "[GHK-Cu](/product/ghk-cu) is the naturally occurring tripeptide glycyl-L-histidyl-L-lysine complexed with copper. It is used in skin, wound model and gene expression work. [GLOW](/product/glow) combines GHK-Cu with BPC-157 and TB-500 in a single lyophilised vial; [KLOW](/product/klow) adds KPV to the same base.",
          "Blends are prepared as one batch, so every component comes from the same preparation. The composition of each vial is printed on the product page and on the batch documentation.",
        ],
      },
      {
        heading: "Choosing between the single compound and a blend",
        paragraphs: [
          "The single-compound vial suits work that isolates copper peptide activity. The blends suit anyone already combining these peptides who wants a fixed ratio. Ratios and total content are stated on each blend page.",
          "GHK-Cu is offered in 50mg and 100mg vials, and it is the one compound here that does not give a clear solution: the copper complex turns the reconstituted vial blue. That is expected rather than a sign of a problem, and the [reconstitution guide](/guides/how-to-reconstitute-peptides) notes it at the relevant step.",
        ],
      },
      {
        heading: "Where the repair peptides are listed",
        paragraphs: [
          "BPC-157, TB-500, KPV and the Wolverine Stack sit in [recovery and repair](/collections/recovery-repair), which covers the tissue repair side of the catalogue. This range keeps the copper compounds and the blends together because that is how they are usually compared.",
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
    relatedGuides: ["how-to-reconstitute-peptides", "peptide-storage-guide", "bpc-157-vs-tb-500"],
  },
  "brain-focus": {
    lede: "Focus, memory and mood peptides: the synthetic heptapeptide Semax and the related anxiolytic-class peptide Selank.",
    blocks: [
      {
        heading: "Semax and Selank",
        paragraphs: [
          "[Semax](/product/semax) is a heptapeptide built on the ACTH(4-7) fragment with a Pro-Gly-Pro tail that slows enzymatic breakdown, and it has no activity at adrenal receptors. [Selank](/product/selank) applies the same stabilising tail to tuftsin, an immunomodulatory tetrapeptide derived from immunoglobulin G. Both come out of the same Russian neuropeptide research programme, which is why they are read together.",
          "The [Selank and Semax blend](/product/selank-semax) supplies both in one vial at a fixed ratio for work that uses the pair rather than either compound alone. Each single page sets out the sequence, molecular formula and the published work on that compound; the blend page lists the composition of the vial.",
        ],
      },
      {
        heading: "Sequences and what they tell you",
        paragraphs: [
          "Semax is Met-Glu-His-Phe-Pro-Gly-Pro. Selank is Thr-Lys-Pro-Arg-Pro-Gly-Pro. The shared Pro-Gly-Pro tripeptide is the stability element in both; the differences at the N-terminus are what separate an ACTH fragment analogue from a tuftsin analogue.",
          "Neither compound is a stimulant in the pharmacological sense, and neither page makes a claim about cognition. The pages describe what has been published, with references, and leave the reading to you.",
        ],
      },
      {
        heading: "Where else these appear",
        paragraphs: [
          "Both compounds are also catalogued in [longevity research](/category/longevity-research) and DSIP sits in [sleep](/collections/sleep), so a neuropeptide comparison does not have to be assembled from three separate ranges. Reconstitution and storage follow the same handling as any other lyophilised vial: see [how to reconstitute](/guides/how-to-reconstitute-peptides) and the [storage guide](/guides/peptide-storage-guide).",
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
    relatedGuides: [
      "how-to-reconstitute-peptides",
      "peptide-storage-guide",
      "how-long-do-reconstituted-peptides-last",
    ],
  },
  "growth-hormone": {
    lede: "Growth hormone, muscle growth and recovery peptides: GHRH analogues, ghrelin receptor agonists, IGF-1 LR3 and related compounds acting on the GH axis.",
    blocks: [
      {
        heading: "Two receptor systems",
        paragraphs: [
          "Growth hormone secretagogues act through two main routes. GHRH receptor agonists include [sermorelin](/product/sermorelin), [tesamorelin](/product/tesamorelin) and [CJC-1295 with](/product/cjc-1295-dac) and [without DAC](/product/cjc-1295-no-dac). Ghrelin receptor (GHS-R1a) agonists include [ipamorelin](/product/ipamorelin), [GHRP-2](/product/ghrp-2), [GHRP-6](/product/ghrp-6) and [hexarelin](/product/hexarelin). The range also carries [IGF-1 LR3](/product/igf-1-lr3), a long-acting IGF-1 analogue widely used as a cell culture growth factor, [MGF](/product/mgf) and [PEG-MGF](/product/peg-mgf), and [kisspeptin-10](/product/kisspeptin-10).",
          "The [Hulk Stack](/product/hulk-stack) and the [CJC-1295 and ipamorelin blend](/product/cjc-1295-ipamorelin) combine a GHRH analogue with a ghrelin receptor agonist in one vial, the pairing most often used when both routes are wanted at once.",
        ],
      },
      {
        heading: "DAC or no DAC",
        paragraphs: [
          "CJC-1295 is offered with and without the drug affinity complex (DAC). The DAC version binds serum albumin and has a far longer half-life in published pharmacokinetic work; the version without DAC (also called modified GRF 1-29) is short-acting. The two product pages compare them directly.",
          "The same split runs through the rest of the range. Tesamorelin and sermorelin are both GHRH analogues, but tesamorelin carries a trans-3-hexenoic acid group that protects it from cleavage, so its published half-life is longer. Those differences are set out on the individual pages rather than in a single table.",
        ],
      },
      {
        heading: "Strength and pack sizes",
        paragraphs: [
          "Most secretagogues here are listed in more than one strength, and the price per mg drops as the vial gets larger. Tesamorelin is a useful example: the [10mg vial](/product/tesamorelin-10mg) and the 20mg vial are separate pages with the same specifications, so the only variable is the amount in the vial.",
        ],
      },
      {
        heading: "Before you compare",
        paragraphs: [
          "Every vial is lyophilised, so reconstitution and cold storage apply to all of them. [How to reconstitute lyophilised peptides](/guides/how-to-reconstitute-peptides) covers the method and the concentration maths, and the [storage guide](/guides/peptide-storage-guide) covers what happens to the powder and the solution afterwards.",
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
    relatedGuides: [
      "how-to-reconstitute-peptides",
      "peptide-storage-guide",
      "how-long-do-reconstituted-peptides-last",
    ],
  },
  "recovery-repair": {
    lede: "Recovery and repair peptides for tendon, joint, muscle and gut work: BPC-157, TB-500, KPV, LL-37, ARA-290 and the Wolverine blend.",
    blocks: [
      {
        heading: "Peptides used in tissue repair work",
        paragraphs: [
          "[BPC-157](/product/bpc-157) is a 15-amino-acid fragment of body protection compound, and [TB-500](/product/tb-500) is a fragment of thymosin beta-4. [KPV](/product/kpv) is the C-terminal tripeptide of alpha-MSH, [LL-37](/product/ll-37) is the human cathelicidin antimicrobial peptide and [ARA-290](/product/ara-290) is an erythropoietin-derived peptide. [SNAP-8](/product/snap-8) is an octapeptide. The linked product pages describe the research literature for each compound.",
          "The [Wolverine Stack](/product/wolverine-stack) combines BPC-157 and TB-500 in one vial for anyone using the pair together.",
        ],
      },
      {
        heading: "Reading the literature",
        paragraphs: [
          "Most published work on these compounds is preclinical. Each product page summarises the models used and links to the original papers on PubMed so the evidence base can be read directly rather than through a marketing summary.",
          "Two guides go further than the product pages. [BPC-157 and TB-500 compared](/guides/bpc-157-vs-tb-500) works through the fragments, the actin-binding domain that distinguishes TB-500 from full thymosin beta-4, and where the published models differ. [Peptide purity testing](/guides/peptide-purity-testing) explains what HPLC and mass spectrometry measure, which matters when two suppliers list the same compound at very different prices.",
        ],
      },
      {
        heading: "Single compounds and blends",
        paragraphs: [
          "The single-compound vials are the right starting point for isolating one mechanism. The blends (Wolverine Stack, [GLOW](/product/glow) and [KLOW](/product/klow)) fix the ratio of two or more compounds in one preparation, which removes the need to combine vials but gives up the ability to vary the ratio. The blends are listed together in [peptide blends](/category/peptide-blends).",
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
    relatedGuides: ["bpc-157-vs-tb-500", "peptide-purity-testing", "peptide-storage-guide"],
  },
  "longevity-cellular": {
    lede: "Anti-ageing, energy and longevity compounds: NAD+, SS-31, epithalon, the thymic peptides and other compounds in the ageing literature.",
    blocks: [
      {
        heading: "Compounds in the longevity range",
        paragraphs: [
          "The range covers the coenzyme [NAD+](/product/nad-plus), the mitochondria-targeted tetrapeptide [SS-31](/product/ss-31) (elamipretide), the pineal tetrapeptides [epithalon](/product/epithalon) and [pinealon](/product/pinealon), the thymic peptides [thymosin alpha-1](/product/thymosin-alpha-1) and [thymalin](/product/thymalin), the tripeptide [glutathione](/product/glutathione), the nonapeptide [oxytocin](/product/oxytocin) and the Semax derivative [adamax](/product/adamax).",
          "They are grouped here because they appear together in the ageing, mitochondrial function and immunosenescence literature, not because they share a mechanism. Each product page explains the specific pathway the compound acts on.",
        ],
      },
      {
        heading: "Three different routes to the same question",
        paragraphs: [
          "NAD+ is a coenzyme consumed as a substrate by sirtuins, PARPs and CD38, so the literature around it is about redox balance and DNA repair signalling. SS-31 works physically, binding cardiolipin on the inner mitochondrial membrane, and is studied for cristae structure and electron transport. The tetrapeptides epithalon and pinealon come from the pineal bioregulator programme, and thymosin alpha-1 and thymalin come from the thymic one.",
          "Working out which of those lines a paper sits in is most of the job when comparing them. The overview on each page names the pathway and the model used.",
        ],
      },
      {
        heading: "Handling and formats",
        paragraphs: [
          "Every compound here arrives as a lyophilised powder in a sealed vial and is reconstituted the same way. NAD+ is offered in 500mg and 1000mg vials, the largest in the catalogue, which changes the solvent volume needed rather than the method. The [reconstitution guide](/guides/how-to-reconstitute-peptides) and the [calculator](/calculator) both handle the larger vial sizes.",
          "Neuropeptides such as Semax, Selank and DSIP are catalogued in [longevity research](/category/longevity-research) alongside these compounds and browsable in [brain and focus](/collections/brain-focus) and [sleep](/collections/sleep).",
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
    relatedGuides: [
      "how-to-reconstitute-peptides",
      "peptide-storage-guide",
      "how-long-do-reconstituted-peptides-last",
    ],
  },
  "tanning-libido": {
    lede: "Tanning and libido peptides: Melanotan 1, Melanotan 2 and PT-141, alpha-MSH analogues with different melanocortin receptor profiles.",
    blocks: [
      {
        heading: "Three melanocortin receptor agonists",
        paragraphs: [
          "[Melanotan 1](/product/melanotan-1) (afamelanotide) is a linear alpha-MSH analogue selective for MC1R. [Melanotan 2](/product/melanotan-2) is a cyclic analogue active across several melanocortin receptors. [PT-141](/product/pt-141) (bremelanotide) is a metabolite of Melanotan 2 acting mainly at MC4R. They are the three melanocortin receptor agonists in the catalogue.",
          "Receptor selectivity is the whole comparison. MC1R is the pigmentation receptor; MC4R is the one the PT-141 literature is built around. Melanotan 2 sits across the family, which is why it appears in both conversations and why its side effect profile in the published work is broader.",
        ],
      },
      {
        heading: "How the three are supplied",
        paragraphs: [
          "All three are lyophilised powders in sealed vials, and all three need the same reconstitution and cold storage as any other peptide here. The [reconstitution guide](/guides/how-to-reconstitute-peptides) covers the method and the [storage guide](/guides/peptide-storage-guide) covers what changes once the vial is in solution.",
          "The comparison guide goes through the structural differences between the two Melanotans and the receptor assays behind them, which is a faster read than three product pages if that is the decision in front of you.",
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
    relatedGuides: [
      "melanotan-1-vs-melanotan-2",
      "how-to-reconstitute-peptides",
      "peptide-storage-guide",
    ],
  },
  sleep: {
    lede: "Sleep peptides: delta sleep-inducing peptide (DSIP), a nonapeptide acting on sleep physiology.",
    blocks: [
      {
        heading: "DSIP",
        paragraphs: [
          "[DSIP](/product/dsip) was first isolated from rabbit cerebral venous blood in the 1970s and is used in electroencephalographic sleep models and in work on several neuroendocrine pathways. The product page carries its CAS number, sequence and references.",
          "The sequence is Trp-Ala-Gly-Gly-Asp-Ala-Ser-Gly-Glu. It is supplied in 5mg and 10mg vials as a lyophilised powder.",
        ],
      },
      {
        heading: "Why the range is a single compound",
        paragraphs: [
          "DSIP is the only sleep-specific compound in the catalogue. Everything else that touches sleep physiology sits in the neuropeptide ranges instead: [Selank](/product/selank) and [Semax](/product/semax) are in [brain and focus](/collections/brain-focus), and both are also catalogued in [longevity research](/category/longevity-research).",
          "Its receptor and exact physiological role remain unresolved in the published work, which is why the product page sticks to what has been measured rather than to a mechanism claim. If you are comparing it with the neuropeptides, read the three pages together.",
        ],
      },
      {
        heading: "Handling",
        paragraphs: [
          "DSIP is a nonapeptide and behaves like the rest of the catalogue in the vial: reconstitute with [bacteriostatic water](/product/bacteriostatic-water), keep the solution cold and protect it from light. The [reconstitution guide](/guides/how-to-reconstitute-peptides) covers the steps, and [how long reconstituted peptides last](/guides/how-long-do-reconstituted-peptides-last) covers the storage window.",
        ],
      },
    ],
    faqs: COMMON_FAQS,
    relatedGuides: [
      "how-to-reconstitute-peptides",
      "how-long-do-reconstituted-peptides-last",
      "peptide-storage-guide",
    ],
  },
  "bacteriostatic-water": {
    lede: "Sterile water with 0.9% benzyl alcohol, the standard solvent for reconstituting a lyophilised vial.",
    blocks: [
      {
        heading: "Reconstitution solvent",
        paragraphs: [
          "Bacteriostatic water is sterile water containing 0.9% benzyl alcohol as a preservative, which lets a reconstituted vial be drawn from more than once. Use the [reconstitution calculator](/calculator) to work out the solvent volume for a target concentration.",
          "We supply it in a 10ml sealed vial. It is the same diluent used across the [reconstitution guide](/guides/how-to-reconstitute-peptides), and it is the solvent named in most published handling notes for multi-access vials.",
        ],
      },
      {
        heading: "When sterile water is the better choice",
        paragraphs: [
          "Benzyl alcohol is a preservative, and a preservative is only useful if a vial will be accessed more than once. Where a protocol calls for single-use aliquots, plain sterile water is the usual diluent instead. The guide covers both cases and the reason each is specified.",
          "If you are weighing up when to reconstitute at all, [how long reconstituted peptides last](/guides/how-long-do-reconstituted-peptides-last) covers the trade-off between stability in the dry powder and convenience in solution.",
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
    relatedGuides: [
      "how-to-reconstitute-peptides",
      "how-long-do-reconstituted-peptides-last",
      "peptide-storage-guide",
    ],
  },
};

const CATEGORY: Record<string, CategoryContent> = {
  "metabolic-research": {
    lede: "Metabolic research compounds grouped by receptor: incretin agonists, an amylin analogue, growth hormone fragments and mitochondrial peptides.",
    blocks: [
      {
        heading: "How this category is organised",
        paragraphs: [
          "This category lists the metabolic compounds by receptor family rather than by the outcome they are studied for. At the top sit the incretin agonists: [semaglutide](/product/semaglutide) at the GLP-1 receptor, [tirzepatide](/product/tirzepatide) at GIP and GLP-1, and [retatrutide](/product/retatrutide) at GIP, GLP-1 and glucagon. Below them are the amylin analogue [cagrilintide](/product/cagrilintide), the growth hormone fragments [AOD-9604](/product/aod-9604) and [176-191](/product/hgh-fragment-176-191), the NNMT inhibitor [5-Amino-1MQ](/product/5-amino-1mq) and the mitochondrial-derived peptide [MOTS-c](/product/mots-c).",
          "The same compounds are browsable as a shopping range in [weight and metabolic](/collections/weight-metabolic), where the copy is written around choosing a vial rather than around the receptor map. Both lead to the same product pages.",
        ],
      },
      {
        heading: "Receptor selectivity in one paragraph",
        paragraphs: [
          "Single, dual and triple agonism is the axis the literature moves along. Adding a receptor adds a mechanism, and the comparison guides set out what each addition does to the published results: [the three incretins side by side](/guides/retatrutide-vs-tirzepatide-vs-semaglutide) for the full picture, or [retatrutide against tirzepatide](/guides/retatrutide-vs-tirzepatide) if the glucagon receptor is the open question.",
          "The non-incretin compounds do not share that axis at all. Cagrilintide acts on amylin, AOD-9604 and 176-191 are growth hormone fragments, 5-Amino-1MQ inhibits NNMT and MOTS-c is a mitochondrial peptide. They are catalogued here because the published work on energy balance uses them, not because they compete with the incretins.",
        ],
      },
      {
        heading: "Specifications and documentation",
        paragraphs: [
          "Every page in this category carries the CAS number, molecular formula, molecular weight and the published references for the compound, plus each vial strength with its cost per mg. Where a certificate is published for a batch, the product page links it and it is listed in the [lab reports hub](/lab-reports).",
        ],
      },
    ],
    faqs: SECTION["weight-metabolic"]!.faqs,
    relatedGuides: [
      "retatrutide-vs-tirzepatide-vs-semaglutide",
      "retatrutide-vs-tirzepatide",
      "buy-retatrutide-uk",
    ],
  },
  "regenerative-research": {
    lede: "BPC-157, TB-500, GHK-Cu and related peptides used in tissue repair work.",
    blocks: [
      {
        heading: "The regenerative range",
        paragraphs: [
          "This category groups the peptides most widely used in tissue repair work: [BPC-157](/product/bpc-157), [TB-500](/product/tb-500), the copper tripeptide [GHK-Cu](/product/ghk-cu), [KPV](/product/kpv), [LL-37](/product/ll-37) and [ARA-290](/product/ara-290). Most published work uses cell culture and animal models; each product page summarises the models and links to the primary literature.",
          "For combination work see the [GLOW and KLOW blends](/product/glow) in the [peptide blends](/category/peptide-blends) category, or the [Wolverine Stack](/product/wolverine-stack) for the BPC-157 and TB-500 pair.",
        ],
      },
      {
        heading: "Where to read next",
        paragraphs: [
          "[BPC-157 against TB-500](/guides/bpc-157-vs-tb-500) is the comparison most of this category turns on, and [peptide purity testing](/guides/peptide-purity-testing) explains what the numbers on a batch document actually measure. The shopping view of the same compounds sits in [recovery and repair](/collections/recovery-repair).",
        ],
      },
    ],
    faqs: SECTION["recovery-repair"]!.faqs,
    relatedGuides: ["bpc-157-vs-tb-500", "peptide-purity-testing", "peptide-storage-guide"],
  },
  "gh-secretagogues": {
    lede: "Growth hormone secretagogues: GHRH analogues, ghrelin receptor agonists and IGF-1 LR3, grouped by receptor.",
    blocks: [
      {
        heading: "GHRH receptor or ghrelin receptor",
        paragraphs: [
          "Every compound in this category acts on one of two receptors. The GHRH receptor is targeted by [sermorelin](/product/sermorelin), [tesamorelin](/product/tesamorelin) and [CJC-1295](/product/cjc-1295-no-dac), with or without the drug affinity complex. The ghrelin receptor GHS-R1a is targeted by [ipamorelin](/product/ipamorelin), [GHRP-2](/product/ghrp-2), [GHRP-6](/product/ghrp-6) and [hexarelin](/product/hexarelin).",
          "Two blends combine the routes: the [Hulk Stack](/product/hulk-stack) pairs CJC-1295 DAC with ipamorelin, and the [CJC-1295 and ipamorelin blend](/product/cjc-1295-ipamorelin) pairs the same two compounds. Growth factors sit outside both receptor systems: [IGF-1 LR3](/product/igf-1-lr3), [MGF](/product/mgf) and [PEG-MGF](/product/peg-mgf) act downstream of the receptor, and [kisspeptin-10](/product/kisspeptin-10) is catalogued here for its place in the reproductive hormone axis.",
        ],
      },
      {
        heading: "How to compare them",
        paragraphs: [
          "Half-life is the first difference to establish. CJC-1295 with DAC binds serum albumin and lasts far longer than the version without it, and tesamorelin carries a group that protects it from cleavage compared with sermorelin. Those facts are on the individual pages with the pharmacokinetic references.",
          "The second difference is selectivity. GHRP-6 and hexarelin engage ghrelin receptor pathways that also drive appetite signalling in published work, where ipamorelin is the more selective of the group. Reading the two receptor families separately is faster than reading the whole category.",
        ],
      },
      {
        heading: "Handling",
        paragraphs: [
          "All of these are lyophilised vials. [How to reconstitute lyophilised peptides](/guides/how-to-reconstitute-peptides) covers the method, and the [storage guide](/guides/peptide-storage-guide) covers the powder and the solution.",
        ],
      },
    ],
    faqs: SECTION["growth-hormone"]!.faqs,
    relatedGuides: [
      "how-to-reconstitute-peptides",
      "peptide-storage-guide",
      "how-long-do-reconstituted-peptides-last",
    ],
  },
  "longevity-research": {
    lede: "NAD+, SS-31, epithalon, thymic peptides and neuropeptides in the ageing literature.",
    blocks: [
      {
        heading: "Cellular and mitochondrial compounds",
        paragraphs: [
          "The core of the category is the coenzyme [NAD+](/product/nad-plus), the cardiolipin-binding tetrapeptide [SS-31](/product/ss-31), the pineal tetrapeptides [epithalon](/product/epithalon) and [pinealon](/product/pinealon), the thymic peptides [thymosin alpha-1](/product/thymosin-alpha-1) and [thymalin](/product/thymalin), plus [glutathione](/product/glutathione), [oxytocin](/product/oxytocin) and [adamax](/product/adamax).",
          "These do not share a mechanism. NAD+ is a redox coenzyme and a substrate for sirtuins, PARPs and CD38; SS-31 interacts with cardiolipin on the inner mitochondrial membrane; the thymic peptides come from immune bioregulator work. Grouping them here follows the literature rather than a single pathway.",
        ],
      },
      {
        heading: "Neuropeptides",
        paragraphs: [
          "The category also includes [DSIP](/product/dsip), [Semax](/product/semax) and [Selank](/product/selank), which act on sleep physiology and neurochemistry rather than ageing directly but are catalogued here for historical reasons. They are also browsable in the [brain and focus](/collections/brain-focus) and [sleep](/collections/sleep) ranges.",
          "For the vial-buying view of the cellular compounds, the [longevity and cellular](/collections/longevity-cellular) range page is the shorter read.",
        ],
      },
    ],
    faqs: SECTION["longevity-cellular"]!.faqs,
    relatedGuides: [
      "how-to-reconstitute-peptides",
      "peptide-storage-guide",
      "how-long-do-reconstituted-peptides-last",
    ],
  },
  "pigmentation-research": {
    lede: "Melanocortin receptor agonists: Melanotan 1, Melanotan 2 and PT-141.",
    blocks: [
      {
        heading: "Receptor selectivity",
        paragraphs: [
          "[Melanotan 1](/product/melanotan-1) is a linear alpha-MSH analogue selective for MC1R, the receptor behind melanogenesis. [Melanotan 2](/product/melanotan-2) is cyclic and active across MC3R, MC4R and MC5R as well as MC1R in published receptor assays, which is why it appears in both pigment and libido work. [PT-141](/product/pt-141) is a Melanotan 2 metabolite acting mainly at MC4R.",
          "That makes this category a small, clean set of tool compounds for melanocortin pharmacology: one selective agonist, one broad one and one metabolite with a shifted receptor preference.",
        ],
      },
      {
        heading: "Reading and handling",
        paragraphs: [
          "[Melanotan 1 against Melanotan 2](/guides/melanotan-1-vs-melanotan-2) covers the structural differences and what the receptor assays show. All three are lyophilised vials reconstituted with [bacteriostatic water](/product/bacteriostatic-water); see the [reconstitution guide](/guides/how-to-reconstitute-peptides) for the method.",
          "The shopping view of the same three compounds is [tanning and libido](/collections/tanning-libido).",
        ],
      },
    ],
    faqs: SECTION["tanning-libido"]!.faqs,
    relatedGuides: ["melanotan-1-vs-melanotan-2", "how-to-reconstitute-peptides"],
  },
  "peptide-blends": {
    lede: "Two or more peptides in one lyophilised vial, prepared as a single batch.",
    blocks: [
      {
        heading: "Why blends",
        paragraphs: [
          "A blend puts a fixed ratio of peptides into one vial so every component comes from the same preparation and batch. [GLOW](/product/glow) combines GHK-Cu, BPC-157 and TB-500; [KLOW](/product/klow) adds KPV; the [Wolverine Stack](/product/wolverine-stack) pairs BPC-157 and TB-500; the [Hulk Stack](/product/hulk-stack) pairs CJC-1295 DAC with ipamorelin. Composition and total content are printed on each product page.",
          "A blend has a fixed component ratio, while separate single-compound vials are listed as distinct research materials. Each blend page links to its constituent compounds for comparison.",
        ],
      },
      {
        heading: "Checking what is in the vial",
        paragraphs: [
          "A blend page states the total content and the amount of each component for every strength offered. That is the number to compare across suppliers, because two 70mg blends can split 70mg very differently. [How to read a certificate of analysis](/guides/how-to-read-a-certificate-of-analysis) covers what the batch document for a blend can and cannot confirm about the individual components.",
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
    relatedGuides: [
      "how-to-read-a-certificate-of-analysis",
      "bpc-157-vs-tb-500",
      "peptide-purity-testing",
    ],
  },
  "lab-supplies": {
    lede: "Lab supplies for handling a lyophilised vial: bacteriostatic water, the diluent most reconstitution protocols name.",
    blocks: [
      {
        heading: "What we stock",
        paragraphs: [
          "The lab supplies category holds [bacteriostatic water](/product/bacteriostatic-water): sterile water with 0.9% benzyl alcohol, supplied in 10ml sealed vials. It is the diluent used throughout our [reconstitution guide](/guides/how-to-reconstitute-peptides) and the one named in most published handling notes for vials that will be accessed more than once.",
          "Syringes, wipes and other consumables are deliberately not listed. They are available from any laboratory supplier and do not belong in a catalogue of research compounds.",
        ],
      },
      {
        heading: "Working out the volume",
        paragraphs: [
          "The [reconstitution calculator](/calculator) takes the vial content and a target concentration and returns the diluent volume. The maths is also worked through by hand in the guide if you want to check it, and [how long reconstituted peptides last](/guides/how-long-do-reconstituted-peptides-last) covers what happens to the preparation after that.",
        ],
      },
    ],
    faqs: SECTION["bacteriostatic-water"]!.faqs,
    relatedGuides: [
      "how-to-reconstitute-peptides",
      "how-long-do-reconstituted-peptides-last",
      "peptide-storage-guide",
    ],
  },
};

export const shopSeo = shopContent;
export const sectionSeo = (slug: string): CategoryContent => SECTION[slug] ?? shopContent;
export const categorySeo = (slug: string): CategoryContent => CATEGORY[slug] ?? shopContent;
