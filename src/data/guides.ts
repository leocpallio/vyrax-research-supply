// Education hub articles. No dosing, no human-use guidance.
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
  /** First publication date. Defaults to `updated` when absent. */
  published?: string;
  /** Short note on what changed in the latest revision, shown on older posts. */
  changed?: string;
  readMins: number;
  compounds: string[]; // related compound slugs
  /** Answer-first summary, 40-60 words, extractable by AI answer engines verbatim. */
  tldr: string;
  body: Block[];
};

export const guides: Guide[] = [
  {
    slug: "how-to-reconstitute-peptides",
    title: "How to reconstitute lyophilised peptides",
    seoTitle: "How to Reconstitute Peptides: Lab Guide UK",
    description:
      "How to reconstitute a lyophilised peptide vial with bacteriostatic water: step by step, solvent choice, concentration maths and storage, plus a dilution reference for every compound.",
    updated: "2026-11-02",
    changed:
      "Added solvent selection, aliquoting, stability evidence and a per-compound dilution reference covering the whole catalogue.",
    readMins: 12,
    compounds: [
      "bacteriostatic-water",
      "bpc-157",
      "retatrutide",
      "ghk-cu",
      "igf-1-lr3",
      "nad-plus",
    ],
    tldr:
      "Peptide reconstitution is a laboratory preparation step, not a universal recipe. Solvent compatibility, concentration and stability depend on the particular sequence and formulation. Researchers should use compound-specific documentation and validated methods, record the batch and preparation conditions, and assess solution quality with appropriate analytical controls. This guide discusses those considerations for research materials only.",
    body: [
      {
        type: "p",
        text: "Peptides are supplied as a lyophilised (freeze-dried) powder because peptides are far more stable dry than in solution. Before use they must be dissolved in a suitable diluent, a process called reconstitution. Done carefully, it gives a solution of known concentration without damaging the peptide.",
      },
      { type: "h", text: "What you need" },
      {
        type: "list",
        items: [
          "The sealed peptide vial, brought to room temperature before opening",
          "A sterile diluent. Bacteriostatic water (sterile water with 0.9% benzyl alcohol) is the usual choice for multi-access vials; sterile water or a buffer may be specified by your protocol",
          "Sterile single-use syringes or calibrated pipettes",
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
        text: "Concentration is the amount of peptide divided by the volume of diluent. A 10mg vial reconstituted with 2ml of bacteriostatic water gives 5mg/ml. The same vial with 1ml gives 10mg/ml. The amount of peptide never changes, only the volume it sits in, so the choice of volume is a choice of concentration, subject to what the solvent can actually dissolve.",
      },
      {
        type: "p",
        text: "Turn it round the other way when you are working from a target mass: the volume of stock that contains a given mass is that mass divided by the concentration. In a 5mg/ml stock, 2mg of peptide sits in 0.4ml. Our reconstitution calculator does both directions, and the per-compound reference lists the concentrations each diluent volume produces for every vial size we supply.",
      },
      {
        type: "table",
        head: ["Vial", "Diluent volume", "Concentration", "Volume holding 1mg"],
        rows: [
          ["5mg", "1ml", "5mg/ml", "0.2ml"],
          ["5mg", "2ml", "2.5mg/ml", "0.4ml"],
          ["10mg", "1ml", "10mg/ml", "0.1ml"],
          ["10mg", "2ml", "5mg/ml", "0.2ml"],
          ["10mg", "3ml", "3.33mg/ml", "0.3ml"],
          ["20mg", "5ml", "4mg/ml", "0.25ml"],
          ["50mg", "5ml", "10mg/ml", "0.1ml"],
          ["70mg", "5ml", "14mg/ml", "0.071ml"],
        ],
      },
      { type: "h", text: "Choosing the solvent" },
      {
        type: "p",
        text: "The solvent does two jobs: it dissolves the powder, and it decides how long the solution stays usable. Four solvents cover almost everything in a research catalogue, and the reason for each is chemistry rather than habit.",
      },
      {
        type: "table",
        head: ["Solvent", "What it is", "Why it is used"],
        rows: [
          [
            "Bacteriostatic water",
            "Sterile water with 0.9% benzyl alcohol",
            "The default for a vial that will be accessed more than once: benzyl alcohol is bacteriostatic, so microbial growth in the vial is limited (Meyer 2007). Not for spectrophotometry near 260 nm, where benzyl alcohol absorbs.",
          ],
          [
            "Sterile water, no preservative",
            "Sterile water without an antimicrobial",
            "Used where a preservative would interfere with the assay or the chemistry, and where the stock is single-use. No protection against microbial growth, so make it fresh and aliquot it.",
          ],
          [
            "Dilute acetic acid, 0.1 M",
            "0.1 mol/l acetic acid in sterile water",
            "For peptides that are poorly soluble, or hydrolyse and aggregate faster, at neutral pH. The stock stays acidic and is diluted into buffer on the day (Wang 1999).",
          ],
          [
            "DMSO, anhydrous",
            "Dimethyl sulfoxide",
            "For the few materials that will not reach a workable concentration in water. The powder is pre-dissolved in the minimum volume of DMSO and an aliquot is diluted into buffer. No aqueous stock is claimed, DMSO freezes at about 18.5°C, and the final DMSO percentage has to be recorded because it changes most assays.",
          ],
        ],
      },
      {
        type: "note",
        text: "Benzyl alcohol is a preservative, not a stabiliser: it slows microbial growth, it does not stop hydrolysis, oxidation or aggregation. A preserved solution still degrades, so the storage rules below apply either way.",
      },
      { type: "h", text: "Aliquoting and repeated access" },
      {
        type: "list",
        items: [
          "Every access to a vial is an opportunity for contamination and for oxygen to enter. Decide the aliquot size before the first access, not after.",
          "Divide a solution that has to be kept into single-use aliquots, freeze them at -20°C and thaw each one once. A refrozen aliquot is not the same material.",
          "Use a fresh sterile tip or needle for each transfer and never return unused solution to the stock vial.",
          "Keep the dry vial sealed until it has reached room temperature, so moisture does not condense onto the powder, and reseal it promptly after use.",
          "Record the number of accesses and the date of the first one. A multi-access vial has a finite working life even when it is preserved.",
        ],
      },
      { type: "h", text: "How long a solution keeps" },
      {
        type: "p",
        text: "Reconstituted material is far less stable than the dry powder. The dry vial is the stable form: sealed at -20°C it is the reference state, and the solution is the transient one. Water enables hydrolysis and deamidation, dissolved oxygen enables oxidation, and light drives photo-oxidation of tryptophan and tyrosine residues (Manning 2010).",
      },
      {
        type: "p",
        text: "Published stability data exists for some peptides and not for most. Where a study exists, our per-compound reference quotes it. Where none exists, it says so, because a shelf life printed without a source is worse than no number at all. The working assumption for an unsourced peptide is the conservative one: keep the solution at 2 to 8°C, protected from light, and treat any time in solution as short.",
      },
      { type: "h", text: "Labelling and records" },
      {
        type: "list",
        items: [
          "Compound name, batch number and the mass that was in the vial.",
          "Solvent used, and the volume added, so the concentration can be recomputed from the label alone.",
          "Date and time of reconstitution, and who prepared it.",
          "Storage location and the date each aliquot was frozen.",
          "Anything unusual: a slow-to-dissolve cake, a colour that differs from the previous preparation, visible particles, foam that did not clear.",
        ],
      },
      { type: "h", text: "When the powder does not fully dissolve" },
      {
        type: "list",
        items: [
          "Give it time and gentle swirling before adding anything else. Some cakes wet out slowly and clear after a few minutes.",
          "Do not keep adding diluent to force it into solution. More volume does dissolve more material once the solution is saturated, but it also dilutes everything already dissolved and you lose track of the final concentration. Work out the volume you need first; if the powder still will not clear, the problem is the solvent, not the volume.",
          "Do not heat it, sonicate it or vortex it. All three increase aggregation (Manning 2010).",
          "Check the appearance recorded for that compound. GHK-Cu and the blends that contain it give a blue solution, which is the copper complex and not a fault.",
          "If material remains undissolved after gentle handling, stop. A peptide that will not dissolve at neutral pH may need dilute acetic acid, and that decision belongs in your records before more material is used.",
        ],
      },
      { type: "h", text: "Every compound, one page" },
      {
        type: "p",
        text: "The general method above is the same for the whole catalogue, but the solvent, the concentration options and the published stability evidence differ by compound. The reconstitution and dilution reference lists all of them: solvent and the reason for it, the concentration each diluent volume gives for every vial size we supply, storage for the dry and diluted forms, handling cautions and the sources behind each statement.",
      },
      { type: "h", text: "After reconstitution" },
      {
        type: "p",
        text: "Reconstituted peptides are much less stable than the dry powder. Keep them at 2 to 8°C, protect them from light and avoid freeze-thaw cycles. If you need to store a solution for longer, divide it into single-use aliquots and freeze those, so each aliquot is thawed only once.",
      },
      { type: "h", text: "Sources" },
      {
        type: "list",
        items: [
          "Manning MC, Chou DK, Murphy BM, Payne RW, Katayama DS. Stability of protein pharmaceuticals: an update. Pharmaceutical Research, 2010. PMID 20143256.",
          "Wang W. Instability, stabilization, and formulation of liquid protein pharmaceuticals. International Journal of Pharmaceutics, 1999. PMID 10460913.",
          "Meyer BK, Ni A, Hu B, Shi L. Antimicrobial preservative use in parenteral products: past and present. Journal of Pharmaceutical Sciences, 2007. PMID 17722087.",
        ],
      },
    ],
  },
  {
    slug: "peptide-storage-guide",
    title: "Peptide storage and handling guide",
    seoTitle: "Peptide Storage Guide: Temperature & Light",
    description:
      "How to store peptides: fridge and freezer temperatures, light, moisture, freeze-thaw cycles and how long a reconstituted vial keeps.",
    updated: "2026-09-28",
    readMins: 5,
    compounds: ["bpc-157", "ghk-cu", "nad-plus"],
    tldr:
      "Peptide stability varies with sequence, formulation, moisture, light and temperature; no single storage duration applies across a catalogue. Freeze-thaw cycles can affect some materials, while visible changes alone cannot establish chemical identity or potency. Researchers should consult compound-specific stability evidence and use analytical testing where a defined holding period matters. This guide compares the factors affecting dry and solution forms.",
    body: [
      {
        type: "p",
        text: "Peptides degrade through several routes: hydrolysis, oxidation (particularly methionine, cysteine and tryptophan residues), deamidation and aggregation. Good storage slows every one of them. The rules below apply to most peptides; always check compound-specific data where it exists.",
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
    seoTitle: "How to Read a Peptide COA: HPLC & Mass Spec",
    description:
      "What a peptide certificate of analysis should show, how HPLC purity and mass spectrometry work, and the red flags to look out for.",
    updated: "2026-09-28",
    readMins: 7,
    compounds: ["bpc-157", "tb-500", "retatrutide"],
    tldr:
      "A valid peptide CoA names the testing laboratory, carries a batch number matching your vial, and shows HPLC purity with the chromatogram plus mass spectrometry confirming the molecular weight. Red flags: no lab name, no batch match, a purity figure with no chromatogram, or the same certificate reused across compounds and years.",
    body: [
      {
        type: "p",
        text: "A certificate of analysis (CoA) is the laboratory report that shows what is actually in a batch. For a peptide, a useful CoA answers three questions: is it the right molecule, how pure is it, and how much is in the vial?",
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
    title: "BPC-157 vs TB-500: recovery peptides compared",
    seoTitle: "BPC-157 vs TB-500: Research Differences",
    description:
      "BPC-157 and TB-500 compared: structure, proposed mechanisms, what the studies looked at and why the two get paired.",
    updated: "2026-09-28",
    readMins: 6,
    compounds: ["bpc-157", "tb-500", "wolverine-stack"],
    tldr:
      "BPC-157 is a 15 amino acid peptide investigated mainly in preclinical tissue-repair models. Thymosin beta-4 is a distinct 43 amino acid peptide studied for actin regulation and cell migration. The label TB-500 can refer to a shorter fragment rather than full-length thymosin beta-4, so identity requires sequence or molecular-weight evidence. Neither name establishes a clinical benefit.",
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
    title: "Retatrutide vs tirzepatide vs semaglutide: weight loss peptides compared",
    seoTitle: "Retatrutide vs Tirzepatide vs Semaglutide",
    description:
      "Semaglutide, tirzepatide and retatrutide compared: receptor targets, structure, half-life chemistry and what separates them.",
    updated: "2026-09-28",
    readMins: 7,
    compounds: ["retatrutide", "tirzepatide", "semaglutide"],
    tldr:
      "Semaglutide targets GLP-1 receptors, tirzepatide targets GIP and GLP-1 receptors, and investigational retatrutide also targets the glucagon receptor. Receptor count describes their pharmacology, not comparative clinical potency or regulatory status. Licensed medicines and unapproved research materials must not be conflated; verify the identity and applicable status of each specific product independently.",
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
        text: "Studies that isolate GLP-1 receptor effects typically use semaglutide. Studies of combined incretin signalling use tirzepatide, often with semaglutide as a comparator. Studies of glucagon receptor contribution use retatrutide alongside one or both of the others.",
      },
    ],
  },
  {
    slug: "how-long-do-reconstituted-peptides-last",
    title: "How long do reconstituted peptides last?",
    seoTitle: "How Long Do Reconstituted Peptides Last?",
    description:
      "What decides the shelf life of a reconstituted peptide: sequence, diluent, temperature, light and handling. No single number fits every compound.",
    updated: "2026-10-28",
    readMins: 5,
    compounds: ["bacteriostatic-water", "bpc-157", "tb-500"],
    tldr:
      "There is no universal shelf life for a peptide solution: sequence, formulation, temperature, light and handling influence stability. Lyophilised and dissolved forms require separate evidence; appearance by itself cannot quantify degradation. Laboratories can evaluate a proposed holding period using validated analytical methods such as HPLC. Consult compound-specific documentation rather than applying one duration or storage rule to every research material.",
    body: [
      {
        type: "p",
        text: "There is no single shelf life for a reconstituted peptide. Stability depends on the amino acid sequence, the diluent, the storage temperature, light exposure and how often the vial is opened. Any fixed number quoted for every peptide should be treated with caution.",
      },
      { type: "h", text: "Lyophilised versus reconstituted" },
      {
        type: "p",
        text: "Freeze-dried powder is far more stable than the same peptide in solution. Water drives most degradation routes, so once a peptide is dissolved the clock starts. Unopened lyophilised vials are typically stored cold and dark, and the powder is the form to keep for long-term holding.",
      },
      { type: "h", text: "What shortens stability in solution" },
      {
        type: "list",
        items: [
          "Sequence: methionine and cysteine residues oxidise, while asparagine and glutamine can deamidate.",
          "Temperature: degradation speeds up as temperature rises, which is why solutions are held at 2 to 8°C.",
          "Freeze-thaw cycles: repeated freezing can aggregate peptides, so dividing a solution into single-use aliquots is common lab practice.",
          "Light and air: amber vials and minimal headspace reduce photo-oxidation.",
          "Contamination: every needle puncture is a chance to introduce microbes.",
        ],
      },
      { type: "h", text: "The diluent matters" },
      {
        type: "p",
        text: "Bacteriostatic water contains 0.9% benzyl alcohol, which suppresses bacterial growth across repeated punctures. Sterile water has no preservative, so a vial made up with it is normally treated as single-use. Neither extends the chemical stability of the peptide itself.",
      },
      { type: "h", text: "How labs decide" },
      {
        type: "p",
        text: "Where a defined hold time matters, laboratories test it, usually by re-running HPLC on stored aliquots and comparing the purity against the day-zero result. A visible change such as cloudiness, particles or discolouration means the solution should be discarded.",
      },
      {
        type: "note",
        text: "Products are sold as research compounds. This guide describes general peptide chemistry and is not a dosing protocol.",
      },
    ],
  },
  {
    slug: "melanotan-1-vs-melanotan-2",
    title: "Melanotan 1 vs melanotan 2: tanning peptides compared",
    seoTitle: "Melanotan 1 vs Melanotan 2: Research Compared",
    description:
      "Melanotan 1 (afamelanotide) and melanotan 2 compared: structure, receptor selectivity, molecular weight and what each is licensed for.",
    updated: "2026-10-28",
    readMins: 5,
    compounds: ["melanotan-1", "melanotan-2"],
    tldr:
      "Melanotan 1 (afamelanotide) is a linear 13 amino acid peptide selective mainly for the MC1R receptor, studied in melanogenesis and photoprotection models. Melanotan 2 is a smaller cyclic heptapeptide binding MC1R, MC3R, MC4R and MC5R. Afamelanotide is a licensed medicine for one rare condition; melanotan 2 has no UK authorisation.",
    body: [
      {
        type: "p",
        text: "Melanotan 1 and melanotan 2 are both synthetic analogues of alpha-melanocyte-stimulating hormone (alpha-MSH). They share a name and an origin in pigmentation research, but they are different molecules with different receptor profiles.",
      },
      {
        type: "table",
        head: ["", "Melanotan 1", "Melanotan 2"],
        rows: [
          ["Also known as", "Afamelanotide", "MT-II"],
          ["Structure", "Linear, 13 amino acids", "Cyclic heptapeptide"],
          ["Molecular weight", "approx. 1,647 Da", "approx. 1,024 Da"],
          ["Receptor profile", "Mainly MC1R", "Non-selective: MC1R, MC3R, MC4R and MC5R"],
          [
            "Main research focus",
            "Melanogenesis and photoprotection models",
            "Melanocortin signalling across several receptor subtypes",
          ],
        ],
      },
      { type: "h", text: "Receptor selectivity" },
      {
        type: "p",
        text: "The key distinction in the literature is selectivity. Melanotan 1 acts mostly at the melanocortin 1 receptor, which controls pigment production in melanocytes. Melanotan 2 binds several melanocortin receptors, which is why it appears in a wider range of research models.",
      },
      { type: "h", text: "Regulatory status" },
      {
        type: "p",
        text: "Afamelanotide is a licensed medicine in some jurisdictions for one rare condition, erythropoietic protoporphyria. Melanotan 2 has no marketing authorisation in the UK, and the MHRA has warned about unlicensed products sold for tanning. Vyrax Labs supplies both as research compounds.",
      },
      {
        type: "note",
        text: "Products are sold as research compounds. This guide compares published chemistry and is not a dosing protocol.",
      },
    ],
  },
  {
    slug: "buy-retatrutide-uk",
    title: "Buying retatrutide in the UK: what to check",
    seoTitle: "Buy Retatrutide UK: Vial Sizes and Batch Checks",
    description:
      "Retatrutide UK buyer's checklist: vial sizes and cost per mg, what a certificate must show, fill and identity checks.",
    updated: "2026-10-27",
    readMins: 7,
    compounds: ["retatrutide", "tirzepatide", "bacteriostatic-water"],
    tldr:
      "Retatrutide is an investigational peptide, not an authorised UK medicine. For research-material identity, a certificate should identify the batch and show the methods and results behind any purity or mass claim; a headline percentage alone does not establish content or authenticity. Check whether molecular mass matches the declared sequence, and distinguish independent analytical evidence from a seller's unverified assertion.",
    body: [
      {
        type: "p",
        text: "Retatrutide is one of the most searched peptides in the UK and one of the most inconsistently supplied. The molecule is a 39 amino acid triple agonist at the GIP, GLP-1 and glucagon receptors, and it is sold as a lyophilised powder in sealed vials. Because it is sold as a research compound rather than a licensed medicine, the buyer carries the checking. This page sets out what to look at before paying, and what to compare between sellers.",
      },
      { type: "h", text: "What is actually in the vial" },
      {
        type: "p",
        text: "A retatrutide vial should contain a white to off-white lyophilised cake or powder and nothing else. The label should carry the compound name, the strength in milligrams, a batch number and a storage instruction. The batch number is the important one: it is the only thing that ties your vial to a laboratory report. A vial with no batch number cannot be verified by anyone, including the seller.",
      },
      {
        type: "p",
        text: "The theoretical molecular weight of retatrutide is approximately 4,731 Da. That figure belongs on the certificate, next to a mass spectrometry result, because it is what distinguishes the real molecule from a lookalike peptide sold under the same name.",
      },
      { type: "h", text: "Vial sizes and cost per milligram" },
      {
        type: "p",
        text: "Retatrutide is normally listed in 10mg, 20mg and 30mg vials. Larger vials are cheaper per milligram, but only if you will get through the material before it degrades, and only if the fill is honest. Price per milligram is the only fair comparison between sellers, so work it out rather than comparing headline prices.",
      },
      {
        type: "table",
        head: ["Vial", "Typical UK price", "Cost per mg"],
        rows: [
          ["10mg", "£59.99", "£6.00"],
          ["20mg", "£79.99", "£4.00"],
          ["30mg", "£109.99", "£3.67"],
        ],
      },
      {
        type: "p",
        text: "A 30mg vial is roughly 40% cheaper per milligram than a 10mg vial. That is a real saving, but it only holds if the 30mg vial actually contains 30mg. Fill is the quietest form of short-measure in this market, and it is invisible without a laboratory result for that batch.",
      },
      { type: "h", text: "What the certificate has to show" },
      {
        type: "list",
        items: [
          "The laboratory that ran the work, named, with a report or sample number you could quote back to them",
          "The batch number, matching the number printed on the vial you are sent",
          "HPLC purity as a percentage, with the chromatogram rather than the number alone",
          "A mass spectrometry result confirming the molecular weight near 4,731 Da",
          "Net peptide content, or measured fill, for the strength on the label",
          "The test date and the method used",
        ],
      },
      {
        type: "p",
        text: "If a seller shows a certificate but the batch number does not match the vial, the certificate is decoration. If the same certificate appears on every product page and has done for a year, it is being reused. Our guide to reading a certificate of analysis goes through the structure of a proper report in detail.",
      },
      { type: "h", text: "Red flags" },
      {
        type: "list",
        items: [
          "Purity quoted as a round number with no chromatogram and no method",
          "A certificate with no laboratory name, or one that cannot be found anywhere else",
          "Retatrutide sold as a liquid, pre-mixed, without stating the diluent or the concentration",
          "Prices far below the market with no batch documentation to explain them",
          "A seller who cannot say what the molecular weight of the compound is",
          "Vials with no batch number, or a batch number that changes between the listing and the delivery",
        ],
      },
      { type: "h", text: "Powder or pre-mixed liquid" },
      {
        type: "p",
        text: "Almost all retatrutide is sold as lyophilised powder because the dry form is far more stable in transit and in storage. Pre-mixed liquid is convenient but starts degrading the day it is made, and you inherit whatever diluent and concentration the seller chose. For anything you intend to keep, powder is the safer purchase.",
      },
      { type: "h", text: "On arrival" },
      {
        type: "list",
        items: [
          "Check the batch number on the vial against the certificate before opening anything",
          "Confirm the powder is an intact cake or free powder, not a collapsed sticky film",
          "Store unopened vials cold and dark, at -20°C for long term holding",
          "Let a cold vial reach room temperature before opening it, so moisture does not condense on the powder",
        ],
      },
      {
        type: "note",
        text: "Vyrax Labs supplies retatrutide as a lyophilised powder in 10mg, 20mg and 30mg vials, with a certificate published for each batch on the Lab Reports page. It is sold for research use only, not as a licensed medicine.",
      },
    ],
  },
  {
    slug: "retatrutide-vs-tirzepatide",
    title: "Retatrutide vs tirzepatide: the third receptor and weight loss",
    seoTitle: "Retatrutide vs Tirzepatide: Receptors Compared",
    description:
      "Retatrutide vs tirzepatide compared: receptor targets, glucagon agonism, structure and molecular weight.",
    updated: "2026-10-27",
    readMins: 6,
    compounds: ["retatrutide", "tirzepatide", "semaglutide"],
    tldr:
      "Tirzepatide is a dual agonist at the GIP and GLP-1 receptors; retatrutide is a triple agonist that adds the glucagon receptor, studied for energy expenditure and hepatic lipid effects. Both are 39 amino acid GIP-backbone peptides with a C20 fatty diacid, differing by about 82 Da, which mass spectrometry resolves and the eye cannot.",
    body: [
      {
        type: "p",
        text: "Retatrutide and tirzepatide are both engineered incretin peptides built on a GIP backbone with a fatty diacid for half-life extension. The difference that matters in the literature is one receptor: tirzepatide activates GIP and GLP-1, while retatrutide adds glucagon receptor agonism on top of both. That single addition is the whole reason the pair is studied side by side.",
      },
      {
        type: "table",
        head: ["", "Tirzepatide", "Retatrutide"],
        rows: [
          ["Receptor targets", "GIP and GLP-1", "GIP, GLP-1 and glucagon"],
          ["Class", "Dual agonist", "Triple agonist"],
          ["Length", "39 amino acids", "39 amino acids"],
          ["Backbone", "GIP", "GIP"],
          ["Half-life extension", "C20 fatty diacid", "C20 fatty diacid"],
          ["Approx. molecular weight", "4,813 Da", "4,731 Da"],
          [
            "Main research use",
            "Combined incretin signalling",
            "Glucagon contribution to energy balance",
          ],
        ],
      },
      { type: "h", text: "Why glucagon is the interesting part" },
      {
        type: "p",
        text: "Glucagon receptor activation raises energy expenditure and drives hepatic lipid handling, which is a different lever from incretin signalling. Adding it to a dual agonist gives a compound that acts on three pathways at once, and it makes retatrutide the tool of choice when a study is asking what glucagon receptor agonism contributes beyond GIP and GLP-1. Tirzepatide cannot answer that question on its own, because it has no glucagon activity.",
      },
      { type: "h", text: "What the two have in common" },
      {
        type: "p",
        text: "Both are 39 amino acids long, both are built on a GIP backbone, both carry a C20 fatty diacid for albumin binding, and both are supplied as lyophilised powder. In a laboratory they are handled the same way and stored the same way. The similarity is why they work as a controlled pair: the backbone and the half-life chemistry are held constant, so the observed difference can be attributed to the receptor profile rather than to the scaffold.",
      },
      { type: "h", text: "Identity checks matter more here" },
      {
        type: "p",
        text: "Because the two molecules are close in size and share a backbone, a mix-up between them is plausible and hard to see. The molecular weights differ by about 82 Da, which mass spectrometry resolves easily but the eye cannot. If you are running a comparative study, confirm the reported mass on the certificate for each batch against 4,813 Da for tirzepatide and 4,731 Da for retatrutide before you start.",
      },
      { type: "h", text: "Choosing between them" },
      {
        type: "list",
        items: [
          "Studying combined incretin effects without glucagon: tirzepatide",
          "Studying the glucagon receptor contribution: retatrutide, with tirzepatide as the dual agonist control",
          "Separating GLP-1 receptor effects from everything else: semaglutide as the selective comparator",
          "Running all three in one model: keep the same batch and the same reconstitution protocol across arms",
        ],
      },
      {
        type: "p",
        text: "Published phase 2 data exist for both compounds and phase 3 programmes are running, so the literature is growing quickly in both directions. Neither is a licensed medicine in the UK, and both are sold here as research compounds.",
      },
      {
        type: "note",
        text: "Products are sold as research compounds. This guide compares published pharmacology and is not a dosing protocol.",
      },
    ],
  },
  {
    slug: "peptide-purity-testing",
    title: "Peptide purity testing: what HPLC and mass spectrometry actually measure",
    seoTitle: "Peptide Purity Testing: HPLC and Mass Spec",
    description:
      "What HPLC and mass spectrometry each prove about a peptide, why purity is not content, and what neither catches.",
    updated: "2026-10-27",
    readMins: 8,
    compounds: ["bpc-157", "retatrutide", "tb-500"],
    tldr:
      "HPLC purity measures what share of detected material is the target peptide; it says nothing about identity, water, salt or fill. Mass spectrometry confirms identity against the theoretical molecular weight. Purity is not content: a 99% pure vial can be under-filled. Check the chromatogram, and match the batch number to your vial.",
    body: [
      {
        type: "p",
        text: "Purity is the most quoted number in peptide supply and the most misunderstood. It answers a narrow question, how much of the detectable material is the target molecule, and it says nothing about identity, quantity or sterility on its own. Understanding what the methods do and do not show is what lets you read a report properly.",
      },
      { type: "h", text: "Two methods, two different questions" },
      {
        type: "p",
        text: "Purity and identity are separate questions and need separate methods. HPLC answers the first. Mass spectrometry answers the second. A report carrying only one of them is only half a report.",
      },
      { type: "h", text: "How HPLC works" },
      {
        type: "p",
        text: "High-performance liquid chromatography pushes the sample through a packed column under pressure. Different components travel at different speeds depending on how they interact with the stationary phase and the mobile phase, so they elute at different times and are detected separately, usually by UV absorbance. The output is a chromatogram: a baseline with peaks on it.",
      },
      {
        type: "p",
        text: "Purity is calculated as the area under the main peak divided by the total area under all peaks, expressed as a percentage. A 98% figure means 98% of the UV-absorbing material that came off the column was the target peptide. The remaining 2% is other UV-absorbing material: truncated sequences, deletion peptides, oxidised variants, diastereomers.",
      },
      { type: "h", text: "What a chromatogram tells you that a number cannot" },
      {
        type: "list",
        items: [
          "Whether the main peak is sharp and symmetrical, or broad and tailing",
          "Whether impurities elute close to the main peak, which makes the separation harder and the number less meaningful",
          "Whether the baseline is flat or noisy",
          "Whether the peak shape is consistent with a single species",
        ],
      },
      {
        type: "p",
        text: "A purity figure with no chromatogram attached cannot be checked at all. The chromatogram is the evidence; the percentage is a summary of it.",
      },
      { type: "h", text: "How mass spectrometry works" },
      {
        type: "p",
        text: "Mass spectrometry ionises the sample and measures the mass to charge ratio of the ions, which gives the molecular mass of the molecule. Comparing that against the theoretical mass for the sequence confirms the compound is what the label says. For retatrutide the theoretical value is about 4,731 Da and for BPC-157 about 1,419 Da. A result within a fraction of a dalton of the theoretical figure is confirmation. A result tens of daltons away is a different molecule.",
      },
      { type: "h", text: "Purity is not content" },
      {
        type: "p",
        text: "Purity is a percentage of what the detector saw. It is blind to water, residual salts, counter-ions and solvent, none of which absorb at the wavelengths used. A vial can be 99% pure and still contain well under the labelled amount of peptide if it holds 20% water and salt by weight. That is why net peptide content is reported separately, and why a certificate without a content figure does not establish the fill.",
      },
      {
        type: "table",
        head: ["Question", "Method", "What it establishes"],
        rows: [
          ["Is it the right molecule?", "Mass spectrometry", "Identity against theoretical mass"],
          ["How much else is in it?", "HPLC", "Purity as a percentage of detected material"],
          ["How much peptide is in the vial?", "Net peptide content", "Fill, after water and salt"],
          ["Is it sterile?", "Not established by either", "Nothing, unless tested separately"],
        ],
      },
      { type: "h", text: "What neither method catches" },
      {
        type: "list",
        items: [
          "Water and salt content, which only a content assay addresses",
          "Sterility and endotoxin, which need separate microbiology",
          "Residual solvents from synthesis, which need gas chromatography",
          "Whether the material was handled cleanly after testing",
          "Whether the vial you were sent came from the batch that was tested",
        ],
      },
      {
        type: "p",
        text: "The last point is the one buyers can control. Matching the batch number on your vial to the batch number on the report is the step that connects the laboratory result to the object in your hand. Without that match, a genuine report proves only that some material, somewhere, was tested.",
      },
      { type: "h", text: "Reading a report in order" },
      {
        type: "list",
        ordered: true,
        items: [
          "Laboratory name and report number, so the result is traceable to a source",
          "Batch number, checked against your vial",
          "Compound and labelled strength",
          "Mass spectrometry result against the theoretical mass",
          "HPLC purity with the chromatogram, and a look at the peak shape",
          "Net peptide content, if the fill matters to your work",
          "Test date, to confirm the report belongs to the current batch",
        ],
      },
      {
        type: "note",
        text: "Every Vyrax Labs batch certificate is published on the Lab Reports page and can be looked up by the batch number printed on the vial. Products are sold as research compounds.",
      },
    ],
  },
];

export const guideBySlug = (slug: string) => guides.find((g) => g.slug === slug);
