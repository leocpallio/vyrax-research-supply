import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Check, Plus, type LucideIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { openCartDrawer } from "@/components/shell/cart-store";
import {
  addCart,
  cartLine,
  fromPrice,
  gbp,
  getCompound,
  productImage,
  productPath,
  stockLabel,
  stockOf,
  type Compound,
  type StockState,
  type Strength,
} from "@/lib/catalog";
import { coaFor, type Coa } from "@/data/coa";
import { labelColour } from "@/data/label-colours";
import { HeroCarousel } from "./HeroCarousel";
import { ladderSaving } from "@/lib/price-ladder";

// Homepage building blocks, pass 3 (5 Nov 2026): Vyrax's own composition, not a Kova mirror.
// Split hero with a batch spec card, numbered mono kickers, bento research fields with caption
// cards, landscape product cards, a batch-register table for certificates and a navy footer.
// Every number comes from the catalogue (prices), src/data/coa.ts (Janoshik reports) or the
// basket's own offer rules; nothing is typed in.

const INK = "#0B1B3B";
const PAPER = "#EEF2F8";
const WARM = "#AC4821";
/** Vyrax wordmark accent blues (src/components/Wordmark.tsx). */
const BLUE = "#5B8DEF";
const BLUE_LIGHT = "#8FB0F5";

const orderable = (s: Strength) => {
  const st = stockOf(s);
  return st !== "out" && st !== "preorder";
};

function cardStock(c: Compound): StockState {
  const states = c.strengths.map(stockOf);
  for (const st of ["low", "in", "available", "preorder", "out"] as StockState[])
    if (states.includes(st)) return st;
  return "available";
}

const PILL: Record<StockState, { text: string; warm: boolean }> = {
  in: { text: stockLabel.in, warm: false },
  // Stock fact, not sales velocity: "Selling fast" needs real order data (1 paid order on 5 Nov 2026).
  low: { text: stockLabel.low, warm: true },
  out: { text: stockLabel.out, warm: false },
  preorder: { text: "In preparation", warm: false },
  available: { text: "To be confirmed", warm: false },
};

/** Soft well tint from the SKU's real label colour. */
const wellTint = (hex: string | undefined) =>
  hex ? `color-mix(in oklab, ${hex} 11%, #F8FAFD)` : "#F2F5FA";

