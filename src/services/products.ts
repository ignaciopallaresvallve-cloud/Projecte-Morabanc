import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  mapProductRow,
  type Product,
  type ProductFilters,
  type ProductRow,
} from "@/types/product";

/** Elimina caracteres especiales de PostgREST/ILIKE para evitar romper el filtro. */
function sanitizeSearchTerm(term: string) {
  return term.replace(/[%_,()]/g, " ").trim();
}

interface GetProductsOptions extends ProductFilters {
  /** "public" oculta los productos descatalogados (catálogo); "admin" los incluye todos. */
  scope?: "public" | "admin";
}

export async function getProducts(options: GetProductsOptions = {}): Promise<Product[]> {
  const { search, category, status, sort, scope = "public" } = options;
  const supabase = await createClient();

  let query = supabase.from("products").select("*");

  // El filtro de `status` no se aplica en SQL a propósito: en Supabase la
  // columna es un enum de Postgres, y comparar contra un valor que no forme
  // parte de sus etiquetas (p. ej. si la base de datos quedó con las
  // etiquetas en catalán mientras el código sigue usando las de castellano)
  // hace que Postgres lance "invalid input value for enum" y rompa toda la
  // consulta. Filtrar en memoria, sobre el valor ya normalizado por
  // `mapProductRow`, evita depender de qué etiquetas concretas tenga el enum.

  if (category) {
    query = query.eq("category", category);
  }

  const term = search ? sanitizeSearchTerm(search) : "";
  if (term) {
    query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
  }

  switch (sort) {
    case "name-asc":
      query = query.order("name", { ascending: true });
      break;
    case "name-desc":
      query = query.order("name", { ascending: false });
      break;
    case "price-asc":
      query = query.order("price", { ascending: true });
      break;
    case "price-desc":
      query = query.order("price", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`No s'han pogut carregar els productes: ${error.message}`);
  }

  let products = ((data as ProductRow[] | null) ?? []).map(mapProductRow);

  if (scope === "public") {
    products = products.filter((product) => product.status !== "descatalogado");
  }

  if (status) {
    products = products.filter((product) => product.status === status);
  }

  return products;
}

export async function getProductById(id: string): Promise<Product | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`No s'ha pogut carregar el producte: ${error.message}`);
  }

  return data ? mapProductRow(data as ProductRow) : null;
}
