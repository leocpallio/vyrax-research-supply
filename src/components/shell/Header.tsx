import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Search, ShoppingBag, UserRound, Menu, X, ChevronDown, ArrowRight } from "lucide-react";
import { Wordmark } from "@/components/Wordmark";
import { compounds, featured } from "@/lib/catalog";
import { shopSections } from "@/data/shop-sections";
import { site } from "@/data/site";
import { cartCount, useCartItems } from "./cart-store";

type NavLink = { label: string; to: string; hint?: string; testid: string };
type NavGroup = { label: string; testid: string; links: NavLink[]; sections?: boolean };

const NAV: NavGroup[] = [
  {
    label: "Shop",
    testid: "nav-shop",
    links: [
      {
        label: "All peptides",
        to: "/shop",
        hint: `${compounds.length} compounds`,
        testid: "nav-shop-all",
      },
      {
        label: "Best sellers",
        to: "/shop",
        hint: `${featured.length} most ordered`,
        testid: "nav-shop-best",
      },
      {
        label: "Lab reports",
        to: "/lab-reports",
        hint: "Certificates by batch",
        testid: "nav-shop-lab",
      },
    ],
    sections: shopSections.length > 0,
  },
  {
    label: "Learn",
    testid: "nav-learn",
    links: [
      {
        label: "Guides",
        to: "/guides",
        hint: "Handling, storage, preparation",
        testid: "nav-learn-guides",
      },
      {
        label: "Reconstitution calculator",
        to: "/calculator",
        hint: "Volume and concentration",
        testid: "nav-learn-calculator",
      },
      {
        label: "Shipping",
        to: "/shipping",
        hint: "Dispatch and delivery",
        testid: "nav-learn-shipping",
      },
      { label: "FAQ", to: "/faq", hint: "Ordering and research use", testid: "nav-learn-faq" },
    ],
  },
];

