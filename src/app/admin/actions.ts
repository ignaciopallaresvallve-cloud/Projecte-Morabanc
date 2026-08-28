"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { PRODUCT_CATEGORIES, PRODUCT_STATUSES, type ProductStatus } from "@/types/product";
import { isValidAndorranIban, normalizeIban } from "@/utils/iban";
import { isValidSwiftBic, normalizeSwiftBic } from "@/utils/swiftBic";
import { MAX_PRODUCT_IMAGES } from "@/lib/constants";

const PICKUP_DATE_OPTIONS_COUNT = 4;
import type { PaymentSettingsFormState } from "@/types/order";

const PRODUCT_IMAGES_BUCKET = "product-images";

export interface ProductFormState {
  error?: string;
  fieldErrors?: Partial<
    Record<
      | "name"
      | "description"
      | "price"
      | "stock"
      | "category"
      | "status"
      | "images"
      | "marketPrice"
      | "sku"
      | "weight"
      | "dimensions",
      string
    >
  >;
}

interface ProductImageInput {
  url: string;
  path: string;
}

interface ParsedProductForm {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  status: ProductStatus;
  images: ProductImageInput[];
  marketPrice: number | null;
  sku: string | null;
  weight: string | null;
  dimensions: string | null;
}

/**
 * Las imágenes ya se han subido a Storage desde el cliente (ver
 * `ProductForm`) antes de llegar aquí: el límite por defecto del cuerpo de
 * una Server Action es demasiado bajo para 10 imágenes a la vez. El
 * formulario envía solo la URL/ruta final de cada una, como JSON.
 */
function parseImagesField(formData: FormData): ProductImageInput[] | null {
  const raw = formData.get("images");
  if (typeof raw !== "string") return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!Array.isArray(parsed)) return null;
  const isValidShape = parsed.every(
    (item): item is ProductImageInput =>
      Boolean(item) && typeof item.url === "string" && typeof item.path === "string"
  );

  return isValidShape ? (parsed as ProductImageInput[]) : null;
}

function isProductImageUrlValid(url: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return false;
  return url.startsWith(`${supabaseUrl}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`);
}

function parseProductForm(formData: FormData): { data: ParsedProductForm } | { error: ProductFormState } {
  const fieldErrors: NonNullable<ProductFormState["fieldErrors"]> = {};

  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2 || name.length > 120) {
    fieldErrors.name = "El nom ha de tenir entre 2 i 120 caràcters.";
  }

  const description = String(formData.get("description") ?? "").trim();
  if (description.length > 1000) {
    fieldErrors.description = "La descripció no pot superar els 1000 caràcters.";
  }

  const priceRaw = String(formData.get("price") ?? "").replace(",", ".");
  const price = Number.parseFloat(priceRaw);
  if (!Number.isFinite(price) || price < 0) {
    fieldErrors.price = "Introdueix un preu vàlid (0 o superior).";
  }

  const stockRaw = String(formData.get("stock") ?? "");
  const stock = Number.parseInt(stockRaw, 10);
  if (!Number.isInteger(stock) || stock < 0) {
    fieldErrors.stock = "Introdueix una quantitat vàlida (0 o superior).";
  }

  const category = String(formData.get("category") ?? "");
  if (!PRODUCT_CATEGORIES.includes(category as (typeof PRODUCT_CATEGORIES)[number])) {
    fieldErrors.category = "Selecciona una categoria vàlida.";
  }

  const status = String(formData.get("status") ?? "");
  if (!PRODUCT_STATUSES.some((item) => item.value === status)) {
    fieldErrors.status = "Selecciona un estat vàlid.";
  }

  const images = parseImagesField(formData);
  if (!images || images.length > MAX_PRODUCT_IMAGES) {
    fieldErrors.images = `Pots pujar fins a ${MAX_PRODUCT_IMAGES} imatges.`;
  } else if (!images.every((image) => isProductImageUrlValid(image.url))) {
    fieldErrors.images = "Alguna imatge no és vàlida. Torna-ho a provar.";
  }

  // Camps opcionals: buits és vàlid (queden a null), només es valida el
  // format quan l'admin ha escrit alguna cosa.
  const marketPriceRaw = String(formData.get("marketPrice") ?? "").trim().replace(",", ".");
  let marketPrice: number | null = null;
  if (marketPriceRaw) {
    const parsedMarketPrice = Number.parseFloat(marketPriceRaw);
    if (!Number.isFinite(parsedMarketPrice) || parsedMarketPrice < 0) {
      fieldErrors.marketPrice = "Introdueix un preu de mercat vàlid (0 o superior).";
    } else {
      marketPrice = parsedMarketPrice;
    }
  }

  const sku = String(formData.get("sku") ?? "").trim() || null;
  if (sku && sku.length > 100) {
    fieldErrors.sku = "El codi no pot superar els 100 caràcters.";
  }

  const weight = String(formData.get("weight") ?? "").trim() || null;
  if (weight && weight.length > 50) {
    fieldErrors.weight = "El pes no pot superar els 50 caràcters.";
  }

  const dimensions = String(formData.get("dimensions") ?? "").trim() || null;
  if (dimensions && dimensions.length > 100) {
    fieldErrors.dimensions = "Les mides no poden superar els 100 caràcters.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { error: { error: "Revisa els camps marcats en vermell.", fieldErrors } };
  }

  return {
    data: {
      name,
      description,
      price,
      stock,
      category,
      status: status as ProductStatus,
      images: images!,
      marketPrice,
      sku,
      weight,
      dimensions,
    },
  };
}

