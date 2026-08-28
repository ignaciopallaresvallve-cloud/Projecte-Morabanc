"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertTriangle, Percent, RotateCcw, X } from "lucide-react";
import {
  applySecondBatchDiscount,
  resetProductPrices,
  type ApplyDiscountState,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import { ModalShell } from "@/components/ui/ModalShell";
import { toast } from "@/components/ui/toast";

const initialState: ApplyDiscountState = {};

type DiscountAction = (
  prevState: ApplyDiscountState,
  formData: FormData
) => Promise<ApplyDiscountState>;

function ConfirmSubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="primary" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

function ConfirmationModal({
  titleId,
  title,
  description,
  action,
  successMessage,
  confirmLabel,
  pendingLabel,
  onClose,
}: {
  titleId: string;
  title: string;
  description: React.ReactNode;
  action: DiscountAction;
  successMessage: (updatedCount: number) => string;
  confirmLabel: string;
  pendingLabel: string;
  onClose: () => void;
}) {
  const [state, formAction] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success) {
      toast(successMessage(state.updatedCount ?? 0), "success");
      onClose();
    } else if (state.error) {
      toast(state.error, "error");
    }
    // Solo debe reaccionar cuando el resultado de la acción cambia, no en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <ModalShell onClose={onClose} labelledBy={titleId}>
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
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-danger/10 text-danger">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 id={titleId} className="font-heading text-lg font-bold text-brand-deep">
              {title}
            </h2>
            <p className="mt-1 text-sm text-text-muted">{description}</p>
          </div>
        </div>

        <form action={formAction} className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel·lar
          </Button>
          <ConfirmSubmitButton label={confirmLabel} pendingLabel={pendingLabel} />
        </form>
      </div>
    </ModalShell>
  );
}

/**
 * Mostra "Segona tanda" o "Restablir preus" segons si el descompte global
 * ja està actiu: mai els dos alhora, així no es pot tornar a aplicar un
 * descompte ja actiu (ni restablir preus quan no n'hi ha cap d'aplicat).
 */
export function PricingDiscountControls({ isDiscountActive }: { isDiscountActive: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  if (isDiscountActive) {
    return (
      <>
        <Button type="button" variant="secondary" onClick={() => setIsOpen(true)}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Restablir preus
        </Button>
        {isOpen && (
          <ConfirmationModal
            titleId="restore-prices-title"
            title="Restablir preus originals"
            description={
              <>
                Aquesta acció tornarà <strong>tots els productes</strong> al
                seu preu original, previ al descompte del 20%, i
                desactivarà la &laquo;Segona tanda&raquo;.
              </>
            }
            action={resetProductPrices}
            successMessage={(count) =>
              `Preus restablerts a ${count} producte${count === 1 ? "" : "s"}.`
            }
            confirmLabel="Restablir preus"
            pendingLabel="Restablint..."
            onClose={() => setIsOpen(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        onClick={() => setIsOpen(true)}
        className="border-danger text-danger hover:bg-danger/10"
      >
        <Percent className="h-4 w-4" aria-hidden="true" />
        Segona tanda
      </Button>
      {isOpen && (
        <ConfirmationModal
          titleId="segona-tanda-title"
          title="Segona tanda: descompte del 20%"
          description={
            <>
              Aquesta acció aplicarà una reducció del <strong>20%</strong> al
              preu de <strong>tots els productes del catàleg</strong>, de
              manera immediata i per a tots els empleats. Es desarà el preu
              original de cada producte, així que després podràs tornar-lo
              enrere amb &laquo;Restablir preus&raquo;.
            </>
          }
          action={applySecondBatchDiscount}
          successMessage={(count) =>
            `Descompte del 20% aplicat a ${count} producte${count === 1 ? "" : "s"}.`
          }
          confirmLabel="Confirmar descompte"
          pendingLabel="Aplicant..."
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
