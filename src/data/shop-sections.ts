import type { Compound } from "./types";

// Shop browsing groups. A compound belongs to one section; the original research
// categories remain available at their existing URLs for older links.
export const shopSections = [
  { slug: "weight-metabolic", name: "Weight Loss", products: ["retatrutide", "tirzepatide", "semaglutide", "cagrilintide", "aod-9604", "5-amino-1mq", "mots-c"] },
  { slug: "copper-blends", name: "Copper & Copper Blends", products: ["ghk-cu", "glow", "klow"] },
  { slug: "brain-focus", name: "Brain & Focus", products: ["semax", "selank"] },
  { slug: "growth-hormone", name: "Growth Hormone", products: ["cjc-1295-no-dac", "cjc-1295-dac", "ipamorelin", "tesamorelin", "ghrp-2", "ghrp-6", "hexarelin", "sermorelin", "igf-1-lr3", "hulk-stack"] },
  { slug: "recovery-repair", name: "Recovery & Repair", products: ["bpc-157", "tb-500", "kpv", "ll-37", "ara-290", "wolverine-stack"] },
  { slug: "longevity-cellular", name: "Longevity & Cellular", products: ["nad-plus", "epithalon", "ss-31", "thymosin-alpha-1", "thymalin"] },
  { slug: "tanning-libido", name: "Tanning & Libido", products: ["melanotan-1", "melanotan-2", "pt-141"] },
  { slug: "sleep", name: "Sleep", products: ["dsip"] },
  { slug: "bacteriostatic-water", name: "Bacteriostatic Water", products: ["bacteriostatic-water"] },
  { slug: "accessories", name: "Accessories", products: [] },
] as const;

export const sectionFor = (compound: Compound) =>
  shopSections.find((section) => (section.products as readonly string[]).includes(compound.slug));

export const productsInSection = (compounds: Compound[], slug: string) =>
  compounds.filter((compound) => sectionFor(compound)?.slug === slug);