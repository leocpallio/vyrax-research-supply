import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, FileCheck2, Truck, ShieldCheck, PackageCheck, Check } from "lucide-react";
import {
  compounds,
  featured,
  gbp,
  productImage,
  productPath,
  fromPrice,
  costPerUnitLabel,
  isB2G1,
  type Compound,
  type CartItem,
} from "@/lib/catalog";
import { coreFaqs, type QA } from "@/data/faq";
import { latestCoa } from "@/data/coa";
import { claimFilled, claimText } from "@/lib/claims";
import { AnalyticsConsentBanner } from "@/components/AnalyticsConsent";
import { AnnouncementBar } from "@/components/shell/AnnouncementBar";
import { Header } from "@/components/shell/Header";
import { Footer } from "@/components/shell/Footer";
import { SearchDialog } from "@/components/shell/SearchDialog";
import { CartDrawer } from "@/components/shell/CartDrawer";
import { RuoGate } from "@/components/shell/RuoGate";
import { CART_ADDED_EVENT, CART_OPEN_EVENT, openCartDrawer } from "@/components/shell/cart-store";

export { openCartDrawer };

const RUO_NOTICE = "For laboratory research use only. Not for human or veterinary use.";

// ---------------------------------------------------------------- Added-to-basket toast
function AddedToast() {
  const [item, setItem] = useState<CartItem | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    const on = (e: Event) => {
      setItem((e as CustomEvent<CartItem>).detail);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setItem(null), 4000);
    };
    window.addEventListener(CART_ADDED_EVENT, on);
    return () => window.removeEventListener(CART_ADDED_EVENT, on);
  }, []);
  if (!item) return null;
  return (
    <div
      role="status"
      data-testid="added-toast"
      className="fixed z-[70] bottom-4 right-4 left-4 md:left-auto md:w-96 bg-paper border border-line shadow-2xl rounded-[20px] p-4 flex gap-3 items-center animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <span className="size-9 rounded-full bg-verify/15 text-verify grid place-items-center shrink-0">
        <Check size={18} />
      </span>
      <div className="flex-1 min-w-0 text-sm">
        <p className="font-semibold truncate">
          Added: {item.name} {item.strength}
          {item.quantity > 1 ? ` x ${item.quantity}` : ""}
        </p>
        <p className="text-muted-foreground text-xs">Basket updated</p>
      </div>
      <button
        type="button"
        onClick={() => {
          setItem(null);
          openCartDrawer();
        }}
        className="rounded-full bg-ink text-ink-foreground h-9 px-4 text-xs font-semibold hover:bg-ink/90 transition-colors duration-150"
      >
        View basket
      </button>
    </div>
  );
}

// ---------------------------------------------------------------- Shell
export function StoreShell({ children }: { children: React.ReactNode }) {
  const [search, setSearch] = useState(false);
  const [cart, setCart] = useState(false);
  useEffect(() => {
    const open = () => setCart(true);
    window.addEventListener(CART_OPEN_EVENT, open);
    return () => window.removeEventListener(CART_OPEN_EVENT, open);
  }, []);
  return (
    <div className="min-h-screen bg-paper text-foreground flex flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[200] focus:p-3 focus:bg-paper"
      >
        Skip to content
      </a>
      <AnnouncementBar />
      <Header onSearch={() => setSearch(true)} onCart={() => setCart(true)} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
      <SearchDialog open={search} onOpenChange={setSearch} />
      <CartDrawer open={cart} onOpenChange={setCart} />
      <AddedToast />
      <AnalyticsConsentBanner />
      <RuoGate />
    </div>
  );
}

