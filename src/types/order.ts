export interface OrderItemSnapshot {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface PaymentSettings {
  accountHolder: string;
  iban: string;
  paymentConcept: string;
  swiftBic: string;
  /** Les 4 opcions de data de recollida oferides al pas "Dades del comprador i recollida". */
  pickupDateOptions: string[];
  /**
   * Segon joc de 4 dates de recollida ("Segona Tanda"), que el comprador
   * pot triar en comptes del primer. No té relació amb `isDiscountActive`
   * (aquell és el descompte "Segona Tanda" de preus, independent d'això).
   */
  pickupDateOptionsSecondTanda: string[];
  /** Si hi ha un descompte "Segona tanda" del 20% aplicat ara mateix a tot el catàleg. */
  isDiscountActive: boolean;
}

/** Dades recollides al pas "Dades del comprador i recollida" del checkout. */
export interface BuyerInfo {
  buyerName: string;
  employeeCode: string;
  department: string;
  /** Exactament 2 de les `pickupDateOptions`. */
  pickupDates: string[];
}

export interface CreatedOrder {
  reference: string;
  total: number;
  items: OrderItemSnapshot[];
}

export interface CreateOrderResult {
  ok: boolean;
  error?: string;
  order?: CreatedOrder;
  paymentSettings?: PaymentSettings;
}

export interface PaymentSettingsFormState {
  error?: string;
  success?: boolean;
  fieldErrors?: Partial<
    Record<
      "accountHolder" | "iban" | "paymentConcept" | "swiftBic" | "pickupDates" | "pickupDatesSecondTanda",
      string
    >
  >;
}

export type OrderStatus = "pendiente_pago" | "pagado" | "cancelado";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pendiente_pago: "Pendent",
  pagado: "Confirmat",
  cancelado: "Cancel·lat",
};

/** Comanda tal com es mostra al llistat de /admin/comandes. */
export interface Order {
  id: string;
  reference: string;
  items: OrderItemSnapshot[];
  total: number;
  status: OrderStatus;
  buyerName: string | null;
  employeeCode: string | null;
  department: string | null;
  pickupDates: string[] | null;
  /** URL (signada, llarga durada) del justificant de transferència adjuntat pel comprador, si n'hi ha. */
  receiptUrl: string | null;
  /** Ruta al bucket privat `transfer-receipts`, per si cal regenerar la URL signada. */
  receiptPath: string | null;
  createdAt: string;
}

/**
 * Una línia de producte venut, tal com es mostra a l'historial de vendes
 * (/admin/vendes): una comanda amb N productes genera N `SaleLine`. Les
 * especificacions del producte (sku/categoria/pes/mides) s'agafen de la
 * fitxa actual del producte, no de la comanda: si el producte s'ha esborrat
 * després de la venda, aquests camps queden a `null`.
 */
export interface SaleLine {
  id: string;
  orderId: string;
  reference: string;
  createdAt: string;
  status: OrderStatus;
  buyerName: string | null;
  employeeCode: string | null;
  department: string | null;
  pickupDates: string[] | null;
  receiptUrl: string | null;
  productName: string;
  sku: string | null;
  category: string | null;
  weight: string | null;
  dimensions: string | null;
  quantity: number;
  unitPrice: number;
  amount: number;
}