function parseRemovedImagePaths(formData: FormData): string[] {
  const raw = formData.get("removedImagePaths");
  if (typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((path): path is string => typeof path === "string") : [];
  } catch {
    return [];
  }
}

async function deleteProductImage(supabase: SupabaseClient, path: string | null | undefined) {
  if (!path) return;
  await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([path]);
}

export async function createProduct(
  _prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  await requireUser();

  const parsed = parseProductForm(formData);
  if ("error" in parsed) return parsed.error;
  const { images, marketPrice, sku, weight, dimensions, ...values } = parsed.data;

  const supabase = await createClient();

  const { error } = await supabase.from("products").insert({
    ...values,
    image_urls: images.map((image) => image.url),
    image_paths: images.map((image) => image.path),
    market_price: marketPrice,
    sku,
    weight,
    dimensions,
  });

  if (error) {
    // La inserción falló pero las imágenes ya se subieron desde el cliente:
    // hay que limpiarlas para no dejar archivos huérfanos en Storage.
    await Promise.all(images.map((image) => deleteProductImage(supabase, image.path)));
    return { error: `No s'ha pogut crear el producte: ${error.message}` };
  }

  revalidatePath("/catalogo");
  revalidatePath("/admin");
  redirect("/admin?toast=created");
}

export async function updateProduct(
  _prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  await requireUser();

  const id = String(formData.get("id") ?? "");
  if (!id) {
    return { error: "Producte no vàlid." };
  }

  const parsed = parseProductForm(formData);
  if ("error" in parsed) return parsed.error;
  const { images, marketPrice, sku, weight, dimensions, ...values } = parsed.data;
  const removedImagePaths = parseRemovedImagePaths(formData);

  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .update({
      ...values,
      image_urls: images.map((image) => image.url),
      image_paths: images.map((image) => image.path),
      market_price: marketPrice,
      sku,
      weight,
      dimensions,
    })
    .eq("id", id);

  if (error) {
    return { error: `No s'ha pogut actualitzar el producte: ${error.message}` };
  }

  if (removedImagePaths.length > 0) {
    await Promise.all(removedImagePaths.map((path) => deleteProductImage(supabase, path)));
  }

  revalidatePath("/catalogo");
  revalidatePath("/admin");
  redirect("/admin?toast=updated");
}

export interface DeleteProductState {
  error?: string;
  success?: boolean;
}

export async function deleteProduct(
  _prevState: DeleteProductState,
  formData: FormData
): Promise<DeleteProductState> {
  await requireUser();

  const id = String(formData.get("id") ?? "");
  if (!id) {
    return { error: "Producte no vàlid." };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("products")
    .select("image_paths")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    return { error: `No s'ha pogut eliminar el producte: ${error.message}` };
  }

  const paths = (existing?.image_paths as string[] | null) ?? [];
  await Promise.all(paths.map((path) => deleteProductImage(supabase, path)));

  revalidatePath("/catalogo");
  revalidatePath("/admin");
  return { success: true };
}