// ---------------------------------------------------------------- Product cards
export function ProductCard({ product }: { product: Compound }) {
  const s = product.strengths[0];
  const img = productImage(product.slug);
  const href = productPath(product.slug);
  const coa = latestCoa(product.slug);
  // ">99% HPLC" only renders when a certificate for this compound is on file: the wording comes
  // from the registry, which is gated on evidence.labReportsPublished.
  const purityBadge = coa
    ? claimFilled("testing.purity-badge", { purity: coa.purity.toFixed(2) })
    : null;
  if (!s) return null;
  return (
    <div className="product-card group flex flex-col">
      <a href={href} className="block relative bg-surface aspect-square overflow-hidden">
        <img
          src={img.src}
          srcSet={img.srcSet}
          sizes="(min-width: 1024px) 300px, 50vw"
          alt={`${product.name} ${s.label} ${img.isRender ? "illustrative vial render" : "vial illustration"}`}
          loading="lazy"
          width={1024}
          height={1024}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <span className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {/* Scoped to the strength displayed on the card: the B2G1 offer only applies to specific
              strengths (e.g. Tirzepatide 20mg), so a compound-level badge would advertise a deal the
              shown strength does not qualify for. */}
          {isB2G1(product.slug, s.label) && (
            <span className="badge-promo">{claimText("offer.b2g1")}</span>
          )}
          {purityBadge && <span className="badge-verify">{purityBadge}</span>}
        </span>
        {!img.isRender && (
          <span className="absolute inset-x-6 top-[46%] text-center font-heading font-semibold text-ink text-sm md:text-base leading-tight pointer-events-none">
            {product.name}
            <span className="block font-mono text-xs text-primary mt-1">{s.label}</span>
          </span>
        )}
      </a>
      <div className="p-4 md:p-5 flex flex-col flex-1">
        <a
          href={href}
          className="font-heading font-semibold text-base md:text-lg leading-snug line-clamp-2 hover:text-primary"
        >
          {product.name}
        </a>
        <div className="flex flex-wrap gap-1.5 mt-2" aria-label={`${product.name} strengths`}>
          {product.strengths.map((x) => (
            <a
              key={x.label}
              href={productPath(product.slug, x.label)}
              className="rounded-full border border-border px-2 py-1 text-xs font-mono hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
              aria-label={`${product.name} ${x.label} specifications`}
            >
              {x.label}
            </a>
          ))}
        </div>
        <div className="flex items-end justify-between gap-2 mt-auto pt-3">
          <div>
            <span className="text-xs text-muted-foreground">
              {product.strengths.length > 1 ? "From" : "Price"}
            </span>
            <p className="font-heading text-xl font-bold">{gbp(fromPrice(product))}</p>
            {product.category !== "peptide-blends" &&
              product.category !== "lab-supplies" &&
              s.unit === "mg" && (
                <p className="text-xs text-muted-foreground">
                  {costPerUnitLabel(
                    product.strengths.find((x) => x.price === fromPrice(product)) ?? s,
                  )}
                </p>
              )}
          </div>
          {coa && (
            <a
              href={coa.file}
              target="_blank"
              rel="noreferrer"
              title="Certificate of analysis (PDF)"
              aria-label={`Certificate of analysis PDF for ${product.name}`}
              className="text-verify size-11 -m-2 grid place-items-center"
            >
              <FileCheck2 size={19} />
            </a>
          )}
        </div>
        <a
          href={href}
          className="mt-4 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm min-h-10 hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          View specifications <ArrowRight size={16} className="ml-2" />
        </a>
      </div>
    </div>
  );
}

export function ProductGrid({ list = compounds }: { list?: Compound[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
      {list.map((p) => (
        <ProductCard key={p.slug} product={p} />
      ))}
    </div>
  );
}

export function FeaturedGrid() {
  return <ProductGrid list={featured} />;
}

// ---------------------------------------------------------------- Trust + misc blocks
export function TrustStrip() {
  const batchTesting = claimText("testing.hplc-ms-batch-testing");
  return (
    <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-medium text-foreground">
      {batchTesting ? (
        <span className="flex items-center gap-2">
          <FileCheck2 size={18} className="text-verify" /> {batchTesting}
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <PackageCheck size={18} className="text-verify" /> {claimText("trust.packaging")}
        </span>
      )}
      <span className="flex items-center gap-2">
        <Truck size={18} className="text-primary" /> Delivery information
      </span>
      <span className="flex items-center gap-2">
        <ShieldCheck size={18} className="text-primary" /> Research use only
      </span>
    </div>
  );
}

export function Disclaimer() {
  return (
    <div className="bg-tint border-y border-border py-3 text-center text-sm font-semibold text-foreground px-4">
      {RUO_NOTICE}
    </div>
  );
}

export const faqItems: QA[] = coreFaqs;
export function FAQ({ items = coreFaqs }: { items?: QA[] | string[][] }) {
  return (
    <div className="divide-y divide-border border-t border-b border-border">
      {items.map(([q, a]) => (
        <details key={q} className="group py-5">
          <summary className="font-heading font-semibold cursor-pointer list-none flex justify-between gap-4">
            {q}
            <span className="text-primary group-open:rotate-45 transition-transform">+</span>
          </summary>
          <p className="text-muted-foreground leading-relaxed mt-3 max-w-3xl">{a}</p>
        </details>
      ))}
    </div>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  body,
  as: As = "h2",
}: {
  eyebrow?: string | undefined;
  title: string;
  body?: string | undefined;
  as?: "h1" | "h2";
}) {
  return (
    <div className="mb-8">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <As className="font-heading text-3xl md:text-4xl font-semibold leading-tight">{title}</As>
      {body && <p className="text-muted-foreground mt-3 max-w-2xl">{body}</p>}
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { name: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-6">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((it, i) => (
          <li key={`${it.name}-${i}`} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden>/</span>}
            {it.to ? (
              <a href={it.to} className="hover:text-primary">
                {it.name}
              </a>
            ) : (
              <span className="text-foreground">{it.name}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
