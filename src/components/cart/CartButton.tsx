"use client";

import { ShoppingBag } from "lucide-react";
import { useCart } from "./CartContext";

export function CartButton() {
  const { totalUnits, openCart } = useCart();

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Obre la cistella${totalUnits > 0 ? ` (${totalUnits} ${totalUnits === 1 ? "unitat" : "unitats"})` : ""}`}
      className="relative flex h-10 w-10 items-center justify-center rounded-md text-brand transition-colors hover:bg-surface-soft"
    >
      <ShoppingBag className="h-5 w-5" aria-hidden="true" />
      {totalUnits > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-brand-deep">
          {totalUnits}
        </span>
      )}
    </button>
  );
}
