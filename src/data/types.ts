export type CategorySlug =
  | "metabolic-research"
  | "regenerative-research"
  | "gh-secretagogues"
  | "longevity-research"
  | "pigmentation-research"
  | "peptide-blends"
  | "lab-supplies";

/**
 * Stock wording shown on product pages.
 * 'available' = orderable, no stock count claimed (default until live stock is wired in).
 */
export type StockState = "in" | "available" | "low" | "out" | "preorder";

export type Strength = {
  /** Label as printed on the vial, e.g. '10mg', '5+5mg', '10ml'. */
  label: string;
  /** Total amount in the vial, used for cost-per-mg and concentration maths. */
  amount: number;
  unit: "mg" | "ml";
  /** GBP per vial. */
  price: number;
  stock?: StockState;
  /** Overrides compound-level composition when a blend has multiple ratios/strengths. */
  composition?: string[];
};

export type Compound = {
  slug: string;
  name: string;
  /** Search synonyms (autocomplete + on-page alias line). */
  aliases: string[];
  category: CategorySlug;
  /** Two or three research-area tags shown on cards. */
  tags: string[];
  kind: "peptide" | "blend" | "small-molecule" | "coenzyme" | "protein" | "supply";
  /** First entry is the default strength (the one the compound hub page shows). */
  strengths: Strength[];
  /** One or two sentences. Used on cards, meta descriptions and the "What is" block. */
  summary: string;
  /** Research overview paragraphs. Research register only: no dosing, no human-use claims. */
  overview: string[];
  applications: string[];
  compare?: { slug: string; text: string };
  /** Blend composition lines. */
  composition?: string[];
  form?: string;
  appearance?: string;
};

export type Category = {
  slug: CategorySlug;
  name: string;
  /** Used in titles: "Buy {seoName} UK". */
  seoName: string;
  blurb: string;
  intro: string[];
};
