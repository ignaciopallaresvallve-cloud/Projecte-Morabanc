import { OrdersTable } from "@/components/admin/OrdersTable";
import { getOrders } from "@/services/orders";

export const metadata = {
  title: "Comandes · Administració",
};

export default async function ComandesPage() {
  const orders = await getOrders();

  return <OrdersTable initialOrders={orders} />;
}
