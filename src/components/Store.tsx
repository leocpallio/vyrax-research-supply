import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Search,
  ShoppingBag,
  UserRound,
  Menu,
  X,
  ArrowRight,
  FileCheck2,
  FlaskConical,
  Truck,
  ShieldCheck,
  RotateCcw,
  PackageCheck,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  compounds,
  featured,
  gbp,
  addCart,
  readCart,
  productImage,
  productPath,
  searchCompounds,
  fromPrice,
  hasB2G1,
  cartLine,
  getCategory,
  type Compound,
  type CartItem,
} from "@/lib/catalog";
import { site, dispatchInfo } from "@/data/site";
import { shopSections } from "@/data/shop-sections";
import { coreFaqs, type QA } from "@/data/faq";
import { latestCoa } from "@/data/coa";
import { supabase } from "@/integrations/supabase/client";

// ---------------------------------------------------------------- Announcement bar
const announcements = [
  `Free tracked UK delivery over £${site.freeDeliveryThreshold}`,
  `Same-day dispatch on orders before ${site.dispatchCutoffHour - 12}pm`,
  "Buy 2, get the 3rd free: Retatrutide 10mg and Tirzepatide 20mg",
  "Save 10% over £150, 15% over £250, 20% over £400",
];

function AnnouncementBar() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % announcements.length), 4500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="bg-ink text-ink-foreground text-xs md:text-sm font-medium">
      <div className="container-main h-9 flex items-center justify-center gap-8">
        <span className="md:hidden truncate" aria-live="polite">
          {announcements[i]}
        </span>
        <div className="hidden md:flex items-center gap-6">
          {announcements.map((a, n) => (
            <span key={a} className="flex items-center gap-6">
              {n > 0 && <span className="opacity-30">|</span>}
              {a}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Search with autocomplete
function SearchBox({ onDone, autoFocus = false }: { onDone?: () => void; autoFocus?: boolean }) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const matches = searchCompounds(q, 7);
  const go = (c?: Compound) => {
    if (c) window.location.assign(productPath(c.slug));
    else navigate({ to: "/shop", search: { q } });
    setQ("");
    onDone?.();
  };
  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
      <Input
        aria-label="Search peptides"
        role="combobox"
        aria-expanded={matches.length > 0}
        aria-controls="search-results"
        autoFocus={autoFocus}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setActive(0);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, matches.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            go(matches[active]);
          } else if (e.key === "Escape") setQ("");
        }}
        placeholder="Search peptides, e.g. BPC-157"
        className="w-full pl-9 rounded-full bg-surface border-border"
      />
      {matches.length > 0 && (
        <div
          id="search-results"
          role="listbox"
          className="absolute top-full left-0 right-0 mt-2 bg-background border border-border shadow-xl rounded-xl overflow-hidden z-50 min-w-[300px]"
        >
          {matches.map((c, n) => {
            const img = productImage(c.slug);
            return (
              <a
                key={c.slug}
                role="option"
                aria-selected={n === active}
                href={productPath(c.slug)}
                onMouseEnter={() => setActive(n)}
                onClick={() => {
                  setQ("");
                  onDone?.();
                }}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm ${n === active ? "bg-surface" : ""}`}
              >
                <img
                  src={img.small ?? img.src}
                  alt=""
                  width={40}
                  height={40}
                  className="size-10 rounded-md object-cover bg-surface"
                />
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold truncate">{c.name}</span>
                  <span className="block text-xs text-muted-foreground truncate">
                    {c.strengths.map((s) => s.label).join(" · ")} · {getCategory(c.category)?.name}
                  </span>
                </span>
                <span className="font-mono text-xs">from {gbp(fromPrice(c))}</span>
              </a>
            );
          })}
          <button
            type="button"
            onClick={() => go()}
            className="w-full text-left px-3 py-2.5 text-xs font-semibold text-primary border-t border-border hover:bg-surface"
          >
            See all results for "{q}"
          </button>
        </div>
      )}
    </div>
  );
}

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
    window.addEventListener("vyrax-added", on);
    return () => window.removeEventListener("vyrax-added", on);
  }, []);
  if (!item) return null;
  return (
    <div
      role="status"
      className="fixed z-[90] bottom-4 right-4 left-4 md:left-auto md:w-96 bg-background border border-border shadow-2xl rounded-xl p-4 flex gap-3 items-center"
    >
      <span className="size-9 rounded-full bg-verify/15 text-verify grid place-items-center shrink-0">
        <Check size={18} />
      </span>
      <div className="flex-1 min-w-0 text-sm">
        <p className="font-semibold truncate">
          Added: {item.name} {item.strength}
          {item.quantity > 1 ? ` × ${item.quantity}` : ""}
        </p>
        <p className="text-muted-foreground text-xs">Basket updated</p>
      </div>
      <Button asChild size="sm" className="rounded-full">
        <Link to="/basket">View basket</Link>
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------- Shell
export function StoreShell({ children }: { children: React.ReactNode }) {
  const [menu, setMenu] = useState(false);
  const [age, setAge] = useState(false);
  const [adult, setAdult] = useState(false);
  const [research, setResearch] = useState(false);
  const [count, setCount] = useState(0);
  useEffect(() => {
    // Remember the confirmation for 30 days so returning researchers are not asked on every visit.
    const stamp = Number(localStorage.getItem("vyrax-age") || 0);
    setAge(!(stamp && Date.now() - stamp < 30 * 864e5));
    const sync = () => setCount(readCart().reduce((a, b) => a + b.quantity, 0));
    sync();
    window.addEventListener("vyrax-cart", sync);
    return () => window.removeEventListener("vyrax-cart", sync);
  }, []);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[200] focus:p-3 focus:bg-background"
      >
        Skip to content
      </a>
      <AnnouncementBar />
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="container-main flex h-[72px] items-center gap-5 justify-between">
          <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label="Vyrax Labs home">
            <span className="brand-symbol">V</span>
            <span className="font-heading font-bold text-xl tracking-normal leading-none">
              VYRAX
              <span className="block text-[9px] tracking-[.36em] font-medium text-muted-foreground mt-1">
                LABS
              </span>
            </span>
          </Link>
          <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold">
            <div className="relative group">
              <Link to="/shop" className="hover:text-primary py-6 inline-block">
                Shop peptides
              </Link>
              <div className="absolute left-1/2 -translate-x-1/2 top-full hidden group-hover:grid group-focus-within:grid grid-cols-2 gap-1 w-[520px] bg-background border border-border rounded-xl shadow-xl p-3">
                 {shopSections.map((c) => (
                  <Link
                    key={c.slug}
                     to="/collections/$slug"
                    params={{ slug: c.slug }}
                    className="rounded-lg p-3 hover:bg-surface"
                  >
                    <span className="block font-semibold">{c.name}</span>
                     <span className="block text-xs text-muted-foreground font-normal mt-0.5">{c.blurb}</span>
                  </Link>
                ))}
                <Link to="/shop" className="rounded-lg p-3 hover:bg-surface text-primary">
                  View all {compounds.length} compounds <ArrowRight className="inline" size={14} />
                </Link>
              </div>
            </div>
            <Link to="/lab-reports" className="hover:text-primary">
              Lab reports
            </Link>
            <Link to="/calculator" className="hover:text-primary">
              Calculator
            </Link>
            <Link to="/guides" className="hover:text-primary">
              Guides
            </Link>
            <Link to="/faq" className="hover:text-primary">
              FAQ
            </Link>
          </nav>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden md:block w-56 xl:w-72">
              <SearchBox />
            </div>
            <Link to="/account" aria-label="Account" title="Account" className="icon-link">
              <UserRound size={21} />
            </Link>
            <Link
              to="/basket"
              aria-label={`Basket, ${count} items`}
              title="Basket"
              className="icon-link relative"
            >
              <ShoppingBag size={21} />
              {count > 0 && (
                <span className="absolute -right-2 -top-2 bg-primary text-primary-foreground rounded-full text-[10px] w-5 h-5 grid place-items-center">
                  {count}
                </span>
              )}
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Toggle menu"
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
        <div className="md:hidden container-main pb-3">
          <SearchBox />
        </div>
        {menu && (
          <nav className="lg:hidden border-t border-border p-4 grid gap-1 font-medium max-h-[70vh] overflow-y-auto">
            {(
              [
                ["Shop all", "/shop"],
                ["Lab reports", "/lab-reports"],
                ["Reconstitution calculator", "/calculator"],
                ["Guides", "/guides"],
                ["FAQ", "/faq"],
                ["Contact", "/contact"],
              ] as const
            ).map(([n, u]) => (
              <Link key={u} to={u} onClick={() => setMenu(false)} className="py-2">
                {n}
              </Link>
            ))}
            <p className="eyebrow mt-4 mb-1">Sections</p>
            {shopSections.map((c) => (
              <Link
                key={c.slug}
                to="/collections/$slug"
                params={{ slug: c.slug }}
                onClick={() => setMenu(false)}
                className="py-2"
              >
                {c.name}
              </Link>
            ))}
          </nav>
        )}
      </header>
      <main id="main">{children}</main>
      <Footer />
      <AddedToast />
      {age && (
        <div className="fixed inset-0 z-[100] bg-ink/80 flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Research access confirmation"
            className="bg-background rounded-2xl max-w-md w-full p-8 shadow-2xl"
          >
            <FlaskConical className="text-primary mb-5" size={30} />
            <h2 className="font-heading text-2xl font-semibold">Research access</h2>
            <p className="text-muted-foreground mt-3 mb-6">
              Vyrax Labs supplies materials for laboratory research only. Please confirm the
              following before continuing.
            </p>
            <label className="flex gap-3 text-sm mb-4">
              <input
                type="checkbox"
                checked={adult}
                onChange={(e) => setAdult(e.target.checked)}
                className="accent-primary mt-0.5"
              />
              I am 18 years of age or older.
            </label>
            <label className="flex gap-3 text-sm mb-6">
              <input
                type="checkbox"
                checked={research}
                onChange={(e) => setResearch(e.target.checked)}
                className="accent-primary mt-0.5"
              />
              I am purchasing for legitimate laboratory research and understand these products are
              not for human or veterinary use.
            </label>
            <Button
              className="w-full h-11 rounded-full"
              disabled={!adult || !research}
              onClick={() => {
                localStorage.setItem("vyrax-age", String(Date.now()));
                setAge(false);
              }}
            >
              Enter Vyrax Labs <ArrowRight />
            </Button>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Read our{" "}
              <Link to="/research-use-policy" className="underline" onClick={() => setAge(false)}>
                research use policy
              </Link>
              .
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Footer
function Newsletter() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  return (
    <form
      className="flex gap-2 mt-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("busy");
        const { error } = await supabase
          .from("mailing_list")
          .insert({ email: email.trim().toLowerCase() });
        // A duplicate address is still a successful subscribe from the visitor's point of view.
        setState(!error || error.code === "23505" ? "done" : "error");
      }}
    >
      {state === "done" ? (
        <p className="text-sm text-ink-foreground">Subscribed. Thank you.</p>
      ) : (
        <>
          <Input
            type="email"
            required
            aria-label="Email address"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-ink-panel border-ink-line text-ink-foreground placeholder:text-ink-muted rounded-full"
          />
          <Button disabled={state === "busy"} className="rounded-full shrink-0">
            Subscribe
          </Button>
        </>
      )}
      {state === "error" && (
        <p className="text-xs text-ink-muted">Could not subscribe. Please try again.</p>
      )}
    </form>
  );
}

function Footer() {
  const company = [
    site.legalName ?? "Vyrax Labs",
    site.companyNumber
      ? `Registered in England and Wales, company no. ${site.companyNumber}`
      : null,
    site.registeredOffice ? `Registered office: ${site.registeredOffice}` : null,
  ].filter(Boolean);
  return (
    <footer className="bg-ink text-ink-foreground">
      <div className="border-b border-ink-line">
        <div className="container-main py-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
          {[
            [
              FileCheck2,
              "Batch certificates",
              "HPLC and mass spectrometry, published on Lab Reports",
            ],
            [
              Truck,
              "Tracked UK delivery",
              `Free over £${site.freeDeliveryThreshold}, dispatched same day before ${site.dispatchCutoffHour - 12}pm`,
            ],
            [PackageCheck, "Protective packaging", "Plain outer parcel, padded vials"],
            [RotateCcw, "Free reship guarantee", "Lost or damaged in transit? We send it again"],
          ].map(([Icon, t, d]) => {
            const I = Icon as typeof Truck;
            return (
              <div key={t as string} className="flex gap-3">
                <I size={20} className="text-primary-soft shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{t as string}</p>
                  <p className="text-ink-muted text-xs mt-0.5">{d as string}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="container-main py-14 grid md:grid-cols-2 lg:grid-cols-5 gap-10">
        <div className="lg:col-span-2">
          <div className="font-heading text-2xl font-bold">
            VYRAX <span className="font-normal">LABS</span>
          </div>
          <p className="mt-4 text-sm text-ink-muted leading-relaxed max-w-sm">
            Research peptides for laboratory use, with batch documentation and tracked UK delivery.
          </p>
          <p className="mt-6 font-semibold text-sm">Batch releases and restocks</p>
          <Newsletter />
          <p className="mt-2 text-[11px] text-ink-muted">No spam. Unsubscribe any time.</p>
        </div>
        <div>
          <h3 className="font-semibold mb-5">Shop</h3>
          {shopSections.map((c) => (
            <Link
              key={c.slug}
              to="/collections/$slug"
              params={{ slug: c.slug }}
              className="block text-sm text-ink-muted mb-3 hover:text-ink-foreground"
            >
              {c.name}
            </Link>
          ))}
        </div>
        <div>
          <h3 className="font-semibold mb-5">Research</h3>
          <FooterLink to="/lab-reports">Lab reports</FooterLink>
          <FooterLink to="/calculator">Reconstitution calculator</FooterLink>
          <FooterLink to="/guides">Guides</FooterLink>
          <FooterLink to="/faq">FAQ</FooterLink>
          <FooterLink to="/about">About us</FooterLink>
        </div>
        <div>
          <h3 className="font-semibold mb-5">Customer care</h3>
          <FooterLink to="/contact">Contact</FooterLink>
          <FooterLink to="/shipping">Delivery</FooterLink>
          <FooterLink to="/returns">Returns and reship policy</FooterLink>
          <FooterLink to="/account">My account</FooterLink>
          <h3 className="font-semibold mb-4 mt-7">Legal</h3>
          <FooterLink to="/terms">Terms and conditions</FooterLink>
          <FooterLink to="/privacy">Privacy policy</FooterLink>
          <FooterLink to="/cookies">Cookie policy</FooterLink>
          <FooterLink to="/research-use-policy">Research use policy</FooterLink>
        </div>
      </div>
      <div className="border-t border-ink-line">
        <div className="container-main py-6 text-xs text-ink-muted grid gap-3 md:flex md:justify-between md:items-start">
          <div className="space-y-1">
            {company.map((line) => (
              <p key={line as string}>{line}</p>
            ))}
            <p>© {new Date().getFullYear()} Vyrax Labs. All rights reserved.</p>
          </div>
          <div className="md:text-right space-y-1 max-w-md">
            {site.paymentMethods.length > 0 && <p>We accept: {site.paymentMethods.join(", ")}</p>}
            <p>
              All products are sold strictly for laboratory research use only. Not for human or
              veterinary use. Not a medicine, food or cosmetic.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to as "/"} className="block text-sm text-ink-muted mb-3 hover:text-ink-foreground">
      {children}
    </Link>
  );
}

// ---------------------------------------------------------------- Product cards
export function ProductCard({ product }: { product: Compound }) {
  const s = product.strengths[0];
  const img = productImage(product.slug);
  const href = productPath(product.slug);
  const coa = latestCoa(product.slug);
  if (!s) return null;
  return (
    <div className="product-card group flex flex-col">
      <a href={href} className="block relative bg-surface aspect-square overflow-hidden">
        <img
          src={img.src}
          srcSet={img.srcSet}
          sizes="(min-width: 1024px) 300px, 50vw"
          alt={`${product.name} ${s.label} research vial`}
          loading="lazy"
          width={1024}
          height={1024}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <span className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {hasB2G1(product) && <span className="badge-promo">Buy 2 get 1 free</span>}
          {coa && <span className="badge-verify">{coa.purity.toFixed(2)}% HPLC</span>}
        </span>
        {!img.isRender && (
          <span className="absolute inset-x-6 top-[46%] text-center font-heading font-semibold text-ink text-sm md:text-base leading-tight pointer-events-none">
            {product.name}
            <span className="block font-mono text-xs text-primary mt-1">{s.label}</span>
          </span>
        )}
      </a>
      <div className="p-4 md:p-5 flex flex-col flex-1">
        <div className="text-[11px] uppercase text-muted-foreground tracking-wide mb-1.5 truncate">
          {product.tags.join(" · ")}
        </div>
        <a
          href={href}
          className="font-heading font-semibold text-base md:text-lg leading-snug line-clamp-2 hover:text-primary"
        >
          {product.name}
        </a>
        <p className="text-xs text-muted-foreground mt-1 font-mono">
          {product.strengths.map((x) => x.label).join(" · ")}
        </p>
        <div className="flex items-end justify-between gap-2 mt-3 mt-auto pt-3">
          <div>
            <span className="text-xs text-muted-foreground">
              {product.strengths.length > 1 ? "From" : "Price"}
            </span>
            <p className="font-heading text-xl font-bold">{gbp(fromPrice(product))}</p>
          </div>
          <Link
            to="/lab-reports"
            title={coa ? "View certificate" : "Lab reports"}
            aria-label={`Lab reports for ${product.name}`}
            className={coa ? "text-verify" : "text-muted-foreground hover:text-primary"}
          >
            <FileCheck2 size={19} />
          </Link>
        </div>
        <Button className="w-full mt-4 rounded-full" onClick={() => addCart(cartLine(product, s))}>
          Add {s.label} to basket
        </Button>
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
  return (
    <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-medium text-foreground">
      <span className="flex items-center gap-2">
        <FileCheck2 size={18} className="text-verify" /> HPLC and MS batch testing
      </span>
      <span className="flex items-center gap-2">
        <Truck size={18} className="text-primary" /> Tracked UK delivery
      </span>
      <span className="flex items-center gap-2">
        <PackageCheck size={18} className="text-primary" /> Same-day dispatch before{" "}
        {site.dispatchCutoffHour - 12}pm
      </span>
      <span className="flex items-center gap-2">
        <ShieldCheck size={18} className="text-primary" /> Free reship guarantee
      </span>
    </div>
  );
}

export function DispatchCountdown({ className = "" }: { className?: string }) {
  const [info, setInfo] = useState<ReturnType<typeof dispatchInfo> | null>(null);
  useEffect(() => {
    setInfo(dispatchInfo());
    const t = setInterval(() => setInfo(dispatchInfo()), 30000);
    return () => clearInterval(t);
  }, []);
  if (!info)
    return (
      <span className={className}>
        Same-day dispatch on working days before {site.dispatchCutoffHour - 12}pm
      </span>
    );
  return (
    <span className={className}>
      {info.today ? (
        <>
          Order within <strong className="font-mono">{info.label}</strong> for dispatch today
        </>
      ) : (
        <>
          Order now for dispatch <strong>{info.label}</strong>
        </>
      )}
    </span>
  );
}

export function Disclaimer() {
  return (
    <div className="bg-tint border-y border-border py-3 text-center text-sm font-semibold text-foreground px-4">
      For research use only. Not for human consumption.
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
          <li key={it.name} className="flex items-center gap-1.5">
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
