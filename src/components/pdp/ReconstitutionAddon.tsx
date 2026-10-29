import { addCart, getCompound, readCart } from "@/lib/catalog";
import { useEffect, useState } from "react";

/**
 * Reconstitution cross-sell under the buy button.
 *
 * Only shown on lyophilised powder vials: a supply product or a ready-made liquid has nothing to
 * reconstitute, so the nudge would be wrong there. State is derived from the basket rather than
 * local state so it stays correct if the drawer removes the line.
 */
const BAC_SLUG = "bacteriostatic-water";

export function ReconstitutionAddon({ show }: { show: boolean }) {
  const [inBasket, setInBasket] = useState(false);

  useEffect(() => {
    const sync = () => setInBasket(readCart().some((i) => i.slug === BAC_SLUG));
    sync();
    window.addEventListener("vyrax-cart", sync);
    return () => window.removeEventListener("vyrax-cart", sync);
  }, []);

  if (!show) return null;

  const bac = getCompound(BAC_SLUG);
  const strength = bac?.strengths[0];
  if (!bac || !strength) return null;

  const add = () =>
    addCart({ slug: bac.slug, name: bac.name, strength: strength.label, price: strength.price, quantity: 1 });

  return (
    <div
      data-testid="reconstitution-addon"
      className="mt-3 flex items-center justify-between gap-3 rounded-[16px] border border-[#040825]/10 bg-white/60 px-4 py-3"
    >
      <div className="min-w-0">
        <p className="text-[13px] font-bold text-[#040825]">
          Needed for reconstitution: Bacteriostatic Water 10ml
        </p>
        <p className="text-[12px] text-[#040825]/60">£{strength.price.toFixed(2)} · sterile, with 0.9% benzyl alcohol</p>
      </div>
      {inBasket ? (
        <span className="shrink-0 rounded-full bg-[#040825]/8 px-3 py-1.5 text-[12px] font-bold text-[#040825]/60">
          Added
        </span>
      ) : (
        <button
          type="button"
          onClick={add}
          className="shrink-0 rounded-full bg-[#040825] px-4 py-2 text-[12px] font-bold text-[#F5F0E5] transition-opacity hover:opacity-90"
        >
          Add £{strength.price.toFixed(2)}
        </button>
      )}
    </div>
  );
}
