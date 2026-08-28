"use client";

import { useState } from "react";
import { Loader2, PackageCheck, X } from "lucide-react";
import { useCart } from "./CartContext";
import { Button } from "@/components/ui/Button";
import { ModalShell } from "@/components/ui/ModalShell";
import { FormField } from "@/components/ui/FormField";
import { inputClasses } from "@/components/ui/formStyles";
import { cn } from "@/utils/cn";

const EMPLOYEE_CODE_LENGTH = 4;
const PICKUP_DATES_REQUIRED = 2;

/**
 * Se monta/desmonta por completo al abrir/cerrar (ver `BuyerInfoModal` más
 * abajo), así el formulario siempre arranca en blanco en cada apertura en
 * lugar de arrastrar los datos de un intento anterior.
 */
function BuyerInfoModalContent({ onClose }: { onClose: () => void }) {
  const { items, checkoutSettings, checkoutSettingsStatus, retryCheckoutSettings, startCheckout } =
    useCart();

  const [buyerName, setBuyerName] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [department, setDepartment] = useState("");
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  // "Segona Tanda" (dates de recollida alternatives) — no té cap relació
  // amb el descompte "Segona Tanda" de preus de l'admin, és un joc
  // diferent de dates que el comprador pot triar en aquest mateix pas.
  const [useSecondTanda, setUseSecondTanda] = useState(false);

  const productNames = items.map((item) => item.name).join(", ");
  const firstTandaDates = checkoutSettings?.pickupDateOptions ?? [];
  const secondTandaDates = checkoutSettings?.pickupDateOptionsSecondTanda ?? [];
  const pickupDateOptions = useSecondTanda ? secondTandaDates : firstTandaDates;

  function toggleTanda() {
    setUseSecondTanda((current) => !current);
    // Les dates ja triades pertanyen a l'altre joc: en canviar, deixen de
    // ser vàlides i cal tornar a triar-ne 2 del joc actiu.
    setSelectedDates([]);
  }

  const nameValid = buyerName.trim().length >= 2;
  const codeValid = employeeCode.trim().length === EMPLOYEE_CODE_LENGTH;
  const departmentValid = department.trim().length >= 2;
  const datesValid = selectedDates.length === PICKUP_DATES_REQUIRED;
  const canSubmit =
    nameValid && codeValid && departmentValid && datesValid && checkoutSettingsStatus === "idle";

  function toggleDate(date: string) {
    setSelectedDates((prev) => {
      if (prev.includes(date)) return prev.filter((entry) => entry !== date);
      if (prev.length >= PICKUP_DATES_REQUIRED) return prev;
      return [...prev, date];
    });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    startCheckout({
      buyerName: buyerName.trim(),
      employeeCode: employeeCode.trim(),
      department: department.trim(),
      pickupDates: selectedDates,
    });
  }

  return (
    <ModalShell onClose={onClose} labelledBy="buyer-info-title">
      <button
        type="button"
        onClick={onClose}
        aria-label="Tancar"
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-soft hover:text-text"
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>

      <div className="max-h-[85vh] overflow-y-auto px-6 py-6 sm:px-8 sm:py-8">
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-surface-soft text-brand">
            <PackageCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 id="buyer-info-title" className="font-heading text-lg font-bold text-brand-deep">
              Dades del comprador i recollida
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              Aquestes dades s&apos;adjunten a la teva comanda perquè
              l&apos;equip de Facilities pugui gestionar la recollida del
              mobiliari.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Nom i cognoms" htmlFor="buyerName">
              <input
                id="buyerName"
                name="buyerName"
                type="text"
                required
                value={buyerName}
                onChange={(event) => setBuyerName(event.target.value)}
                className={inputClasses}
              />
            </FormField>

            <FormField
              label="Codi d'empleat"
              htmlFor="employeeCode"
              hint={`Exactament ${EMPLOYEE_CODE_LENGTH} caràcters.`}
            >
              <input
                id="employeeCode"
                name="employeeCode"
                type="text"
                required
                maxLength={EMPLOYEE_CODE_LENGTH}
                value={employeeCode}
                onChange={(event) => setEmployeeCode(event.target.value)}
                className={inputClasses}
              />
            </FormField>

            <FormField label="Departament" htmlFor="department">
              <input
                id="department"
                name="department"
                type="text"
                required
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
                className={inputClasses}
              />
            </FormField>

            <FormField label="Nom del moble" htmlFor="productName">
              <input
                id="productName"
                type="text"
                readOnly
                value={productNames}
                className={cn(inputClasses, "cursor-not-allowed bg-surface-muted text-text-muted")}
              />
            </FormField>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium text-text">
              Dates de recollida <span className="text-text-muted">(selecciona 2)</span>
            </legend>

            {checkoutSettingsStatus === "idle" && secondTandaDates.length > 0 && (
              <button
                type="button"
                onClick={toggleTanda}
                aria-pressed={useSecondTanda}
                className={cn(
                  "self-start rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                  useSecondTanda
                    ? "border-brand bg-brand text-white"
                    : "border-border text-text-muted hover:border-brand hover:text-brand"
                )}
              >
                {useSecondTanda ? "✓ Segona Tanda — tornar a la primera" : "Segona Tanda"}
              </button>
            )}

            {checkoutSettingsStatus === "loading" && (
              <div className="flex items-center gap-2 rounded-md border border-border bg-surface-muted px-4 py-3 text-sm text-text-muted">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Carregant les dates disponibles...
              </div>
            )}

            {checkoutSettingsStatus === "error" && (
              <div className="flex flex-col items-start gap-2 rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">
                <p>No s&apos;han pogut carregar les dates de recollida.</p>
                <button
                  type="button"
                  onClick={retryCheckoutSettings}
                  className="font-semibold underline underline-offset-2 hover:no-underline"
                >
                  Torna-ho a provar
                </button>
              </div>
            )}

            {checkoutSettingsStatus === "idle" && pickupDateOptions.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {pickupDateOptions.map((date) => {
                  const checked = selectedDates.includes(date);
                  const disabled = !checked && selectedDates.length >= PICKUP_DATES_REQUIRED;
                  return (
                    <label
                      key={date}
                      className={cn(
                        "flex items-center gap-2 rounded-md border px-3 py-2.5 text-sm transition-colors",
                        checked
                          ? "border-brand bg-surface-soft text-brand-deep"
                          : "border-border text-text",
                        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-surface-soft"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggleDate(date)}
                        className="h-4 w-4 shrink-0 rounded border-border text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                      />
                      {date}
                    </label>
                  );
                })}
              </div>
            )}

            {checkoutSettingsStatus === "idle" && pickupDateOptions.length === 0 && (
              <p className="rounded-md bg-warning/10 px-4 py-3 text-sm text-warning">
                Encara no hi ha dates de recollida configurades. Contacta amb
                l&apos;equip de Facilities.
              </p>
            )}
          </fieldset>

          <div className="mt-1 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel·lar
            </Button>
            <Button type="submit" variant="primary" disabled={!canSubmit}>
              Entesos
            </Button>
          </div>
        </form>
      </div>
    </ModalShell>
  );
}

export function BuyerInfoModal() {
  const { isBuyerInfoOpen, closeBuyerInfo } = useCart();

  if (!isBuyerInfoOpen) return null;

  return <BuyerInfoModalContent onClose={closeBuyerInfo} />;
}
