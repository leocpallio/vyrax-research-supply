import { site } from "./site";

/** First-order offer shown in the entry popup. Every figure here is derived from offers the
 *  basket already applies automatically (spend tiers, free delivery, gift rule), so the popup can
 *  never promise something the checkout will not reproduce. */
export type ResearchIntent = {
  id: string;
  label: string;
  /** Collection the button routes to. */
  to: string;
};

export const researchIntents: ResearchIntent[] = [
  { id: "tissue-repair", label: "Tissue repair", to: "/collections/recovery-repair" },
  { id: "gh-axis", label: "GH axis", to: "/collections/growth-hormone" },
  { id: "melanocortins", label: "Melanocortins", to: "/collections/tanning-libido" },
  { id: "metabolic", label: "Metabolic pathways", to: "/collections/weight-metabolic" },
];

/** Tier ladder, largest first, as the basket applies it. */
export const offerTiers = [...site.spendTiers].sort((a, b) => b.over - a.over);

export const topOfferPct = Math.round((offerTiers[0]?.rate ?? 0) * 100);

export type OfferGift = {
  slug: string;
  strength: string;
  label: string;
  short: string;
  value: number;
  over: number;
};
export const offerGift = site.firstOrderGift as OfferGift | null;

export const offerLines = () => {
  const tiers = [...site.spendTiers]
    .sort((a, b) => a.over - b.over)
    .map((t) => `${Math.round(t.rate * 100)}% off £${t.over}+`);
  const out = [tiers.join(" · ")];
  out.push(`Free delivery over £${site.freeDeliveryThreshold}`);
  if (offerGift) out.push(`Free ${offerGift.label} over £${offerGift.over}`);
  return out;
};
