"use client";

import { useEffect, useState } from "react";
import { Ban, Check, FileText, ShoppingBag } from "lucide-react";
import { useCart } from "./CartContext";
import { cn } from "@/utils/cn";
import type { Product } from "@/types/product";

export function AddToCartButton({ product }: { product: Product }) {
  const { addItem, items, totalUnits, maxUnits, openSpecialRequestForProduct } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!justAdded) return;
    const timeout = setTimeout(() => setJustAdded(false), 1500);
    return () => clearTimeout(timeout);
  }, [justAdded]);

  const isAvailable = product.status === "disponible" && product.stock > 0;
  const qtyInCart = items.find((item) => item.productId === product.id)?.quantity ?? 0;
  const limitReached = totalUnits >= maxUnits;
  const productExhausted = qtyInCart >= product.stock;
  // El límit de 3 unitats no bloqueja l'usuari sense més ni més menys: li
  // ofereix la via de la sol·licitud especial. L'estoc esgotat, en canvi,
  // és un límit real.
  const disabled = !isAvailable || productExhausted;

  function handleClick() {
    if (disabled) return;

    if (limitReached) {
      openSpecialRequestForProduct({ id: product.id, name: product.name }, qtyInCart + 1);
      return;
    }

    const result = addItem(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrls[0] ?? null,
        category: product.category,
        stock: product.stock,
      },
      1
    );
    if (result.ok) setJustAdded(true);
  }

  let caption: string | null = null;
  if (isAvailable && productExhausted) {
    caption = "Sense més estoc disponible.";
  } else if (isAvailable && limitReached) {
    caption = "Es gestiona mitjançant sol·licitud especial.";
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full items-center justify-center gap-2 rounded-md text-sm font-semibold transition-colors duration-150",
          justAdded
            ? "bg-success/10 text-success"
            : limitReached && !disabled
              ? "border border-accent bg-transparent text-brand-deep hover:bg-accent/10"
              : "bg-brand text-white hover:bg-brand-strong disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-muted"
        )}
      >
        {justAdded ? (
          <>
            <Check className="h-4 w-4" aria-hidden="true" />
            Afegit
          </>
        ) : disabled ? (
          <>
            <Ban className="h-4 w-4" aria-hidden="true" />
            No disponible
          </>
        ) : limitReached ? (
          <>
            <FileText className="h-4 w-4" aria-hidden="true" />
            Sol·licitar quantitat especial
          </>
        ) : (
          <>
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            Afegeix a la cistella
          </>
        )}
      </button>
      {caption && <p className="text-xs text-text-muted">{caption}</p>}
    </div>
  );
}
