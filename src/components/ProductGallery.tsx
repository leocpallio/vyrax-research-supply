import { useState } from "react";
import type { Img } from "@/lib/catalog";

/**
 * Product page image: the front render, 1:1, sticky beside the buy box on desktop.
 * When a real lab report is held for this strength, a second tab shows the report itself.
 * Side views are withheld until their batch and QR artwork can be verified against a real batch.
 */
export function ProductGallery({
  image,
  name,
  fallbackLabel,
  report,
}: {
  image: Img;
  name: string;
  fallbackLabel?: string;
  report?: { src: string; batch: string } | undefined;
}) {
  const [view, setView] = useState<"vial" | "report">("vial");
  const showReport = Boolean(report) && view === "report";
  return (
    <div>
      <figure
        data-testid="pdp-gallery"
        data-pdp-gallery
        className="relative aspect-square overflow-hidden bg-white"
      >
        {showReport && report ? (
          <a href={report.src} target="_blank" rel="noreferrer" aria-label={`Open the Janoshik lab report for batch ${report.batch}`}>
            <img
              src={report.src}
              alt={`Janoshik test report for ${name}, batch ${report.batch}`}
              width={1600}
              height={2360}
              decoding="async"
              className="w-full h-full object-contain object-top select-none border border-border"
            />
          </a>
        ) : (
          <img
            src={image.src}
            srcSet={image.srcSet}
            sizes="(min-width: 1024px) 600px, 100vw"
            alt={`${name} research vial, illustrative front render`}
            width={1024}
            height={1024}
            fetchPriority="high"
            decoding="async"
            draggable={false}
            className="w-full h-full object-cover select-none"
          />
        )}
        {!showReport && !image.isRender && fallbackLabel && (
          <figcaption className="absolute inset-x-10 top-[46%] text-center font-heading font-semibold text-xl leading-tight pointer-events-none">
            {fallbackLabel}
          </figcaption>
        )}
      </figure>
      {report && (
        <div className="mt-3 flex gap-3" role="tablist" aria-label="Product images">
          <button
            type="button"
            role="tab"
            aria-selected={view === "vial"}
            onClick={() => setView("vial")}
            className={`h-16 w-16 overflow-hidden rounded-lg border bg-white ${view === "vial" ? "border-primary" : "border-border"}`}
          >
            <img src={image.src} alt="" className="h-full w-full object-cover" />
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "report"}
            onClick={() => setView("report")}
            className={`h-16 w-16 overflow-hidden rounded-lg border bg-white ${view === "report" ? "border-primary" : "border-border"}`}
            aria-label="Lab report"
          >
            <img src={report.src} alt="" className="h-full w-full object-cover object-top" />
          </button>
        </div>
      )}
    </div>
  );
}
