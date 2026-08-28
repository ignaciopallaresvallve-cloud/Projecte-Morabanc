export type SpecialRequestFieldName =
  | "firstName"
  | "lastName"
  | "email"
  | "department"
  | "phone"
  | "productId"
  | "products"
  | "quantity"
  | "reason"
  | "comments";

export interface SpecialRequestFormState {
  status: "idle" | "success" | "error";
  error?: string;
  fieldErrors?: Partial<Record<SpecialRequestFieldName, string>>;
}

export interface SpecialRequestPrefill {
  /** Listado editable de productos y cantidades deseadas, uno por línea. */
  productsSummary: string;
  /** Cantidad total deseada (siempre > MAX_CART_UNITS). */
  quantity: number;
  /** Producte preseleccionat al desplegable, si se sap quin és en obrir el formulari. */
  productId?: string;
}

/** Producte mínim per al desplegable "Producte" del formulari de sol·licitud especial. */
export interface SpecialRequestProductOption {
  id: string;
  name: string;
  sku: string | null;
}

export type SpecialRequestStatus = "pendiente" | "aprobado" | "rechazado";

export const SPECIAL_REQUEST_STATUS_LABELS: Record<SpecialRequestStatus, string> = {
  pendiente: "Pendent",
  aprobado: "Aprovat",
  rechazado: "Rebutjat",
};

/** Dades necessàries per redactar el correu de notificació en aprovar/rebutjar. */
export interface SpecialRequestNotifyDetails {
  email: string;
  buyerName: string;
  productName: string | null;
  quantity: number;
}

/** Sol·licitud especial tal com es mostra a /admin/sol-licituds. */
export interface SpecialRequest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  phone: string | null;
  productId: string | null;
  /** Nom del producte vinculat, si encara existeix (pot ser null si es va esborrar). */
  productName: string | null;
  productSku: string | null;
  products: string;
  quantity: number;
  reason: string;
  comments: string | null;
  status: SpecialRequestStatus;
  createdAt: string;
}
