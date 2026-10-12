import { gbp } from "@/lib/catalog";
import type { PackOption } from "@/lib/pdp-packs";
import { cn } from "@/lib/utils";

/**
 * Pack picker as a radiogroup of rows. Keyboard: arrows move, space/enter select (native radios
 * inside labels, visually hidden). Prices come from the basket pricing helper, so a row never
 * promises a figure the basket will not reproduce.
 */
export function PackPicker({
  options,
  value,
  onChange,
  strengthLabel,
}: {
  options: PackOption[];
  value: number;
  onChange: (count: number) => void;
  strengthLabel: string;
}) {
  const showPacks = options.some((o) => o.count > 1 && o.savePct > 0);
  const rows = showPacks ? options : options.filter((o) => o.count === 1);
  if (rows.length < 2) return null;
  return (
    <fieldset className="mt-6 min-w-0">
      <legend className="text-xs font-bold tracking-[0.08em] mb-2.5">PACK</legend>
      <div
        role="radiogroup"
        aria-label="Pack"
        data-testid="product-pack-options"
        data-layout="rows"
        className="flex flex-col gap-2"
      >
        {rows.map((o) => {
          const checked = o.count === value;
          return (
            <label
              key={o.count}
              data-testid="pack-option"
              data-pack-count={o.count}
              data-checked={checked}
              className={cn(
                "flex items-center gap-3 rounded-2xl border px-4 py-3 cursor-pointer transition-colors duration-150",
                checked ? "border-foreground bg-tint" : "border-border hover:bg-tint/60",
              )}
            >
              <input
                type="radio"
                name="pack"
                value={o.count}
                checked={checked}
                onChange={() => onChange(o.count)}
                className="sr-only"
              />
              <span
                aria-hidden
                className={cn(
                  "size-4 rounded-full border-2 shrink-0 transition-colors",
                  checked ? "border-foreground bg-foreground" : "border-border",
                )}
              />
              <span className="flex-1 min-w-0 text-sm">
                <span className="font-semibold">{o.label}</span>{" "}
                <span className="text-muted-foreground">
                  {o.count === 1 ? strengthLabel : `${o.count} x ${strengthLabel}`}
                </span>
                {o.savePct > 0 && (
                  <span
                    data-testid="pack-save"
                    className="ml-2 inline-block rounded-full bg-[var(--warm,#AC4821)] text-white text-[11px] font-bold px-2 py-0.5 align-middle"
                  >
                    Save {o.savePct}%
                  </span>
                )}
              </span>
              <span className="text-right text-sm tabular-nums">
                <span className="font-semibold block">{gbp(o.total)}</span>
                {o.count > 1 && (
                  <span className="text-muted-foreground text-xs">{gbp(o.perVial)} a vial</span>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
