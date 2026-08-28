"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { cn } from "@/utils/cn";

interface ProductImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
  imageSizes?: string;
  /** "contain" mostra la peça sencera sense retallar-la (p. ex. al modal de detall); "cover" omple el marc (p. ex. a la targeta del catàleg). */
  fit?: "contain" | "cover";
}

/** Carrusel d'imatges amb fletxes i indicadors de punts; es col·lapsa a una sola imatge estàtica si només n'hi ha una. */
export function ProductImageCarousel({
  images,
  alt,
  className,
  imageSizes,
  fit = "cover",
}: ProductImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className={cn("relative flex items-center justify-center bg-surface-soft text-text-muted", className)}>
        <ImageOff className="h-10 w-10" aria-hidden="true" />
      </div>
    );
  }

  function goTo(index: number) {
    setActiveIndex((index + images.length) % images.length);
  }

  return (
    <div className={cn("relative overflow-hidden bg-surface-soft", className)}>
      <Image
        key={images[activeIndex]}
        src={images[activeIndex]}
        alt={alt}
        fill
        sizes={imageSizes ?? "(min-width: 640px) 50vw, 100vw"}
        className={cn(fit === "contain" ? "object-contain p-6" : "object-cover")}
        priority={activeIndex === 0}
      />

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(activeIndex - 1)}
            aria-label="Imatge anterior"
            className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-brand-deep shadow-soft transition-colors hover:bg-white"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => goTo(activeIndex + 1)}
            aria-label="Imatge següent"
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-brand-deep shadow-soft transition-colors hover:bg-white"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((image, index) => (
              <button
                key={image}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Anar a la imatge ${index + 1}`}
                aria-current={index === activeIndex}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  index === activeIndex ? "w-5 bg-white" : "w-1.5 bg-white/60 hover:bg-white/80"
                )}
              />
            ))}
          </div>

          <span className="absolute right-3 top-3 rounded-full bg-brand-deep/70 px-2 py-0.5 text-xs font-semibold text-white">
            {activeIndex + 1}/{images.length}
          </span>
        </>
      )}
    </div>
  );
}
