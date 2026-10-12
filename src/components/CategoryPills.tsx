import { ArrowUpDown, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { shopSections } from "@/data/shop-sections";
import { categories } from "@/data/categories";

export type Pill = { name: string; href: string; active?: boolean };

export const sectionPills = (activeSlug?: string): Pill[] => [
  { name: "All", href: "/shop", active: activeSlug === undefined },
  ...shopSections.map((s) => ({
    name: s.name,
    href: `/collections/${s.slug}`,
    active: s.slug === activeSlug,
  })),
];

export const categoryPills = (activeSlug: string): Pill[] => [
  { name: "All", href: "/shop" },
  ...categories.map((c) => ({
    name: c.name,
    href: `/category/${c.slug}`,
    active: c.slug === activeSlug,
  })),
];

export type SortKey = "featured" | "price-asc" | "price-desc" | "name";
export const SORTS: { key: SortKey; label: string }[] = [
  { key: "featured", label: "Featured" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
  { key: "name", label: "Name A to Z" },
];

export function SortButton({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (k: SortKey) => void;
}) {
  const current = SORTS.find((s) => s.key === value) ?? SORTS[0]!;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-testid="sort-button"
          aria-label={`Sort products, currently ${current.label}`}
          className="shrink-0 inline-flex items-center gap-2 h-9 px-3.5 rounded-full border border-[#040825]/15 bg-[#F5F0E5] text-sm font-medium hover:bg-[#EAE6DC] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#040825]"
        >
          <ArrowUpDown size={14} />
          <span className="hidden sm:inline">{current.label}</span>
          <span className="sm:hidden">Sort</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="rounded-2xl border-[#040825]/10 bg-[#F5F0E5] p-1.5 min-w-48"
      >
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onChange(v as SortKey)}>
          {SORTS.map((s) => (
            <DropdownMenuRadioItem
              key={s.key}
              value={s.key}
              data-testid={`sort-${s.key}`}
              className="rounded-xl pl-3 pr-8 py-2 text-sm cursor-pointer focus:bg-[#EAE6DC] [&>span]:left-auto [&>span]:right-2"
            >
              {s.label}
              {s.key === value && <Check size={14} className="ml-auto" />}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Horizontal pill row, sticky under the 72px shell header. Plain anchors so each pill is a crawlable link. */
export function CategoryPills({
  items,
  sort,
  onSort,
  label = "Browse by range",
}: {
  items: Pill[];
  sort?: SortKey | undefined;
  onSort?: ((k: SortKey) => void) | undefined;
  label?: string | undefined;
}) {
  return (
    <div
      data-testid="category-pills"
      className="sticky top-[72px] z-30 -mx-5 px-5 bg-[#F5F0E5]/95 backdrop-blur border-b border-[#040825]/10"
    >
      <div className="flex items-center gap-3 py-2.5">
        <nav
          aria-label={label}
          className="flex-1 min-w-0 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((p) => (
            <a
              key={p.href}
              href={p.href}
              data-testid="category-pill"
              aria-current={p.active ? "page" : undefined}
              className={`shrink-0 inline-flex items-center h-9 px-4 rounded-full border text-sm font-medium whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#040825] ${
                p.active
                  ? "bg-[#040825] text-[#F5F0E5] border-[#040825]"
                  : "border-[#040825]/15 text-[#040825] hover:bg-[#EAE6DC]"
              }`}
            >
              {p.name}
            </a>
          ))}
        </nav>
        {sort && onSort && <SortButton value={sort} onChange={onSort} />}
      </div>
    </div>
  );
}