function Dropdown({
  group,
  open,
  onToggle,
  onClose,
}: {
  group: NavGroup;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        data-testid={group.testid}
        onClick={onToggle}
        className={`inline-flex items-center gap-1 h-10 px-3 rounded-full text-sm font-semibold transition-colors duration-150 hover:bg-tint ${open ? "bg-tint" : ""}`}
      >
        {group.label}
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div
          role="menu"
          data-testid={`${group.testid}-menu`}
          className={`absolute left-0 top-full mt-2 bg-paper border border-line rounded-[20px] shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150 ${group.sections ? "w-[560px] grid grid-cols-2 gap-1" : "w-72"}`}
        >
          <div>
            {group.links.map((l) => (
              <Link
                key={l.testid}
                to={l.to as "/"}
                role="menuitem"
                data-testid={l.testid}
                onClick={onClose}
                className="block rounded-xl px-3 py-2.5 hover:bg-tint transition-colors duration-150"
              >
                <span className="block text-sm font-semibold">{l.label}</span>
                {l.hint && <span className="block text-xs text-muted-foreground">{l.hint}</span>}
              </Link>
            ))}
          </div>
          {group.sections && (
            <div className="border-l border-line pl-2">
              <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Research stacks
              </p>
              {shopSections.map((s) => (
                <Link
                  key={s.slug}
                  to="/collections/$slug"
                  params={{ slug: s.slug }}
                  role="menuitem"
                  data-testid={`nav-section-${s.slug}`}
                  onClick={onClose}
                  className="block rounded-xl px-3 py-1.5 text-sm hover:bg-tint transition-colors duration-150"
                >
                  {s.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MobileMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[80] bg-ink/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          data-testid="mobile-menu"
          className="fixed z-[81] inset-0 bg-paper flex flex-col outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left duration-200"
        >
          <div className="flex items-center justify-between px-4 h-14 border-b border-line">
            <DialogPrimitive.Title className="sr-only">Menu</DialogPrimitive.Title>
            <Wordmark className="h-[15px] w-auto" title="Vyrax Labs" />
            <DialogPrimitive.Close
              className="icon-link -mr-2"
              aria-label="Close menu"
              data-testid="mobile-menu-close"
            >
              <X size={22} />
            </DialogPrimitive.Close>
          </div>
          <nav className="flex-1 overflow-y-auto px-4 py-4">
            {NAV.map((g) => (
              <div key={g.testid} className="mb-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-1">
                  {g.label}
                </p>
                {g.links.map((l) => (
                  <DialogPrimitive.Close asChild key={l.testid}>
                    <Link
                      to={l.to as "/"}
                      data-testid={`m-${l.testid}`}
                      className="flex items-center justify-between py-3 text-base font-semibold border-b border-line"
                    >
                      {l.label} <ArrowRight size={16} className="text-muted-foreground" />
                    </Link>
                  </DialogPrimitive.Close>
                ))}
                {g.sections && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {shopSections.map((s) => (
                      <DialogPrimitive.Close asChild key={s.slug}>
                        <Link
                          to="/collections/$slug"
                          params={{ slug: s.slug }}
                          className="chip text-xs"
                        >
                          {s.name}
                        </Link>
                      </DialogPrimitive.Close>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="mb-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-1">
                Company
              </p>
              {(
                [
                  ["About", "/about"],
                  ["Contact", "/contact"],
                  ["My account", "/account"],
                ] as const
              ).map(([n, u]) => (
                <DialogPrimitive.Close asChild key={u}>
                  <Link
                    to={u}
                    className="flex items-center justify-between py-3 text-base font-semibold border-b border-line"
                  >
                    {n} <ArrowRight size={16} className="text-muted-foreground" />
                  </Link>
                </DialogPrimitive.Close>
              ))}
            </div>
          </nav>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function Header({ onSearch, onCart }: { onSearch: () => void; onCart: () => void }) {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const items = useCartItems();
  const count = cartCount(items);
  const close = () => setOpenGroup(null);
  return (
    <header
      className="sticky top-0 z-40 bg-paper/90 backdrop-blur-md border-b border-line"
      data-testid="site-header"
    >
      <div className="container-main flex h-16 items-center gap-3 justify-between">
        <div className="flex items-center gap-2 lg:gap-6">
          <button
            type="button"
            className="icon-link lg:hidden -ml-2"
            aria-label="Open menu"
            data-testid="menu-open"
            onClick={() => setMenu(true)}
          >
            <Menu size={22} />
          </button>
          <Link
            to="/"
            className="flex items-center shrink-0"
            aria-label={`${site.name} home`}
            data-testid="logo"
          >
            <Wordmark className="h-[15px] sm:h-[17px] w-auto" />
          </Link>
          <nav className="hidden lg:flex items-center gap-1" aria-label="Primary">
            {NAV.map((g) => (
              <Dropdown
                key={g.testid}
                group={g}
                open={openGroup === g.testid}
                onToggle={() => setOpenGroup(openGroup === g.testid ? null : g.testid)}
                onClose={close}
              />
            ))}
            <Link
              to="/lab-reports"
              data-testid="nav-lab-reports"
              className="h-10 px-3 inline-flex items-center rounded-full text-sm font-semibold hover:bg-tint transition-colors duration-150"
            >
              Lab reports
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-0.5 sm:gap-1">
          <button
            type="button"
            onClick={onSearch}
            aria-label="Search"
            data-testid="search-open"
            className="icon-link lg:flex lg:items-center lg:w-auto lg:min-w-52 lg:h-10 lg:px-4 lg:gap-2 lg:border lg:border-line lg:bg-paper lg:hover:bg-tint lg:text-sm lg:text-muted-foreground"
          >
            <Search size={20} className="lg:size-4" />
            <span className="hidden lg:inline flex-1 text-left">Search peptides</span>
            <kbd className="hidden lg:inline font-mono text-[10px] border border-line rounded px-1 py-0.5">
              Ctrl K
            </kbd>
          </button>
          <Link
            to="/account"
            aria-label="Account"
            className="icon-link hidden sm:grid"
            data-testid="account-link"
          >
            <UserRound size={21} />
          </Link>
          <button
            type="button"
            onClick={onCart}
            aria-label={`Basket, ${count} item${count === 1 ? "" : "s"}`}
            data-testid="cart-open"
            className="icon-link relative -mr-2"
          >
            <ShoppingBag size={21} />
            {count > 0 && (
              <span
                data-testid="cart-badge"
                className="absolute right-0.5 top-0.5 bg-warm text-warm-foreground rounded-full text-[10px] font-bold min-w-[18px] h-[18px] px-1 grid place-items-center tabular"
              >
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
      <MobileMenu open={menu} onOpenChange={setMenu} />
    </header>
  );
}
