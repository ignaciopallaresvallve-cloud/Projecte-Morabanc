import type { Order, SaleLine } from "@/types/order";
import type { Product } from "@/types/product";

/**
 * Aplana les comandes en línies de venda (una per producte) i les enriqueix
 * amb les especificacions actuals del producte (sku/categoria/pes/mides),
 * que no es guarden a la comanda. Si el producte ja no existeix (esborrat
 * després de la venda), aquests camps queden a `null` en comptes de trencar
 * la pàgina.
 */
export function buildSaleLines(orders: Order[], products: Product[]): SaleLine[] {
  const productsById = new Map(products.map((product) => [product.id, product]));

  return orders.flatMap((order) =>
    order.items.map((item, index) => {
      const product = productsById.get(item.productId);

      return {
        id: `${order.id}-${item.productId}-${index}`,
        orderId: order.id,
        reference: order.reference,
        createdAt: order.createdAt,
        status: order.status,
        buyerName: order.buyerName,
        employeeCode: order.employeeCode,
        department: order.department,
        pickupDates: order.pickupDates,
        receiptUrl: order.receiptUrl,
        productName: item.name,
        sku: product?.sku ?? null,
        category: product?.category ?? null,
        weight: product?.weight ?? null,
        dimensions: product?.dimensions ?? null,
        quantity: item.quantity,
        unitPrice: item.price,
        amount: item.price * item.quantity,
      };
    })
  );
}
