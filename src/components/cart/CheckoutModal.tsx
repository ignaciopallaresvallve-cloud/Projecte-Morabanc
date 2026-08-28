"use client";

import { useState } from "react";
import { AlertTriangle, Banknote, CheckCircle2, Copy, Landmark, Loader2, X } from "lucide-react";
import { useCart } from "./CartContext";
import { Button } from "@/components/ui/Button";
import { ModalShell } from "@/components/ui/ModalShell";
import { toast } from "@/components/ui/toast";
import { confirmOrderPayment } from "@/lib/actions/order";
import { formatPrice } from "@/utils/format";
import { formatIban } from "@/utils/iban";
import type { CreateOrderResult } from "@/types/order";

type CheckoutStatus = "idle" | "loading" | "success" | "error";

function CheckoutModalContent({
  status,
  result,
  onClose,
}: {
  status: CheckoutStatus;
  result: CreateOrderResult | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const order = result?.order;
  const paymentSettings = result?.paymentSettings;
  const concept =
    order && paymentSettings
      ? `${paymentSettings.paymentConcept || "Mobiliari MoraBanc Office Store"} — ${order.reference}`
      : "";

  function handleCopyIban() {
    if (!paymentSettings?.iban) return;
    navigator.clipboard.writeText(paymentSettings.iban.replace(/\s+/g, "")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  async function handleFinish() {
    if (!order) {
      onClose();
      return;
    }

    setConfirming(true);
    try {
      const confirmResult = await confirmOrderPayment(order.reference);
      if (!confirmResult.ok) {
        throw new Error(confirmResult.error ?? "No s'ha pogut confirmar la sol·licitud.");
      }
    } catch (err) {
      toast(
        err instanceof Error
          ? `No s'ha pogut actualitzar l'estat de la sol·licitud: ${err.message}`
          : "No s'ha pogut actualitzar l'estat de la sol·licitud.",
        "error"
      );
    } finally {
      setConfirming(false);
      onClose();
    }
  }

  return (
    <ModalShell onClose={onClose} labelledBy="checkout-title" closable={status !== "loading"}>
      {status !== "loading" && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Tancar"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-soft hover:text-text"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      )}

      {status === "loading" && (
        <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand" aria-hidden="true" />
          <p id="checkout-title" className="text-sm text-text-muted">
            Registrant la teva sol·licitud...
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/10 text-danger">
            <AlertTriangle className="h-7 w-7" aria-hidden="true" />
          </div>
          <h2 id="checkout-title" className="font-heading text-lg font-bold text-brand-deep">
            No s&apos;ha pogut registrar la sol·licitud
          </h2>
          <p className="max-w-sm text-sm text-text-muted">
            {result?.error ?? "Torna-ho a provar d'aquí a uns minuts."}
          </p>
          <Button variant="secondary" onClick={onClose} className="mt-2">
            Tancar
          </Button>
        </div>
      )}

      {status === "success" && order && paymentSettings && (
        <div className="max-h-[85vh] overflow-y-auto px-6 py-6 sm:px-8 sm:py-8">
          <div className="mb-6 flex flex-col items-center gap-2 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
              <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
            </div>
            <h2 id="checkout-title" className="font-heading text-lg font-bold text-brand-deep">
              Sol·licitud registrada
            </h2>
            <p className="text-sm text-text-muted">
              La teva comanda ha quedat registrada com a{" "}
              <span className="font-semibold text-warning">Pendent de pagament</span>.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-surface-muted p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
              Resum de la comanda
            </p>
            <ul className="flex flex-col gap-1.5">
              {order.items.map((item) => (
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
                {formatPrice(order.total)}
              </span>
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-brand/20 bg-surface-soft p-4">
            <div className="mb-3 flex items-center gap-2">
              <Landmark className="h-4 w-4 text-brand" aria-hidden="true" />
              <p className="text-sm font-semibold text-brand-deep">Dades per a la transferència</p>
            </div>

            {paymentSettings.iban ? (
              <dl className="flex flex-col gap-3 text-sm">
                <div>
                  <dt className="text-xs text-text-muted">Titular del compte</dt>
                  <dd className="font-medium text-text">{paymentSettings.accountHolder}</dd>
                </div>
                <div>
                  <dt className="text-xs text-text-muted">IBAN</dt>
                  <dd className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-medium text-text">
                      {formatIban(paymentSettings.iban)}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyIban}
                      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand transition-colors hover:bg-white"
                    >
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      {copied ? "Copiat" : "Copiar"}
                    </button>
                  </dd>
                </div>
                {paymentSettings.swiftBic && (
                  <div>
                    <dt className="text-xs text-text-muted">SWIFT / BIC</dt>
                    <dd className="font-mono font-medium text-text">{paymentSettings.swiftBic}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs text-text-muted">Concepte de pagament</dt>
                  <dd className="font-medium text-text">{concept}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-text-muted">
                Les dades bancàries encara no s&apos;han configurat. Posa&apos;t
                en contacte amb l&apos;equip de Facilities indicant el teu
                número de sol·licitud.
              </p>
            )}
          </div>

          <div className="mt-5 flex items-start gap-2 rounded-lg bg-info/10 px-4 py-3 text-xs leading-relaxed text-info">
            <Banknote className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>
              Has de completar la sol·licitud fent tu mateix una
              transferència bancària des del teu banc per l&apos;import
              indicat.{" "}
              <strong className="font-semibold">
                MoraBanc Office Store no fa cap cobrament a través
                d&apos;aquesta web.
              </strong>
            </p>
          </div>

          <p className="mt-4 text-center text-xs text-text-muted">
            Núm. de sol·licitud:{" "}
            <span className="font-mono font-semibold text-text">{order.reference}</span>
          </p>

          <div className="mt-6 flex justify-end">
            <Button variant="primary" onClick={handleFinish} disabled={confirming}>
              {confirming ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Confirmant...
                </>
              ) : (
                "Entesos"
              )}
            </Button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}

export function CheckoutModal() {
  const { isCheckoutOpen, checkoutStatus, checkoutResult, closeCheckout } = useCart();

  if (!isCheckoutOpen) return null;

  return (
    <CheckoutModalContent status={checkoutStatus} result={checkoutResult} onClose={closeCheckout} />
  );
}
