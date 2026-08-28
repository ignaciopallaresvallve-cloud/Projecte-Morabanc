"use client";

import Image from "next/image";
import { ImageOff, Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "./CartContext";
import { formatPrice } from "@/utils/format";
import { cn } from "@/utils/cn";
import type { CartItem } from "@/types/cart";

export function CartItemRow({ item }: { item: CartItem }) {
  const { updateQuantity, removeItem, totalUnits, maxUnits, openSpecialRequestForProduct } =
    useCart();

  const stockExhausted = item.quantity >= item.stock;
  const limitReached = totalUnits >= maxUnits;

  function handleIncrease() {
    if (stockExhausted) return;
    if (limitReached) {
      openSpecialRequestForProduct({ id: item.productId, name: item.name }, item.quantity + 1);
      return;
    }
    updateQuantity(item.productId, item.quantity + 1);
  }

  return (
    <li className="flex gap-3 py-4">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-surface-soft">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.name} fill sizes="64px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-text-muted">
            <ImageOff className="h-5 w-5" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold leading-snug text-text">{item.name}</p>
            <p className="text-xs text-text-muted">{item.category}</p>
          </div>
          <button
            type="button"
            onClick={() => removeItem(item.productId)}
            aria-label={`Treure ${item.name} de la cistella`}
            title="Treure"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-danger/10 hover:text-danger"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-1 flex items-end justify-between">
          <div className="flex items-center gap-1 rounded-md border border-border">
            <button
              type="button"
              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
              aria-label="Disminuir la quantitat"
              className="flex h-8 w-8 items-center justify-center text-text transition-colors hover:bg-surface-soft disabled:cursor-not-allowed disabled:text-text-muted"
            >
              <Minus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <span className="w-5 text-center text-sm font-medium text-text" aria-live="polite">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={handleIncrease}
              disabled={stockExhausted}
              aria-label={limitReached ? "Sol·licitar més unitats mitjançant petició especial" : "Augmentar la quantitat"}
              title={limitReached && !stockExhausted ? "Sol·licitar quantitat especial" : undefined}
              className={cn(
                "flex h-8 w-8 items-center justify-center transition-colors disabled:cursor-not-allowed disabled:text-text-muted disabled:hover:bg-transparent",
                limitReached && !stockExhausted
                  ? "text-brand hover:bg-accent/10"
                  : "text-text hover:bg-surface-soft"
              )}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          <p className="text-sm font-semibold text-brand-deep">
            {formatPrice(item.price * item.quantity)}
          </p>
        </div>
      </div>
    </li>
  );
}
