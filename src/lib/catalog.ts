import vial from "@/assets/vyrax-vial.jpg";
import { metabolicAndRegenerative } from "@/data/compounds-a";
import { secretagoguesToSupplies } from "@/data/compounds-b";
import { ukplAdditions } from "@/data/ukpl-additions";
import { categories } from "@/data/categories";
import { chem, citations } from "@/data/research";
import { latestCoa } from "@/data/coa";
import { site } from "@/data/site";
import { claimGate, isClaimAllowed } from "@/lib/claims";
import { trackBasketChange } from "@/lib/analytics";
import type { Category, CategorySlug, Compound, Strength, StockState } from "@/data/types";

export { categories, chem, citations };
export type { Category, CategorySlug, Compound, Strength, StockState };

export const compounds: Compound[] = [
  ...metabolicAndRegenerative,
  ...secretagoguesToSupplies,
  ...ukplAdditions,
];
const bySlug = new Map(compounds.map((c) => [c.slug, c]));
export const getCompound = (slug: string) => bySlug.get(slug);
export const getCategory = (slug: string) => categories.find((c) => c.slug === slug);
export const compoundsIn = (category: string) => compounds.filter((c) => c.category === category);

// ---------------------------------------------------------------- URLs
// Hub page /product/<compound> shows the default (first) strength. Every other strength of a
// multi-strength compound gets its own page /product/<compound>-<strength> with its own title,
// H1 and canonical, matching the one-page-per-strength pattern of the top-ranking UK stores.
export const strengthKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
export const variantSlug = (c: Compound, s: Strength) =>
  c.strengths[0] === s ? c.slug : `${c.slug}-${strengthKey(s.label)}`;
export const productPath = (slug: string, strength?: string) => {
  const c = getCompound(slug);
  const s = c?.strengths.find((x) => x.label === strength);
  return "/product/" + (c && s ? variantSlug(c, s) : slug);
};

export type Resolved = {
  compound: Compound;
  strength: Strength;
  isHub: boolean;
  redirectTo?: string;
};
const variantIndex = new Map<string, { compound: Compound; strength: Strength }>();
for (const c of compounds)
  for (const s of c.strengths)
    variantIndex.set(`${c.slug}-${strengthKey(s.label)}`, { compound: c, strength: s });

export function resolveProductSlug(slug: string): Resolved | undefined {
  const c = bySlug.get(slug);
  if (c && c.strengths[0]) return { compound: c, strength: c.strengths[0], isHub: true };
  const v = variantIndex.get(slug);
  if (!v) return undefined;
  // /product/retatrutide-10mg duplicates the hub: send it there.
  if (v.compound.strengths[0] === v.strength)
    return { ...v, isHub: true, redirectTo: v.compound.slug };
  return { ...v, isHub: false };
}

/** Every indexable product URL (hub + non-default strengths), for the sitemap. */
export const allProductSlugs = () =>
  compounds.flatMap((c) => c.strengths.map((s) => variantSlug(c, s)));

// ---------------------------------------------------------------- Images
// Product renders (Blender, Vyrax label): src/assets/products/<product-slug>__<strength>.webp (1536px) plus
// sm/<same file> (640px) for cards and thumbnails. Strength key = lower case, non-alphanumerics to '-' ("5+5mg" -> "5-5mg").
// The label on each render prints its strength, so a strength with no render of its own falls back to the
// plain generic vial rather than a render showing a different mg.
// Extra product-page views of the same vial: <product-slug>__<strength>__<view>.webp, e.g. __qr (turned to the
// batch QR side panel) and __storage (turned to storage + expiry). productImage() only ever returns the front
// (cards, basket, og:image); productGallery() returns the front first, then the views in VIEW_ORDER.
const renderLg = import.meta.glob("../assets/products/*.webp", {
  eager: true,
  import: "default",
}) as Record<string, string>;
const renderSm = import.meta.glob("../assets/products/sm/*.webp", {
  eager: true,
  import: "default",
}) as Record<string, string>;
type Render = {
  strength: string;
  view: string;
  src: string;
  small?: string | undefined;
  srcSet: string;
};
const renders: Record<string, Render[]> = {};
for (const [path, src] of Object.entries(renderLg)) {
  const file = path.slice(path.lastIndexOf("/") + 1);
  const [slug = "", key = "", view = "front"] = file.replace(/\.webp$/, "").split("__");
  const small = renderSm[`../assets/products/sm/${file}`];
  (renders[slug] ??= []).push({
    strength: key,
    view,
    src,
    small,
    srcSet: small ? `${small} 640w, ${src} 1536w` : `${src} 1536w`,
  });
}
export type Img = {
  src: string;
  srcSet?: string | undefined;
  small?: string | undefined;
  isRender: boolean;
  view?: string | undefined;
};
const VIEW_ORDER = ["front", "qr", "storage"];
const viewRank = (view: string) => {
  const i = VIEW_ORDER.indexOf(view);
  return i < 0 ? VIEW_ORDER.length : i;
};
const rendersOf = (slug: string, strength?: string) => {
  const c = getCompound(slug);
  const want = strengthKey(strength ?? c?.strengths[0]?.label ?? "");
  return (renders[slug] ?? []).filter((r) => r.strength === want);
};
const toImg = (r: Render): Img => ({
  src: r.src,
  srcSet: r.srcSet,
  small: r.small,
  isRender: true,
  view: r.view,
});
export function productImage(slug: string, strength?: string): Img {
  const hit = rendersOf(slug, strength).find((r) => r.view === "front");
  return hit ? toImg(hit) : { src: vial, isRender: false };
}
/** Every image of one strength for the product page gallery: the front first, then the turned views. */
export function productGallery(slug: string, strength?: string): Img[] {
  const front = productImage(slug, strength);
  if (!front.isRender) return [front];
  const views = rendersOf(slug, strength)
    .filter((r) => r.view !== "front")
    .sort((a, b) => viewRank(a.view) - viewRank(b.view));
  return [front, ...views.map(toImg)];
}

