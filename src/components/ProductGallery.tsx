import { useEffect, useState, type ReactNode } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import type { Img } from "@/lib/catalog";

// What each render shows (file suffix __<view>), for alt text and the thumbnail buttons.
const VIEW_TEXT: Record<string, string> = {
  front: "front of the vial",
  qr: "side panel with the batch QR code",
  storage: "side panel with storage and expiry",
};
const viewText = (im: Img) => VIEW_TEXT[im.view ?? "front"] ?? "vial";

/**
 * Product page gallery for strengths with more than one render of the same vial (front + turned views).
 * Swipe or drag on the main photo, arrows from sm up, thumbnails underneath. The first slide is the
 * front render, the same image as the product cards, og:image and basket.
 */
export function ProductGallery({
  images,
  name,
  badges,
}: {
  images: Img[];
  name: string;
  badges?: ReactNode;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!api) return;
    const sync = () => setIndex(api.selectedScrollSnap());
    sync();
    api.on("select", sync);
    api.on("reInit", sync);
    return () => {
      api.off("select", sync);
      api.off("reInit", sync);
    };
  }, [api]);

  return (
    <div>
      <div className="relative">
        <Carousel
          setApi={setApi}
          aria-label={`${name} images`}
          className="bg-surface rounded-2xl overflow-hidden"
        >
          <CarouselContent className="ml-0">
            {images.map((im, i) => (
              <CarouselItem
                key={im.src}
                className="pl-0"
                aria-label={`${i + 1} of ${images.length}: ${viewText(im)}`}
              >
                <div className="aspect-[4/3] sm:aspect-square">
                  <img
                    src={im.src}
                    srcSet={im.srcSet}
                    sizes="(min-width: 1024px) 600px, 100vw"
                    alt={
                      i === 0
                        ? `${name} research vial, Vyrax Labs`
                        : `${name} vial, ${viewText(im)}`
                    }
                    width={1024}
                    height={1024}
                    fetchPriority={i === 0 ? "auto" : "low"}
                    draggable={false}
                    className="w-full h-full object-contain sm:object-cover select-none"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-3 size-10 bg-background/90 hidden sm:inline-flex" />
          <CarouselNext className="right-3 size-10 bg-background/90 hidden sm:inline-flex" />
        </Carousel>
        {badges && (
          <span className="absolute top-4 left-4 flex gap-2 pointer-events-none">{badges}</span>
        )}
      </div>
      <div className="flex gap-2.5 mt-3">
        {images.map((im, i) => (
          <button
            key={im.src}
            type="button"
            onClick={() => api?.scrollTo(i)}
            aria-label={`Show the ${viewText(im)}`}
            aria-current={i === index ? "true" : undefined}
            className={cn(
              "size-16 sm:size-20 rounded-xl overflow-hidden border-2 bg-surface transition-colors",
              i === index ? "border-primary" : "border-border hover:border-primary/40",
            )}
          >
            <img
              src={im.small ?? im.src}
              alt=""
              width={640}
              height={640}
              loading="lazy"
              className="w-full h-full object-cover scale-[1.18]"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