const fmtDate = (iso: string) =>
  new Date(iso + "T12:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const btnPrimary =
  "inline-flex items-center justify-center gap-2 h-12 px-6 rounded-[10px] bg-[#0B1B3B] text-[#EEF2F8] font-semibold text-[15px] transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B1B3B]";
const btnGhost =
  "inline-flex items-center justify-center gap-2 h-12 px-5 rounded-[10px] ring-1 ring-[#0B1B3B]/20 font-semibold text-[15px] hover:ring-[#0B1B3B]/45 hover:bg-white/60 transition-colors";

// ---------------------------------------------------------------- Kicker + section title
/** Numbered mono kicker: "02 / Research fields" with a wordmark-blue square. */
export function Kicker({
  index,
  children,
  tone = "dark",
}: {
  index?: string;
  children: React.ReactNode;
  tone?: "dark" | "light";
}) {
  return (
    <p
      className={`flex items-center gap-2 font-mono text-[11px] md:text-[12px] uppercase tracking-[0.14em] ${
        tone === "dark" ? "text-[#0B1B3B]/60" : "text-[#EEF2F8]/72"
      }`}
    >
      <span
        className="size-1.5 shrink-0"
        style={{ background: tone === "dark" ? BLUE : BLUE_LIGHT }}
      />
      {index && <span className="tabular-nums">{index} /</span>}
      {children}
    </p>
  );
}

/** Two-weight headline: medium ink lead + italic accent tail. */
export function Title({
  lead,
  accent,
  as: As = "h2",
  tone = "dark",
  className = "",
  testId,
}: {
  lead: string;
  accent?: string;
  as?: "h1" | "h2";
  tone?: "dark" | "light";
  className?: string;
  testId?: string;
}) {
  return (
    <As
      data-testid={testId}
      className={`font-heading font-semibold tracking-[-0.045em] leading-[0.98] ${className}`}
    >
      {lead}
      {accent && (
        <>
          {" "}
          <em
            className="font-normal italic tracking-[-0.03em]"
            style={{ color: tone === "dark" ? "#5B8DEF" : BLUE_LIGHT }}
          >
            {accent}
          </em>
        </>
      )}
    </As>
  );
}

// ---------------------------------------------------------------- Purity chip
function PurityChip({ coa, href }: { coa: Coa; href: string }) {
  return (
    <a
      href={href}
      data-testid="card-purity-chip"
      className="inline-flex items-center gap-1.5 rounded-[8px] bg-white/95 px-2 py-1 font-mono text-[10.5px] md:text-[11px] text-[#0B1B3B] ring-1 ring-[#0B1B3B]/10 hover:bg-white"
    >
      <span className="size-1.5 rounded-full bg-[#1F7A4C]" />
      <span className="tabular-nums font-medium">{coa.purity.toFixed(2)}%</span>
      <span className="text-[#0B1B3B]/68 hidden min-[380px]:inline">COA</span>
      <ArrowUpRight size={11} className="text-[#0B1B3B]/68 -ml-0.5" />
    </a>
  );
}

// ---------------------------------------------------------------- Product card
/** "tile": landscape well with info below (2x2 featured grid). "row": horizontal list item. */
export function HomeProductCard({
  product,
  priority = false,
  variant = "tile",
}: {
  product: Compound;
  priority?: boolean;
  variant?: "tile" | "row";
}) {
  const s = product.strengths[0];
  const [added, setAdded] = useState(false);
  const [open, setOpen] = useState(false);
  if (!s) return null;
  const img = productImage(product.slug, s.label);
  const href = productPath(product.slug);
  const coa = coaFor(product.slug, s.label)[0] ?? coaFor(product.slug)[0];
  const stock = cardStock(product);
  const pill = PILL[stock];
  const multi = product.strengths.length > 1;
  const canAdd = product.strengths.some(orderable);
  const ladder = ladderSaving(product, s);
  const tint = wellTint(labelColour(product.slug, s.label));
  const row = variant === "row";

  const add = (strength: Strength) => {
    addCart(cartLine(product, strength));
    openCartDrawer();
    setOpen(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  const addClass =
    "inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-[10px] bg-[#0B1B3B] text-[#EEF2F8] text-[13px] md:text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B1B3B]";

  const addButton = multi ? (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-testid="quick-add-button"
          aria-label={`Choose amount for ${product.name}`}
          disabled={!canAdd}
          className={addClass}
        >
          {added ? <Check size={15} /> : <Plus size={15} />} Add
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-56 rounded-[14px] border-[#0B1B3B]/10 bg-white p-1.5 shadow-xl"
      >
        <p className="px-3 pt-1.5 pb-1 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#0B1B3B]/60">
          Choose amount
        </p>
        <ul>
          {product.strengths.map((x) => (
            <li key={x.label}>
              <button
                type="button"
                data-testid="quick-add-option"
                disabled={!orderable(x)}
                onClick={() => add(x)}
                className="w-full flex items-center justify-between rounded-[10px] px-3 py-2 text-sm hover:bg-[#EDF1F7] disabled:opacity-40"
              >
                <span className="font-mono">{x.label}</span>
                <span className="tabular-nums font-semibold">{gbp(x.price)}</span>
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  ) : (
    <button
      type="button"
      data-testid="quick-add-button"
      aria-label={`Add ${product.name} ${s.label} to basket`}
      disabled={!canAdd}
      onClick={() => add(s)}
      className={addClass}
    >
      {added ? <Check size={15} /> : <Plus size={15} />} Add
    </button>
  );

  const price = (
    <p className="flex flex-wrap items-baseline gap-x-1.5">
      {multi && <span className="text-xs text-[#0B1B3B]/60">From</span>}
      {ladder && !multi && (
        <s className="text-[13px] text-[#0B1B3B]/68 tabular-nums">{gbp(ladder.was)}</s>
      )}
      <span
        data-testid="product-price"
        className="text-[17px] md:text-[19px] font-semibold tabular-nums tracking-[-0.01em]"
        style={ladder && !multi ? { color: WARM } : undefined}
      >
        {gbp(fromPrice(product))}
      </span>
    </p>
  );

  const strengths = (
    <p className="font-mono text-[10.5px] md:text-[11px] uppercase tracking-[0.08em] text-[#0B1B3B]/68 truncate">
      {product.strengths.map((x) => x.label).join(" · ")}
    </p>
  );

  if (row) {
    return (
      <article
        data-testid="product-wrapper"
        className="group grid grid-cols-[96px_minmax(0,1fr)] sm:grid-cols-[132px_minmax(0,1fr)] gap-3 sm:gap-5 items-center rounded-[16px] bg-[#EEF2F8]/70 ring-1 ring-[#0B1B3B]/8 p-2.5 sm:p-3"
      >
        <a
          href={href}
          tabIndex={-1}
          aria-hidden="true"
          className="relative block aspect-square overflow-hidden rounded-[12px]"
          style={{ background: tint }}
        >
          <img
            src={img.small ?? img.src}
            srcSet={img.srcSet}
            sizes="140px"
            alt=""
            loading="lazy"
            width={280}
            height={280}
            className="size-full object-contain scale-[1.1] mix-blend-multiply transition-transform duration-500 group-hover:scale-[1.05]"
          />
        </a>
        <div className="min-w-0 flex flex-col gap-1 pr-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              data-testid="card-stock-pill"
              data-stock={stock}
              className={`font-mono text-[10px] uppercase tracking-[0.1em] ${pill.warm ? "text-[#AC4821]" : "text-[#0B1B3B]/68"}`}
            >
              {pill.text}
            </span>
            {coa && <PurityChip coa={coa} href={`/verify/${coa.batch}`} />}
          </div>
          <h3 className="font-heading font-semibold text-[16px] sm:text-[19px] leading-snug tracking-[-0.02em]">
            <a
              href={href}
              data-testid="product-title"
              className="hover:underline underline-offset-4"
            >
              {product.name}
            </a>
          </h3>
          {strengths}
          <div className="mt-1 flex items-center justify-between gap-3">
            {price}
            {addButton}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      data-testid="product-wrapper"
      className="group flex flex-col rounded-[16px] bg-white ring-1 ring-[#0B1B3B]/8 p-2 md:p-2.5 transition-shadow duration-300 hover:shadow-[0_22px_44px_-30px_rgba(11,27,59,0.5)]"
    >
      <div
        className="relative aspect-[1/1] sm:aspect-[5/4] overflow-hidden rounded-[12px]"
        style={{ background: tint }}
      >
        <a href={href} className="block size-full" tabIndex={-1} aria-hidden="true">
          <img
            src={img.small ?? img.src}
            srcSet={img.srcSet}
            sizes="(max-width:1023px) 50vw, 420px"
            alt=""
            loading={priority ? "eager" : "lazy"}
            width={640}
            height={640}
            className="size-full object-contain object-center scale-[1.08] mix-blend-multiply transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </a>
        <span
          data-testid="card-stock-pill"
          data-stock={stock}
          className={`absolute top-2.5 right-2.5 rounded-[6px] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] ${
            pill.warm ? "bg-[#AC4821] text-[#EEF2F8]" : "bg-white/90 text-[#0B1B3B]/70"
          }`}
        >
          {pill.text}
        </span>
        {coa && (
          <div className="absolute bottom-2.5 left-2.5">
            <PurityChip coa={coa} href={`/verify/${coa.batch}`} />
          </div>
        )}
      </div>
      <div className="pt-3 pb-1 px-1.5 flex flex-col gap-1 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading font-semibold text-[16px] md:text-[20px] leading-snug tracking-[-0.02em] min-w-0">
            <a
              href={href}
              data-testid="product-title"
              className="hover:underline underline-offset-4"
            >
              {product.name}
            </a>
          </h3>
          <span className="hidden sm:block shrink-0 pt-0.5">{price}</span>
        </div>
        {strengths}
        <span className="sm:hidden">{price}</span>
        <div className="mt-auto pt-2.5 flex items-center gap-2">
          <a
            href={href}
            className="inline-flex items-center gap-1 h-10 px-1 text-[13px] md:text-sm font-semibold text-[#0B1B3B]/75 hover:text-[#0B1B3B]"
          >
            Details <ArrowRight size={14} />
          </a>
          <span className="ml-auto">{addButton}</span>
        </div>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------- Bundle feature (real basket offer)
/** A pack of three vials where the basket really makes every 3rd one free (site.b2g1). */
export function BundleCard({
  product,
  strength,
  image,
  offerLabel,
}: {
  product: Compound;
  strength: Strength;
  image: string;
  offerLabel: string;
}) {
  const [added, setAdded] = useState(false);
  const was = strength.price * 3;
  const now = strength.price * 2;
  const href = productPath(product.slug, strength.label);
  const add = () => {
    addCart(cartLine(product, strength, 3));
    openCartDrawer();
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };
  return (
    <article
      data-testid="bundle-card"
      className="group relative flex flex-col overflow-hidden rounded-[22px] bg-[#F3D9D3]"
    >
      <a
        href={href}
        className="block aspect-[4/3] overflow-hidden"
        tabIndex={-1}
        aria-hidden="true"
      >
        <img
          src={image}
          alt=""
          loading="lazy"
          width={1000}
          height={1241}
          className="size-full object-cover object-[50%_42%] transition-transform duration-700 group-hover:scale-[1.03]"
        />
      </a>
      <span className="absolute top-4 left-4 rounded-[8px] px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.1em] bg-[#AC4821] text-[#EEF2F8]">
        {offerLabel}
      </span>
      <div className="p-5 md:p-7 flex flex-col gap-2 flex-1">
        <h3 className="font-heading font-semibold text-[22px] md:text-[28px] leading-tight tracking-[-0.035em]">
          <a href={href} className="hover:underline underline-offset-4">
            {product.name} {strength.label} <span className="font-normal italic">x3</span>
          </a>
        </h3>
        <p className="text-[14px] md:text-[15px] text-[#0B1B3B]/70 leading-relaxed max-w-[420px]">
          Add three vials and the basket takes the third off automatically.
        </p>
        <div className="mt-auto pt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-baseline gap-2">
            <s className="text-[14px] text-[#0B1B3B]/68 tabular-nums">{gbp(was)}</s>
            <span
              className="text-[24px] md:text-[28px] font-semibold tabular-nums tracking-[-0.02em]"
              style={{ color: WARM }}
            >
              {gbp(now)}
            </span>
          </p>
          <div className="flex items-center gap-2">
            <a
              href={href}
              className="inline-flex items-center gap-1 h-11 px-2 text-sm font-semibold text-[#0B1B3B]/75 hover:text-[#0B1B3B]"
            >
              Details <ArrowRight size={14} />
            </a>
            <button
              type="button"
              data-testid="bundle-add"
              aria-label={`Add 3 x ${product.name} ${strength.label} to basket`}
              disabled={!orderable(strength)}
              onClick={add}
              className="inline-flex items-center justify-center gap-1.5 h-11 px-5 rounded-[10px] bg-[#0B1B3B] text-[#EEF2F8] text-sm font-semibold hover:opacity-90 disabled:opacity-40"
            >
              {added ? <Check size={15} /> : <Plus size={15} />} Add 3
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------- Hero (split, single image)
export type TrustItem = {
  icon: LucideIcon;
  stat: string;
  body: string;
  to: string;
  testId: string;
};

export type HeroSpec = {
  name: string;
  strength: string;
  batch: string;
  purity: number;
  lab: string;
  href: string;
};

export function HeroSplit({
  kicker,
  lead,
  accent,
  sub,
  cta,
  link,
  offer,
  ledger,
}: {
  kicker: string;
  lead: string;
  accent: string;
  sub: string;
  cta: { label: string; to: string };
  link: { label: string; to: string };
  offer?: { label: string; to: string } | null;
  ledger: TrustItem[];
}) {
  return (
    <section className="bg-[#EEF2F8] bg-gridlines" data-testid="hero">
      <HeroCarousel
        eyebrow={kicker}
        lead={lead}
        accent={accent}
        sub={sub}
        cta={cta}
        link={link}
        offer={offer}
      />

      <div
        id="home-trust"
        className="border-t border-[#0B1B3B]/10 bg-[#EEF2F8]"
        data-testid="trust-strip"
      >
        <ol className="container-main grid grid-cols-1 sm:grid-cols-3">
          {ledger.map((t, n) => (
            <li
              key={t.testId}
              className="border-b sm:border-b-0 sm:border-l first:sm:border-l-0 border-[#0B1B3B]/10 last:border-b-0"
            >
              <Link
                to={t.to as "/"}
                data-testid={t.testId}
                className="group grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 py-4 md:py-6 sm:px-6 first:sm:pl-0 hover:bg-white/40 transition-colors"
              >
                <span className="font-mono text-[11px] text-[#0B1B3B]/68 tabular-nums pt-1">
                  0{n + 1}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2 font-heading text-[15px] md:text-[16px] font-semibold leading-tight tabular-nums">
                    <t.icon size={15} className="shrink-0" style={{ color: BLUE }} />
                    {t.stat}
                  </span>
                  <span className="block text-[12.5px] md:text-[13px] text-[#0B1B3B]/60 leading-snug mt-1">
                    {t.body}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- Research fields bento
export type FieldTile = {
  slug: string;
  label: string;
  compounds: string[];
  count: number;
  image: string;
  width: number;
  height: number;
};

/** Layout slot per tile. Mobile: 2-col grid; lg: 12-col bento with one tall lead tile. */
const BENTO = [
  "col-span-2 lg:col-span-7 lg:row-span-2",
  "col-span-2 lg:col-span-5 lg:h-[300px]",
  "col-span-1 lg:col-span-5 lg:h-[300px]",
  "col-span-1 lg:col-span-5 lg:h-[340px]",
  "col-span-2 lg:col-span-7 lg:h-[340px]",
];
/** object-position per slot so the vials stay in frame when a tile crops portrait. */
const ASPECT = ["aspect-[4/3]", "aspect-[16/9]", "aspect-[4/5]", "aspect-[4/5]", "aspect-[16/9]"];
const FOCUS = ["50% 55%", "50% 55%", "38% 55%", "50% 55%", "50% 55%"];

function BentoTile({ t, n }: { t: FieldTile; n: number }) {
  const small = n === 2 || n === 3;
  return (
    <Link
      to="/collections/$slug"
      params={{ slug: t.slug }}
      data-testid="field-tile"
      className={`group relative flex flex-col overflow-hidden rounded-[18px] md:rounded-[22px] bg-[#EEF2F8] lg:block lg:bg-[#0A1A38] ${BENTO[n] ?? "col-span-1"}`}
    >
      <div className={`relative w-full overflow-hidden bg-[#0A1A38] ${ASPECT[n] ?? "aspect-square"} lg:absolute lg:inset-0 lg:aspect-auto`}>
      <img
        src={t.image}
        alt={`${t.label}: ${t.compounds.slice(0, 3).join(", ")} vials`}
        loading="lazy"
        width={t.width}
        height={t.height}
        style={{ objectPosition: FOCUS[n] }}
        className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-[1.035]"
      />
      </div>
      <div
        className={`relative flex-1 px-3 py-2.5 md:px-4 md:py-3 lg:absolute lg:left-4 lg:bottom-4 lg:right-auto lg:flex-none ${small ? "" : "lg:max-w-[340px]"} lg:rounded-[14px] lg:bg-white/92 lg:backdrop-blur text-[#0B1B3B] flex items-center gap-3`}
      >
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className="font-mono text-[10px] md:text-[10.5px] text-[#0B1B3B]/68 tabular-nums">
              0{n + 1}
            </span>
            <span className="font-heading font-semibold text-[15px] md:text-[19px] leading-tight tracking-[-0.025em] min-w-0">
              {t.label}
            </span>
          </span>
          <span
            className={`mt-0.5 text-[11.5px] md:text-[12.5px] text-[#0B1B3B]/60 leading-snug ${small ? "hidden md:line-clamp-1" : "line-clamp-1"}`}
          >
            {t.compounds.join(", ")}
          </span>
          <span
            className={`font-mono text-[10px] uppercase tracking-[0.1em] text-[#0B1B3B]/68 ${small ? "block md:hidden mt-0.5" : "hidden"}`}
          >
            {t.count} compounds
          </span>
        </span>
        <span className="hidden min-[400px]:grid place-items-center size-8 md:size-9 shrink-0 rounded-[9px] bg-[#0B1B3B] text-[#EEF2F8] transition-transform group-hover:translate-x-0.5">
          <ArrowRight size={15} />
        </span>
      </div>
    </Link>
  );
}

export function ResearchFields({
  index,
  tiles,
  intro,
  shopAllLabel,
}: {
  index: string;
  tiles: FieldTile[];
  intro: string;
  shopAllLabel: string;
}) {
  return (
    <section className="bg-white py-16 md:py-24" data-testid="research-fields">
      <div className="container-main">
        <div className="grid gap-5 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:items-end mb-8 md:mb-12">
          <div>
            <Kicker index={index}>Research fields</Kicker>
            <Title
              lead="Five ranges,"
              accent="one pathway each."
              className="mt-3 text-[36px] md:text-[56px]"
            />
          </div>
          <div className="md:pl-8 md:border-l md:border-[#0B1B3B]/12">
            <p className="text-[15px] md:text-[16.5px] leading-relaxed text-[#0B1B3B]/70 max-w-[440px]">
              {intro}
            </p>
            <Link to="/shop" className={`mt-4 ${btnGhost} h-11`}>
              {shopAllLabel} <ArrowRight size={15} />
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-3 md:gap-4">
          {tiles.map((t, n) => (
            <BentoTile key={t.slug} t={t} n={n} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- Featured block
export function FeaturedBlock({
  index,
  products,
  total,
}: {
  index: string;
  products: Compound[];
  total: number;
}) {
  return (
    <section className="bg-[#EEF2F8] bg-gridlines py-16 md:py-24" data-testid="best-sellers">
      <div className="container-main grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-14">
        <div className="lg:sticky lg:top-28 self-start">
          <Kicker index={index}>Featured</Kicker>
          <Title lead="Start" accent="here." className="mt-3 text-[36px] md:text-[56px]" />
          <p className="mt-4 text-[15px] md:text-[16.5px] leading-relaxed text-[#0B1B3B]/70 max-w-[320px]">
            Curated starting points from the {total}-compound catalogue. Batch-numbered vials,
            priced per vial.
          </p>
          <Link to="/shop" className={`mt-5 ${btnPrimary}`}>
            Shop all {total} <ArrowRight size={16} />
          </Link>
        </div>
        <div data-testid="product-grid" className="grid grid-cols-2 gap-3 md:gap-5">
          {products.map((p, i) => (
            <HomeProductCard key={p.slug} product={p} priority={i < 2} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- Blends: feature + list
export function BlendsBlock({
  index,
  products,
  bundle,
}: {
  index: string;
  products: Compound[];
  bundle: React.ReactNode;
}) {
  return (
    <section className="bg-white py-16 md:py-24" data-testid="blends-row">
      <div className="container-main">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8 md:mb-10">
          <div>
            <Kicker index={index}>Blends &amp; stacks</Kicker>
            <Title
              lead="Pre-combined,"
              accent="one vial."
              className="mt-3 text-[36px] md:text-[56px]"
            />
          </div>
          <Link
            to="/category/$slug"
            params={{ slug: "peptide-blends" }}
            className={`${btnGhost} h-11`}
          >
            All blends <ArrowRight size={15} />
          </Link>
        </div>
        <div
          className={`grid gap-4 md:gap-5 ${bundle ? "lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]" : ""}`}
        >
          {bundle}
          <div className="flex flex-col gap-3 md:gap-4">
            {products.map((p) => (
              <HomeProductCard key={p.slug} product={p} variant="row" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- Certificate register
export function CoaBand({
  index,
  list,
  heading,
  accent,
  sub,
}: {
  index: string;
  list: Coa[];
  heading: string;
  accent: string;
  sub: string;
}) {
  const labs = [...new Set(list.map((c) => c.lab))];
  const latest = list
    .map((c) => c.tested)
    .sort()
    .at(-1);
  return (
    <section className="bg-[#0B1B3B] text-[#EEF2F8] py-16 md:py-24" data-testid="lab-report-band">
      <div className="container-main grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)] lg:gap-16">
        <div className="lg:sticky lg:top-28 self-start">
          <Kicker index={index} tone="light">
            Batch register
          </Kicker>
          <Title
            tone="light"
            lead={heading}
            accent={accent}
            className="mt-3 text-[34px] md:text-[52px]"
          />
          <p className="mt-4 text-[15px] md:text-[16.5px] leading-relaxed text-[#EEF2F8]/70 max-w-[420px]">
            {sub}
          </p>
          <dl className="mt-7 grid grid-cols-3 gap-3 max-w-[420px]">
            {[
              ["Reports", String(list.length)],
              ["Lab", labs.join(", ")],
              ["Latest", latest ? fmtDate(latest) : "-"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-[12px] ring-1 ring-[#EEF2F8]/14 px-3 py-2.5">
                <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#EEF2F8]/72">
                  {k}
                </dt>
                <dd className="mt-1 font-heading font-semibold text-[15px] md:text-[17px] leading-tight tabular-nums">
                  {v}
                </dd>
              </div>
            ))}
          </dl>
          <Link
            to="/lab-reports"
            data-testid="view-all-lab-reports"
            className="mt-7 inline-flex items-center gap-2 h-12 px-6 rounded-[10px] bg-[#EEF2F8] text-[#0B1B3B] font-semibold text-[15px] hover:opacity-90"
          >
            View all certificates <ArrowRight size={16} />
          </Link>
        </div>

        <div>
          <div className="hidden md:grid grid-cols-[64px_minmax(0,1fr)_120px_110px_88px] gap-4 px-2 pb-3 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#EEF2F8]/45">
            <span />
            <span>Compound / batch</span>
            <span>HPLC purity</span>
            <span>Report date</span>
            <span />
          </div>
          <ol data-testid="lab-report-ticker" className="border-t border-[#EEF2F8]/14">
            {list.map((r) => {
              const c = getCompound(r.compound);
              const name = c?.name ?? r.compound;
              const img = productImage(r.compound, r.strength);
              const tint = wellTint(labelColour(r.compound, r.strength));
              return (
                <li key={r.batch} className="border-b border-[#EEF2F8]/14">
                  <a
                    href={`/verify/${r.batch}`}
                    data-testid="lab-report-chip"
                    className="group grid grid-cols-[52px_minmax(0,1fr)_auto] md:grid-cols-[64px_minmax(0,1fr)_120px_110px_88px] items-center gap-3 md:gap-4 px-0 md:px-2 py-3.5 md:py-4 hover:bg-[#EEF2F8]/[0.04] transition-colors"
                  >
                    <span
                      className="size-[52px] md:size-16 rounded-[12px] overflow-hidden"
                      style={{ background: tint }}
                    >
                      <img
                        src={img.small ?? img.src}
                        alt=""
                        loading="lazy"
                        width={64}
                        height={64}
                        className="size-full object-contain scale-[1.35] mix-blend-multiply"
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-heading font-semibold text-[15px] md:text-[17px] leading-tight truncate">
                        {name} {r.strength}
                      </span>
                      <span className="block font-mono text-[11px] text-[#EEF2F8]/55 mt-1">
                        {r.batch}
                        {r.measuredMg != null && ` · ${r.measuredMg} mg found`}
                        <span className="block md:hidden">{fmtDate(r.tested)}</span>
                      </span>
                    </span>
                    <span className="text-right md:text-left font-heading font-semibold tabular-nums tracking-[-0.03em] text-[22px] md:text-[26px] leading-none">
                      {r.purity.toFixed(2)}
                      <span className="text-[14px] md:text-[16px]" style={{ color: BLUE_LIGHT }}>
                        %
                      </span>
                    </span>
                    <span className="hidden md:block font-mono text-[12px] text-[#EEF2F8]/72">
                      {fmtDate(r.tested)}
                    </span>
                    <span className="hidden md:inline-flex justify-self-end items-center gap-1 h-9 px-3 rounded-[9px] ring-1 ring-[#EEF2F8]/25 text-[13px] font-semibold group-hover:bg-[#EEF2F8] group-hover:text-[#0B1B3B] transition-colors">
                      View <ArrowUpRight size={13} />
                    </span>
                  </a>
                </li>
              );
            })}
          </ol>
          <p className="mt-4 text-[12.5px] text-[#EEF2F8]/72 leading-relaxed">
            Figures copied exactly as printed on each {labs.join(", ")} report. Each row opens the
            batch page with the original report.
          </p>
        </div>
      </div>
    </section>
  );
}

export { INK, PAPER };
