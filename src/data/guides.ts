// Education hub articles. Research register only: no dosing, no human-use guidance.
export type Block =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "list"; items: string[]; ordered?: boolean }
  | { type: "note"; text: string }
  | { type: "table"; head: string[]; rows: string[][] };

export type Guide = {
  slug: string;
  title: string;
  seoTitle: string;
  description: string;
  updated: string; // ISO date
  readMins: number;
  compounds: string[]; // related compound slugs
  body: Block[];
};

export const guides: Guide[] = [
  {
    slug: "how-to-reconstitute-peptides",
    title: "How to reconstitute lyophilised peptides",
    seoTitle: "How to Reconstitute Peptides: Step-by-Step Lab Guide UK",
    description:
      "A step-by-step laboratory guide to reconstituting lyophilised research peptides with bacteriostatic water, including concentration maths and handling tips.",
    updated: "2026-09-28",
    readMins: 6,
    compounds: ["bacteriostatic-water", "bpc-157", "retatrutide"],
    body: [
      {
        type: "p",
        text: "Research peptides are supplied as a lyophilised (freeze-dried) powder because peptides are far more stable dry than in solution. Before use in an assay they must be dissolved in a suitable diluent, a process called reconstitution. Done carefully, it gives a solution of known concentration without damaging the peptide.",
      },
      { type: "h", text: "What you need" },
      {
        type: "list",
        items: [
          "The sealed peptide vial, brought to room temperature before opening",
          "A sterile diluent. Bacteriostatic water (sterile water with 0.9% benzyl alcohol) is the usual choice for multi-access vials; sterile water or a buffer may be specified by your protocol",
          "Sterile single-use laboratory syringes or calibrated pipettes",
          "Alcohol wipes for the vial stoppers",
          "A clean, low-draught work surface and appropriate PPE",
        ],
      },
      { type: "h", text: "Step by step" },
      {
        type: "list",
        ordered: true,
        items: [
          "Let the vial reach room temperature for 10 to 15 minutes so condensation does not form inside it.",
          "Check the label and batch number against your records and the certificate of analysis.",
          "Wipe the rubber stoppers of the peptide vial and the diluent vial with an alcohol wipe and allow them to dry.",
          "Draw up the calculated volume of diluent (see the maths below).",
          "Insert the needle through the stopper and let the diluent run slowly down the inside wall of the vial. Do not jet it directly onto the powder.",
          "Swirl gently or roll the vial between your fingers until the powder has dissolved. Do not shake, as agitation can cause foaming and aggregation.",
          "Inspect the solution. It should be clear and free of particles. Some peptides, such as GHK-Cu, give a coloured (blue) solution, which is normal.",
          "Label the vial with the concentration, date of reconstitution and batch number, then store it refrigerated at 2 to 8°C.",
        ],
      },
      { type: "h", text: "Working out the concentration" },
      {
        type: "p",
        text: "Concentration is simply the amount of peptide divided by the volume of diluent. A 10mg vial reconstituted with 2ml of bacteriostatic water gives 5mg/ml. The same vial with 1ml gives 10mg/ml. Use our reconstitution calculator to work this out in either direction, including the volume needed to reach a target concentration.",
      },
      {
        type: "table",
        head: ["Vial", "Diluent volume", "Concentration"],
        rows: [
          ["5mg", "1ml", "5mg/ml"],
          ["5mg", "2ml", "2.5mg/ml"],
          ["10mg", "2ml", "5mg/ml"],
          ["10mg", "3ml", "3.33mg/ml"],
          ["50mg", "5ml", "10mg/ml"],
        ],
      },
      {
        type: "note",
        text: "Some peptides are poorly soluble in water at neutral pH. If a peptide does not dissolve, check the supplier data and the literature for a recommended solvent before adding more diluent.",
      },
      { type: "h", text: "After reconstitution" },
      {
        type: "p",
        text: "Reconstituted peptides are much less stable than the dry powder. Keep them at 2 to 8°C, protect them from light and avoid freeze-thaw cycles. If you need to store a solution for longer, divide it into single-use aliquots and freeze those, so each aliquot is thawed only once.",
      },
    ],
  },
  {
    slug: "peptide-storage-guide",
    title: "Peptide storage and handling guide",
    seoTitle: "Peptide Storage Guide: Temperature, Light & Stability UK",
    description:
      "How to store lyophilised and reconstituted research peptides: temperatures, light, moisture, freeze-thaw cycles and shelf-life considerations.",
    updated: "2026-09-28",
    readMins: 5,
    compounds: ["bpc-157", "ghk-cu", "nad-plus"],
    body: [
      {
        type: "p",
        text: "Peptides degrade through several routes: hydrolysis, oxidation (particularly methionine, cysteine and tryptophan residues), deamidation and aggregation. Good storage slows every one of them. The rules below apply to most research peptides; always check compound-specific data where it exists.",
      },
      { type: "h", text: "Lyophilised (powder) peptides" },
      {
        type: "list",
        items: [
          "Long-term storage: -20°C or colder, in the sealed vial.",
          "Short-term storage (weeks): 2 to 8°C refrigeration is suitable for most peptides.",
          "Transit: lyophilised peptides tolerate room temperature for the few days of normal UK delivery.",
          "Keep vials away from light and moisture. Store them in their box or an opaque container.",
          "Allow a cold vial to reach room temperature before opening, so moisture does not condense on the powder.",
        ],
      },
      { type: "h", text: "Reconstituted (solution) peptides" },
      {
        type: "list",
        items: [
          "Store at 2 to 8°C and protect from light.",
          "Avoid repeated freeze-thaw cycles. If freezing is needed, aliquot first.",
          "Use sterile technique every time the vial is accessed.",
          "Bacteriostatic water limits microbial growth in multi-access vials; sterile water does not.",
          "Label every vial with the compound, concentration, batch number and date.",
        ],
      },
      { type: "h", text: "Signs of degradation" },
      {
        type: "p",
        text: "Cloudiness, visible particles, a change in colour (other than a compound's normal colour) or a powder that has collapsed into a sticky film can all indicate moisture exposure or degradation. If in doubt, do not use the material in an experiment and contact us with the batch number.",
      },
      {
        type: "table",
        head: ["Form", "Temperature", "Notes"],
        rows: [
          ["Lyophilised, long term", "-20°C", "Sealed, dark, dry"],
          ["Lyophilised, short term", "2 to 8°C", "Sealed, dark"],
          ["Reconstituted", "2 to 8°C", "Dark, sterile access, no freeze-thaw"],
          ["Aliquoted solution", "-20°C", "Thaw each aliquot once only"],
        ],
      },
    ],
  },
  {
    slug: "how-to-read-a-certificate-of-analysis",
    title: "How to read a peptide certificate of analysis",
    seoTitle: "How to Read a Peptide COA: HPLC & Mass Spec Explained",
    description:
      "What a peptide certificate of analysis should show, how HPLC purity and mass spectrometry work, and the red flags to look out for.",
    updated: "2026-09-28",
    readMins: 7,
    compounds: ["bpc-157", "tb-500", "retatrutide"],
    body: [
      {
        type: "p",
        text: "A certificate of analysis (CoA) is the laboratory report that shows what is actually in a batch. For research peptides, a useful CoA answers three questions: is it the right molecule, how pure is it, and how much is in the vial?",
      },
      { type: "h", text: "What a good CoA includes" },
      {
        type: "list",
        items: [
          "The testing laboratory's name and a unique report or sample number",
          "The batch number, which should match the number printed on your vial",
          "The compound and labelled amount (for example, BPC-157 10mg)",
          "HPLC purity as a percentage, with the chromatogram",
          "Mass spectrometry results confirming the molecular weight",
          "Net peptide content or measured quantity, where tested",
          "The test date and the method used",
        ],
      },
      { type: "h", text: "HPLC purity" },
      {
        type: "p",
        text: "High-performance liquid chromatography separates the components of a sample as it passes through a column. Each component produces a peak on the chromatogram. Purity is the area of the main peak as a percentage of the total peak area. A figure of 99% means that 99% of the UV-absorbing material detected was the target peptide. It does not measure water, salts or counter-ions, which is why net content is reported separately.",
      },
      { type: "h", text: "Mass spectrometry" },
      {
        type: "p",
        text: "HPLC shows how pure a sample is, but not what it is. Mass spectrometry (MS or LC-MS) measures the mass of the molecule so it can be compared with the theoretical molecular weight. The two methods together confirm both identity and purity. Our product pages list the theoretical molecular weight of each compound so you can compare it with the certificate.",
      },
      { type: "h", text: "Red flags" },
      {
        type: "list",
        items: [
          "No laboratory name, or a report that cannot be traced to a real laboratory",
          "A batch number that does not match your vial, or no batch number at all",
          "The same certificate reused across different compounds or years",
          "Purity with no chromatogram, or identity with no mass spectrometry",
          "Round numbers with no method stated",
        ],
      },
      {
        type: "note",
        text: "Every Vyrax Labs certificate is published on the Lab Reports page and can be looked up by the batch number printed on your vial.",
      },
    ],
  },
  {
    slug: "bpc-157-vs-tb-500",
    title: "BPC-157 vs TB-500: how the research compares",
    seoTitle: "BPC-157 vs TB-500: Research Differences Explained | UK",
    description:
      "BPC-157 and TB-500 compared: structure, proposed mechanisms, research models and why they are often studied together.",
    updated: "2026-09-28",
    readMins: 6,
    compounds: ["bpc-157", "tb-500", "wolverine-stack"],
    body: [
      {
        type: "p",
        text: "BPC-157 and TB-500 are the two most frequently compared peptides in tissue repair research. They are often mentioned together, but they are very different molecules with different proposed mechanisms.",
      },
      {
        type: "table",
        head: ["", "BPC-157", "TB-500 (thymosin beta-4)"],
        rows: [
          ["Length", "15 amino acids", "43 amino acids"],
          [
            "Origin",
            "Partial sequence of a gastric juice protein",
            "Naturally occurring in most cells",
          ],
          ["Molecular weight", "approx. 1,419 Da", "approx. 4,963 Da"],
          [
            "Main research focus",
            "Tendon, ligament, gut and vascular models",
            "Actin regulation, cell migration, wound and cardiac models",
          ],
          [
            "Proposed pathways",
            "Angiogenesis, nitric oxide system, growth factor signalling",
            "G-actin sequestration, cell migration, angiogenesis",
          ],
        ],
      },
      { type: "h", text: "BPC-157" },
      {
        type: "p",
        text: "BPC-157 is notable for its stability in gastric conditions. Most of its literature comes from rodent models of tendon, ligament, muscle and gastrointestinal injury, where it has been linked to angiogenesis and the nitric oxide system. Human clinical data are very limited, and recent reviews stress the need for controlled studies.",
      },
      { type: "h", text: "TB-500" },
      {
        type: "p",
        text: "Thymosin beta-4 binds monomeric G-actin and regulates actin polymerisation, which is central to cell migration. It has been studied in wound repair, corneal injury and cardiac models. Note that the name TB-500 is sometimes used for a short synthetic fragment of thymosin beta-4 rather than the full-length peptide, so check the molecular weight on the certificate.",
      },
      { type: "h", text: "Why they are studied together" },
      {
        type: "p",
        text: "Because the two peptides are thought to act through different pathways, some researchers study them in combination to compare single and combined effects in the same model. Our Wolverine Stack supplies both in one vial from the same batch.",
      },
    ],
  },
  {
    slug: "retatrutide-vs-tirzepatide-vs-semaglutide",
    title: "Retatrutide vs tirzepatide vs semaglutide: receptor pharmacology compared",
    seoTitle: "Retatrutide vs Tirzepatide vs Semaglutide: Research Guide",
    description:
      "How the single, dual and triple incretin agonists differ in receptor targets, structure and research use.",
    updated: "2026-09-28",
    readMins: 7,
    compounds: ["retatrutide", "tirzepatide", "semaglutide", "cagrilintide"],
    body: [
      {
        type: "p",
        text: "Semaglutide, tirzepatide and retatrutide are three generations of incretin-based peptides. The key difference between them is how many receptors each one activates: one, two or three.",
      },
      {
        type: "table",
        head: ["", "Semaglutide", "Tirzepatide", "Retatrutide"],
        rows: [
          ["Receptor targets", "GLP-1", "GIP and GLP-1", "GIP, GLP-1 and glucagon"],
          ["Class", "Single agonist", "Dual agonist", "Triple agonist"],
          ["Length", "31 amino acids", "39 amino acids", "39 amino acids"],
          ["Backbone", "GLP-1", "GIP", "GIP"],
          ["Half-life extension", "C18 fatty diacid", "C20 fatty diacid", "C20 fatty diacid"],
          ["Approx. molecular weight", "4,114 Da", "4,813 Da", "4,731 Da"],
        ],
      },
      { type: "h", text: "Semaglutide: the GLP-1 benchmark" },
      {
        type: "p",
        text: "Semaglutide is a GLP-1 analogue with substitutions that protect it from DPP-4 and a fatty diacid chain that binds albumin. With the largest body of published data of the three, it is the usual reference compound for GLP-1 receptor research.",
      },
      { type: "h", text: "Tirzepatide: adding GIP" },
      {
        type: "p",
        text: "Tirzepatide is built on a GIP backbone and activates both GIP and GLP-1 receptors, with greater relative activity at the GIP receptor. Comparing it with semaglutide helps separate GLP-1 receptor effects from combined incretin effects.",
      },
      { type: "h", text: "Retatrutide: adding glucagon" },
      {
        type: "p",
        text: "Retatrutide adds glucagon receptor agonism. Glucagon receptor activation is studied for its effects on energy expenditure and hepatic lipid metabolism, which makes retatrutide a tool for studying what a third receptor adds beyond dual incretin agonism. Its phase 2 results were published in 2023 and phase 3 programmes are ongoing.",
      },
      { type: "h", text: "Choosing a compound for your study" },
      {
        type: "p",
        text: "Studies that isolate GLP-1 receptor effects typically use semaglutide. Studies of combined incretin signalling use tirzepatide, often with semaglutide as a comparator. Studies of glucagon receptor contribution use retatrutide alongside one or both of the others. The amylin analogue cagrilintide is used for a separate pathway and is often studied in combination with GLP-1 agonists.",
      },
    ],
  },
];

export const guideBySlug = (slug: string) => guides.find((g) => g.slug === slug);
