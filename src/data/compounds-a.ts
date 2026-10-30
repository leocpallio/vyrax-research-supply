import type { Compound } from "./types";

// Prices: benchmarked against live UK competitor listings scraped 28 Sep 2026
// (astralabs, ukpeptidelab, oplabs, proformapeptides, midshirelabs, crownpeptides, imperialpeptides,
// peptideslabuk, uk-peptides, pharmalabglobal, rndpeptides, my-peptides). See docs/pricing-basis.md.

export const metabolicAndRegenerative: Compound[] = [
  // ---------------------------------------------------------------- Metabolic research
  {
    slug: "retatrutide",
    name: "Retatrutide",
    aliases: ["LY3437943", "GLP-3", "triple agonist", "reta"],
    category: "metabolic-research",
    tags: ["Incretin", "Energy metabolism"],
    useCases: ["Weight Loss", "Fat Loss", "Appetite Control"],
    kind: "peptide",
    strengths: [
      { label: "10mg", amount: 10, unit: "mg", price: 59.99 },
      { label: "20mg", amount: 20, unit: "mg", price: 79.99 },
      { label: "30mg", amount: 30, unit: "mg", price: 109.99 },
    ],
    summary:
      "Retatrutide (LY3437943) is a synthetic triple agonist peptide acting at the GIP, GLP-1 and glucagon receptors. Supplied as a lyophilised powder in sealed vials.",
    overview: [
      "Retatrutide is a single-chain synthetic peptide developed as an agonist at three receptors: glucose-dependent insulinotropic polypeptide (GIP), glucagon-like peptide-1 (GLP-1) and glucagon (GCG). It is built on a GIP-based backbone carrying a fatty diacid that binds albumin and extends half-life.",
      "Phase 2 results were published in 2023 and phase 3 programmes are running, so the literature is growing fast. It acts at all three receptors at once, which makes it the comparator of choice against dual and single receptor agonists.",
    ],
    applications: [
      "Triple-receptor (GIP, GLP-1, glucagon) signalling",
      "Energy expenditure and substrate use in rodent models",
      "Hepatic lipid metabolism",
      "Comparison against tirzepatide and semaglutide",
    ],
    compare: {
      slug: "tirzepatide",
      text: "Tirzepatide acts at two receptors (GIP and GLP-1). Retatrutide adds glucagon receptor agonism, which is the main focus of comparative studies between the two.",
    },
  },
  {
    slug: "tirzepatide",
    name: "Tirzepatide",
    aliases: ["GLP-2", "dual agonist", "tirz", "LY3298176"],
    category: "metabolic-research",
    tags: ["Incretin", "Glucose metabolism"],
    useCases: ["Weight Loss", "Fat Loss", "Appetite Control"],
    kind: "peptide",
    strengths: [
      { label: "10mg", amount: 10, unit: "mg", price: 54.99 },
      { label: "20mg", amount: 20, unit: "mg", price: 64.99 },
      { label: "30mg", amount: 30, unit: "mg", price: 84.99 },
      { label: "40mg", amount: 40, unit: "mg", price: 99.99 },
      { label: "60mg", amount: 60, unit: "mg", price: 139.99 },
    ],
    summary:
      "Tirzepatide is a 39-amino-acid dual agonist peptide acting at the GIP and GLP-1 receptors. Supplied as a lyophilised powder in sealed vials.",
    overview: [
      "Tirzepatide is a linear 39-amino-acid peptide based on the native GIP sequence and modified with a C20 fatty diacid moiety, which enables albumin binding and a prolonged half-life. It is an agonist at both the GIP and GLP-1 receptors, with greater affinity for the GIP receptor.",
      "It has one of the largest published literatures of any incretin peptide, covering glycaemic, body weight and lipid endpoints. It is the usual reference dual agonist when comparing single, dual and triple receptor pharmacology.",
    ],
    applications: [
      "Dual incretin (GIP and GLP-1) pharmacology",
      "Insulin secretion and beta-cell function",
      "Adipose tissue and lipid metabolism",
      "Comparator against semaglutide and retatrutide",
    ],
    compare: {
      slug: "semaglutide",
      text: "Semaglutide is a selective GLP-1 receptor agonist. Tirzepatide adds GIP receptor agonism, so the pair is often used to separate GLP-1 effects from combined incretin effects.",
    },
  },
  {
    slug: "semaglutide",
    name: "Semaglutide",
    aliases: ["GLP-1", "sema", "GLP-1 analogue"],
    category: "metabolic-research",
    tags: ["Incretin", "Appetite signalling"],
    useCases: ["Weight Loss", "Appetite Control", "Blood Sugar"],
    kind: "peptide",
    strengths: [
      { label: "10mg", amount: 10, unit: "mg", price: 34.99 },
      { label: "20mg", amount: 20, unit: "mg", price: 59.99 },
      { label: "30mg", amount: 30, unit: "mg", price: 79.99 },
    ],
    summary:
      "Semaglutide is a long-acting GLP-1 receptor agonist peptide with 94% sequence homology to native GLP-1. Supplied as a lyophilised powder.",
    overview: [
      "Semaglutide is a GLP-1 analogue with two amino acid substitutions (Aib at position 8 and Arg at position 34) and a C18 fatty diacid attached through a linker at lysine 26. These modifications protect it from DPP-4 degradation and promote albumin binding, giving it a long half-life.",
      "It has an extensive literature on GLP-1 receptor signalling, appetite regulation and glucose homeostasis, and is the benchmark GLP-1 receptor agonist in comparative work.",
    ],
    applications: [
      "GLP-1 signalling and desensitisation",
      "Glucose-stimulated insulin secretion",
      "Central appetite regulation in animal models",
      "Benchmark comparator in incretin work",
    ],
    compare: {
      slug: "tirzepatide",
      text: "Tirzepatide acts at the GIP and GLP-1 receptors, whereas semaglutide is selective for the GLP-1 receptor.",
    },
  },
  {
    slug: "cagrilintide",
    name: "Cagrilintide",
    aliases: ["amylin analogue", "cagri", "NN9838"],
    category: "metabolic-research",
    tags: ["Amylin", "Satiety signalling"],
    useCases: ["Weight Loss", "Appetite Control", "Satiety"],
    kind: "peptide",
    strengths: [{ label: "5mg", amount: 5, unit: "mg", price: 39.99 }],
    summary:
      "Cagrilintide is a long-acting acylated amylin analogue acting at the amylin and calcitonin receptors. Supplied as a lyophilised powder.",
    overview: [
      "Cagrilintide is a lipidated analogue of amylin designed for an extended duration of action. It acts as a non-selective agonist at amylin receptors and at the calcitonin receptor.",
      "It acts on satiety signalling and is usually bought alongside semaglutide, where the complementary amylin and GLP-1 pathways are worked together.",
    ],
    applications: [
      "Amylin and calcitonin receptor pharmacology",
      "Satiety and gastric emptying in animal models",
      "Combination with GLP-1 receptor agonists",
    ],
    compare: {
      slug: "semaglutide",
      text: "Semaglutide targets the GLP-1 receptor, cagrilintide targets amylin receptors, and the two are frequently studied in combination.",
    },
  },
  {
    slug: "aod-9604",
    name: "AOD-9604",
    aliases: ["AOD9604", "hGH fragment 176-191", "Tyr-hGH 177-191"],
    category: "metabolic-research",
    tags: ["Lipid metabolism", "GH fragment"],
    useCases: ["Fat Loss", "Weight Loss", "Lipolysis"],
    kind: "peptide",
    strengths: [
      { label: "5mg", amount: 5, unit: "mg", price: 34.99 },
      { label: "10mg", amount: 10, unit: "mg", price: 44.99 },
    ],
    summary:
      "AOD-9604 is a modified 16-amino-acid fragment of the C-terminal region of human growth hormone, residues 177 to 191 with an added N-terminal tyrosine.",
    overview: [
      "AOD-9604 is a modified fragment from the C-terminal end of human growth hormone. It isolates the lipolytic activity of that region from the growth-promoting and insulin effects of the full hormone.",
      "Published work covers lipid metabolism in animal models and adipocytes, cartilage in animal models, and analytical detection.",
    ],
    applications: [
      "Lipolysis and lipogenesis in adipocyte models",
      "GH fragment structure-activity",
      "Cartilage and joint tissue in animal models",
      "Analytical detection and metabolism",
    ],
    compare: {
      slug: "tesamorelin",
      text: "Tesamorelin is a GHRH analogue that acts upstream at the pituitary, while AOD-9604 is a fragment of growth hormone itself.",
    },
  },
  {
    slug: "5-amino-1mq",
    name: "5-Amino-1MQ",
    aliases: ["5-amino-1-methylquinolinium", "NNMT inhibitor"],
    category: "metabolic-research",
    tags: ["NNMT", "NAD+ metabolism"],
    useCases: ["Fat Loss", "Metabolism", "Weight Loss"],
    kind: "small-molecule",
    form: "Powder (iodide salt)",
    appearance: "Red-brown to dark brown solid",
    strengths: [
      { label: "50mg", amount: 50, unit: "mg", price: 39.99 },
      { label: "10mg", amount: 10, unit: "mg", price: 29.99 },
    ],
    summary:
      "5-Amino-1MQ is a small-molecule, membrane-permeable inhibitor of nicotinamide N-methyltransferase (NNMT). Supplied as a lyophilised powder.",
    overview: [
      "5-Amino-1-methylquinolinium is a small molecule rather than a peptide. It inhibits nicotinamide N-methyltransferase (NNMT), an enzyme that methylates nicotinamide and is highly expressed in adipose tissue and liver.",
      "NNMT sits where NAD+ salvage and methyl donor metabolism meet, so inhibitors are used to probe cellular energy metabolism and adipocyte biology.",
    ],
    applications: [
      "NNMT enzyme inhibition",
      "Adipocyte metabolism in vitro",
      "NAD+ salvage pathway",
      "Diet-induced obesity in rodents",
    ],
    compare: {
      slug: "nad-plus",
      text: "NAD+ is the coenzyme itself. 5-Amino-1MQ is used to study NNMT, one of the enzymes that influences NAD+ availability.",
    },
  },
  {
    slug: "mots-c",
    name: "MOTS-c",
    aliases: ["mitochondrial derived peptide", "MOTSc"],
    category: "metabolic-research",
    tags: ["Mitochondria", "AMPK signalling"],
    useCases: ["Metabolism", "Fat Loss", "Energy"],
    kind: "peptide",
    strengths: [
      { label: "10mg", amount: 10, unit: "mg", price: 24.99 },
      { label: "40mg", amount: 40, unit: "mg", price: 69.99 },
    ],
    summary:
      "MOTS-c is a 16-amino-acid mitochondrial-derived peptide encoded within the 12S rRNA gene. Supplied as a lyophilised powder in sealed vials.",
    overview: [
      "MOTS-c (mitochondrial open reading frame of the 12S rRNA type-c) is a mitochondrial-derived peptide first described in 2015. It is encoded by a short open reading frame in the mitochondrial genome and moves to the nucleus under metabolic stress.",
      "It is linked to AMPK signalling, skeletal muscle glucose metabolism and metabolic ageing, largely in cell and rodent models.",
    ],
    applications: [
      "Mitochondrial-derived peptide signalling",
      "AMPK pathway activation",
      "Skeletal muscle glucose uptake in rodents",
      "Metabolic ageing",
    ],
    compare: {
      slug: "ss-31",
      text: "SS-31 acts directly on the inner mitochondrial membrane, while MOTS-c is a signalling peptide encoded by mitochondrial DNA.",
    },
  },

  // ---------------------------------------------------------------- Regenerative research
  {
    slug: "bpc-157",
    name: "BPC-157",
    aliases: ["body protection compound", "BPC 157", "pentadecapeptide"],
    category: "regenerative-research",
    tags: ["Tissue repair", "Gut"],
    useCases: ["Recovery & Repair", "Gut Health", "Tendon & Joint"],
    kind: "peptide",
    strengths: [
      { label: "5mg", amount: 5, unit: "mg", price: 16.99 },
      { label: "10mg", amount: 10, unit: "mg", price: 29.99 },
    ],
    summary:
      "BPC-157 is a synthetic 15-amino-acid peptide based on a sequence found in gastric juice. Supplied as a lyophilised powder in sealed vials.",
    overview: [
      "BPC-157 (Body Protection Compound 157) is a pentadecapeptide with the sequence Gly-Glu-Pro-Pro-Pro-Gly-Lys-Pro-Ala-Asp-Asp-Ala-Gly-Leu-Val. It is a partial sequence of a protein found in gastric juice, and is notable for its stability in gastric conditions.",
      "Most published work is in animal models, covering tendon, ligament, muscle and gastrointestinal injury, angiogenesis and the nitric oxide system. Human clinical data remain very limited.",
    ],
    applications: [
      "Tendon and ligament healing in rodents",
      "Gastrointestinal mucosa",
      "Angiogenesis and VEGF signalling",
      "Nitric oxide system interaction",
    ],
    compare: {
      slug: "tb-500",
      text: "TB-500 relates to thymosin beta-4 and actin regulation, whereas BPC-157 is a gastric-derived pentadecapeptide. The two are often studied side by side, and are combined in the Wolverine Stack.",
    },
  },
  {
    slug: "tb-500",
    name: "TB-500",
    aliases: ["thymosin beta-4", "thymosin beta 4", "TB4", "Tβ4"],
    category: "regenerative-research",
    tags: ["Tissue repair", "Cell migration"],
    useCases: ["Recovery & Repair", "Flexibility", "Muscle Repair"],
    kind: "peptide",
    strengths: [
      { label: "5mg", amount: 5, unit: "mg", price: 23.99 },
      { label: "10mg", amount: 10, unit: "mg", price: 39.99 },
    ],
    summary:
      "TB-500 is the name used for synthetic thymosin beta-4, a 43-amino-acid peptide involved in actin regulation and cell migration. Lyophilised powder.",
    overview: [
      "Thymosin beta-4 is a naturally occurring 43-amino-acid peptide present in most human and animal cells. Its best characterised role is binding G-actin, which regulates actin polymerisation and cell migration.",
      "Its literature spans wound repair, corneal injury, cardiac tissue and angiogenesis, predominantly in animal and cell models.",
      "The name TB-500 is also used for the shorter actin-binding fragment Ac-LKKTETQ (thymosin beta-4 17-23). The specifications on this page refer to full-length thymosin beta-4; the molecular weight reported on the batch certificate confirms which form a batch contains.",
    ],
    applications: [
      "Actin sequestration and cell migration",
      "Wound repair and angiogenesis in animals",
      "Corneal and cardiac tissue",
      "Comparison alongside BPC-157",
    ],
    compare: {
      slug: "bpc-157",
      text: "BPC-157 is a 15-amino-acid gastric-derived peptide, while TB-500 is the 43-amino-acid actin-binding thymosin beta-4. They are studied through different mechanisms.",
    },
  },
  {
    slug: "ghk-cu",
    name: "GHK-Cu",
    aliases: ["copper peptide", "copper tripeptide", "glycyl-histidyl-lysine"],
    category: "regenerative-research",
    tags: ["Skin", "Tissue remodelling"],
    useCases: ["Skin & Anti-Ageing", "Collagen", "Hair Growth"],
    kind: "peptide",
    appearance: "Blue lyophilised powder",
    strengths: [
      { label: "50mg", amount: 50, unit: "mg", price: 23.99 },
      { label: "100mg", amount: 100, unit: "mg", price: 37.99 },
    ],
    summary:
      "GHK-Cu is the copper(II) complex of the naturally occurring tripeptide glycyl-L-histidyl-L-lysine. Supplied as a blue lyophilised powder.",
    overview: [
      "GHK is a tripeptide first identified in human plasma that has a high affinity for copper(II) ions. The GHK-Cu complex has been studied for its role in tissue remodelling, including effects on collagen and glycosaminoglycan synthesis in fibroblast cultures.",
      "Gene expression work has also looked at large sets of genes linked to repair and antioxidant pathways. It is widely used in dermatological and cosmetic science.",
    ],
    applications: [
      "Fibroblast collagen and elastin synthesis",
      "Copper binding and transport",
      "Skin models and wound repair",
      "Antioxidant and gene expression",
    ],
    compare: {
      slug: "glow",
      text: "GLOW combines GHK-Cu with BPC-157 and TB-500 in a single vial for combination studies.",
    },
  },
  {
    slug: "kpv",
    name: "KPV",
    aliases: ["Lys-Pro-Val", "alpha-MSH 11-13", "α-MSH fragment"],
    category: "regenerative-research",
    tags: ["Inflammation", "Gut"],
    useCases: ["Gut Health", "Recovery & Repair", "Inflammation"],
    kind: "peptide",
    strengths: [{ label: "10mg", amount: 10, unit: "mg", price: 28.99 }],
    summary:
      "KPV is the C-terminal tripeptide Lys-Pro-Val of alpha-melanocyte-stimulating hormone. Supplied as a lyophilised powder in sealed vials.",
    overview: [
      "KPV corresponds to residues 11 to 13 of α-MSH. It keeps much of the anti-inflammatory activity of the parent hormone without the pigmentary effects of melanocortin-1 receptor activation.",
      "Its uptake runs through the PepT1 transporter in intestinal epithelial cells, and delivery work has covered hydrogels and transdermal systems.",
    ],
    applications: [
      "Intestinal inflammation",
      "PepT1 transporter uptake",
      "Cytokine signalling in epithelial cells",
      "Drug delivery formulation",
    ],
    compare: {
      slug: "bpc-157",
      text: "BPC-157 is also studied in gastrointestinal models, but it is a 15-amino-acid gastric peptide rather than an α-MSH fragment.",
    },
  },
  {
    slug: "ll-37",
    name: "LL-37",
    aliases: ["cathelicidin", "hCAP18", "CAMP"],
    category: "regenerative-research",
    tags: ["Antimicrobial", "Innate immunity"],
    useCases: ["Immune Support", "Antimicrobial", "Gut Health"],
    kind: "peptide",
    strengths: [{ label: "5mg", amount: 5, unit: "mg", price: 29.99 }],
    summary:
      "LL-37 is the only human cathelicidin antimicrobial peptide, a 37-amino-acid cationic peptide cleaved from hCAP18. Lyophilised powder.",
    overview: [
      "LL-37 is released from its precursor protein hCAP18 and forms an amphipathic alpha-helix that interacts with microbial membranes. Beyond direct antimicrobial action it has immunomodulatory roles, including chemotaxis, neutrophil extracellular traps and epithelial repair.",
      "Its expression is regulated by vitamin D signalling, which makes it central to innate immunity work.",
    ],
    applications: [
      "Antimicrobial membrane interaction",
      "Innate immune signalling and chemotaxis",
      "Neutrophil extracellular traps (NETs)",
      "Wound and epithelial repair",
    ],
    compare: {
      slug: "kpv",
      text: "KPV is studied mainly for anti-inflammatory signalling, whereas LL-37 is primarily studied as an antimicrobial and immunomodulatory peptide.",
    },
  },
  {
    slug: "ara-290",
    name: "ARA-290",
    aliases: ["cibinetide", "ARA290", "helix B surface peptide"],
    category: "regenerative-research",
    tags: ["Innate repair receptor", "Neuropathy"],
    useCases: ["Nerve Repair", "Recovery & Repair", "Neuropathy"],
    kind: "peptide",
    strengths: [{ label: "10mg", amount: 10, unit: "mg", price: 24.99 }],
    summary:
      "ARA-290 (cibinetide) is an 11-amino-acid peptide modelled on erythropoietin that acts at the innate repair receptor. Lyophilised powder.",
    overview: [
      "ARA-290 is modelled on the helix B surface of erythropoietin (EPO). It engages the tissue-protective receptor complex formed by the EPO receptor and CD131 without stimulating red blood cell production.",
      "Its literature covers inflammation, neuropathy models and wound repair, including in diabetic animals.",
    ],
    applications: [
      "Innate repair receptor (EPOR, CD131) signalling",
      "Small-fibre neuropathy",
      "Inflammation",
      "Wound healing in diabetic animals",
    ],
    compare: {
      slug: "bpc-157",
      text: "Both are studied in tissue repair, but ARA-290 acts through the innate repair receptor, a mechanism distinct from BPC-157.",
    },
  },
];
