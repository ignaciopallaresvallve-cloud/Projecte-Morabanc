export interface CartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  category: string;
  /** Stock disponible del producto en el momento de añadirlo, usado como tope. */
  stock: number;
  quantity: number;
}

export interface CartProductInput {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  category: string;
  stock: number;
}

export type CartLimitReason = "limit" | "stock";

export interface CartMutationResult {
  ok: boolean;
  appliedQuantity: number;
  reason?: CartLimitReason;
}
