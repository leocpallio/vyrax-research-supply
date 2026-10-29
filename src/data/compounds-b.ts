import type { Compound } from "./types";

// Prices benchmarked against live UK competitor listings scraped 28 Sep 2026. See docs/pricing-basis.md.

export const secretagoguesToSupplies: Compound[] = [
  // ---------------------------------------------------------------- GH secretagogues
  {
    slug: "cjc-1295-no-dac",
    name: "CJC-1295 no-DAC",
    aliases: ["Mod GRF 1-29", "modified GRF (1-29)", "CJC-1295 without DAC"],
    category: "gh-secretagogues",
    tags: ["GHRH analogue", "Pulsatile GH"],
    useCases: ["Growth Hormone", "Muscle Growth", "Recovery"],
    kind: "peptide",
    strengths: [{ label: "5mg", amount: 5, unit: "mg", price: 24.99 }],
    summary:
      "CJC-1295 no-DAC (Modified GRF 1-29) is a 29-amino-acid GHRH analogue with four substitutions that improve stability. Lyophilised powder.",
    overview: [
      "Modified GRF (1-29) is based on the first 29 amino acids of growth hormone-releasing hormone, the shortest fully active fragment. Four substitutions (at positions 2, 8, 15 and 27) protect it against enzymatic degradation compared with native GRF (1-29).",
      "Without the drug affinity complex (DAC) it has a short half-life, so it gives a pulsatile GHRH signal. It is usually paired with a ghrelin receptor agonist such as ipamorelin.",
    ],
    applications: [
      "GHRH receptor activation",
      "Pulsatile GH release in animal models",
      "Combination with ghrelin receptor agonists",
      "Peptide stability and degradation",
    ],
    compare: {
      slug: "cjc-1295-dac",
      text: "The DAC version carries a lysine-linked maleimide group that binds albumin, giving a half-life of days rather than minutes. The no-DAC version is used where short, pulsatile signalling is wanted.",
    },
  },
  {
    slug: "cjc-1295-dac",
    name: "CJC-1295 DAC",
    aliases: ["CJC-1295 with DAC", "drug affinity complex"],
    category: "gh-secretagogues",
    tags: ["GHRH analogue", "Long-acting peptides"],
    useCases: ["Growth Hormone", "Muscle Growth", "Anti-Ageing"],
    kind: "peptide",
    strengths: [{ label: "5mg", amount: 5, unit: "mg", price: 34.99 }],
    summary:
      "CJC-1295 DAC is a long-acting GHRH analogue carrying a drug affinity complex that binds serum albumin. Supplied as a lyophilised powder.",
    overview: [
      "CJC-1295 with DAC combines a modified GRF (1-29) sequence with a maleimidopropionic acid group attached to a C-terminal lysine. This group forms a covalent bond with circulating albumin, which extends the half-life substantially.",
      "Published pharmacology shows sustained increases in growth hormone and IGF-1 secretion. It is the long-acting counterpart to the no-DAC form.",
    ],
    applications: [
      "Long-acting GHRH receptor pharmacology",
      "GH and IGF-1 axis",
      "Albumin conjugation (DAC) technology",
    ],
    compare: {
      slug: "cjc-1295-no-dac",
      text: "The no-DAC version has a much shorter half-life and is used to study pulsatile release.",
    },
  },
  {
    slug: "ipamorelin",
    name: "Ipamorelin",
    aliases: ["NNC 26-0161", "ghrelin agonist"],
    category: "gh-secretagogues",
    tags: ["Ghrelin receptor", "Selective secretagogue"],
    useCases: ["Growth Hormone", "Muscle Growth", "Sleep"],
    kind: "peptide",
    strengths: [
      { label: "5mg", amount: 5, unit: "mg", price: 18.99 },
      { label: "10mg", amount: 10, unit: "mg", price: 32.99 },
    ],
    summary:
      "Ipamorelin is a synthetic pentapeptide ghrelin receptor agonist, the first selective growth hormone secretagogue of its class.",
    overview: [
      "Ipamorelin (Aib-His-D-2Nal-D-Phe-Lys-NH2) is a pentapeptide agonist of the growth hormone secretagogue receptor (GHS-R1a). Early pharmacology described it as selective, releasing growth hormone without the marked ACTH and cortisol increases seen with GHRP-6 and GHRP-2.",
      "It has been used in bone formation models in rodents and in pharmacokinetic modelling.",
    ],
    applications: [
      "GHS-R1a (ghrelin receptor) agonism",
      "Selectivity vs GHRP-2 and GHRP-6",
      "Bone formation in rodent models",
      "Combination with GHRH analogues",
    ],
    compare: {
      slug: "ghrp-6",
      text: "GHRP-6 is an older, less selective ghrelin receptor agonist. Ipamorelin is studied for its narrower hormone release profile.",
    },
  },
  {
    slug: "tesamorelin",
    name: "Tesamorelin",
    aliases: ["TH9507", "GHRH analogue"],
    category: "gh-secretagogues",
    tags: ["GHRH analogue", "Visceral fat"],
    useCases: ["Growth Hormone Research", "Lipolysis Research", "Adipose Research"],
    kind: "peptide",
    strengths: [
      { label: "5mg", amount: 5, unit: "mg", price: 27.99 },
      { label: "10mg", amount: 10, unit: "mg", price: 49.99 },
    ],
    summary:
      "Tesamorelin is a synthetic analogue of growth hormone-releasing hormone (GHRH 1-44) with an N-terminal trans-3-hexenoyl modification.",
    overview: [
      "Tesamorelin consists of the full 44-amino-acid sequence of human GHRH with a trans-3-hexenoic acid group added at the N-terminus. The modification increases resistance to dipeptidyl aminopeptidase cleavage while keeping GHRH receptor activity.",
      "Its literature centres on visceral adipose tissue and the GH and IGF-1 axis, which makes it a reference GHRH receptor compound.",
    ],
    applications: [
      "GHRH receptor pharmacology",
      "Visceral adipose tissue",
      "GH and IGF-1 axis studies",
    ],
    compare: {
      slug: "cjc-1295-no-dac",
      text: "CJC-1295 no-DAC is a modified 29-amino-acid fragment of GHRH, while tesamorelin keeps the full 44-amino-acid sequence.",
    },
  },
  {
    slug: "ghrp-2",
    name: "GHRP-2",
    aliases: ["pralmorelin", "KP-102"],
    category: "gh-secretagogues",
    tags: ["Ghrelin receptor", "Secretagogues"],
    useCases: ["Growth Hormone", "Appetite", "Muscle Growth"],
    kind: "peptide",
    strengths: [
      { label: "5mg", amount: 5, unit: "mg", price: 9.99 },
      { label: "10mg", amount: 10, unit: "mg", price: 14.99 },
    ],
    summary:
      "GHRP-2 (pralmorelin) is a synthetic hexapeptide agonist of the ghrelin receptor. Supplied as a lyophilised powder in sealed vials.",
    overview: [
      "GHRP-2 is a synthetic hexapeptide (D-Ala-D-2Nal-Ala-Trp-D-Phe-Lys-NH2) that stimulates growth hormone release through the GHS-R1a receptor. It was developed as a diagnostic agent for growth hormone deficiency.",
      "It is one of the more potent early growth hormone releasing peptides, and is also used as an analytical reference.",
    ],
    applications: [
      "GHS-R1a agonist potency",
      "Interaction with GHRH and somatostatin",
      "Analytical detection methods",
    ],
    compare: {
      slug: "ghrp-6",
      text: "GHRP-6 was the earlier hexapeptide. GHRP-2 is generally reported as more potent at the ghrelin receptor.",
    },
  },
  {
    slug: "ghrp-6",
    name: "GHRP-6",
    aliases: ["growth hormone releasing hexapeptide"],
    category: "gh-secretagogues",
    tags: ["Ghrelin receptor", "Secretagogues"],
    useCases: ["Growth Hormone", "Appetite", "Muscle Growth"],
    kind: "peptide",
    strengths: [
      { label: "5mg", amount: 5, unit: "mg", price: 9.49 },
      { label: "10mg", amount: 10, unit: "mg", price: 14.49 },
    ],
    summary:
      "GHRP-6 is a synthetic hexapeptide (His-D-Trp-Ala-Trp-D-Phe-Lys-NH2) and one of the first growth hormone releasing peptides.",
    overview: [
      "GHRP-6 is a first-generation growth hormone secretagogue that acts at the ghrelin receptor (GHS-R1a). It has been used for decades as a tool compound in GH regulation research, including diagnostic testing studies.",
      "More recent work covers cytoprotection in organ injury models and hydrogel delivery.",
    ],
    applications: [
      "Ghrelin receptor signalling",
      "Growth hormone regulation",
      "Cytoprotection in organ injury models",
    ],
    compare: {
      slug: "ipamorelin",
      text: "Ipamorelin is a newer pentapeptide studied for greater selectivity than GHRP-6.",
    },
  },
  {
    slug: "hexarelin",
    name: "Hexarelin",
    aliases: ["examorelin"],
    category: "gh-secretagogues",
    tags: ["Ghrelin receptor", "Cardiovascular"],
    useCases: ["Growth Hormone", "Muscle Growth", "Heart"],
    kind: "peptide",
    strengths: [{ label: "2mg", amount: 2, unit: "mg", price: 12.99 }],
    summary:
      "Hexarelin (examorelin) is a synthetic hexapeptide ghrelin receptor agonist with additional affinity for the CD36 receptor. Lyophilised powder.",
    overview: [
      "Hexarelin is structurally related to GHRP-6, with a 2-methyl-D-tryptophan substitution. Besides the ghrelin receptor, it binds CD36, which is linked to effects on cardiac tissue that are independent of growth hormone.",
      "Its literature covers cardiovascular work and, more recently, kidney and vascular injury.",
    ],
    applications: [
      "GHS-R1a and CD36 receptor pharmacology",
      "Cardioprotection in animal models",
      "Vascular and renal injury",
    ],
    compare: {
      slug: "ghrp-6",
      text: "Hexarelin is a methylated analogue of GHRP-6 with added CD36 binding.",
    },
  },
  {
    slug: "sermorelin",
    name: "Sermorelin",
    aliases: ["GRF 1-29", "GHRH 1-29"],
    category: "gh-secretagogues",
    tags: ["GHRH analogue", "Pituitary"],
    useCases: ["Growth Hormone", "Anti-Ageing", "Sleep"],
    kind: "peptide",
    strengths: [
      { label: "2mg", amount: 2, unit: "mg", price: 12.99 },
      { label: "5mg", amount: 5, unit: "mg", price: 27.99 },
      { label: "10mg", amount: 10, unit: "mg", price: 39.99 },
    ],
    summary:
      "Sermorelin is the 29-amino-acid N-terminal fragment of growth hormone-releasing hormone (GHRH 1-29 amide). Lyophilised powder in sealed vials.",
    overview: [
      "Sermorelin corresponds to the first 29 amino acids of human GHRH, the minimum sequence with full biological activity at the GHRH receptor. It was historically used as a diagnostic and therapeutic agent before being withdrawn from some markets for commercial reasons.",
      "It is the unmodified reference fragment against which stabilised analogues such as Modified GRF (1-29) are compared.",
    ],
    applications: [
      "GHRH receptor activation",
      "Pituitary GH release",
      "Reference fragment for analogue comparisons",
    ],
    compare: {
      slug: "cjc-1295-no-dac",
      text: "CJC-1295 no-DAC is sermorelin with four stabilising amino acid substitutions.",
    },
  },
  {
    slug: "igf-1-lr3",
    name: "IGF-1 LR3",
    aliases: ["Long R3 IGF-1", "LR3 IGF-I"],
    category: "gh-secretagogues",
    tags: ["Growth factors", "Cell culture"],
    useCases: ["Muscle Growth", "Growth Hormone", "Recovery"],
    kind: "protein",
    strengths: [{ label: "1mg", amount: 1, unit: "mg", price: 39.99 }],
    summary:
      "IGF-1 LR3 is an 83-amino-acid analogue of insulin-like growth factor 1 with a 13-amino-acid N-terminal extension and an Arg3 substitution.",
    overview: [
      "Long R3 IGF-1 differs from native IGF-1 by an arginine at position 3 and a 13-amino-acid N-terminal extension. These changes greatly reduce binding to IGF binding proteins, so more of the analogue stays free and active in culture systems.",
      "It is widely used as a cell culture supplement and in growth factor signalling work, including recombinant expression.",
    ],
    applications: [
      "IGF-1 receptor signalling",
      "Cell culture and bioprocessing",
      "IGF binding protein interaction",
    ],
  },

  // ---------------------------------------------------------------- Longevity research
  {
    slug: "nad-plus",
    name: "NAD+",
    aliases: ["nicotinamide adenine dinucleotide", "NAD"],
    category: "longevity-research",
    tags: ["Cellular energy", "Sirtuins"],
    useCases: ["Anti-Ageing", "Energy", "Longevity"],
    kind: "coenzyme",
    appearance: "White to off-white lyophilised powder",
    strengths: [
      { label: "500mg", amount: 500, unit: "mg", price: 39.99 },
      { label: "1000mg", amount: 1000, unit: "mg", price: 84.99 },
    ],
    summary:
      "NAD+ (nicotinamide adenine dinucleotide) is a coenzyme central to redox reactions and a substrate for sirtuins and PARP enzymes. Lyophilised.",
    overview: [
      "NAD+ is a dinucleotide coenzyme found in every living cell. It carries electrons in metabolic redox reactions and is consumed as a substrate by sirtuins, PARPs and CD38, which link it to DNA repair, gene regulation and cellular stress responses.",
      "NAD+ declines with age, which makes it one of the most studied molecules in ageing biology.",
    ],
    applications: [
      "Sirtuin and PARP enzyme assays",
      "Mitochondrial function and redox balance",
      "Cellular senescence and ageing",
    ],
    compare: {
      slug: "5-amino-1mq",
      text: "5-Amino-1MQ is used to study NNMT, an enzyme that affects NAD+ salvage, whereas NAD+ is the coenzyme itself.",
    },
  },
  {
    slug: "epithalon",
    name: "Epithalon",
    aliases: ["epitalon", "AEDG", "Ala-Glu-Asp-Gly"],
    category: "longevity-research",
    tags: ["Telomeres", "Pineal peptides"],
    useCases: ["Anti-Ageing", "Longevity", "Sleep"],
    kind: "peptide",
    strengths: [{ label: "10mg", amount: 10, unit: "mg", price: 19.99 }],
    summary:
      "Epithalon (Ala-Glu-Asp-Gly) is a synthetic tetrapeptide based on the pineal gland extract epithalamin. Supplied as a lyophilised powder.",
    overview: [
      "Epithalon was developed as a synthetic version of the active component of epithalamin, a polypeptide extract of the pineal gland. It is a short tetrapeptide (Ala-Glu-Asp-Gly).",
      "Its literature covers telomerase activity and telomere length in cell lines, antioxidant activity, wound healing in vitro and pineal biology.",
    ],
    applications: [
      "Telomerase activity and telomere length",
      "Antioxidant activity in vitro",
      "Pineal and circadian rhythm",
    ],
    compare: {
      slug: "thymalin",
      text: "Both originate from the same bioregulator research programme. Thymalin is a thymus extract, while epithalon is a defined synthetic tetrapeptide.",
    },
  },
  {
    slug: "ss-31",
    name: "SS-31",
    aliases: ["elamipretide", "Bendavia", "MTP-131"],
    category: "longevity-research",
    tags: ["Mitochondria", "Cardiolipin"],
    useCases: ["Mitochondria", "Energy", "Anti-Ageing"],
    kind: "peptide",
    strengths: [
      { label: "10mg", amount: 10, unit: "mg", price: 24.99 },
      { label: "50mg", amount: 50, unit: "mg", price: 59.99 },
    ],
    summary:
      "SS-31 (elamipretide) is a mitochondria-targeted tetrapeptide that binds cardiolipin in the inner mitochondrial membrane. Lyophilised powder.",
    overview: [
      "SS-31 is a Szeto-Schiller peptide (D-Arg-Dmt-Lys-Phe-NH2) that concentrates in the inner mitochondrial membrane, where it interacts with cardiolipin. This interaction is associated with stabilising cristae structure and electron transport chain function.",
      "It is used across models of mitochondrial dysfunction, including cardiac and neurological work.",
    ],
    applications: [
      "Cardiolipin interaction",
      "Mitochondrial bioenergetics",
      "Oxidative stress and ferroptosis",
    ],
    compare: {
      slug: "mots-c",
      text: "MOTS-c is a mitochondrial-encoded signalling peptide, while SS-31 acts directly at the inner mitochondrial membrane.",
    },
  },
  {
    slug: "dsip",
    name: "DSIP",
    aliases: ["delta sleep-inducing peptide"],
    category: "longevity-research",
    tags: ["Sleep", "Neuropeptides"],
    useCases: ["Sleep", "Recovery", "Brain & Focus"],
    kind: "peptide",
    strengths: [
      { label: "5mg", amount: 5, unit: "mg", price: 13.99 },
      { label: "10mg", amount: 10, unit: "mg", price: 24.99 },
    ],
    summary:
      "DSIP (delta sleep-inducing peptide) is a nonapeptide first isolated in 1977 from rabbit cerebral venous blood. Supplied as a lyophilised powder.",
    overview: [
      "DSIP (Trp-Ala-Gly-Gly-Asp-Ala-Ser-Gly-Glu) was identified during research into sleep-promoting factors. Its receptor and exact physiological role remain unresolved, which keeps it an active research subject.",
      "It is linked to sleep architecture, stress response and neuroendocrine regulation.",
    ],
    applications: [
      "Sleep architecture in animal models",
      "Neuroendocrine stress response",
      "Neuropeptide signalling",
    ],
  },
  {
    slug: "thymosin-alpha-1",
    name: "Thymosin Alpha-1",
    aliases: ["thymalfasin", "TA1", "Tα1"],
    category: "longevity-research",
    tags: ["Immune", "Thymic peptides"],
    useCases: ["Immune Support", "Longevity", "Recovery"],
    kind: "peptide",
    strengths: [
      { label: "5mg", amount: 5, unit: "mg", price: 21.99 },
      { label: "10mg", amount: 10, unit: "mg", price: 44.99 },
    ],
    summary:
      "Thymosin Alpha-1 (thymalfasin) is a 28-amino-acid N-acetylated peptide originally isolated from thymus tissue. Lyophilised powder.",
    overview: [
      "Thymosin Alpha-1 is derived from prothymosin alpha and was first isolated from thymosin fraction 5. It modulates innate and adaptive immune signalling, including toll-like receptor pathways and T-cell maturation.",
      "Its literature covers immune ageing, infectious disease models and vaccine response.",
    ],
    applications: [
      "T-cell maturation and immune signalling",
      "Toll-like receptor pathways",
      "Immune ageing",
    ],
    compare: {
      slug: "thymalin",
      text: "Thymalin is a polypeptide extract from calf thymus, while Thymosin Alpha-1 is a single defined 28-amino-acid peptide.",
    },
  },
  {
    slug: "thymalin",
    name: "Thymalin",
    aliases: ["thymus peptide complex"],
    category: "longevity-research",
    tags: ["Bioregulators", "Thymic peptides"],
    useCases: ["Immune Support", "Longevity", "Anti-Ageing"],
    kind: "peptide",
    strengths: [{ label: "10mg", amount: 10, unit: "mg", price: 21.99 }],
    summary:
      "Thymalin is a complex of polypeptides extracted from thymus tissue, used as an immune bioregulator. Supplied as a lyophilised powder.",
    overview: [
      "Thymalin is a polypeptide complex isolated from calf thymus rather than a single defined sequence, so it has no single CAS number or molecular formula. It originates from the same bioregulator research programme as epithalamin.",
      "It has been used in haematopoietic stem cell differentiation and immune ageing models.",
    ],
    applications: [
      "Immune bioregulation",
      "Haematopoietic stem cell differentiation",
      "Immune ageing models",
    ],
    compare: {
      slug: "epithalon",
      text: "Epithalon is the synthetic tetrapeptide from the same research lineage, with a defined sequence.",
    },
  },
  {
    slug: "semax",
    name: "Semax",
    aliases: ["ACTH 4-7 Pro-Gly-Pro", "Met-Glu-His-Phe-Pro-Gly-Pro"],
    category: "longevity-research",
    tags: ["Neuropeptides", "BDNF signalling"],
    useCases: ["Brain & Focus", "Memory", "Mood"],
    kind: "peptide",
    strengths: [
      { label: "10mg", amount: 10, unit: "mg", price: 24.99 },
      { label: "5mg", amount: 5, unit: "mg", price: 19.99 },
    ],
    summary:
      "Semax is a synthetic heptapeptide analogue of the ACTH (4-7) fragment, extended with a Pro-Gly-Pro sequence for stability. Lyophilised powder.",
    overview: [
      "Semax (Met-Glu-His-Phe-Pro-Gly-Pro) combines the ACTH (4-7) fragment with a C-terminal Pro-Gly-Pro tripeptide that slows enzymatic breakdown. It has no hormonal activity at adrenal receptors.",
      "Its literature covers neurotrophic signalling, including BDNF expression, and gene expression changes in cerebral ischaemia models.",
    ],
    applications: [
      "BDNF and neurotrophin signalling",
      "Cerebral ischaemia models",
      "Gene expression studies",
    ],
    compare: {
      slug: "selank",
      text: "Selank is a tuftsin analogue from the same research institute. The two are often studied together in functional connectomics work.",
    },
  },
  {
    slug: "selank",
    name: "Selank",
    aliases: ["tuftsin analogue", "Thr-Lys-Pro-Arg-Pro-Gly-Pro"],
    category: "longevity-research",
    tags: ["Neuropeptides", "GABAergic signalling"],
    useCases: ["Anxiety & Calm", "Brain & Focus", "Mood"],
    kind: "peptide",
    strengths: [
      { label: "10mg", amount: 10, unit: "mg", price: 24.99 },
      { label: "5mg", amount: 5, unit: "mg", price: 18.99 },
    ],
    summary:
      "Selank is a synthetic heptapeptide analogue of tuftsin (Thr-Lys-Pro-Arg) extended with Pro-Gly-Pro. Supplied as a lyophilised powder.",
    overview: [
      "Selank adds the stabilising Pro-Gly-Pro sequence to tuftsin, an immunomodulatory tetrapeptide derived from immunoglobulin G. It was developed at the same institute as Semax.",
      "It is linked to GABAergic gene expression, monoamine signalling and behaviour in animal models.",
    ],
    applications: [
      "GABAergic gene expression",
      "Monoamine signalling",
      "Behavioural models in rodents",
    ],
    compare: {
      slug: "semax",
      text: "Semax is an ACTH (4-7) analogue, while Selank is a tuftsin analogue. Both share the Pro-Gly-Pro stabilising tail.",
    },
  },

  // ---------------------------------------------------------------- Pigmentation research
  {
    slug: "melanotan-2",
    name: "Melanotan 2",
    aliases: ["MT-2", "MT2", "melanotan II"],
    category: "pigmentation-research",
    tags: ["Melanocortin", "Pigmentation"],
    useCases: ["Tanning", "Appetite Control", "Libido"],
    kind: "peptide",
    strengths: [{ label: "10mg", amount: 10, unit: "mg", price: 21.99 }],
    summary:
      "Melanotan 2 is a synthetic cyclic heptapeptide analogue of alpha-MSH and a non-selective melanocortin receptor agonist. Lyophilised powder.",
    overview: [
      "Melanotan II is a cyclic lactam analogue of α-MSH that acts at several melanocortin receptors (MC1R, MC3R, MC4R and MC5R). Cyclisation makes it more stable and potent than the linear hormone.",
      "It is a tool compound across melanocortin receptors, used in pigmentation, energy balance and selectivity work.",
    ],
    applications: [
      "Melanocortin receptor pharmacology",
      "Melanogenesis in cell models",
      "Receptor selectivity",
    ],
    compare: {
      slug: "melanotan-1",
      text: "Melanotan 1 (afamelanotide) is linear and more selective for MC1R. Melanotan 2 is cyclic and non-selective.",
    },
  },
  {
    slug: "melanotan-1",
    name: "Melanotan 1",
    aliases: ["MT-1", "afamelanotide", "melanotan I"],
    category: "pigmentation-research",
    tags: ["Melanocortin", "Photoprotection"],
    useCases: ["Tanning", "Skin", "Pigmentation"],
    kind: "peptide",
    strengths: [{ label: "10mg", amount: 10, unit: "mg", price: 19.99 }],
    summary:
      "Melanotan 1 (afamelanotide) is a linear 13-amino-acid analogue of alpha-MSH with selectivity for the MC1 receptor. Lyophilised powder.",
    overview: [
      "Afamelanotide is α-MSH with two substitutions (Nle4 and D-Phe7) that increase potency and resistance to degradation. It acts mainly at the melanocortin-1 receptor on melanocytes.",
      "Its literature centres on melanogenesis and photoprotection, including work in erythropoietic protoporphyria.",
    ],
    applications: ["MC1R signalling", "Melanogenesis", "Photoprotection"],
    compare: {
      slug: "melanotan-2",
      text: "Melanotan 2 is a cyclic, non-selective analogue with activity at several melanocortin receptors.",
    },
  },
  {
    slug: "pt-141",
    name: "PT-141",
    aliases: ["bremelanotide"],
    category: "pigmentation-research",
    tags: ["Melanocortin", "MC4R signalling"],
    useCases: ["Libido", "Sexual Health", "Melanocortin"],
    kind: "peptide",
    strengths: [{ label: "10mg", amount: 10, unit: "mg", price: 19.99 }],
    summary:
      "PT-141 (bremelanotide) is a cyclic heptapeptide melanocortin receptor agonist and a metabolite of Melanotan 2. Lyophilised powder.",
    overview: [
      "Bremelanotide is a cyclic peptide closely related to Melanotan II, lacking the C-terminal amide. It acts mainly at the MC4 and MC3 receptors in the central nervous system.",
      "It is used in central melanocortin signalling work and in comparisons with other melanocortin agonists.",
    ],
    applications: [
      "MC4R and MC3R signalling",
      "Central melanocortin pathways",
      "Comparative melanocortin pharmacology",
    ],
    compare: {
      slug: "melanotan-2",
      text: "PT-141 is a metabolite of Melanotan 2 with a different receptor emphasis (MC4R).",
    },
  },

  // ---------------------------------------------------------------- Peptide blends
  {
    slug: "glow",
    name: "GLOW",
    aliases: ["GLOW blend", "GHK-Cu BPC-157 TB-500 blend"],
    category: "peptide-blends",
    tags: ["Skin", "Tissue repair"],
    useCases: ["Skin & Anti-Ageing", "Glow", "Recovery & Repair"],
    kind: "blend",
    composition: ["GHK-Cu 50mg", "BPC-157 10mg", "TB-500 10mg"],
    appearance: "Pale blue lyophilised powder (from the GHK-Cu)",
    strengths: [{ label: "70mg", amount: 70, unit: "mg", price: 59.99 }],
    summary: "GLOW is a 70mg blend of GHK-Cu, BPC-157 and TB-500 in a single lyophilised vial.",
    overview: [
      "GLOW puts three of the most used tissue repair peptides in one lyophilised vial: GHK-Cu, BPC-157 and TB-500.",
      "A blend gives you all three from one preparation and one batch. Each component is listed on the batch certificate.",
    ],
    applications: [
      "Combination work across repair pathways",
      "Skin and fibroblast models",
      "Single-batch multi-compound vials",
    ],
    compare: {
      slug: "klow",
      text: "KLOW adds 10mg of KPV to the same three compounds.",
    },
  },
  {
    slug: "klow",
    name: "KLOW",
    aliases: ["KLOW blend", "KPV GHK-Cu BPC-157 TB-500 blend"],
    category: "peptide-blends",
    tags: ["Inflammation", "Tissue repair"],
    useCases: ["Skin & Anti-Ageing", "Glow", "Gut Health"],
    kind: "blend",
    composition: ["GHK-Cu 50mg", "BPC-157 10mg", "TB-500 10mg", "KPV 10mg"],
    appearance: "Pale blue lyophilised powder (from the GHK-Cu)",
    strengths: [{ label: "80mg", amount: 80, unit: "mg", price: 67.99 }],
    summary:
      "KLOW is an 80mg blend of GHK-Cu, BPC-157, TB-500 and KPV in a single lyophilised vial.",
    overview: [
      "KLOW adds KPV, the anti-inflammatory tripeptide fragment of α-MSH, to the GLOW base: four compounds in one vial.",
      "It covers inflammatory signalling alongside the repair pathways in a single vial.",
    ],
    applications: [
      "Combination repair and inflammation work",
      "Epithelial and gut models",
      "Single-batch multi-compound vials",
    ],
    compare: { slug: "glow", text: "GLOW is the same blend without KPV." },
  },
  {
    slug: "wolverine-stack",
    name: "Wolverine Stack",
    aliases: ["BPC-157 + TB-500", "BPC TB blend"],
    category: "peptide-blends",
    tags: ["Tissue repair", "Blends"],
    useCases: ["Recovery & Repair", "Tendon & Joint", "Muscle Repair"],
    kind: "blend",
    composition: ["BPC-157 5mg", "TB-500 5mg"],
    strengths: [
      { label: "5+5mg", amount: 10, unit: "mg", price: 36.99 },
      {
        label: "10+10mg",
        amount: 20,
        unit: "mg",
        price: 54.99,
        composition: ["BPC-157 10mg", "TB-500 10mg"],
      },
    ],
    summary:
      "The Wolverine Stack combines BPC-157 and TB-500 in one lyophilised vial; check the selected strength for the amount of each.",
    overview: [
      "This blend pairs BPC-157 and TB-500, the two peptides most often compared in tissue repair work, in one vial.",
      "It gives you both compounds from the same batch and preparation.",
    ],
    applications: ["Combination repair work", "Tendon and muscle injury models", "Angiogenesis"],
    compare: {
      slug: "bpc-157",
      text: "Both components are also available as single-compound vials.",
    },
  },
  {
    slug: "hulk-stack",
    name: "Hulk Stack",
    aliases: ["CJC-1295 DAC + Ipamorelin", "CJC ipamorelin blend"],
    category: "peptide-blends",
    tags: ["Secretagogues", "Blends"],
    useCases: ["Muscle Growth", "Growth Hormone", "Strength"],
    kind: "blend",
    composition: ["CJC-1295 DAC", "Ipamorelin"],
    strengths: [{ label: "20mg", amount: 20, unit: "mg", price: 69.99 }],
    summary:
      "The Hulk Stack combines CJC-1295 DAC and Ipamorelin in a single 20mg lyophilised vial.",
    overview: [
      "This blend pairs a long-acting GHRH analogue (CJC-1295 DAC) with a selective ghrelin receptor agonist (Ipamorelin). They act on separate receptors that both drive growth hormone release.",
      "It pairs the two receptor routes in one vial. The split between components is shown on the batch certificate.",
    ],
    applications: [
      "GHRH and ghrelin receptor combination studies",
      "GH axis",
      "Single-batch multi-compound vials",
    ],
    compare: {
      slug: "ipamorelin",
      text: "Both components are also available as single-compound vials.",
    },
  },

  // ---------------------------------------------------------------- Lab supplies
  {
    slug: "bacteriostatic-water",
    name: "Bacteriostatic Water",
    aliases: ["bac water", "BW", "benzyl alcohol water"],
    category: "lab-supplies",
    tags: ["Reconstitution", "Lab supplies"],
    useCases: ["Lab Supply", "Reconstitution"],
    kind: "supply",
    form: "Sterile solution",
    appearance: "Clear, colourless liquid",
    strengths: [{ label: "10ml", amount: 10, unit: "ml", price: 5.99 }],
    summary:
      "Sterile water containing 0.9% benzyl alcohol as a bacteriostatic preservative, for reconstituting a lyophilised vial.",
    overview: [
      "Bacteriostatic water is sterile water with 0.9% benzyl alcohol, which inhibits bacterial growth and allows a sealed vial to be accessed more than once.",
      "It is the standard solvent for reconstituting a lyophilised vial. See the reconstitution guide and calculator for the maths.",
    ],
    applications: ["Reconstitution of a lyophilised vial", "Multi-dose preparations"],
  },
];
