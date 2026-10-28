import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

// Public browser key, restricted by HTTP referrer to vyraxlabs.co.uk. Not a secret.
const KEY = (import.meta as unknown as { env?: Record<string, string> }).env?.[
  "VITE_GOOGLE_PLACES_KEY"
];

type Sug = { placeId: string; main: string; secondary: string };
export type Resolved = { address: string; address2: string; city: string; postcode: string };
type Props = React.ComponentProps<typeof Input> & {
  value: string;
  onValue: (v: string) => void;
  onResolve: (a: Resolved) => void;
};

const token = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

/** UK address typeahead (Google Places API New). Falls back to a plain input if no key or any failure. */
export function AddressAutocomplete({ value, onValue, onResolve, onChange: _c, ...rest }: Props) {
  const [sugs, setSugs] = useState<Sug[]>([]);
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const tok = useRef(token());
  const timer = useRef<number | undefined>(undefined);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const f = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", f);
    return () => document.removeEventListener("mousedown", f);
  }, [open]);

  const search = useCallback((q: string) => {
    window.clearTimeout(timer.current);
    if (!KEY || q.trim().length < 3) {
      setSugs([]);
      setOpen(false);
      return;
    }
    timer.current = window.setTimeout(async () => {
      try {
        const r = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Goog-Api-Key": KEY },
          body: JSON.stringify({
            input: q,
            sessionToken: tok.current,
            includedRegionCodes: ["gb"],
          }),
        });
        if (!r.ok) throw new Error(String(r.status));
        const j = await r.json();
        const out: Sug[] = (j.suggestions ?? [])
          .filter((s: { placePrediction?: unknown }) => s.placePrediction)
          .map(
            (s: {
              placePrediction: {
                placeId: string;
                text?: { text?: string };
                structuredFormat?: {
                  mainText?: { text?: string };
                  secondaryText?: { text?: string };
                };
              };
            }) => ({
              placeId: s.placePrediction.placeId,
              main:
                s.placePrediction.structuredFormat?.mainText?.text ??
                s.placePrediction.text?.text ??
                "",
              secondary: s.placePrediction.structuredFormat?.secondaryText?.text ?? "",
            }),
          );
        setSugs(out);
        setOpen(out.length > 0);
        setHi(0);
      } catch {
        setSugs([]);
        setOpen(false);
      }
    }, 250);
  }, []);

  const pick = useCallback(
    async (s: Sug) => {
      setOpen(false);
      onValue(s.main);
      try {
        const r = await fetch(
          `https://places.googleapis.com/v1/places/${encodeURIComponent(s.placeId)}?sessionToken=${encodeURIComponent(tok.current)}`,
          { headers: { "X-Goog-Api-Key": KEY ?? "", "X-Goog-FieldMask": "addressComponents" } },
        );
        if (!r.ok) throw new Error(String(r.status));
        const j = await r.json();
        const comps: { longText?: string; shortText?: string; types?: string[] }[] =
          j.addressComponents ?? [];
        const get = (...t: string[]) => comps.find((c) => c.types?.some((x) => t.includes(x)));
        const num = get("street_number")?.shortText ?? "";
        const route = get("route")?.longText ?? "";
        const sub = get("subpremise")?.longText ?? "";
        const prem = get("premise")?.longText ?? "";
        let a1 = s.main;
        if (num && route) a1 = prem ? `${prem}, ${num} ${route}` : `${num} ${route}`;
        else if (prem && route) a1 = `${prem}, ${route}`;
        else if (route) a1 = route;
        onResolve({
          address: a1,
          address2: sub,
          city: get("postal_town")?.longText ?? get("locality")?.longText ?? "",
          postcode: get("postal_code")?.longText ?? "",
        });
      } catch {
        /* keep the optimistic line 1; customer completes the rest by hand */
      } finally {
        tok.current = token();
      }
    },
    [onResolve, onValue],
  );

  return (
    <div ref={root} className="relative">
      <Input
        {...rest}
        value={value}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        onChange={(e) => {
          onValue(e.target.value);
          search(e.target.value);
        }}
        onFocus={() => sugs.length > 0 && setOpen(true)}
        onKeyDown={(e) => {
          if (!open || !sugs.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHi((h) => Math.min(h + 1, sugs.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHi((h) => Math.max(h - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            void pick(sugs[hi]!);
          } else if (e.key === "Escape") setOpen(false);
        }}
      />
      {open && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-xl border border-line bg-white shadow-lg"
        >
          {sugs.map((s, i) => (
            <li
              key={s.placeId}
              role="option"
              aria-selected={i === hi}
              onMouseDown={(e) => {
                e.preventDefault();
                void pick(s);
              }}
              onMouseEnter={() => setHi(i)}
              className={`cursor-pointer border-b border-line px-3 py-2.5 last:border-b-0 ${i === hi ? "bg-paper" : ""}`}
            >
              <div className="text-sm text-ink">{s.main}</div>
              {s.secondary && <div className="text-xs text-muted-foreground">{s.secondary}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
