import { useEffect, useState } from "react";

/**
 * Cut-off countdown under the buy button.
 *
 * Client-side only: the server cannot know the shopper's clock, and a cached page would show a
 * stale number. Until the effect runs it renders a static promise, so there is no layout jump.
 */
const CUTOFF_HOUR = 14; // 2pm UK, matches the announcement bar

/** Copy for the time left before cut-off. Pure so it is testable without a clock. */
export function dispatchText(remainingMs: number | null, weekday?: number): string {
  if (weekday === 0 || weekday === 6) return "Orders placed now are dispatched Monday";
  if (remainingMs === null) return "Order before 2pm for same-day dispatch";
  if (remainingMs <= 0) return "Order now, dispatched tomorrow";
  const h = Math.floor(remainingMs / 3_600_000);
  const m = Math.floor((remainingMs % 3_600_000) / 60_000);
  return `Order within ${h}h ${String(m).padStart(2, "0")}m, dispatched today`;
}

function ukNow(): Date {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
  const d = new Date();
  d.setHours(Number(get("hour")) % 24, Number(get("minute")), 0, 0);
  return d;
}

export function DispatchCountdown({ className = "" }: { className?: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(ukNow());
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  const remaining = (() => {
    if (!now) return null;
    const cutoff = new Date(now);
    cutoff.setHours(CUTOFF_HOUR, 0, 0, 0);
    const ms = cutoff.getTime() - now.getTime();
    return ms > 0 ? ms : 0;
  })();

  return (
    <p
      data-testid="dispatch-countdown"
      className={`flex items-center justify-center gap-1.5 text-[13px] font-semibold text-[#040825]/70 ${className}`}
    >
      <span aria-hidden="true" className="inline-block size-1.5 rounded-full bg-[#AC4821]" />
      {dispatchText(remaining, now?.getDay())}
    </p>
  );
}
