import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useId, useRef, useState } from "react";
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
import { Wordmark } from "@/components/Wordmark";
import {
  compounds,
  featured,
  gbp,
  readCart,
  productImage,
  productPath,
  searchCompounds,
  fromPrice,
  costPerUnitLabel,
  isB2G1,
  getCategory,
  type Compound,
  type CartItem,
} from "@/lib/catalog";
import { site, spendTierLine } from "@/data/site";
import { shopSections } from "@/data/shop-sections";
import { coreFaqs, type QA } from "@/data/faq";
import { latestCoa } from "@/data/coa";
import { claimFilled, claimGate, claimText } from "@/lib/claims";
import { AnalyticsConsentBanner } from "@/components/AnalyticsConsent";
import { capture } from "@/lib/analytics";

// ---------------------------------------------------------------- Announcement bar
const RUO_NOTICE = "For laboratory research use only. Not for human or veterinary use.";
const announcements = [
  RUO_NOTICE,
  site.checkoutOpen
    ? `Free UK delivery over £${site.freeDeliveryThreshold}`
    : "Checkout is not open yet: browse specifications and certificates",
];

function AnnouncementBar() {
  return (
    <div className="bg-ink text-ink-foreground text-xs md:text-sm font-medium">
      <div className="container-main h-9 flex items-center justify-center gap-8">
        <span className="md:hidden truncate">{announcements[0]}</span>
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
  const [focused, setFocused] = useState(false);
  const resultsId = useId();
  const navigate = useNavigate();
  const matches = searchCompounds(q, 7);
  const open = focused && q.trim().length >= 2;
  const go = (c?: Compound) => {
    if (q.trim().length >= 2) capture("search", { source: "header", result_count: matches.length });
    if (c) navigate({ to: productPath(c.slug) });
    else navigate({ to: "/shop", search: { q } });
    setQ("");
    setFocused(false);
    onDone?.();
  };
  return (
    <div
      className="relative w-full"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
      }}
    >
      <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
      <Input
        aria-label="Search peptides"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={open ? resultsId : undefined}
        aria-activedescendant={open && matches[active] ? `${resultsId}-${active}` : undefined}
        autoFocus={autoFocus}
        value={q}
        onFocus={() => setFocused(true)}
        onChange={(e) => {
          setQ(e.target.value);
          setActive(0);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, Math.max(0, matches.length - 1)));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            go(open ? matches[active] : undefined);
          } else if (e.key === "Escape") {
            setQ("");
            setFocused(false);
          }
        }}
        placeholder="Search peptides, e.g. BPC-157"
        className="w-full pl-9 rounded-full bg-surface border-border"
      />
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border shadow-xl rounded-xl overflow-hidden z-50 min-w-[300px]">
          <div id={resultsId} role="listbox" aria-label="Matching compounds">
            {matches.map((c, n) => {
              const img = productImage(c.slug);
              return (
                <a
                  key={c.slug}
                  id={`${resultsId}-${n}`}
                  role="option"
                  aria-selected={n === active}
                  href={productPath(c.slug)}
                  onMouseEnter={() => setActive(n)}
                  onClick={() => {
                    capture("search", { source: "header", result_count: matches.length });
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
                      {c.strengths.map((s) => s.label).join(" · ")} ·{" "}
                      {getCategory(c.category)?.name}
                    </span>
                  </span>
                  <span className="font-mono text-xs">from {gbp(fromPrice(c))}</span>
                </a>
              );
            })}
          </div>
          {matches.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">No matching compounds</p>
          )}
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
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Remember the confirmation for 30 days so returning researchers are not asked on every visit.
    const stamp = Number(localStorage.getItem("vyrax-age") || 0);
    setAge(!(stamp && Date.now() - stamp < 30 * 864e5));
    const sync = () => setCount(readCart().reduce((a, b) => a + b.quantity, 0));
    sync();
    window.addEventListener("vyrax-cart", sync);
    return () => window.removeEventListener("vyrax-cart", sync);
  }, []);
  useEffect(() => {
    if (!age) return;
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLInputElement>('input[type="checkbox"]')?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [age]);
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
          <Link to="/" className="flex items-center shrink-0" aria-label="Vyrax Labs home">
            <Wordmark className="h-[15px] sm:h-[18px] w-auto" />
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
                ["Contact us", "/contact"],
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
      <AnalyticsConsentBanner />
      {age && (
        <div className="fixed inset-0 z-[100] bg-ink/80 flex items-center justify-center p-4">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="research-access-title"
            aria-describedby="research-access-description"
            onKeyDown={(e) => {
              if (e.key !== "Tab") return;
              const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(
                "input:not(:disabled), button:not(:disabled), a[href]",
              );
              if (!nodes?.length) return;
              const first = nodes[0];
              const last = nodes[nodes.length - 1];
              if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last?.focus();
              } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first?.focus();
              }
            }}
            className="bg-background rounded-2xl max-w-md w-full p-8 shadow-2xl"
          >
            <FlaskConical className="text-primary mb-5" size={30} />
            <h2 id="research-access-title" className="font-heading text-2xl font-semibold">
              Research access
            </h2>
            <p id="research-access-description" className="text-muted-foreground mt-3 mb-6">
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
              <Link
                to="/research-use-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
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
function Footer() {
  // Unknown company facts render as an honest absence, never as an invented value. Every line here
  // comes from the claim registry, so a fact appearing in the footer means the evidence manifest
  // (src/lib/evidence.ts) holds it.
  const company = [
    site.name,
    claimText("identity.registered-office"),
  ].filter(Boolean);
  // Only lists payment methods the evidence manifest says are actually live at checkout.
  const paymentLine =
    claimFilled("payment.methods-live", {
      paymentMethods: `${site.paymentMethods.join(", ")}. Card details are entered on our payment provider's secure page`,
    }) ?? "Card checkout is not open yet.";
  return (
    <footer className="bg-ink text-ink-foreground">
      <div className="border-b border-ink-line">
        <div className="container-main py-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
          {[
            [
              FileCheck2,
              claimGate("testing.certificates-published"),
              claimGate("testing.hplc-mass-spec-published"),
            ],
            [
              Truck,
              "UK delivery",
              `${site.carrier}, £${site.standardDeliveryFee.toFixed(2)}, free over £${site.freeDeliveryThreshold}`,
            ],
            [PackageCheck, "Contact", `Email ${site.email}`],
            [
              RotateCcw,
              "Returns policy",
              `Unopened items: ${site.returnWindowDays} days from delivery`,
            ],
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
          <Wordmark tone="light" title="Vyrax Labs" className="h-[19px] w-auto" />
          <p className="mt-4 text-sm text-ink-muted leading-relaxed max-w-sm">
            Research peptides for laboratory use, supplied from the UK. Check the specification and
            the certificate for a batch before you buy.
          </p>
          <p className="mt-3 text-sm">
            <a
              href={`mailto:${site.email}`}
              className="text-ink-foreground underline underline-offset-2"
            >
              {site.email}
            </a>
          </p>
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
          <FooterLink to="/contact">Contact us</FooterLink>
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
            <p>
              © {new Date().getFullYear()} {site.name}. All rights reserved.
            </p>
          </div>
          <div className="md:text-right space-y-1 max-w-md">
            <p aria-label="Payment methods" className="font-semibold text-ink-foreground">
              {paymentLine}
            </p>
            <p>
              All products are sold strictly for laboratory research use only. Not for human or
              veterinary use. Not a medicine, food, cosmetic or supplement.
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
