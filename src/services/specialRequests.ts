import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { SpecialRequest, SpecialRequestStatus } from "@/types/specialRequest";

interface SpecialRequestRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  phone: string | null;
  product_id: string | null;
  products: string;
  quantity: number;
  reason: string;
  comments: string | null;
  status: SpecialRequestStatus;
  created_at: string;
  // Embedding d'una relació a-un via FK: PostgREST el retorna com un objecte
  // (no un array) quan la columna local (`product_id`) és la que porta la FK.
  products_ref: { name: string; sku: string | null } | null;
}

function mapRow(row: SpecialRequestRow): SpecialRequest {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    department: row.department,
    phone: row.phone,
    productId: row.product_id,
    productName: row.products_ref?.name ?? null,
    productSku: row.products_ref?.sku ?? null,
    products: row.products,
    quantity: row.quantity,
    reason: row.reason,
    comments: row.comments,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function getSpecialRequests(): Promise<SpecialRequest[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("special_requests")
    .select(
      "id, first_name, last_name, email, department, phone, product_id, products, quantity, reason, comments, status, created_at, products_ref:products(name, sku)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`No s'han pogut carregar les sol·licituds especials: ${error.message}`);
  }

  return ((data as unknown as SpecialRequestRow[] | null) ?? []).map(mapRow);
}
