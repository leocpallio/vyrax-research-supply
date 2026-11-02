import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import {
  SYRINGES,
  compute,
  graduations,
  mlToUnits,
  nearestGraduationMl,
  parsePositive,
  round,
  syringeById,
  toMg,
  type MassUnit,
  type SyringeSpec,
} from "@/lib/syringe";
import type { DilutionRecord } from "@/data/reconstitution";

/**
 * Laboratory volumetric measuring tool: vial, diluent, syringe barrel.
 * The user supplies every value. Nothing here suggests or prefills a target mass.
 */

type Option = { slug: string; name: string; strengths: { label: string; amount: number }[] };

const fmt = (n: number, dp = 3) =>
  Number.isFinite(n) ? n.toLocaleString("en-GB", { maximumFractionDigits: dp }) : "-";
const fmtDraw = (n: number, dp: number) =>
  n > 0 && n < 10 ** -dp ? `<${(10 ** -dp).toFixed(dp)}` : fmt(n, dp);

const fmtMass = (mg: number) => (mg < 1 ? `${fmt(mg * 1000, 1)} mcg` : `${fmt(mg, 3)} mg`);

// Syringe geometry in SVG user units. The vial is its own SVG so both can be sized for the hero.
const VB_W = 720;
const VB_H = 196;
const BX0 = 96; // needle end of the barrel (0 ml line)
const BX1 = 640; // capacity line
const BW = BX1 - BX0;
const BY = 78; // barrel top
const BH = 70; // barrel height

// Vial geometry.
const VW = 140;
const VH = 220;
const VIAL_TOP = 64;
const VIAL_BOT = 206;
const VIAL_H = VIAL_BOT - VIAL_TOP;