// ---------------------------------------------------------------- Pricing helpers
export const gbp = (value: number) => "£" + value.toFixed(2);
export const costPerUnit = (s: Strength) => (s.amount > 0 ? s.price / s.amount : 0);
export const costPerUnitLabel = (s: Strength) => `${gbp(costPerUnit(s))}/${s.unit}`;
export const fromPrice = (c: Compound) => Math.min(...c.strengths.map((s) => s.price));
export const isB2G1 = (slug: string, strength: string) =>
  site.b2g1.some((o) => o.slug === slug && o.strength === strength);
export const hasB2G1 = (c: Compound) => c.strengths.some((s) => isB2G1(c.slug, s.label));

export const stockOf = (s: Strength): StockState => s.stock ?? site.defaultStock;
export const stockLabel: Record<StockState, string> = {
  in: "In stock",
  available: "Availability to be confirmed",
  low: "Low stock",
  out: "Out of stock",
  preorder: "Pre-order",
};

/** Purity-backed title modifier. The wording comes from the claim registry, so the title can only
 * claim a tested purity when the shop holds a certificate for this strength AND the registry's
 * testing claims are switched on by evidence (src/lib/evidence.ts). */
export function trustModifier(slug: string, strength?: string) {
  const coa = latestCoa(slug, strength) ?? latestCoa(slug);
  return coa && coa.purity >= 99 && isClaimAllowed("testing.purity-title")
    ? claimGate("testing.purity-title")
    : claimGate("testing.page-title");
}

// ---------------------------------------------------------------- Search
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9+]+/g, "");
export function searchCompounds(q: string, limit = 50) {
  const n = norm(q);
  if (n.length < 2) return [];
  const score = (c: Compound) => {
    const name = norm(c.name);
    if (name.startsWith(n)) return 0;
    if (name.includes(n)) return 1;
    if (c.aliases.some((a) => norm(a).includes(n))) return 2;
    if (
      c.tags.some((t) => norm(t).includes(n)) ||
      norm(getCategory(c.category)?.name ?? "").includes(n)
    )
      return 3;
    return 9;
  };
  return compounds
    .map((c) => [score(c), c] as const)
    .filter(([s]) => s < 9)
    .sort((a, b) => a[0] - b[0] || a[1].name.localeCompare(b[1].name))
    .slice(0, limit)
    .map(([, c]) => c);
}

// ---------------------------------------------------------------- Merchandising
export const featuredSlugs = [
  "retatrutide",
  "tirzepatide",
  "bpc-157",
  "tb-500",
  "ghk-cu",
  "semaglutide",
  "glow",
  "mots-c",
];
export const featured = featuredSlugs
  .map((s) => bySlug.get(s))
  .filter((c): c is Compound => Boolean(c));
export const blends = compoundsIn("peptide-blends");

// Backwards-compatible shape used by older components.
export type Product = Compound & { variants: { strength: string; price: number }[]; image: string };
export const products: Product[] = compounds.map((c) => ({
  ...c,
  variants: c.strengths.map((s) => ({ strength: s.label, price: s.price })),
  image: productImage(c.slug).src,
}));
export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/\+/g, "-plus")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// ---------------------------------------------------------------- Basket
import { priceBasket, type CartItem } from "./basket-pricing";
export type { CartItem };
export const cartKey = "vyrax-basket";

export { priceBasket };

/** Lines the server will reject at checkout (out of stock / preorder). */
export const isLineUnavailable = (i: CartItem) => {
  const st = getCompound(i.slug)?.strengths.find((x) => x.label === i.strength);
  return !st || stockOf(st) === "out" || stockOf(st) === "preorder";
};

export function readCart(): CartItem[] {
  try {
    const raw = JSON.parse(localStorage.getItem(cartKey) || "[]") as CartItem[];
    // Drop lines for products or strengths that no longer exist and refresh prices from the catalogue.
    return raw.flatMap((i) => {
      const s = getCompound(i.slug)?.strengths.find((x) => x.label === i.strength);
      return s
        ? [{ ...i, price: s.price, quantity: Math.max(1, Math.min(99, i.quantity | 0)) }]
        : [];
    });
  } catch {
    return [];
  }
}
export function writeCart(items: CartItem[]) {
  const before = readCart();
  localStorage.setItem(cartKey, JSON.stringify(items));
  trackBasketChange(before, items);
  window.dispatchEvent(new Event("vyrax-cart"));
}
export function addCart(item: CartItem) {
  const items = readCart();
  const existing = items.find((i) => i.slug === item.slug && i.strength === item.strength);
  if (existing) existing.quantity += item.quantity;
  else items.push(item);
  writeCart(items);
  window.dispatchEvent(new CustomEvent("vyrax-added", { detail: item }));
}
export const cartLine = (c: Compound, s: Strength, quantity = 1): CartItem => ({
  slug: c.slug,
  name: c.name,
  strength: s.label,
  price: s.price,
  quantity,
});
