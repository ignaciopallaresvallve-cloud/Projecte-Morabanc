"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getPaymentSettings } from "@/services/paymentSettings";
import { MAX_CART_UNITS } from "@/lib/constants";
import type { BuyerInfo, CreateOrderResult, OrderItemSnapshot, PaymentSettings } from "@/types/order";

const EMPLOYEE_CODE_LENGTH = 4;
const PICKUP_DATES_REQUIRED = 2;

function generateOrderReference() {
  const raw = crypto.randomUUID().replace(/-/g, "").toUpperCase();
  return `MB-${raw.slice(0, 6)}`;
}

/**
 * Ajustos de pagament (dades bancàries + opcions de data de recollida) per
 * al pas "Dades del comprador i recollida" del checkout, abans de registrar
 * cap comanda. `getPaymentSettings` és un servei `server-only`, no
 * invocable directament des d'un component client: aquest embolcall és el
 * que el fa accessible com a Server Action.
 */
export async function fetchCheckoutSettings(): Promise<PaymentSettings> {
  return getPaymentSettings();
}

export async function createOrder(
  items: OrderItemSnapshot[],
  buyerInfo: BuyerInfo
): Promise<CreateOrderResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error: "El registre de sol·licituds encara no està disponible (Supabase no configurat).",
    };
  }

  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: "La cistella està buida." };
  }

  // Nunca se confía en el total calculado en el cliente: se recalcula aquí a
  // partir de los precios recibidos, igual que se revalida el límite de
  // unidades, aunque esta web nunca cobra nada (es solo el importe que se
  // mostrará como referencia para la transferencia).
  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);
  if (totalUnits > MAX_CART_UNITS) {
    return {
      ok: false,
      error: `No es poden sol·licitar més de ${MAX_CART_UNITS} unitats per comanda.`,
    };
  }

  if (items.some((item) => item.quantity <= 0 || item.price < 0)) {
    return { ok: false, error: "La cistella conté dades no vàlides." };
  }

  // Las Server Actions son alcanzables por POST directo, no solo desde el
  // formulario del paso 1: se revalida aquí lo mismo que ya valida el
  // formulario en el cliente.
  const buyerName = buyerInfo.buyerName?.trim() ?? "";
  const employeeCode = buyerInfo.employeeCode?.trim() ?? "";
  const department = buyerInfo.department?.trim() ?? "";
  const pickupDates = Array.isArray(buyerInfo.pickupDates) ? buyerInfo.pickupDates : [];

  if (buyerName.length < 2 || buyerName.length > 150) {
    return { ok: false, error: "Introdueix el nom i cognoms del comprador." };
  }
  if (employeeCode.length !== EMPLOYEE_CODE_LENGTH) {
    return {
      ok: false,
      error: `El codi d'empleat ha de tenir exactament ${EMPLOYEE_CODE_LENGTH} caràcters.`,
    };
  }
  if (department.length < 2 || department.length > 100) {
    return { ok: false, error: "Introdueix el departament." };
  }
  if (pickupDates.length !== PICKUP_DATES_REQUIRED) {
    return {
      ok: false,
      error: `Selecciona exactament ${PICKUP_DATES_REQUIRED} dates de recollida.`,
    };
  }

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const reference = generateOrderReference();

  const supabase = await createClient();

  // `place_order` descuenta el stock de cada línea, guarda los datos del
  // comprador y crea el pedido dentro de la misma transacción en base de
  // datos (ver supabase/migrations/20260818120000_checkout_buyer_info_and_pickup_dates.sql):
  // si falta stock de cualquier producto, no se descuenta nada y no se crea
  // el pedido. La lectura de los ajustes de pago es independiente, así que
  // se lanza en paralelo para no encadenar dos idas y vueltas a Supabase.
  const [{ error }, paymentSettings] = await Promise.all([
    supabase.rpc("place_order", {
      p_reference: reference,
      p_items: items,
      p_total: total,
      p_buyer_name: buyerName,
      p_employee_code: employeeCode,
      p_department: department,
      p_pickup_dates: pickupDates,
    }),
    getPaymentSettings(),
  ]);

  if (error) {
    const insufficientStockMatch = error.message.match(/INSUFFICIENT_STOCK:\s*(.+)/);
    if (insufficientStockMatch) {
      return {
        ok: false,
        error: `No queda prou estoc de «${insufficientStockMatch[1].trim()}». Actualitza la cistella i torna-ho a provar.`,
      };
    }
    return { ok: false, error: `No s'ha pogut registrar la comanda: ${error.message}` };
  }

  return {
    ok: true,
    order: { reference, total, items },
    paymentSettings,
  };
}

/**
 * Marca una comanda com a pagada (de 'pendiente_pago' a 'pagado') en clicar
 * "Entesos" a la pantalla de dades bancàries. No es concedeix `update`
 * directe sobre `orders` a `anon`: passa per la funció RPC
 * `confirm_order_payment` (`SECURITY DEFINER`), que només toca `status` de
 * la fila amb aquesta referència, res més.
 */
export async function confirmOrderPayment(reference: string): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase no configurat." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("confirm_order_payment", {
    p_reference: reference,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