export function SyringeTool({
  options,
  records,
}: {
  options: Option[];
  records: Record<string, DilutionRecord | undefined>;
}) {
  const uid = useId();
  const [slug, setSlug] = useState("");
  const [vial, setVial] = useState("10");
  const [diluent, setDiluent] = useState("2");
  const [target, setTarget] = useState(""); // deliberately empty: the user supplies the mass
  const [unit, setUnit] = useState<MassUnit>("mg");
  const [syringeId, setSyringeId] = useState<SyringeSpec["id"]>("1");
  const [dragging, setDragging] = useState(false);
  const [swirl, setSwirl] = useState(0);
  const [pour, setPour] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);

  const syringe = syringeById(syringeId) ?? SYRINGES[2]!;
  const record = slug ? records[slug] : undefined;
  const option = options.find((o) => o.slug === slug);
  const blocked = record?.withholdConcentrations
    ? "withheld"
    : record?.readyToUse
      ? "solution"
      : record?.isDiluent
        ? "diluent"
        : null;

  const vialMg = parsePositive(vial);
  const diluentMl = parsePositive(diluent);
  const targetRaw = parsePositive(target);
  const targetMg = targetRaw === null ? null : toMg(targetRaw, unit);

  const r = useMemo(
    () =>
      blocked
        ? null
        : compute({
            vialMg,
            diluentMl,
            targetMg,
            syringe,
            ...(record?.concentrationCeiling ? { ceiling: record.concentrationCeiling } : {}),
          }),
    [blocked, vialMg, diluentMl, targetMg, syringe, record],
  );

  // Swirl once whenever the stock concentration changes.
  const concKey = r ? round(r.mgPerMl, 6) : 0;
  useEffect(() => {
    if (concKey) setSwirl((n) => n + 1);
  }, [concKey]);
  // Pour a stream of diluent into the vial whenever the diluent volume changes.
  const firstPour = useRef(true);
  useEffect(() => {
    if (firstPour.current) {
      firstPour.current = false;
      return;
    }
    if (diluentMl !== null) setPour((n) => n + 1);
  }, [diluentMl]);

  const barrelMl = r?.draw ? Math.min(r.draw.shownMl, syringe.capacityMl) : 0;
  const drawFrac = barrelMl / syringe.capacityMl;
  const plungerX = BX0 + drawFrac * BW;
  const over = r?.warnings.find((w) => w.kind === "over-capacity");

  // ----- plunger interaction: the plunger reads back the mass held at a graduation
  const setFromMl = (ml: number) => {
    if (!r) return;
    const clamped = Math.max(0, Math.min(ml, syringe.capacityMl));
    const snapped = nearestGraduationMl(clamped, syringe);
    const massMg = snapped * r.mgPerMl;
    if (snapped === 0) {
      setTarget("");
      return;
    }
    if (unit === "mcg") setTarget(String(round(massMg * 1000, 3)));
    else setTarget(String(round(massMg, 4)));
  };
  const mlFromPointer = (e: { clientX: number }) => {
    const svg = svgRef.current;
    if (!svg) return 0;
    const box = svg.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * VB_W;
    return ((x - BX0) / BW) * syringe.capacityMl;
  };
  const onPointerDown = (e: ReactPointerEvent<SVGElement>) => {
    if (!r) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setDragging(true);
    setFromMl(mlFromPointer(e));
  };
  const onPointerMove = (e: ReactPointerEvent<SVGElement>) => {
    if (dragging) setFromMl(mlFromPointer(e));
  };
  const endDrag = () => setDragging(false);
  const onKey = (e: KeyboardEvent<SVGElement>) => {
    if (!r) return;
    const cur = r.draw ? Math.min(r.draw.nearestMl, syringe.capacityMl) : 0;
    const step = syringe.minorMl;
    const map: Record<string, number> = {
      ArrowRight: cur + step,
      ArrowUp: cur + step,
      ArrowLeft: cur - step,
      ArrowDown: cur - step,
      PageUp: cur + step * 10,
      PageDown: cur - step * 10,
      Home: 0,
      End: syringe.capacityMl,
    };
    const next = map[e.key];
    if (next === undefined) return;
    e.preventDefault();
    setFromMl(next);
  };

  const ticks = useMemo(() => graduations(syringe), [syringe]);
  const vialCapMl = diluentMl !== null && diluentMl > 3 ? 10 : 3;
  const liquidMl = diluentMl === null ? 0 : Math.min(diluentMl, vialCapMl);
  const drawnMl = r?.draw ? Math.min(r.draw.shownMl, liquidMl) : 0;
  const remainingMl = Math.max(0, liquidMl - drawnMl);
  const level = liquidMl ? remainingMl / vialCapMl : 0;
  const overTone = Boolean(over);
  const drawKey = r?.draw ? round(r.draw.shownMl, 4) : 0;

  const valueText = r?.draw
    ? syringe.unitScale
      ? `${fmt(mlToUnits(barrelMl), 1)} units, ${fmt(barrelMl, 3)} ml`
      : `${fmt(barrelMl, 2)} ml`
    : "Empty";

  return (
    <section
      aria-labelledby={`${uid}-h`}
      className="border border-border rounded-2xl bg-card overflow-hidden"
      data-testid="syringe-tool"
    >
      <div className="px-5 md:px-8 pt-6 md:pt-8">
        <p className="eyebrow">LABORATORY MEASURING TOOL</p>
        <h2 id={`${uid}-h`} className="font-heading text-2xl md:text-3xl font-semibold mt-1">
          Syringe draw-volume calculator
        </h2>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm md:text-base">
          Enter the vial mass, the diluent volume and the target mass you want to measure. The
          barrel shows the draw volume on a real U-100 or ml scale. Drag the plunger, or use the
          arrow keys, to read the mass held at any graduation. For research use only.
        </p>
      </div>

      {/* ---------------- hero diagram: vial + syringe, full width */}
      <div className="px-5 md:px-8 pt-6">
        <div className="rounded-2xl bg-tint/60 border border-border px-3 py-4 md:px-8 md:py-8 flex flex-col md:flex-row md:items-center gap-2 md:gap-8">
          <svg
            viewBox={`0 0 ${VW} ${VH}`}
            className="block h-[132px] md:h-auto md:w-[150px] lg:w-[170px] mx-auto md:mx-0 shrink-0"
            style={{ aspectRatio: `${VW} / ${VH}` }}
            role="img"
            aria-label={
              diluentMl !== null
                ? `Vial: ${fmt(liquidMl, 2)} ml of diluent added, ${fmt(remainingMl, 2)} ml left after the draw`
                : "Vial with lyophilised powder, no diluent added"
            }
          >
            <defs>
              <linearGradient id={`${uid}-vglass`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#dfe5ef" stopOpacity="0.95" />
                <stop offset="0.35" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="1" stopColor="#dfe5ef" stopOpacity="0.95" />
              </linearGradient>
              <linearGradient id={`${uid}-vliquid`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#a7c3f7" />
                <stop offset="1" stopColor="#5B8DEF" />
              </linearGradient>
              <clipPath id={`${uid}-vialclip`}>
                <rect x="24" y={VIAL_TOP} width="92" height={VIAL_H} rx="12" />
              </clipPath>
            </defs>
            {/* diluent stream, replayed on every diluent change */}
            {pour > 0 && (
              <rect
                key={`pour-${pour}`}
                className="vx-pour"
                x="66"
                y="0"
                width="8"
                height={VIAL_BOT - 8}
                rx="4"
                fill="#5B8DEF"
                opacity="0"
              />
            )}
            {/* crimp cap and stopper */}
            <rect x="40" y="22" width="60" height="22" rx="4" fill="#14213D" />
            <rect x="46" y="44" width="48" height="14" fill="#6B7688" />
            <rect
              x="24"
              y={VIAL_TOP - 6}
              width="92"
              height={VIAL_H + 6}
              rx="13"
              fill={`url(#${uid}-vglass)`}
              stroke="#14213D"
              strokeOpacity="0.35"
              strokeWidth="2"
            />
            <g clipPath={`url(#${uid}-vialclip)`}>
              {/* lyophilised cake, fades as diluent goes in */}
              <rect
                x="24"
                y={VIAL_BOT - 22}
                width="92"
                height="22"
                fill="#f4f1ea"
                className="motion-safe:transition-opacity motion-safe:duration-700"
                opacity={diluentMl === null ? 1 : 0}
              />
              <g
                className="motion-safe:transition-transform motion-safe:duration-700 ease-out"
                style={{ transform: `translateY(${VIAL_H * (1 - level)}px)` }}
              >
                <rect
                  x="24"
                  y={VIAL_TOP}
                  width="92"
                  height={VIAL_H}
                  fill={`url(#${uid}-vliquid)`}
                  opacity="0.88"
                />
                <path
                  key={swirl}
                  className="vx-swirl"
                  d={`M24 ${VIAL_TOP + 2} q11.5 -6 23 0 t23 0 t23 0 t23 0 t23 0 v9 h-115z`}
                  fill="#ffffff"
                  opacity="0.4"
                />
              </g>
            </g>
            {/* reflection */}
            <rect
              x="32"
              y={VIAL_TOP + 8}
              width="6"
              height={VIAL_H - 24}
              rx="3"
              fill="#ffffff"
              opacity="0.55"
            />
          </svg>

          <div className="min-w-0 flex-1">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${VB_W} ${VB_H}`}
              className="w-full h-auto block select-none touch-none"
              style={{ aspectRatio: `${VB_W} / ${VB_H}` }}
              role="group"
              aria-label="Laboratory measuring syringe"
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              <defs>
                <linearGradient id={`${uid}-glass`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
                  <stop offset="0.5" stopColor="#eef2f8" stopOpacity="0.9" />
                  <stop offset="1" stopColor="#dfe5ef" stopOpacity="0.95" />
                </linearGradient>
                <linearGradient id={`${uid}-liquid`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#8fb2f4" />
                  <stop offset="1" stopColor="#5B8DEF" />
                </linearGradient>
                <linearGradient id={`${uid}-liquid-over`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#e9b48f" />
                  <stop offset="1" stopColor="#c8693a" />
                </linearGradient>
                <clipPath id={`${uid}-barrel`}>
                  <rect x={BX0} y={BY + 3} width={BW} height={BH - 6} rx="3" />
                </clipPath>
              </defs>

              {/* needle and hub; liquid runs along it on each new draw */}
              <g aria-hidden="true">
                <rect x="8" y={BY + BH / 2 - 1.5} width="72" height="3" fill="#6B7688" />
                {drawKey > 0 && (
                  <line
                    key={`flow-${drawKey}`}
                    className="vx-flow"
                    x1="8"
                    x2="80"
                    y1={BY + BH / 2}
                    y2={BY + BH / 2}
                    stroke="#5B8DEF"
                    strokeWidth="3"
                    strokeDasharray="10 8"
                  />
                )}
                <rect
                  x="78"
                  y={BY + BH / 2 - 10}
                  width="18"
                  height="20"
                  rx="3"
                  fill="#c9d1de"
                  stroke="#6B7688"
                  strokeOpacity="0.6"
                />
              </g>

              {/* barrel */}
              <rect
                x={BX0}
                y={BY}
                width={BW}
                height={BH}
                rx="6"
                fill={`url(#${uid}-glass)`}
                stroke={overTone ? "#c8693a" : "#14213D"}
                strokeOpacity={overTone ? 0.9 : 0.45}
                strokeWidth={overTone ? 2.5 : 1.5}
              />
              <g clipPath={`url(#${uid}-barrel)`} aria-hidden="true">
                <rect
                  x={BX0}
                  y={BY + 3}
                  width={BW}
                  height={BH - 6}
                  fill={`url(#${uid}-${overTone ? "liquid-over" : "liquid"})`}
                  opacity="0.85"
                  className={
                    dragging
                      ? ""
                      : "motion-safe:transition-transform motion-safe:duration-500 ease-out"
                  }
                  style={{
                    transform: `scaleX(${drawFrac})`,
                    transformBox: "fill-box",
                    transformOrigin: "left center",
                  }}
                />
              </g>
              {/* graduations, printed on the barrel like a real syringe */}
              <g aria-hidden="true">
                {ticks.map((t) => {
                  const x = BX0 + t.frac * BW;
                  const len = t.major ? 24 : t.mid ? 16 : 9;
                  return (
                    <g key={t.k}>
                      <line
                        x1={x}
                        x2={x}
                        y1={BY}
                        y2={BY + len}
                        stroke="#14213D"
                        strokeWidth={t.major ? 1.6 : 0.9}
                      />
                      {t.label && (
                        <text
                          x={x}
                          y={BY - 10}
                          textAnchor="middle"
                          fontSize="17"
                          className="vx-scale-num fill-[#14213D] font-mono"
                        >
                          {t.label}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>

              {/* plunger: stopper + rod + thumb press. The slider for keyboard and AT. */}
              <g
                role="slider"
                tabIndex={r ? 0 : -1}
                aria-label="Plunger position"
                aria-valuemin={0}
                aria-valuemax={
                  syringe.unitScale ? mlToUnits(syringe.capacityMl) : syringe.capacityMl
                }
                aria-valuenow={syringe.unitScale ? mlToUnits(barrelMl) : barrelMl}
                aria-valuetext={valueText}
                aria-disabled={!r}
                onKeyDown={onKey}
                onPointerDown={onPointerDown}
                className={`${r ? "cursor-ew-resize" : "cursor-not-allowed"} outline-none focus-visible:[&_.vx-stopper]:stroke-[#5B8DEF] focus-visible:[&_.vx-stopper]:stroke-[3]`}
              >
                <g
                  className={
                    dragging
                      ? ""
                      : "motion-safe:transition-transform motion-safe:duration-500 ease-out"
                  }
                  style={{ transform: `translateX(${plungerX - BX0}px)` }}
                >
                  {/* generous invisible hit area for touch */}
                  <rect
                    x={BX0 - 18}
                    y={BY - 34}
                    width={VB_W - BX0 + 18}
                    height={BH + 68}
                    fill="transparent"
                  />
                  <rect
                    className="vx-stopper"
                    x={BX0}
                    y={BY + 2}
                    width="16"
                    height={BH - 4}
                    rx="3"
                    fill="#14213D"
                    stroke="#14213D"
                  />
                  <rect
                    x={BX0 + 16}
                    y={BY + BH / 2 - 6}
                    width={BW + 30}
                    height="12"
                    fill="#6B7688"
                    opacity="0.8"
                  />
                  <rect
                    x={BX0 + BW + 44}
                    y={BY - 14}
                    width="13"
                    height={BH + 28}
                    rx="4"
                    fill="#14213D"
                  />
                </g>
              </g>
              <rect
                x={BX1 + 2}
                y={BY - 6}
                width="10"
                height={BH + 12}
                rx="3"
                fill={overTone ? "#c8693a" : "#14213D"}
                opacity="0.9"
                aria-hidden="true"
                className={overTone ? "vx-pulse" : ""}
              />

              {/* callout at the draw line */}
              {r?.draw && !over && (
                <g
                  aria-hidden="true"
                  className={
                    dragging
                      ? ""
                      : "motion-safe:transition-transform motion-safe:duration-500 ease-out"
                  }
                  style={{ transform: `translateX(${plungerX - BX0}px)` }}
                >
                  <line
                    x1={BX0}
                    x2={BX0}
                    y1={BY + BH}
                    y2={BY + BH + 8}
                    stroke="#5B8DEF"
                    strokeWidth="2.5"
                  />
                  <polygon
                    points={`${BX0 - 7},${BY + BH + 38} ${BX0 + 7},${BY + BH + 38} ${BX0},${BY + BH + 30}`}
                    fill="#5B8DEF"
                  />
                </g>
              )}
            </svg>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs md:text-sm text-muted-foreground md:pl-[13%]">
              <span>Laboratory measuring syringe, {syringe.label}</span>
              <span>{syringe.unitScale ? "U-100 units (100 per ml)" : "ml scale"}</span>
            </div>
            <p
              className={`mt-2 min-h-8 md:pl-[13%] ${over && r?.draw ? "" : "invisible"}`}
              aria-hidden="true"
              data-testid="syringe-over-badge"
            >
              <span className="inline-block rounded-full bg-[#a4512a] text-white text-xs md:text-sm font-semibold px-3 py-1.5">
                {over && r?.draw
                  ? `Needs ${fmt(r.draw.ml, 3)} ml, barrel holds ${fmt(syringe.capacityMl, 2)} ml`
                  : "Within capacity"}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-6 md:gap-8 p-5 md:p-8">
        {/* ---------------- inputs */}
        <div className="space-y-5">
          <label className="block">
            <span className="text-sm font-semibold">Compound (optional)</span>
            <select
              className="mt-2 w-full h-11 border border-border rounded-md px-3 bg-background"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                const o = options.find((x) => x.slug === e.target.value);
                if (o?.strengths[0]) setVial(String(o.strengths[0].amount));
              }}
            >
              <option value="">Any compound</option>
              {options.map((o) => (
                <option key={o.slug} value={o.slug}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>

          <Field
            id={`${uid}-vial`}
            label="Vial mass"
            suffix="mg"
            value={vial}
            onChange={setVial}
            invalid={vialMg === null}
          >
            {option && option.strengths.length > 1 && (
              <Chips
                label="Vial strengths"
                items={option.strengths.map((s) => ({
                  key: s.label,
                  text: s.label,
                  value: String(s.amount),
                }))}
                current={vial}
                onPick={setVial}
              />
            )}
          </Field>

          <Field
            id={`${uid}-dil`}
            label="Diluent added"
            suffix="ml"
            value={diluent}
            onChange={setDiluent}
            invalid={diluentMl === null}
          >
            <Chips
              label="Diluent volumes"
              items={[1, 2, 2.5, 3, 5].map((v) => ({
                key: String(v),
                text: `${v} ml`,
                value: String(v),
              }))}
              current={diluent}
              onPick={setDiluent}
            />
          </Field>

          <div>
            <label htmlFor={`${uid}-target`} className="text-sm font-semibold">
              Target mass to measure
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id={`${uid}-target`}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="Enter a mass"
                aria-invalid={target !== "" && targetRaw === null}
                aria-describedby={`${uid}-target-hint`}
                className="flex-1 min-w-0 h-11 rounded-md border border-input bg-background px-3 font-mono"
              />
              <div
                role="radiogroup"
                aria-label="Mass unit"
                className="flex rounded-md border border-input overflow-hidden"
              >
                {(["mg", "mcg"] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    role="radio"
                    aria-checked={unit === u}
                    onClick={() => {
                      if (u === unit) return;
                      if (targetRaw !== null)
                        setTarget(
                          String(
                            u === "mcg" ? round(targetRaw * 1000, 3) : round(targetRaw / 1000, 6),
                          ),
                        );
                      setUnit(u);
                    }}
                    className={`px-3 min-w-12 text-sm font-semibold ${unit === u ? "bg-primary text-primary-foreground" : "bg-background"}`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
            <p id={`${uid}-target-hint`} className="text-xs text-muted-foreground mt-1 min-h-4">
              {target !== "" && targetRaw === null
                ? "Enter a number greater than zero."
                : "Your own value from your experimental design. The tool does not suggest one."}
            </p>
          </div>

          <fieldset>
            <legend className="text-sm font-semibold">Syringe</legend>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {SYRINGES.map((s) => (
                <label
                  key={s.id}
                  className={`cursor-pointer rounded-md border text-center py-2 text-sm font-semibold has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring ${
                    s.id === syringeId
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background"
                  }`}
                >
                  <input
                    type="radio"
                    name={`${uid}-syr`}
                    value={s.id}
                    checked={s.id === syringeId}
                    onChange={() => setSyringeId(s.id)}
                    className="sr-only"
                  />
                  {s.id} ml
                  <span className="block text-[11px] font-normal opacity-80">
                    {s.unitScale ? `${mlToUnits(s.capacityMl)} units` : "ml scale"}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {/* ---------------- readout */}
        <div className="min-w-0">
          {/* readout: fixed heights so warnings never shift the layout */}
          {blocked ? (
            <div
              className="rounded-xl bg-ink text-ink-foreground p-5 min-h-[248px]"
              data-testid="syringe-blocked"
            >
              <p className="font-semibold">
                {blocked === "withheld"
                  ? `${record?.name}: no validated stock`
                  : blocked === "solution"
                    ? `${record?.name}: supplied as a solution`
                    : `${record?.name} is the diluent`}
              </p>
              <p className="text-sm text-ink-muted mt-2">
                {blocked === "withheld"
                  ? "The reference holds no validated aqueous stock for this compound, so the tool prints no concentration and no draw volume. Use the concentration your own validated preparation measured."
                  : blocked === "solution"
                    ? "There is no reconstitution step. The concentration is printed on the label: the draw volume is the target mass divided by that concentration."
                    : "Bacteriostatic water is the solvent, not something to reconstitute. Pick the compound you are dissolving."}
              </p>
            </div>
          ) : (
            <div
              className="rounded-xl bg-ink text-ink-foreground p-5 min-h-[248px]"
              aria-live="polite"
            >
              <dl className="grid grid-cols-3 gap-3">
                <Stat label="Concentration" value={r ? `${fmt(r.mgPerMl, 3)}` : "-"} unit="mg/ml" />
                <Stat
                  label="Draw volume"
                  value={r?.draw ? fmtDraw(r.draw.ml, 6) : "-"}
                  unit={over ? "ml, over capacity" : "ml"}
                  alert={Boolean(over)}
                />
                <Stat
                  label={syringe.unitScale ? "Units (U-100)" : "Units equiv."}
                  value={r?.draw ? fmtDraw(r.draw.units, 4) : "-"}
                  unit="units"
                />
              </dl>
              <div className="mt-4 text-xs text-ink-muted font-mono space-y-1 min-h-[54px]">
                {r ? (
                  <>
                    <p>
                      {fmt(vialMg ?? 0)} mg ÷ {fmt(diluentMl ?? 0)} ml = {fmt(r.mgPerMl, 4)} mg/ml (
                      {fmt(r.mcgPerMl, 1)} mcg/ml)
                    </p>
                    {r.draw ? (
                      <p>
                        {fmtMass(targetMg ?? 0)} ÷ {fmt(r.mgPerMl, 4)} mg/ml = {fmt(r.draw.ml, 4)}{" "}
                        ml × 100 = {fmt(r.draw.units, 2)} units
                      </p>
                    ) : (
                      <p>
                        One graduation ({fmt(syringe.minorMl, 3)} ml) holds{" "}
                        {fmtMass(r.mgPerGraduation)}.
                      </p>
                    )}
                    {r.draw && !over && Math.abs(r.draw.nearestMl - r.draw.ml) > 1e-9 && (
                      <p>
                        Nearest graduation{" "}
                        {syringe.unitScale
                          ? `${fmt(r.draw.nearestUnits, 1)} units`
                          : `${fmt(r.draw.nearestMl, 2)} ml`}{" "}
                        holds {fmtMass(r.draw.massAtNearestMg)}.
                      </p>
                    )}
                  </>
                ) : (
                  <p>Enter a vial mass and a diluent volume greater than zero.</p>
                )}
              </div>
              <div className="mt-3 min-h-[56px] space-y-2 text-xs">
                {r?.warnings.map((w) =>
                  w.kind === "over-capacity" ? (
                    <div
                      key={w.kind}
                      className="rounded-md bg-[oklch(0.528_0.141_40.2/0.18)] text-[oklch(0.92_0.05_60)] px-3 py-2"
                      role="status"
                      data-testid="syringe-over-capacity"
                    >
                      <p className="font-semibold">
                        Over capacity: {fmt(r.draw?.ml ?? 0, 3)} ml does not fit this{" "}
                        {fmt(syringe.capacityMl, 2)} ml barrel ({fmt(w.excessMl, 3)} ml over).
                      </p>
                      <p className="mt-1">
                        {w.nextSyringe
                          ? `Switch to the ${w.nextSyringe.id} ml syringe`
                          : `Split it across ${w.drawsNeeded} full draws of this barrel`}
                        {w.diluentForFullBarrelMl !== null
                          ? `, or reconstitute with ${fmt(w.diluentForFullBarrelMl, 2)} ml of diluent or less so it fits one barrel.`
                          : "."}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {w.nextSyringe && (
                          <button
                            type="button"
                            onClick={() => setSyringeId(w.nextSyringe!.id)}
                            className="h-9 px-3 rounded-full bg-white/15 hover:bg-white/25 font-semibold text-white"
                          >
                            Use {w.nextSyringe.id} ml syringe
                          </button>
                        )}
                        {w.diluentForFullBarrelMl !== null && (
                          <button
                            type="button"
                            onClick={() =>
                              setDiluent(String(Math.floor(w.diluentForFullBarrelMl! * 100) / 100))
                            }
                            className="h-9 px-3 rounded-full bg-white/15 hover:bg-white/25 font-semibold text-white"
                          >
                            Set diluent to{" "}
                            {fmt(Math.floor(w.diluentForFullBarrelMl * 100) / 100, 2)} ml
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p
                      key={w.kind}
                      className="rounded-md bg-[oklch(0.528_0.141_40.2/0.18)] text-[oklch(0.92_0.05_60)] px-3 py-2"
                      role="status"
                    >
                      {w.kind === "below-graduation"
                        ? `The draw is smaller than one graduation (${fmt(w.minorMl, 3)} ml), so it cannot be measured on this barrel. Use a smaller syringe or more diluent.`
                        : w.kind === "exceeds-vial"
                          ? "The target mass is more than the vial contains."
                          : `${fmt(r.mgPerMl, 2)} mg/ml is above the ${fmt(w.ceilingMgPerMl, 2)} mg/ml soluble range in the reference (${
                              w.verified ? "published" : "unverified supplier guidance"
                            }). Use ${fmt(w.minDiluentMl, 2)} ml of diluent or more.`}
                    </p>
                  ),
                )}
              </div>
              <p className="text-[11px] text-ink-muted mt-2">
                Arithmetic only, for laboratory measurement. Units are U-100 volume graduations, not
                IU of activity. Verify against your own validated procedures.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  unit,
  alert = false,
}: {
  label: string;
  value: string;
  unit: string;
  alert?: boolean;
}) {
  return (
    <div className={`bg-ink-panel rounded-lg p-3 min-w-0 ${alert ? "ring-2 ring-[#c8693a]" : ""}`}>
      <dt className="text-[11px] text-ink-muted">{label}</dt>
      <dd className="font-mono text-lg md:text-2xl font-semibold mt-1 truncate tabular-nums">
        {value}
      </dd>
      <dd className="text-[11px] text-ink-muted">{unit}</dd>
    </div>
  );
}

function Field({
  id,
  label,
  suffix,
  value,
  onChange,
  invalid,
  children,
}: {
  id: string;
  label: string;
  suffix: string;
  value: string;
  onChange: (v: string) => void;
  invalid: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <div className="mt-2 relative">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={invalid}
          aria-describedby={`${id}-err`}
          className="w-full h-11 rounded-md border border-input bg-background pl-3 pr-12 font-mono"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
          {suffix}
        </span>
      </div>
      <p id={`${id}-err`} className="text-xs text-promo mt-1 min-h-4">
        {invalid ? "Enter a number greater than zero." : ""}
      </p>
      {children}
    </div>
  );
}

function Chips({
  label,
  items,
  current,
  onPick,
}: {
  label: string;
  items: { key: string; text: string; value: string }[];
  current: string;
  onPick: (v: string) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {items.map((i) => (
        <button
          key={i.key}
          type="button"
          aria-pressed={current === i.value}
          onClick={() => onPick(i.value)}
          className={`h-9 px-3 rounded-full border text-sm ${
            current === i.value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background"
          }`}
        >
          {i.text}
        </button>
      ))}
    </div>
  );
}
