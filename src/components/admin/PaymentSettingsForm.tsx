"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { inputClasses } from "@/components/ui/formStyles";
import { updatePaymentSettings } from "@/app/admin/actions";
import type { PaymentSettings, PaymentSettingsFormState } from "@/types/order";

const initialState: PaymentSettingsFormState = {};
const PICKUP_DATE_OPTIONS_COUNT = 4;

export function PaymentSettingsForm({ settings }: { settings: PaymentSettings }) {
  const [state, formAction, pending] = useActionState(updatePaymentSettings, initialState);
  const pickupDates = Array.from(
    { length: PICKUP_DATE_OPTIONS_COUNT },
    (_, index) => settings.pickupDateOptions[index] ?? ""
  );
  const pickupDatesSecondTanda = Array.from(
    { length: PICKUP_DATE_OPTIONS_COUNT },
    (_, index) => settings.pickupDateOptionsSecondTanda[index] ?? ""
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.error && (
        <p role="alert" className="rounded-md bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
          {state.error}
        </p>
      )}

      {state.success && (
        <p className="flex items-center gap-2 rounded-md bg-success/10 px-4 py-3 text-sm font-medium text-success">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Ajustos desats correctament.
        </p>
      )}

      <FormField
        label="Titular del compte"
        htmlFor="accountHolder"
        error={state.fieldErrors?.accountHolder}
      >
        <input
          id="accountHolder"
          name="accountHolder"
          type="text"
          required
          defaultValue={settings.accountHolder}
          placeholder="Ex: MoraBanc, SA"
          className={inputClasses}
        />
      </FormField>

      <FormField label="IBAN" htmlFor="iban" error={state.fieldErrors?.iban}>
        <input
          id="iban"
          name="iban"
          type="text"
          required
          defaultValue={settings.iban}
          placeholder="Ex: AD12 0001 2030 2003 5910 0100"
          className={`${inputClasses} font-mono`}
        />
      </FormField>

      <FormField label="SWIFT / BIC" htmlFor="swiftBic" error={state.fieldErrors?.swiftBic}>
        <input
          id="swiftBic"
          name="swiftBic"
          type="text"
          required
          defaultValue={settings.swiftBic}
          placeholder="Ex: MORAADAD"
          className={`${inputClasses} font-mono uppercase`}
        />
      </FormField>

      <FormField
        label="Concepte de pagament"
        htmlFor="paymentConcept"
        error={state.fieldErrors?.paymentConcept}
        hint={`Es mostrarà juntament amb el número de sol·licitud, perquè puguis identificar cada transferència (ex. «${settings.paymentConcept || "..."} — MB-A1B2C3»).`}
      >
        <input
          id="paymentConcept"
          name="paymentConcept"
          type="text"
          required
          defaultValue={settings.paymentConcept}
          placeholder="Ex: Mobiliari MoraBanc Office Store"
          className={inputClasses}
        />
      </FormField>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium text-text">
          Dates de recollida disponibles — Primera Tanda
        </legend>
        <p className="text-xs text-text-muted">
          Aquestes 4 opcions es mostren per defecte als empleats perquè
          triïn 2 dates en finalitzar una sol·licitud.
        </p>
        {state.fieldErrors?.pickupDates && (
          <p className="text-xs font-medium text-danger">{state.fieldErrors.pickupDates}</p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {pickupDates.map((date, index) => (
            <FormField key={index} label={`Data ${index + 1}`} htmlFor={`pickupDate${index}`}>
              <input
                id={`pickupDate${index}`}
                name={`pickupDate${index}`}
                type="text"
                required
                defaultValue={date}
                placeholder="Ex: 20/08"
                className={inputClasses}
              />
            </FormField>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium text-text">
          Dates de recollida disponibles — Segona Tanda
        </legend>
        <p className="text-xs text-text-muted">
          L&apos;empleat pot canviar a aquestes 4 dates alternatives amb el
          botó &quot;Segona Tanda&quot; al pas de dades del comprador.
        </p>
        {state.fieldErrors?.pickupDatesSecondTanda && (
          <p className="text-xs font-medium text-danger">
            {state.fieldErrors.pickupDatesSecondTanda}
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {pickupDatesSecondTanda.map((date, index) => (
            <FormField
              key={index}
              label={`Data ${index + 1}`}
              htmlFor={`pickupDateSecondTanda${index}`}
            >
              <input
                id={`pickupDateSecondTanda${index}`}
                name={`pickupDateSecondTanda${index}`}
                type="text"
                required
                defaultValue={date}
                placeholder="Ex: 27/08"
                className={inputClasses}
              />
            </FormField>
          ))}
        </div>
      </fieldset>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Desant..." : "Desar ajustos"}
        </Button>
      </div>
    </form>
  );
}
