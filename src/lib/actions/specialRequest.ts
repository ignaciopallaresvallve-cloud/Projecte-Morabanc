"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getProducts } from "@/services/products";
import { sendEmail } from "@/lib/email/resend";
import {
  buildSpecialRequestApprovedEmail,
  buildSpecialRequestRejectedEmail,
} from "@/lib/email/specialRequestTemplates";
import { MAX_CART_UNITS } from "@/lib/constants";
import type {
  SpecialRequestFormState,
  SpecialRequestNotifyDetails,
  SpecialRequestProductOption,
} from "@/types/specialRequest";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Llista de productes per al desplegable "Producte" del formulari. És una
 * Server Action perquè `SpecialRequestModal` és un component client muntat
 * globalment (des de `CartProvider`), no una pàgina amb accés directe al
 * servei `getProducts` (`server-only`).
 */
export async function fetchSpecialRequestProductOptions(): Promise<SpecialRequestProductOption[]> {
  if (!isSupabaseConfigured()) return [];

  const products = await getProducts({ sort: "name-asc" });
  return products.map((product) => ({ id: product.id, name: product.name, sku: product.sku }));
}

export async function submitSpecialRequest(
  _prevState: SpecialRequestFormState,
  formData: FormData
): Promise<SpecialRequestFormState> {
  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      error: "L'enviament de sol·licituds encara no està disponible (Supabase no configurat).",
    };
  }

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const department = String(formData.get("department") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const productId = String(formData.get("productId") ?? "").trim();
  const products = String(formData.get("products") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const comments = String(formData.get("comments") ?? "").trim();
  const quantityRaw = String(formData.get("quantity") ?? "");
  const quantity = Number.parseInt(quantityRaw, 10);

  const fieldErrors: NonNullable<SpecialRequestFormState["fieldErrors"]> = {};

  if (firstName.length < 2 || firstName.length > 100) {
    fieldErrors.firstName = "Introdueix el teu nom.";
  }
  if (lastName.length < 2 || lastName.length > 100) {
    fieldErrors.lastName = "Introdueix els teus cognoms.";
  }
  if (!EMAIL_PATTERN.test(email)) {
    fieldErrors.email = "Introdueix un correu electrònic vàlid.";
  }
  if (department.length < 2 || department.length > 100) {
    fieldErrors.department = "Indica el teu departament.";
  }
  if (!productId) {
    fieldErrors.productId = "Selecciona el producte principal de la sol·licitud.";
  }
  if (!products) {
    fieldErrors.products = "Indica els productes i les quantitats sol·licitades.";
  }
  if (!Number.isInteger(quantity) || quantity <= MAX_CART_UNITS) {
    fieldErrors.quantity = `Indica una quantitat superior a ${MAX_CART_UNITS} unitats.`;
  }
  if (!reason) {
    fieldErrors.reason = "Indica el motiu de la sol·licitud.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      error: "Revisa els camps marcats en vermell.",
      fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("special_requests").insert({
    first_name: firstName,
    last_name: lastName,
    email,
    department,
    phone: phone || null,
    product_id: productId,
    products,
    quantity,
    reason,
    comments: comments || null,
  });

  if (error) {
    return {
      status: "error",
      error: `No s'ha pogut enviar la sol·licitud: ${error.message}`,
    };
  }

  return { status: "success" };
}

interface ActionResult {
  ok: boolean;
  error?: string;
  /**
   * L'acció principal (aprovar/rebutjar) ha anat bé encara que el correu
   * de notificació falli — el correu és un "best effort", no bloqueja
   * l'acció de l'admin. Si hi ha un error aquí, cal avisar-lo igualment.
   */
  emailError?: string;
}

/**
 * Aprova una sol·licitud especial: si té un producte vinculat, en descompta
 * l'estoc de forma atòmica (falla si no n'hi ha prou, en comptes de deixar
 * estoc negatiu). Passa per la funció RPC `approve_special_request`
 * (`SECURITY DEFINER`, només `authenticated`), no per un `update` directe.
 * En cas d'èxit, envia un correu de notificació al comprador — les dades
 * (`details`) les passa el client, que ja les té totes carregades a la
 * taula, per no haver de tornar a consultar la fila.
 */
export async function approveSpecialRequest(
  id: string,
  details: SpecialRequestNotifyDetails
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("approve_special_request", { p_id: id });

  if (error) {
    if (error.message.includes("INSUFFICIENT_STOCK")) {
      return {
        ok: false,
        error: "No queda prou estoc del producte per aprovar aquesta quantitat.",
      };
    }
    return { ok: false, error: error.message };
  }

  const { subject, html } = buildSpecialRequestApprovedEmail(details);
  const emailResult = await sendEmail({ to: details.email, subject, html });

  return { ok: true, emailError: emailResult.ok ? undefined : emailResult.error };
}

/**
 * Rebutja una sol·licitud especial. No toca l'estoc. En cas d'èxit, envia
 * un correu de notificació al comprador (best effort, igual que en
 * l'aprovació).
 */
export async function rejectSpecialRequest(
  id: string,
  details: SpecialRequestNotifyDetails
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("reject_special_request", { p_id: id });

  if (error) {
    return { ok: false, error: error.message };
  }

  const { subject, html } = buildSpecialRequestRejectedEmail(details);
  const emailResult = await sendEmail({ to: details.email, subject, html });

  return { ok: true, emailError: emailResult.ok ? undefined : emailResult.error };
}
