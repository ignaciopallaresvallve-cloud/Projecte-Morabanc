"use client";

import { useCart } from "@/components/cart/CartContext";
import type { Product } from "@/types/product";

export function ProductStockLabel({ product }: { product: Product }) {
  const { items } = useCart();

  if (product.status === "agotado") return <>Sense estoc</>;
  if (product.stock <= 0) return <>Consulta la disponibilitat</>;

  const qtyInCart = items.find((item) => item.productId === product.id)?.quantity ?? 0;
  const remaining = Math.max(0, product.stock - qtyInCart);

  if (remaining <= 0) return <>Sense més estoc disponible.</>;
  if (remaining === 1) return <>Última unitat disponible</>;
  return <>{remaining} unitats disponibles</>;
}
