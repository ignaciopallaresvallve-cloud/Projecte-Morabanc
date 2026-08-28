"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff, Images } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { ProductStockLabel } from "./ProductStockLabel";
import { ProductDetailModal } from "./ProductDetailModal";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import type { Product } from "@/types/product";
import { formatPrice } from "@/utils/format";

export function ProductCard({ product }: { product: Product }) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const coverImage = product.imageUrls[0] ?? null;

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-soft transition-shadow duration-200 hover:shadow-elevated">
      <button
        type="button"
        onClick={() => setIsDetailOpen(true)}
        aria-haspopup="dialog"
        aria-label={`Veure detalls de ${product.name}`}
        className="block w-full text-left"
      >
        <div className="relative flex h-64 w-full items-center justify-center overflow-hidden rounded-t-xl bg-surface-soft p-4">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={product.name}
              width={800}
              height={800}
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 90vw"
              className="h-auto max-h-full w-auto max-w-full object-contain"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-text-muted">
              <ImageOff className="h-8 w-8" aria-hidden="true" />
            </div>
          )}
          <StatusBadge status={product.status} className="absolute left-3 top-3 z-10 shadow-soft" />
          {product.imageUrls.length > 1 && (
            <span className="absolute bottom-3 right-3 z-10 flex items-center gap-1 rounded-full bg-brand-deep/70 px-2 py-1 text-xs font-semibold text-white">
              <Images className="h-3.5 w-3.5" aria-hidden="true" />
              {product.imageUrls.length}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2 p-5 pb-0">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand">
            {product.category}
          </span>
          <h3 className="font-heading text-lg font-semibold leading-snug text-brand-deep">
            {product.name}
          </h3>
          <p className="line-clamp-2 text-sm leading-relaxed text-text-muted">
            {product.description || "Sense descripció disponible."}
          </p>
        </div>
      </button>

      <div className="flex flex-1 flex-col justify-end gap-2 p-5 pt-2">
        <div className="mt-2 flex items-end justify-between gap-3">
          <div>
            <div className="flex items-baseline gap-2">
              <p className="font-heading text-xl font-bold text-brand-deep">
                {formatPrice(product.price)}
              </p>
              {product.marketPrice !== null && product.marketPrice > product.price && (
                <p className="text-sm text-text-muted line-through">
                  {formatPrice(product.marketPrice)}
                </p>
              )}
            </div>
            <p className="text-xs text-text-muted">
              <ProductStockLabel product={product} />
            </p>
          </div>
        </div>

        <div className="mt-3">
          <AddToCartButton product={product} />
        </div>
      </div>

      {isDetailOpen && <ProductDetailModal product={product} onClose={() => setIsDetailOpen(false)} />}
    </article>
  );
}
