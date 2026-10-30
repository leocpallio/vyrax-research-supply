import { priceBasket, productImage, type CartItem } from "@/lib/catalog";
import { readPromo } from "@/lib/promo-client";
import { site } from "@/data/site";

type Step = { id: string; label: string; at: number; kind: "delivery" | "gift" | "pct"; pct?: number };

/** The ladder exactly as the basket applies it: delivery, gift, then spend tiers ascending. */
function ladder(): Step[] {
  const gift = site.firstOrderGift;
  const out: Step[] = [{ id: "delivery", label: "Free delivery", at: site.freeDeliveryThreshold, kind: "delivery" }];
  if (gift) out.push({ id: "gift", label: "Free Bac Water", at: gift.over, kind: "gift" });
  for (const t of [...site.spendTiers].sort((a, b) => a.over - b.over)) {
    out.push({ id: `pct-${t.over}`, label: `${Math.round(t.rate * 100)}% off`, at: t.over, kind: "pct", pct: Math.round(t.rate * 100) });
  }
  return out.sort((a, b) => a.at - b.at);
}

function blurb(s: Step) {
  return s.kind === "pct" ? `${s.pct}% off` : s.kind === "gift" ? `a free ${site.firstOrderGift?.short ?? "gift"}` : "free 24-hour delivery";
}

export function TierRail({ items }: { items: CartItem[] }) {
  const goods = priceBasket(items, readPromo()).goods;
  const steps = ladder();
  const next = steps.find((s) => goods < s.at) ?? null;
  const reached = steps.filter((s) => goods >= s.at).length;
  const money = (n: number) => `£${n.toFixed(2)}`;

  return (
    <div className="border-b border-line bg-[#faf6ef] px-5 pb-4 pt-3" data-testid="delivery-ladder">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-semibold leading-snug" data-testid="delivery-ladder-label">
          {next ? (items.length ? `Add ${money(next.at - goods)} for ${blurb(next)}` : `${money(next.at)} unlocks free delivery`) : "Every reward unlocked"}
        </p>
        <span className="shrink-0 pt-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#AC4821]">Your tiers</span>
      </div>

      <ol className="mt-3 grid gap-1" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((s, i) => (
          <li key={s.id} className="text-center">
            <span className={`block h-[3px] rounded-full ${i < reached ? "bg-[#AC4821]" : "bg-[#040825]/12"}`} />
            <span className="mt-1.5 block text-[9px] leading-tight text-[#040825]/60">{s.label}</span>
            <span className="block text-[9px] font-semibold text-[#040825]">£{s.at}</span>
          </li>
        ))}
      </ol>

      <Reward key={next ? next.id : "ready"} step={next} />
    </div>
  );
}

function Reward({ step }: { step: Step | null }) {
  if (!step) {
    return (
      <div className="reward-in mt-4 text-center">
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#AC4821]">Your basket is ready</p>
        <p className="mt-2 font-heading text-[1.15rem] font-black leading-tight text-[#040825]">Happy researching.</p>
      </div>
    );
  }
  if (step.kind === "pct") {
    return (
      <div className="reward-in mt-4 rounded-2xl bg-[#f2ece0] py-5 text-center">
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#AC4821]">At £{step.at}</p>
        <p className="mt-1 text-[2rem] font-black leading-none tracking-[-0.03em]">
          <span className="text-[#040825]">{step.pct}%</span> <span className="text-[#AC4821]">off</span>
        </p>
      </div>
    );
  }
  const gift = site.firstOrderGift;
  if (!gift) return null;
  const img = productImage(gift.slug, gift.strength);
  return (
    <div className="reward-in mt-4 rounded-2xl bg-[#0A1633] px-4 py-4 text-center">
      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#AC4821]">Once you pay £{step.at}</p>
      <div className="mx-auto mt-2 flex h-[74px] w-[70px] items-center justify-center rounded-xl bg-[#FAF6EF]">
        <img src={img.src} alt="" className="h-[64px] w-auto object-contain" />
      </div>
      <p className="mt-2 text-[11px] font-semibold text-[#FAF6EF]">1× {gift.label}</p>
      <p className="mt-0.5">
        <s className="text-[10px] text-[#FAF6EF]/40">£{gift.value.toFixed(2)}</s>{" "}
        <span className="text-[13px] font-black text-[#AC4821]">FREE</span>
      </p>
    </div>
  );
}
