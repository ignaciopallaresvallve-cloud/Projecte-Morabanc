"use client";

import { X } from "lucide-react";
import { ModalShell } from "@/components/ui/ModalShell";
import { ProductImageCarousel } from "./ProductImageCarousel";
import { StatusBadge } from "./StatusBadge";
import { ProductStockLabel } from "./ProductStockLabel";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { formatPrice } from "@/utils/format";
import type { Product } from "@/types/product";

export function ProductDetailModal({ product, onClose }: { product: Product; onClose: () => void }) {
  return (
    <ModalShell
      onClose={onClose}
      labelledBy="product-detail-title"
      maxWidthClassName="w-[90vw] max-w-5xl"
    >
      <div className="max-h-[85vh] overflow-y-auto rounded-xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Tancar"
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-text-muted shadow-soft transition-colors hover:bg-white hover:text-text"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
          <ProductImageCarousel
            images={product.imageUrls}
            alt={product.name}
            className="aspect-square w-full rounded-lg md:aspect-auto md:h-full md:min-h-[420px]"
            imageSizes="(min-width: 768px) 50vw, 100vw"
            fit="contain"
          />

          <div className="flex flex-col gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-brand">
                  {product.category}
                </span>
                <StatusBadge status={product.status} />
              </div>
              <h2
                id="product-detail-title"
                className="font-heading text-2xl font-bold text-brand-deep"
              >
                {product.name}
              </h2>
            </div>

            <div className="flex items-baseline gap-2">
              <p className="font-heading text-3xl font-bold text-brand-deep">
                {formatPrice(product.price)}
              </p>
              {product.marketPrice !== null && product.marketPrice > product.price && (
                <p className="text-base text-text-muted line-through">
                  {formatPrice(product.marketPrice)}
                </p>
              )}
            </div>
            <p className="text-sm font-medium text-text-muted">
              <ProductStockLabel product={product} />
            </p>

            <div>
              <h3 className="mb-1 text-sm font-semibold text-text">Descripció</h3>
              <p className="whitespace-pre-line text-sm leading-relaxed text-text-muted">
                {product.description || "Sense descripció disponible."}
              </p>
            </div>

            {(product.sku || product.weight || product.dimensions) && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-text">Especificacions</h3>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  {product.sku && (
                    <>
                      <dt className="text-text-muted">ID de producte</dt>
                      <dd className="text-text">{product.sku}</dd>
                    </>
                  )}
                  {product.weight && (
                    <>
                      <dt className="text-text-muted">Pes</dt>
                      <dd className="text-text">{product.weight}</dd>
                    </>
                  )}
                  {product.dimensions && (
                    <>
                      <dt className="text-text-muted">Mides</dt>
                      <dd className="text-text">{product.dimensions}</dd>
                    </>
                  )}
                </dl>
              </div>
            )}

            <div className="mt-auto pt-2">
              <AddToCartButton product={product} />
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}
