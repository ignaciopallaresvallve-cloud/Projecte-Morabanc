import { SalesHistoryTable } from "@/components/admin/SalesHistoryTable";
import { getOrders } from "@/services/orders";
import { getProducts } from "@/services/products";
import { buildSaleLines } from "@/lib/salesHistory";

export const metadata = {
  title: "Historial de vendes · Administració",
};

export default async function VendesPage() {
  const [orders, products] = await Promise.all([
    getOrders(),
    getProducts({ scope: "admin" }),
  ]);
  const saleLines = buildSaleLines(orders, products);

  return <SalesHistoryTable saleLines={saleLines} />;
}
