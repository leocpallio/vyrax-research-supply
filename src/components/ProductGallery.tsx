import type { Img } from "@/lib/catalog";

/**
 * Product page image: the front render only, 1:1, sticky beside the buy box on desktop.
 * Side views are withheld until their batch and QR artwork can be verified against a real batch.
 */
export function ProductGallery({
  image,
  name,
  fallbackLabel,
}: {
  image: Img;
  name: string;
  fallbackLabel?: string;
}) {
  return (
    <figure
      data-testid="pdp-gallery"
      className="relative aspect-square rounded-2xl overflow-hidden bg-surface border border-border"
    >
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
      {!image.isRender && fallbackLabel && (
        <figcaption className="absolute inset-x-10 top-[46%] text-center font-heading font-semibold text-xl leading-tight pointer-events-none">
          {fallbackLabel}
        </figcaption>
      )}
    </figure>
  );
}
