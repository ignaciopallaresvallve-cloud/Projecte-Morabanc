"use client";

import { ShieldCheck, X } from "lucide-react";
import { useCart } from "./CartContext";
import { useMandatoryConsent } from "@/hooks/useMandatoryConsent";
import { Button } from "@/components/ui/Button";
import { ModalShell } from "@/components/ui/ModalShell";
import { formatPrice } from "@/utils/format";

/**
 * Se monta/desmonta por completo al abrir/cerrar (ver `PurchaseCommitmentModal`
 * más abajo), así el checkbox de consentimiento siempre arranca destildado
 * en cada apertura en lugar de arrastrar el estado de una confirmación anterior.
 */
function PurchaseCommitmentModalContent({ onClose }: { onClose: () => void }) {
  const { items, totalAmount, openBuyerInfo } = useCart();
  const { accepted, toggle } = useMandatoryConsent();

  function handleConfirm() {
    if (!accepted) return;
    openBuyerInfo();
  }

  return (
    <ModalShell onClose={onClose} labelledBy="purchase-commitment-title">
      <button
        type="button"
        onClick={onClose}
        aria-label="Tancar"
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-soft hover:text-text"
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>

      <div className="px-6 py-6 sm:px-8 sm:py-8">
        <div className="mb-5 flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-surface-soft text-brand">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2
              id="purchase-commitment-title"
              className="font-heading text-lg font-bold text-brand-deep"
            >
              Compromís de compra
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              En confirmar la compra, l&apos;estoc reservat es descompta a
              l&apos;instant del catàleg, encara que el pagament es faci més
              tard mitjançant transferència bancària. Et compromets a
              completar aquesta transferència pels productes indicats a
              continuació.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface-muted p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
            Productes reservats
          </p>
          <ul className="flex flex-col gap-1.5">
            {items.map((item) => (
              <li key={item.productId} className="flex items-center justify-between text-sm">
                <span className="text-text">
                  {item.name} <span className="text-text-muted">×{item.quantity}</span>
                </span>
                <span className="font-medium text-text">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <span className="text-sm font-medium text-text-muted">Import total</span>
            <span className="font-heading text-xl font-bold text-brand-deep">
              {formatPrice(totalAmount)}
            </span>
          </div>
        </div>

        <p className="mt-5 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-xs leading-relaxed text-text">
          Els mobles adscrits a aquesta plataforma són d&apos;ús exclusiu
          intern o personal i en queda estrictament prohibida la revenda a
          tercers.
        </p>

        <label className="mt-3 flex items-start gap-3 rounded-lg bg-info/10 px-4 py-3 text-sm leading-relaxed text-text">
          <input
            type="checkbox"
            checked={accepted}
            onChange={toggle}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          />
          Entenc i accepto realitzar la transferència bancària segons
          aquestes condicions, i accepto la prohibició de revenda a
          tercers.
        </label>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel·lar
          </Button>
          <Button type="button" variant="primary" disabled={!accepted} onClick={handleConfirm}>
            Confirmar compra
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}

export function PurchaseCommitmentModal() {
  const { isPurchaseCommitmentOpen, closePurchaseCommitment } = useCart();

  if (!isPurchaseCommitmentOpen) return null;

  return <PurchaseCommitmentModalContent onClose={closePurchaseCommitment} />;
}