export async function updatePaymentSettings(
  _prevState: PaymentSettingsFormState,
  formData: FormData
): Promise<PaymentSettingsFormState> {
  await requireUser();

  const fieldErrors: NonNullable<PaymentSettingsFormState["fieldErrors"]> = {};

  const accountHolder = String(formData.get("accountHolder") ?? "").trim();
  if (accountHolder.length < 2 || accountHolder.length > 150) {
    fieldErrors.accountHolder = "Introdueix el titular del compte.";
  }

  const ibanRaw = String(formData.get("iban") ?? "");
  const iban = normalizeIban(ibanRaw);
  if (!isValidAndorranIban(iban)) {
    fieldErrors.iban =
      "L'IBAN no és vàlid. Ha de ser un IBAN d'Andorra (comença per «AD» i té 24 caràcters).";
  }

  const paymentConcept = String(formData.get("paymentConcept") ?? "").trim();
  if (paymentConcept.length < 2 || paymentConcept.length > 200) {
    fieldErrors.paymentConcept = "Introdueix el concepte de pagament.";
  }

  const swiftBic = normalizeSwiftBic(String(formData.get("swiftBic") ?? ""));
  if (!isValidSwiftBic(swiftBic)) {
    fieldErrors.swiftBic = "El SWIFT/BIC no és vàlid (8 u 11 caràcters).";
  }

  const pickupDates = Array.from({ length: PICKUP_DATE_OPTIONS_COUNT }, (_, index) =>
    String(formData.get(`pickupDate${index}`) ?? "").trim()
  );
  if (pickupDates.some((date) => date.length === 0)) {
    fieldErrors.pickupDates = "Omple les 4 dates de recollida.";
  }

  const pickupDatesSecondTanda = Array.from({ length: PICKUP_DATE_OPTIONS_COUNT }, (_, index) =>
    String(formData.get(`pickupDateSecondTanda${index}`) ?? "").trim()
  );
  if (pickupDatesSecondTanda.some((date) => date.length === 0)) {
    fieldErrors.pickupDatesSecondTanda = "Omple les 4 dates de recollida de la Segona Tanda.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Revisa els camps marcats en vermell.", fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("payment_settings")
    .update({
      account_holder: accountHolder,
      iban,
      payment_concept: paymentConcept,
      swift_bic: swiftBic,
      pickup_dates: pickupDates,
      pickup_dates_second_tanda: pickupDatesSecondTanda,
    })
    .eq("id", 1);

  if (error) {
    return { error: `No s'han pogut desar els ajustos: ${error.message}` };
  }

  revalidatePath("/admin/pagos");
  return { success: true };
}

export interface ApplyDiscountState {
  error?: string;
  success?: boolean;
  updatedCount?: number;
}

const SECOND_BATCH_DISCOUNT_PERCENTAGE = 20;

/**
 * "Segona Tanda": aplica un descompte global del 20% al preu de tots els
 * productes del catàleg. `useActionState` exige la firma (state, formData),
 * aunque esta acción no necesite ninguno de los dos parámetros.
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
export async function applySecondBatchDiscount(
  _prevState: ApplyDiscountState,
  _formData: FormData
): Promise<ApplyDiscountState> {
  /* eslint-enable @typescript-eslint/no-unused-vars */
  await requireUser();

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("apply_bulk_price_discount", {
    p_percentage: SECOND_BATCH_DISCOUNT_PERCENTAGE,
  });

  if (error) {
    const message = error.message.includes("DISCOUNT_ALREADY_ACTIVE")
      ? "Ja hi ha un descompte actiu. Restableix els preus abans d'aplicar-ne un altre."
      : `No s'ha pogut aplicar el descompte: ${error.message}`;
    return { error: message };
  }

  revalidatePath("/catalogo");
  revalidatePath("/admin");

  return { success: true, updatedCount: data as number };
}

/**
 * "Restablir preus": torna tots els productes al seu preu original i
 * desactiva el descompte "Segona Tanda". `useActionState` exige la firma
 * (state, formData), aunque esta acción no necesite ninguno de los dos.
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
export async function resetProductPrices(
  _prevState: ApplyDiscountState,
  _formData: FormData
): Promise<ApplyDiscountState> {
  /* eslint-enable @typescript-eslint/no-unused-vars */
  await requireUser();

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("reset_product_prices");

  if (error) {
    const message = error.message.includes("DISCOUNT_NOT_ACTIVE")
      ? "No hi ha cap descompte actiu per restablir."
      : `No s'han pogut restablir els preus: ${error.message}`;
    return { error: message };
  }

  revalidatePath("/catalogo");
  revalidatePath("/admin");

  return { success: true, updatedCount: data as number };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
