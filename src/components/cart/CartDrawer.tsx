"use client";

import { ShoppingBag, X } from "lucide-react";
import { useCart } from "./CartContext";
import { CartItemRow } from "./CartItemRow";
import { UnitsProgress } from "./UnitsProgress";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/toast";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { formatPrice } from "@/utils/format";
import { cn } from "@/utils/cn";

export function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    totalAmount,
    totalUnits,
    maxUnits,
    clearCart,
    openSpecialRequestForCart,
    openPurchaseCommitment,
  } = useCart();

  useEscapeKey(isOpen, closeCart);
  const trapRef = useFocusTrap<HTMLDivElement>(isOpen);

  function handleClearCart() {
    clearCart();
    toast("Cistella buidada.", "info");
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[60] transition-opacity duration-200",
        isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      )}
      aria-hidden={!isOpen}
    >
      <div
        className="absolute inset-0 bg-brand-deep/40 backdrop-blur-sm"
        onClick={closeCart}
      />

      <div
        ref={trapRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Cistella de sol·licitud"
        className={cn(
          "absolute inset-y-0 right-0 flex h-full w-full max-w-md flex-col bg-surface shadow-lifted transition-transform duration-300 ease-out focus:outline-none",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="font-heading text-lg font-bold text-brand-deep">La teva cistella</h2>
            <p className="text-xs text-text-muted">
              {items.length === 0
                ? "Encara no has afegit cap producte."
                : `${items.length} producte${items.length === 1 ? "" : "s"} seleccionat${items.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Tancar la cistella"
            className="flex h-9 w-9 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-soft hover:text-text"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-soft text-brand">
              <ShoppingBag className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="font-heading text-base font-semibold text-brand-deep">
              La teva cistella està buida
            </p>
            <p className="max-w-xs text-sm text-text-muted">
              Explora el catàleg i afegeix el mobiliari que necessitis. Pots
              sol·licitar fins a {maxUnits} unitats en total.
            </p>
            <Button href="/catalogo" variant="secondary" onClick={closeCart}>
              Anar al catàleg
            </Button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5">
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <CartItemRow key={item.productId} item={item} />
              ))}
            </ul>
          </div>
        )}

        {items.length > 0 && (
          <div className="flex flex-col gap-4 border-t border-border px-5 py-5">
            <UnitsProgress used={totalUnits} max={maxUnits} />

            {totalUnits >= maxUnits && (
              <div className="rounded-md bg-warning/10 px-3 py-2 text-xs text-warning">
                <p className="font-medium">
                  Has arribat al màxim de {maxUnits} unitats per sol·licitud.
                </p>
                <button
                  type="button"
                  onClick={openSpecialRequestForCart}
                  className="mt-1 font-semibold underline underline-offset-2 hover:no-underline"
                >
                  Necessites més? Sol·licita una excepció
                </button>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-muted">Total</span>
              <span className="font-heading text-2xl font-bold text-brand-deep">
                {formatPrice(totalAmount)}
              </span>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                closeCart();
                openPurchaseCommitment();
              }}
              className="w-full"
            >
              Finalitzar sol·licitud
            </Button>

            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={handleClearCart}
                className="font-medium text-text-muted transition-colors hover:text-danger"
              >
                Buidar la cistella
              </button>
              <button
                type="button"
                onClick={closeCart}
                className="font-medium text-brand transition-colors hover:underline"
              >
                Continuar explorant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
