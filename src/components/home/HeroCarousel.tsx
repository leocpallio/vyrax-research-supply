import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import slidesJson from "@/assets/home/hero/slides.json";

// Full-bleed hero carousel. Slide art lives in src/assets/home/hero/ (slides.json lists it).
// Copy is shared across slides; only the kicker label and image change.

type SlideDef = {
  file: string;
  mobile?: string;
  kicker: string;
  alt: string;
  backdrop?: string;
  scrim?: string;
};

const urls = {
  ...import.meta.glob("/src/assets/home/hero/*.webp", {
    eager: true,
    query: "?url",
    import: "default",
  }),
  ...import.meta.glob("/src/assets/home/*.webp", { eager: true, query: "?url", import: "default" }),
} as Record<string, string>;

const resolve = (f?: string) =>
  f ? (urls[`/src/assets/home/hero/${f}`] ?? urls[`/src/assets/home/${f}`]) : undefined;

const slides = (
  Array.isArray(slidesJson)
    ? (slidesJson as SlideDef[])
    : (slidesJson as { slides: SlideDef[] }).slides
)
  .map((s) => ({ ...s, src: resolve(s.file), msrc: resolve(s.mobile) }))
  .filter((s): s is typeof s & { src: string } => !!s.src);

const INTERVAL = 6000;

