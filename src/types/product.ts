export const PRODUCT_STATUSES = [
  { value: "disponible", label: "Disponible" },
  { value: "agotado", label: "Esgotat" },
  { value: "descatalogado", label: "Descatalogat" },
] as const;

export type ProductStatus = (typeof PRODUCT_STATUSES)[number]["value"];

const DEFAULT_PRODUCT_STATUS: ProductStatus = "disponible";

/**
 * Variantes crudas que puede tener `status` en la fila de Supabase para cada
 * estado canónico de la app. La tabla usa valores en castellano, pero puede
 * haber filas con el equivalente en catalán (p. ej. introducidas a mano
 * desde el editor de Supabase), así que se aceptan ambas.
 */
const STATUS_ALIASES: Record<ProductStatus, readonly string[]> = {
  disponible: ["disponible"],
  agotado: ["agotado", "esgotat"],
  descatalogado: ["descatalogado", "descatalogat"],
};

/** Devuelve todos los valores crudos aceptados en base de datos para un estado canónico. */
export function expandStatusAliases(status: ProductStatus): string[] {
  return [...STATUS_ALIASES[status]];
}

/**
 * Normaliza un valor de `status` recibido de Supabase a uno de los estados
 * canónicos de la app. Si llega un valor inesperado (dato corrupto, o un
 * estado todavía no contemplado), no lanza: cae a "disponible" para que la
 * página del catálogo nunca se rompa por un dato de estado desconocido.
 */
export function normalizeProductStatus(raw: string): ProductStatus {
  const normalized = raw.trim().toLowerCase();
  const match = (Object.entries(STATUS_ALIASES) as [ProductStatus, readonly string[]][]).find(
    ([, aliases]) => aliases.includes(normalized)
  );

  if (!match) {
    console.warn(`Estado de producto desconocido recibido de Supabase: "${raw}".`);
    return DEFAULT_PRODUCT_STATUS;
  }

  return match[0];
}

export const PRODUCT_CATEGORIES = [
  "Mobles",
  "Cadira",
  "Butaca",
  "Sofà",
  "Taula",
  "Armari",
  "Moble",
  "Prestatgeria",
  "Decoració",
  "Electrodomèstic",
  "Altres",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  status: ProductStatus;
  /** Fins a 10 imatges, en ordre; la primera és la imatge principal (catàleg/targeta). */
  imageUrls: string[];
  /** Rutes al bucket de Storage, mateix ordre/índex que `imageUrls`. */
  imagePaths: string[];
  /** Preu de mercat / PVP original, per mostrar l'estalvi respecte al preu de segona mà. */
  marketPrice: number | null;
  /** Codi/SKU intern del producte. */
  sku: string | null;
  weight: string | null;
  dimensions: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Forma bruta d'una fila de la taula `products` a Supabase (snake_case). */
export interface ProductRow {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  /** No tipado como `ProductStatus`: en base de datos puede llegar cualquier texto. */
  status: string;
  image_urls: string[] | null;
  image_paths: string[] | null;
  market_price: number | null;
  sku: string | null;
  weight: string | null;
  dimensions: string | null;
  created_at: string;
  updated_at: string;
}

export function mapProductRow(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    stock: row.stock,
    category: row.category,
    status: normalizeProductStatus(row.status),
    imageUrls: row.image_urls ?? [],
    imagePaths: row.image_paths ?? [],
    marketPrice: row.market_price,
    sku: row.sku,
    weight: row.weight,
    dimensions: row.dimensions,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type ProductSort = "name-asc" | "name-desc" | "price-asc" | "price-desc";

export interface ProductFilters {
  search?: string;
  category?: string;
  status?: ProductStatus;
  sort?: ProductSort;
}
