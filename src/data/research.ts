// Generated from verified PubChem records and live PubMed (NCBI E-utilities) pulls, 28 Sep 2026.
// Citations are only kept when the paper title names the compound. Regenerate rather than hand-edit.
export type Citation = {
  pmid: string;
  title: string;
  journal: string;
  year: string;
  author: string;
};
export type Chem = { cas?: string; formula?: string; mw?: string; sequence?: string };
export const chem: Record<string, Chem> = {
  retatrutide: {
    cas: "2381089-83-2",
    formula: "C221H342N46O68",
    mw: "4,731.4",
  },
  tirzepatide: {
    cas: "2023788-19-2",
    formula: "C225H348N48O68",
    mw: "4,813.5",
  },
  semaglutide: {
    cas: "910463-68-2",
    formula: "C187H291N45O59",
    mw: "4,114.0",
  },
  cagrilintide: {
    cas: "1415456-99-3",
    formula: "C194H312N54O59S2",
    mw: "4,409.0",
  },
  "aod-9604": {
    cas: "221231-10-3",
    formula: "C78H123N23O23S2",
    mw: "1,815.1",
  },
  tesamorelin: {
    cas: "218949-48-5",
    formula: "C221H366N72O67S",
    mw: "5,136.0",
  },
  "5-amino-1mq": {
    cas: "42464-96-0",
    formula: "C10H11IN2 (iodide salt)",
    mw: "286.1",
  },
  "mots-c": {
    cas: "1627580-64-6",
    formula: "C101H152N28O22S2",
    mw: "2,174.6",
    sequence: "Met-Arg-Trp-Gln-Glu-Met-Gly-Tyr-Ile-Phe-Tyr-Pro-Arg-Lys-Leu-Arg",
  },
  "bpc-157": {
    cas: "137525-51-0",
    formula: "C62H98N16O22",
    mw: "1,419.5",
    sequence: "Gly-Glu-Pro-Pro-Pro-Gly-Lys-Pro-Ala-Asp-Asp-Ala-Gly-Leu-Val",
  },
  "tb-500": {
    cas: "77591-33-4",
    formula: "C212H350N56O78S",
    mw: "4,963.4",
  },
  "ghk-cu": {
    cas: "89030-95-5",
    formula: "C14H23CuN6O4+",
    mw: "402.9",
    sequence: "Gly-His-Lys (copper complex)",
  },
  kpv: {
    cas: "67727-97-3",
    formula: "C16H30N4O4",
    mw: "342.4",
    sequence: "Lys-Pro-Val",
  },
  "ll-37": {
    cas: "154947-66-7",
    formula: "C205H340N60O53",
    mw: "4,493.0",
  },
  "ara-290": {
    cas: "1208243-50-8",
    formula: "C51H84N16O21",
    mw: "1,257.3",
  },
  "cjc-1295-no-dac": {
    cas: "863288-34-0",
    formula: "C152H252N44O42",
    mw: "3,367.9",
  },
  "cjc-1295-dac": {
    cas: "446262-90-4",
    formula: "C165H269N47O46",
    mw: "3,647.2",
  },
  ipamorelin: {
    cas: "170851-70-4",
    formula: "C38H49N9O5",
    mw: "711.9",
    sequence: "Aib-His-D-2Nal-D-Phe-Lys-NH2",
  },
  "ghrp-2": {
    cas: "158861-67-7",
    formula: "C45H55N9O6",
    mw: "818.0",
    sequence: "D-Ala-D-2Nal-Ala-Trp-D-Phe-Lys-NH2",
  },
  "ghrp-6": {
    cas: "87616-84-0",
    formula: "C46H56N12O6",
    mw: "873.0",
    sequence: "His-D-Trp-Ala-Trp-D-Phe-Lys-NH2",
  },
  hexarelin: {
    cas: "140703-51-1",
    formula: "C47H58N12O6",
    mw: "887.0",
    sequence: "His-D-2MeTrp-Ala-Trp-D-Phe-Lys-NH2",
  },
  sermorelin: {
    cas: "86168-78-7",
    formula: "C149H246N44O42S",
    mw: "3,357.9",
  },
  "igf-1-lr3": {
    mw: "approx. 9,100",
  },
  "nad-plus": {
    cas: "53-84-9",
    formula: "C21H27N7O14P2",
    mw: "663.4",
  },
  epithalon: {
    cas: "307297-39-8",
    formula: "C14H22N4O9",
    mw: "390.4",
    sequence: "Ala-Glu-Asp-Gly",
  },
  "ss-31": {
    cas: "736992-21-5",
    formula: "C32H49N9O5",
    mw: "639.8",
    sequence: "D-Arg-Dmt-Lys-Phe-NH2",
  },
  "thymosin-alpha-1": {
    cas: "62304-98-7",
    formula: "C129H215N33O55",
    mw: "3,108.3",
  },
  thymalin: {},
  dsip: {
    cas: "62568-57-4",
    formula: "C35H48N10O15",
    mw: "848.8",
    sequence: "Trp-Ala-Gly-Gly-Asp-Ala-Ser-Gly-Glu",
  },
  semax: {
    cas: "80714-61-0",
    formula: "C37H51N9O10S",
    mw: "813.9",
    sequence: "Met-Glu-His-Phe-Pro-Gly-Pro",
  },
  selank: {
    cas: "129954-34-3",
    formula: "C33H57N11O9",
    mw: "751.9",
    sequence: "Thr-Lys-Pro-Arg-Pro-Gly-Pro",
  },
  "melanotan-2": {
    cas: "121062-08-6",
    formula: "C50H69N15O9",
    mw: "1,024.2",
  },
  "melanotan-1": {
    cas: "75921-69-6",
    formula: "C78H111N21O19",
    mw: "1,646.8",
  },
  "pt-141": {
    cas: "189691-06-3",
    formula: "C50H68N14O10",
    mw: "1,025.2",
  },
};
export const citations: Record<string, Citation[]> = {
  retatrutide: [
    {
      pmid: "37366315",
      title: "Triple-Hormone-Receptor Agonist Retatrutide for Obesity - A Phase 2 Trial",
      journal: "N Engl J Med",
      year: "2023",
      author: "Jastreboff AM",
    },
    {
      pmid: "37385280",
      title:
        "Retatrutide, a GIP, GLP-1 and glucagon receptor agonist, for people with type 2 diabetes: a randomised, double-blind, placebo and active-controlled, parallel-group, phase 2 trial conducted in the USA",
      journal: "Lancet",
      year: "2023",
      author: "Rosenstock J",
    },
    {
      pmid: "40291085",
      title:
        "Efficacy and safety of retatrutide, a novel GLP-1, GIP, and glucagon receptor agonist for obesity treatment: a systematic review and meta-analysis of randomized controlled trials",
      journal: "Proc (Bayl Univ Med Cent)",
      year: "2025",
      author: "Abdrabou Abouelmagd A",
    },
  ],
  tirzepatide: [
    {
      pmid: "38613667",
      title:
        "Subcutaneously administered tirzepatide vs semaglutide for adults with type 2 diabetes: a systematic review and network meta-analysis of randomised controlled trials",
      journal: "Diabetologia",
      year: "2024",
      author: "Karagiannis T",
    },
    {
      pmid: "39632534",
      title: "Tirzepatide for overweight and obesity management",
      journal: "Expert Opin Pharmacother",
      year: "2025",
      author: "Hamza M",
    },
    {
      pmid: "41032183",
      title: "Anti-inflammatory effects of tirzepatide: a systematic review and meta-analysis",
      journal: "Rev Endocr Metab Disord",
      year: "2026",
      author: "Masson W",
    },
  ],
  semaglutide: [
    {
      pmid: "38613667",
      title:
        "Subcutaneously administered tirzepatide vs semaglutide for adults with type 2 diabetes: a systematic review and network meta-analysis of randomised controlled trials",
      journal: "Diabetologia",
      year: "2024",
      author: "Karagiannis T",
    },
    {
      pmid: "38952487",
      title: "Clinical Pharmacokinetics of Semaglutide: A Systematic Review",
      journal: "Drug Des Devel Ther",
      year: "2024",
      author: "Yang XD",
    },
  ],
  cagrilintide: [
    {
      pmid: "42251860",
      title:
        "Efficacy and safety of once-weekly cagrilintide-semaglutide (CagriSema) in adults with type 2 diabetes inadequately controlled on diet and exercise (REIMAGINE 1): a randomised, double-blind, placebo-controlled, phase 3a study",
      journal: "Lancet Diabetes Endocrinol",
      year: "2026",
      author: "Aroda VR",
    },
    {
      pmid: "34798060",
      title:
        "Once-weekly cagrilintide for weight management in people with overweight and obesity: a multicentre, randomised, double-blind, placebo-controlled and active-controlled, dose-finding phase 2 trial",
      journal: "Lancet",
      year: "2021",
      author: "Lau DCW",
    },
    {
      pmid: "36883831",
      title: "Cagrilintide: A Long-Acting Amylin Analog for the Treatment of Obesity",
      journal: "Cardiol Rev",
      year: "2024",
      author: "D'Ascanio AM",
    },
  ],
  "aod-9604": [
    {
      pmid: "15134286",
      title: "AOD-9604 Metabolic",
      journal: "Curr Opin Investig Drugs",
      year: "2004",
      author: "Wilding J",
    },
    {
      pmid: "25208511",
      title: "Detection and in vitro metabolism of AOD9604",
      journal: "Drug Test Anal",
      year: "2015",
      author: "Cox HD",
    },
    {
      pmid: "26275694",
      title:
        "Effect of Intra-articular Injection of AOD9604 with or without Hyaluronic Acid in Rabbit Osteoarthritis Model",
      journal: "Ann Clin Lab Sci",
      year: "2015",
      author: "Kwon DR",
    },
  ],
  tesamorelin: [
    {
      pmid: "21591600",
      title: "Tesamorelin update",
      journal: "BETA",
      year: "2010",
      author: "O'Neal R",
    },
    {
      pmid: "21668043",
      title: "Tesamorelin: a review of its use in the management of HIV-associated lipodystrophy",
      journal: "Drugs",
      year: "2011",
      author: "Dhillon S",
    },
    {
      pmid: "22298602",
      title:
        "Tesamorelin: a growth hormone-releasing factor analogue for HIV-associated lipodystrophy",
      journal: "Ann Pharmacother",
      year: "2012",
      author: "Spooner LM",
    },
  ],
  "5-amino-1mq": [
    {
      pmid: "39067875",
      title:
        "NAD(+) metabolism enzyme NNMT in cancer-associated fibroblasts drives tumor progression and resistance to immunotherapy by modulating macrophages in urothelial bladder cancer",
      journal: "J Immunother Cancer",
      year: "2024",
      author: "Yang M",
    },
    {
      pmid: "33645410",
      title:
        "Small molecule inhibitor of nicotinamide N-methyltransferase shows anti-proliferative activity in HeLa cells",
      journal: "J Obstet Gynaecol",
      year: "2021",
      author: "Akar S",
    },
    {
      pmid: "35013352",
      title:
        "Reduced calorie diet combined with NNMT inhibition establishes a distinct microbiome in DIO mice",
      journal: "Sci Rep",
      year: "2022",
      author: "Dimet-Wiley A",
    },
  ],
  "mots-c": [
    {
      pmid: "25738459",
      title:
        "The mitochondrial-derived peptide MOTS-c promotes metabolic homeostasis and reduces obesity and insulin resistance",
      journal: "Cell Metab",
      year: "2015",
      author: "Lee C",
    },
    {
      pmid: "36761202",
      title: "MOTS-c: A promising mitochondrial-derived peptide for therapeutic exploitation",
      journal: "Front Endocrinol (Lausanne)",
      year: "2023",
      author: "Zheng Y",
    },
    {
      pmid: "39321430",
      title:
        "Mitochondrial-Derived Peptide MOTS-c Suppresses Ovarian Cancer Progression by Attenuating USP7-Mediated LARS1 Deubiquitination",
      journal: "Adv Sci (Weinh)",
      year: "2024",
      author: "Yin Y",
    },
  ],
  "bpc-157": [
    {
      pmid: "40005999",
      title:
        "Multifunctionality and Possible Medical Application of the BPC 157 Peptide-Literature and Patent Review",
      journal: "Pharmaceuticals (Basel)",
      year: "2025",
      author: "Józwiak M",
    },
    {
      pmid: "40756949",
      title: "Emerging Use of BPC-157 in Orthopaedic Sports Medicine: A Systematic Review",
      journal: "HSS J",
      year: "2025",
      author: "Vasireddi N",
    },
    {
      pmid: "30915550",
      title:
        "Gastric pentadecapeptide body protection compound BPC 157 and its role in accelerating musculoskeletal soft tissue healing",
      journal: "Cell Tissue Res",
      year: "2019",
      author: "Gwyer D",
    },
  ],
  "tb-500": [
    {
      pmid: "40816274",
      title:
        "Thymosin beta 4 as an Alzheimer disease intervention target identified using human brain organoids",
      journal: "Stem Cell Reports",
      year: "2025",
      author: "Zeng PM",
    },
    {
      pmid: "41229390",
      title:
        "Recombinant human thymosin beta 4 improves ischemic cardiac dysfunction in mice and patients with acute ST-segment elevation myocardial infarction after reperfusion",
      journal: "Cardiovasc Res",
      year: "2025",
      author: "Zhang Y",
    },
    {
      pmid: "27450736",
      title: "Cardioprotection by Thymosin Beta 4",
      journal: "Vitam Horm",
      year: "2016",
      author: "Pipes GT",
    },
  ],
  "ghk-cu": [
    {
      pmid: "37035833",
      title: "GHK peptide prevents sleep-deprived learning impairment in aging mice",
      journal: "Aging Pathobiol Ther",
      year: "2023",
      author: "Rosenfeld M",
    },
    {
      pmid: "39795193",
      title:
        "Are We Ready to Measure Skin Permeation of Modern Antiaging GHK-Cu Tripeptide Encapsulated in Liposomes?",
      journal: "Molecules",
      year: "2025",
      author: "Ogórek K",
    },
    {
      pmid: "22666519",
      title:
        "The human tripeptide GHK-Cu in prevention of oxidative stress and degenerative conditions of aging: implications for cognitive health",
      journal: "Oxid Med Cell Longev",
      year: "2012",
      author: "Pickart L",
    },
  ],
  kpv: [
    {
      pmid: "35245681",
      title:
        "A KPV-binding double-network hydrogel restores gut mucosal barrier in an inflamed colon",
      journal: "Acta Biomater",
      year: "2022",
      author: "Zhao Y",
    },
    {
      pmid: "28343991",
      title:
        "Transdermal Iontophoretic Delivery of Lysine-Proline-Valine (KPV) Peptide Across Microporated Human Skin",
      journal: "J Pharm Sci",
      year: "2017",
      author: "Pawar K",
    },
    {
      pmid: "18061177",
      title: "PepT1-mediated tripeptide KPV uptake reduces intestinal inflammation",
      journal: "Gastroenterology",
      year: "2008",
      author: "Dalmasso G",
    },
  ],
  "ll-37": [
    {
      pmid: "38642493",
      title:
        "Vitamin D triggers hCAP18/LL-37 production: Implications for LL-37-induced human osteoblast cytotoxicity",
      journal: "Biochem Biophys Res Commun",
      year: "2024",
      author: "Aidoukovitch A",
    },
    {
      pmid: "35954305",
      title: "LL-37, a Multi-Faceted Amphipathic Peptide Involved in NETosis",
      journal: "Cells",
      year: "2022",
      author: "Radic M",
    },
    {
      pmid: "39170953",
      title: "LL-37: A Direct Link Between Inflammation and Myocardial Infarction",
      journal: "JACC Basic Transl Sci",
      year: "2024",
      author: "Schneider DJ",
    },
  ],
  "ara-290": [
    {
      pmid: "21410562",
      title:
        "The erythropoietin analogue ARA290 modulates the innate immune response and reduces Escherichia coli invasion into urothelial cells",
      journal: "FEMS Immunol Med Microbiol",
      year: "2011",
      author: "Polgárová K",
    },
    {
      pmid: "29223734",
      title:
        "Activation of the EPOR-β common receptor complex by cibinetide ameliorates impaired wound healing in mice with genetic diabetes",
      journal: "Biochim Biophys Acta Mol Basis Dis",
      year: "2018",
      author: "Bitto A",
    },
    {
      pmid: "35008482",
      title:
        "The Non-Erythropoietic EPO Analogue Cibinetide Inhibits Osteoclastogenesis In Vitro and Increases Bone Mineral Density in Mice",
      journal: "Int J Mol Sci",
      year: "2021",
      author: "Awida Z",
    },
  ],
  "cjc-1295-no-dac": [],
  "cjc-1295-dac": [
    {
      pmid: "16352683",
      title:
        "Prolonged stimulation of growth hormone (GH) and insulin-like growth factor I secretion by CJC-1295, a long-acting analog of GH-releasing hormone, in healthy adults",
      journal: "J Clin Endocrinol Metab",
      year: "2006",
      author: "Teichman SL",
    },
    {
      pmid: "19386527",
      title:
        "Activation of the GH/IGF-1 axis by CJC-1295, a long-acting GHRH analog, results in serum protein profile changes in normal adult subjects",
      journal: "Growth Horm IGF Res",
      year: "2009",
      author: "Sackmann-Sala L",
    },
  ],
  ipamorelin: [
    {
      pmid: "9849822",
      title: "Ipamorelin, the first selective growth hormone secretagogue",
      journal: "Eur J Endocrinol",
      year: "1998",
      author: "Raun K",
    },
    {
      pmid: "10373343",
      title:
        "Ipamorelin, a new growth-hormone-releasing peptide, induces longitudinal bone growth in rats",
      journal: "Growth Horm IGF Res",
      year: "1999",
      author: "Johansen PB",
    },
    {
      pmid: "9879640",
      title:
        "Pharmacokinetic evaluation of ipamorelin and other peptidyl growth hormone secretagogues with emphasis on nasal absorption",
      journal: "Xenobiotica",
      year: "1998",
      author: "Johansen PB",
    },
  ],
  "ghrp-2": [
    {
      pmid: "15230633",
      title:
        "Pralmorelin: GHRP 2, GPA 748, growth hormone-releasing peptide 2, KP-102 D, KP-102 LN, KP-102D, KP-102LN",
      journal: "Drugs R D",
      year: "2004",
      author: "",
    },
    {
      pmid: "8887169",
      title:
        "GHRP-2, GHRH and SRIF interrelationships during chronic administration of GHRP-2 to humans",
      journal: "J Pediatr Endocrinol Metab",
      year: "1996",
      author: "Bowers CY",
    },
    {
      pmid: "20552695",
      title:
        "Determination of growth hormone secretagogue pralmorelin (GHRP-2) and its metabolite in human urine by liquid chromatography/electrospray ionization tandem mass spectrometry",
      journal: "Rapid Commun Mass Spectrom",
      year: "2010",
      author: "Okano M",
    },
  ],
  "ghrp-6": [
    {
      pmid: "8887178",
      title:
        "Growth hormone releasing hexapeptide-6 (GHRP-6) test in the diagnosis of GH-deficiency",
      journal: "J Pediatr Endocrinol Metab",
      year: "1996",
      author: "Pombo M",
    },
    {
      pmid: "41327290",
      title:
        "Growth hormone-releasing peptide 6 (GHRP-6) hydrogel for acute kidney injury therapy via metabolic regulation",
      journal: "J Nanobiotechnology",
      year: "2025",
      author: "Zhao X",
    },
    {
      pmid: "7920995",
      title:
        "Regulation of growth hormone secretion by the growth hormone releasing hexapeptide (GHRP-6)",
      journal: "J Pediatr Endocrinol",
      year: "1993",
      author: "Micic D",
    },
  ],
  hexarelin: [
    {
      pmid: "25278975",
      title: "The cardiovascular action of hexarelin",
      journal: "J Geriatr Cardiol",
      year: "2014",
      author: "Mao Y",
    },
    {
      pmid: "37710348",
      title: "Hexarelin alleviates apoptosis on ischemic acute kidney injury via MDM2/p53 pathway",
      journal: "Eur J Med Res",
      year: "2023",
      author: "Guan C",
    },
    {
      pmid: "34856183",
      title:
        "Hexarelin attenuates abdominal aortic aneurysm formation by inhibiting SMC phenotype switch and inflammasome activation",
      journal: "Microvasc Res",
      year: "2022",
      author: "Jiang B",
    },
  ],
  sermorelin: [
    {
      pmid: "18046908",
      title:
        "Sermorelin: a better approach to management of adult-onset growth hormone insufficiency?",
      journal: "Clin Interv Aging",
      year: "2006",
      author: "Walker RF",
    },
    {
      pmid: "33842627",
      title: "A potentially effective drug for patients with recurrent glioma: sermorelin",
      journal: "Ann Transl Med",
      year: "2021",
      author: "Chang Y",
    },
    {
      pmid: "18031173",
      title:
        "Sermorelin: a review of its use in the diagnosis and treatment of children with idiopathic growth hormone deficiency",
      journal: "BioDrugs",
      year: "1999",
      author: "Prakash A",
    },
  ],
  "igf-1-lr3": [
    {
      pmid: "37261455",
      title: "Recombinant expression of IGF-1 and LR3 IGF-1 fused with xylanase in Pichia pastoris",
      journal: "Appl Microbiol Biotechnol",
      year: "2023",
      author: "Lu Z",
    },
    {
      pmid: "39679943",
      title: "IGF-1 LR3 does not promote growth in late-gestation growth-restricted fetal sheep",
      journal: "Am J Physiol Endocrinol Metab",
      year: "2025",
      author: "White A",
    },
    {
      pmid: "37114757",
      title:
        "Attenuated glucose-stimulated insulin secretion during an acute IGF-1 LR3 infusion into fetal sheep does not persist in isolated islets",
      journal: "J Dev Orig Health Dis",
      year: "2023",
      author: "White A",
    },
  ],
  "nad-plus": [
    {
      pmid: "24786309",
      title: "NAD+ and sirtuins in aging and disease",
      journal: "Trends Cell Biol",
      year: "2014",
      author: "Imai S",
    },
    {
      pmid: "37424179",
      title: "NAD metabolism: Role in senescence regulation and aging",
      journal: "Aging Cell",
      year: "2024",
      author: "Chini CCS",
    },
  ],
  epithalon: [
    {
      pmid: "40141333",
      title: "Overview of Epitalon-Highly Bioactive Pineal Tetrapeptide with Promising Properties",
      journal: "Int J Mol Sci",
      year: "2025",
      author: "Araj SK",
    },
    {
      pmid: "40908429",
      title:
        "Epitalon increases telomere length in human cell lines through telomerase upregulation or ALT activity",
      journal: "Biogerontology",
      year: "2025",
      author: "Al-Dulaimi S",
    },
    {
      pmid: "40493162",
      title:
        "The Antioxidant Tetrapeptide Epitalon Enhances Delayed Wound Healing in an in Vitro Model of Diabetic Retinopathy",
      journal: "Stem Cell Rev Rep",
      year: "2025",
      author: "Gatta M",
    },
  ],
  "ss-31": [
    {
      pmid: "31747905",
      title:
        "Elamipretide (SS-31) improves mitochondrial dysfunction, synaptic and memory impairment induced by lipopolysaccharide in mice",
      journal: "J Neuroinflammation",
      year: "2019",
      author: "Zhao W",
    },
    {
      pmid: "39940712",
      title:
        "Elamipretide: A Review of Its Structure, Mechanism of Action, and Therapeutic Potential",
      journal: "Int J Mol Sci",
      year: "2025",
      author: "Tung C",
    },
    {
      pmid: "39848110",
      title:
        "SS-31@Fer-1 Alleviates ferroptosis in hypoxia/reoxygenation cardiomyocytes via mitochondrial targeting",
      journal: "Biomed Pharmacother",
      year: "2025",
      author: "Zheng H",
    },
  ],
  "thymosin-alpha-1": [
    {
      pmid: "11381492",
      title: "Thymosin alpha-1",
      journal: "Am J Health Syst Pharm",
      year: "2001",
      author: "Ancell CD",
    },
    {
      pmid: "41373628",
      title: "Aging and Thymosin Alpha-1",
      journal: "Int J Mol Sci",
      year: "2025",
      author: "Simonova MA",
    },
    {
      pmid: "15546254",
      title: "Thymalfasin (thymosin-alpha 1) therapy in patients with chronic hepatitis B",
      journal: "J Gastroenterol Hepatol",
      year: "2004",
      author: "Liaw YF",
    },
  ],
  thymalin: [
    {
      pmid: "12577695",
      title: "[Geroprotective effect of thymalin and epithalamin]",
      journal: "Adv Gerontol",
      year: "2002",
      author: "Khavinson VKh",
    },
    {
      pmid: "33237528",
      title: "Thymalin: Activation of Differentiation of Human Hematopoietic Stem Cells",
      journal: "Bull Exp Biol Med",
      year: "2020",
      author: "Khavinson VK",
    },
    {
      pmid: "38431810",
      title:
        "Reparative osteogenesis in mandible in cases of filling a bone defect with hydroxyapatite-containing osteotropic material and injecting the surrounding soft tissues with thymalin: experimental and morphological study",
      journal: "Wiad Lek",
      year: "2024",
      author: "Boiko AA",
    },
  ],
  dsip: [
    {
      pmid: "11437870",
      title: "Delta sleep-inducing peptide",
      journal: "Eur J Anaesthesiol",
      year: "2001",
      author: "Pollard BJ",
    },
    {
      pmid: "16539679",
      title: "Delta sleep-inducing peptide (DSIP): a still unresolved riddle",
      journal: "J Neurochem",
      year: "2006",
      author: "Kovalzon VM",
    },
    {
      pmid: "3550726",
      title: "Delta-sleep-inducing peptide (DSIP): an update",
      journal: "Peptides",
      year: "1986",
      author: "Graf MV",
    },
  ],
  semax: [
    {
      pmid: "32342318",
      title: "Functional Connectomic Approach to Studying Selank and Semax Effects",
      journal: "Dokl Biol Sci",
      year: "2020",
      author: "Panikratova YR",
    },
    {
      pmid: "40692165",
      title:
        "Semax peptide targets the μ opioid receptor gene Oprm1 to promote deubiquitination and functional recovery after spinal cord injury in female mice",
      journal: "Br J Pharmacol",
      year: "2025",
      author: "Liu R",
    },
    {
      pmid: "41479572",
      title:
        "The Potential of the Peptide Drug Semax and Its Derivative for Correcting Pathological Impairments in the Animal Model of Alzheimer's Disease",
      journal: "Acta Naturae",
      year: "2025",
      author: "Radchenko AI",
    },
  ],
  selank: [
    {
      pmid: "32342318",
      title: "Functional Connectomic Approach to Studying Selank and Semax Effects",
      journal: "Dokl Biol Sci",
      year: "2020",
      author: "Panikratova YR",
    },
    {
      pmid: "36322304",
      title:
        "Selank, a Peptide Analog of Tuftsin, Attenuates Aversive Signs of Morphine Withdrawal in Rats",
      journal: "Bull Exp Biol Med",
      year: "2022",
      author: "Konstantinopolsky MA",
    },
    {
      pmid: "28293190",
      title:
        "GABA, Selank, and Olanzapine Affect the Expression of Genes Involved in GABAergic Neurotransmission in IMR-32 Cells",
      journal: "Front Pharmacol",
      year: "2017",
      author: "Filatova E",
    },
  ],
  "melanotan-2": [
    {
      pmid: "37478579",
      title: "Melanotan-II reverses memory impairment induced by a short-term HF diet",
      journal: "Biomed Pharmacother",
      year: "2023",
      author: "Wekwejt P",
    },
    {
      pmid: "35188390",
      title: "CLIPSing Melanotan-II to Discover Multiple Functionally Selective hMCR Agonists",
      journal: "J Med Chem",
      year: "2022",
      author: "Tomassi S",
    },
    {
      pmid: "38285527",
      title:
        "5-Hydroxypyrroloindoline Affords Tryptathionine and 2,2'-bis-Indole Peptide Staples: Application to Melanotan-II",
      journal: "Chemistry",
      year: "2024",
      author: "Todorovic M",
    },
  ],
  "melanotan-1": [
    {
      pmid: "38598652",
      title: "Afamelanotide",
      journal: "",
      year: "2012",
      author: "",
    },
    {
      pmid: "26132941",
      title: "Afamelanotide for Erythropoietic Protoporphyria",
      journal: "N Engl J Med",
      year: "2015",
      author: "Langendonk JG",
    },
    {
      pmid: "38784937",
      title: "Afamelanotide in protoporphyria and other skin diseases: a review",
      journal: "Postepy Dermatol Alergol",
      year: "2024",
      author: "Polańska A",
    },
  ],
  "pt-141": [
    {
      pmid: "34436837",
      title: "Bremelanotide",
      journal: "",
      year: "2012",
      author: "",
    },
    {
      pmid: "31369224",
      title: "Bremelanotide",
      journal: "",
      year: "2006",
      author: "",
    },
    {
      pmid: "15134289",
      title: "PT-141 Palatin",
      journal: "Curr Opin Investig Drugs",
      year: "2004",
      author: "Hedlund P",
    },
  ],
};