export function HeroCarousel({
  eyebrow,
  lead,
  accent,
  sub,
  cta,
  link,
  offer,
}: {
  eyebrow: string;
  lead: string;
  accent: string;
  sub: string;
  cta: { label: string; to: string };
  link: { label: string; to: string };
  offer?: { label: string; to: string } | null | undefined;
}) {
  const n = slides.length;
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const touch = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const f = () => setReduced(mq.matches);
    f();
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, []);

  const go = useCallback((k: number) => setI(((k % n) + n) % n), [n]);

  useEffect(() => {
    if (reduced || paused || n < 2) return;
    const t = window.setTimeout(() => go(i + 1), INTERVAL);
    return () => window.clearTimeout(t);
  }, [i, paused, reduced, n, go]);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") go(i - 1);
    else if (e.key === "ArrowRight") go(i + 1);
  };

  const arrow =
    "absolute top-1/2 -translate-y-1/2 z-20 hidden lg:grid size-11 place-items-center rounded-full bg-white/14 text-white ring-1 ring-white/30 backdrop-blur hover:bg-white/28 focus-visible:outline-2 focus-visible:outline-white";

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured research peptides"
      data-testid="hero-carousel"
      onKeyDown={onKey}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
      }}
      onPointerDown={(e) => {
        if (e.pointerType !== "mouse") touch.current = e.clientX;
      }}
      onPointerUp={(e) => {
        if (touch.current == null) return;
        const dx = e.clientX - touch.current;
        touch.current = null;
        if (Math.abs(dx) > 50) go(i + (dx < 0 ? 1 : -1));
      }}
      className="relative isolate overflow-hidden bg-[#0B1B3B] text-white h-auto lg:h-[clamp(580px,56.25vw,880px)] w-full"
      style={{ touchAction: "pan-y" }}
    >
      {slides.map((s, k) => (
        <div
          key={s.file + k}
          aria-hidden={k !== i}
          aria-roledescription="slide"
          aria-label={`${k + 1} of ${n}`}
          className={`absolute inset-0 ${reduced ? "" : "transition-opacity duration-700"} ${
            k === i ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          style={{ background: s.backdrop ?? s.scrim ?? "#0B1B3B" }}
        >
          <picture>
            {s.msrc && <source media="(max-width: 1023px)" srcSet={s.msrc} />}
            <img
              src={s.src}
              alt={s.alt}
              width={1920}
              height={1080}
              loading={k === 0 ? "eager" : "lazy"}
              fetchPriority={k === 0 ? "high" : "auto"}
              decoding={k === 0 ? "sync" : "async"}
              className="absolute inset-x-0 top-[-20vw] h-auto w-full lg:top-0 lg:inset-0 lg:size-full object-cover lg:object-[72%_50%]"
            />
          </picture>
        </div>
      ))}

      {/* scrims: left-to-right on desktop, bottom-up + overall on mobile */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(to_top,rgba(11,27,59,0.97)_0%,rgba(11,27,59,0.9)_40%,rgba(11,27,59,0)_58%)] lg:bg-[linear-gradient(to_right,rgba(11,27,59,0.94)_0%,rgba(11,27,59,0.86)_30%,rgba(11,27,59,0.4)_48%,rgba(11,27,59,0)_62%)]"
      />

      <div className="container-main relative z-20 flex lg:h-full items-end lg:items-center pt-[calc(min(100vw,1023px)*0.80)] pb-16 lg:pt-0 lg:pb-0">
        <div className="max-w-[560px]">
          <p className="flex items-center gap-2 font-mono text-[11px] lg:text-[12px] uppercase tracking-[0.14em] text-white/85">
            <span className="size-1.5 shrink-0 bg-[#5B8DEF]" />
            <span>{eyebrow}</span>
          </p>
          <p
            data-testid="hero-slide-kicker"
            className="mt-2 font-mono text-[11px] lg:text-[12px] uppercase tracking-[0.14em] text-[#8FB0F5]"
          >
            {String(i + 1).padStart(2, "0")} / {slides[i]?.kicker}
          </p>
          <h1
            data-testid="hero-title"
            className="mt-4 font-heading font-semibold tracking-[-0.045em] leading-[0.98] text-[40px] sm:text-[52px] lg:text-[68px]"
          >
            {lead}{" "}
            <em className="font-normal italic tracking-[-0.03em] text-[#8FB0F5]">{accent}</em>
          </h1>
          <p className="mt-4 lg:mt-5 text-[15px] lg:text-[18px] leading-[1.55] text-white/90 max-w-[480px]">
            {sub}
          </p>
          <div className="mt-6 lg:mt-7 flex flex-wrap items-center gap-3">
            <Link
              to={cta.to as "/"}
              data-testid="hero-cta"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-[#5B8DEF] px-6 text-[15px] font-semibold text-[#0B1B3B] hover:bg-[#8FB0F5]"
            >
              {cta.label} <ArrowRight size={16} />
            </Link>
            <Link
              to={link.to as "/"}
              data-testid="hero-lab-reports"
              className="inline-flex h-12 items-center rounded-full px-6 text-[15px] font-semibold text-white ring-1 ring-white/45 hover:bg-white/10"
            >
              {link.label}
            </Link>
          </div>
          {offer ? (
            <Link
              to={offer.to as "/"}
              data-testid="hero-offer"
              className="mt-5 hidden sm:inline-flex items-center gap-3 rounded-[10px] bg-white/12 ring-1 ring-white/25 pl-1.5 pr-3 py-1.5 text-[13.5px] hover:bg-white/20"
            >
              <span className="rounded-[7px] bg-[#AC4821] px-2 py-1 font-mono text-[10.5px] uppercase tracking-[0.1em] text-white">
                Offer
              </span>
              <span className="font-semibold">{offer.label}</span>
              <ArrowRight size={14} />
            </Link>
          ) : null}
        </div>
      </div>

      {n > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => go(i - 1)}
            className={`${arrow} left-4`}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => go(i + 1)}
            className={`${arrow} right-4`}
          >
            <ChevronRight size={20} />
          </button>
          <div className="absolute bottom-4 lg:bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1">
            {slides.map((s, k) => (
              <button
                key={s.file + k}
                type="button"
                aria-label={`Go to slide ${k + 1}`}
                aria-current={k === i ? "true" : undefined}
                onClick={() => go(k)}
                className="grid h-6 w-6 place-items-center"
              >
                <span
                  className={`block h-2 rounded-full transition-all ${
                    k === i ? "w-6 bg-white" : "w-2 bg-white/50"
                  }`}
                />
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
