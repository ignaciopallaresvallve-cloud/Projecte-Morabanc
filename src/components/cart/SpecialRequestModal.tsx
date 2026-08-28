"use client";

import { useActionState, useEffect, useState } from "react";
import { CheckCircle2, FileText, X } from "lucide-react";
import { useCart } from "./CartContext";
import { fetchSpecialRequestProductOptions, submitSpecialRequest } from "@/lib/actions/specialRequest";
import { Button } from "@/components/ui/Button";
import { ModalShell } from "@/components/ui/ModalShell";
import { FormField } from "@/components/ui/FormField";
import { inputClasses, textareaClasses } from "@/components/ui/formStyles";
import { MAX_CART_UNITS } from "@/lib/constants";
import type {
  SpecialRequestFormState,
  SpecialRequestPrefill,
  SpecialRequestProductOption,
} from "@/types/specialRequest";

const initialState: SpecialRequestFormState = { status: "idle" };

interface FormValues {
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  phone: string;
  productId: string;
  products: string;
  quantity: string;
  reason: string;
  comments: string;
}

/**
 * Se monta/desmonta por completo al abrir/cerrar (ver `SpecialRequestModal`
 * más abajo), así el `useActionState` siempre arranca limpio en cada
 * apertura en lugar de arrastrar el estado de éxito de un envío anterior.
 */
function SpecialRequestModalContent({
  prefill,
  onClose,
}: {
  prefill: SpecialRequestPrefill | null;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(submitSpecialRequest, initialState);
  const [productOptions, setProductOptions] = useState<SpecialRequestProductOption[]>([]);

  useEffect(() => {
    fetchSpecialRequestProductOptions().then(setProductOptions);
  }, []);

  // Campos controlados a propósito: tras invocar una Server Action, React
  // vacía los campos no controlados del formulario aunque la acción devuelva
  // un error de validación. Mantener el valor en estado propio evita que el
  // usuario tenga que volver a escribir todo si algo falla.
  const [values, setValues] = useState<FormValues>({
    firstName: "",
    lastName: "",
    email: "",
    department: "",
    phone: "",
    productId: prefill?.productId ?? "",
    products: prefill?.productsSummary ?? "",
    quantity: String(prefill?.quantity ?? MAX_CART_UNITS + 1),
    reason: "",
    comments: "",
  });

  function updateField<K extends keyof FormValues>(field: K) {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setValues((current) => ({ ...current, [field]: event.target.value }));
    };
  }

  return (
    <ModalShell onClose={onClose} labelledBy="special-request-title">
      <button
        type="button"
        onClick={onClose}
        aria-label="Tancar el formulari"
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-soft hover:text-text"
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>

      {state.status === "success" ? (
        <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
            <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
          </div>
          <h2 id="special-request-title" className="font-heading text-lg font-bold text-brand-deep">
            Sol·licitud enviada
          </h2>
          <p className="max-w-sm text-sm text-text-muted">
            Hem rebut la teva petició especial. L&apos;equip de Facilities es
            posarà en contacte amb tu per gestionar-la.
          </p>
          <Button variant="secondary" onClick={onClose} className="mt-2">
            Tancar
          </Button>
        </div>
      ) : (
        <div className="max-h-[85vh] overflow-y-auto px-6 py-6 sm:px-8 sm:py-8">
          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-surface-soft text-brand">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="special-request-title"
                className="font-heading text-lg font-bold text-brand-deep"
              >
                Sol·licitud especial de mobiliari
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                Les sol·licituds de més de {MAX_CART_UNITS} unitats es
                gestionen de forma personalitzada. Completa aquest formulari
                i el nostre equip es posarà en contacte amb tu.
              </p>
            </div>
          </div>

          <form action={formAction} className="flex flex-col gap-5">
            {state.error && (
              <p
                role="alert"
                className="rounded-md bg-danger/10 px-4 py-3 text-sm font-medium text-danger"
              >
                {state.error}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Nom" htmlFor="firstName" error={state.fieldErrors?.firstName}>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={values.firstName}
                  onChange={updateField("firstName")}
                  className={inputClasses}
                />
              </FormField>

              <FormField label="Cognoms" htmlFor="lastName" error={state.fieldErrors?.lastName}>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={values.lastName}
                  onChange={updateField("lastName")}
                  className={inputClasses}
                />
              </FormField>

              <FormField
                label="Email corporatiu"
                htmlFor="email"
                error={state.fieldErrors?.email}
                hint="Hi enviarem la confirmació quan es resolgui la sol·licitud."
              >
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={values.email}
                  onChange={updateField("email")}
                  className={inputClasses}
                />
              </FormField>

              <FormField label="Departament" htmlFor="department" error={state.fieldErrors?.department}>
                <input
                  id="department"
                  name="department"
                  type="text"
                  required
                  value={values.department}
                  onChange={updateField("department")}
                  className={inputClasses}
                />
              </FormField>

              <FormField label="Telèfon" htmlFor="phone" optional>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={values.phone}
                  onChange={updateField("phone")}
                  className={inputClasses}
                />
              </FormField>

              <FormField
                label="Producte"
                htmlFor="productId"
                error={state.fieldErrors?.productId}
                hint="S'utilitza per descomptar l'estoc automàticament si la sol·licitud s'aprova."
              >
                <select
                  id="productId"
                  name="productId"
                  required
                  value={values.productId}
                  onChange={updateField("productId")}
                  className={inputClasses}
                >
                  <option value="" disabled>
                    Selecciona un producte
                  </option>
                  {productOptions.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                      {product.sku ? ` (${product.sku})` : ""}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Quantitat" htmlFor="quantity" error={state.fieldErrors?.quantity}>
                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min={MAX_CART_UNITS + 1}
                  step={1}
                  required
                  value={values.quantity}
                  onChange={updateField("quantity")}
                  className={inputClasses}
                />
              </FormField>
            </div>

            <FormField
              label="Productes sol·licitats"
              htmlFor="products"
              error={state.fieldErrors?.products}
            >
              <textarea
                id="products"
                name="products"
                rows={3}
                required
                value={values.products}
                onChange={updateField("products")}
                placeholder="Ex: Cadira ergonòmica Pro (x2), Taula elevable elèctrica (x2)..."
                className={textareaClasses}
              />
            </FormField>

            <FormField label="Motiu" htmlFor="reason" error={state.fieldErrors?.reason}>
              <textarea
                id="reason"
                name="reason"
                rows={2}
                required
                value={values.reason}
                onChange={updateField("reason")}
                placeholder="Ex: obertura d'una nova oficina, incorporació de diversos empleats..."
                className={textareaClasses}
              />
            </FormField>

            <FormField label="Comentaris" htmlFor="comments" optional>
              <textarea
                id="comments"
                name="comments"
                rows={2}
                value={values.comments}
                onChange={updateField("comments")}
                className={textareaClasses}
              />
            </FormField>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel·lar
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Enviant..." : "Enviar la sol·licitud"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </ModalShell>
  );
}

export function SpecialRequestModal() {
  const { isSpecialRequestOpen, specialRequestPrefill, closeSpecialRequest } = useCart();

  if (!isSpecialRequestOpen) return null;

  return (
    <SpecialRequestModalContent prefill={specialRequestPrefill} onClose={closeSpecialRequest} />
  );
}
