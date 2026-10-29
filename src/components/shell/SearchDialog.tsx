import { useNavigate } from "@tanstack/react-router";
import { useEffect, useId, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Search, X, ArrowRight } from "lucide-react";
import {
  fromPrice,
  gbp,
  getCategory,
  productImage,
  productPath,
  searchCompounds,
  featured,
  type Compound,
} from "@/lib/catalog";
import { capture } from "@/lib/analytics";

export function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const navigate = useNavigate();
  const typed = q.trim().length >= 2;
  const matches: Compound[] = typed ? searchCompounds(q, 8) : featured.slice(0, 6);
  useEffect(() => {
    if (!open) {
      setQ("");
      setActive(0);
    }
  }, [open]);
  // Cmd/Ctrl+K opens search from anywhere.
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [onOpenChange]);
  const report = () => {
    if (typed) capture("search", { source: "header", result_count: matches.length });
  };
  const go = (c?: Compound) => {
    report();
    if (c) navigate({ to: productPath(c.slug) });
    else if (typed) navigate({ to: "/shop", search: { q: q.trim() } });
    onOpenChange(false);
  };
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[80] bg-ink/50 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          data-testid="search-dialog"
          className="fixed z-[81] inset-x-3 top-3 sm:inset-x-auto sm:left-1/2 sm:top-[10vh] sm:w-full sm:max-w-xl sm:-translate-x-1/2 rounded-[20px] bg-paper border border-line shadow-2xl overflow-hidden outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-2 duration-200"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
        >
          <DialogPrimitive.Title className="sr-only">Search peptides</DialogPrimitive.Title>
          <div className="flex items-center gap-3 px-4 h-14 border-b border-line">
            <Search className="size-5 text-muted-foreground shrink-0" aria-hidden />
            <input
              ref={inputRef}
              data-testid="search-input"
              role="combobox"
              aria-label="Search peptides"
              aria-autocomplete="list"
              aria-expanded={matches.length > 0}
              aria-controls={listId}
              aria-activedescendant={matches[active] ? `${listId}-${active}` : undefined}
              value={q}
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
                  go(matches[active]);
                }
              }}
              placeholder="Search peptides, e.g. BPC-157"
              className="flex-1 min-w-0 bg-transparent outline-none text-base placeholder:text-muted-foreground"
              autoComplete="off"
              spellCheck={false}
            />
            <DialogPrimitive.Close
              className="icon-link -mr-2"
              aria-label="Close search"
              data-testid="search-close"
            >
              <X size={20} />
            </DialogPrimitive.Close>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            <p className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {typed ? `${matches.length} result${matches.length === 1 ? "" : "s"}` : "Popular"}
            </p>
            <div id={listId} role="listbox" aria-label="Matching compounds" className="pb-2">
              {matches.map((c, n) => {
                const img = productImage(c.slug);
                return (
                  <a
                    key={c.slug}
                    id={`${listId}-${n}`}
                    role="option"
                    aria-selected={n === active}
                    href={productPath(c.slug)}
                    data-testid="search-result"
                    onMouseEnter={() => setActive(n)}
                    onClick={(e) => {
                      e.preventDefault();
                      go(c);
                    }}
                    className={`flex items-center gap-3 mx-2 px-2 py-2 rounded-xl text-sm transition-colors duration-150 ${n === active ? "bg-tint" : ""}`}
                  >
                    <img
                      src={img.small ?? img.src}
                      alt=""
                      width={44}
                      height={44}
                      className="size-11 rounded-lg object-contain bg-white"
                    />
                    <span className="flex-1 min-w-0">
                      <span className="block font-semibold truncate">{c.name}</span>
                      <span className="block text-xs text-muted-foreground truncate">
                        {c.strengths.map((s) => s.label).join(" / ")}
                        {getCategory(c.category) ? ` / ${getCategory(c.category)?.name}` : ""}
                      </span>
                    </span>
                    <span className="tabular text-xs font-medium whitespace-nowrap">
                      from {gbp(fromPrice(c))}
                    </span>
                  </a>
                );
              })}
              {typed && matches.length === 0 && (
                <p className="px-4 py-3 text-sm text-muted-foreground" data-testid="search-empty">
                  No matching compounds. Try an alias such as "bac water" or a category.
                </p>
              )}
            </div>
          </div>
          {typed && (
            <button
              type="button"
              onClick={() => go()}
              data-testid="search-see-all"
              className="w-full flex items-center justify-between px-4 h-12 text-sm font-semibold border-t border-line hover:bg-tint transition-colors duration-150"
            >
              See all results for "{q.trim()}"
              <ArrowRight size={16} />
            </button>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
