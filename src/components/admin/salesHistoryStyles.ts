import type { OrderStatus } from "@/types/order";

export const STATUS_BADGE_STYLES: Record<OrderStatus, string> = {
  pendiente_pago: "bg-warning/10 text-warning",
  pagado: "bg-success/10 text-success",
  cancelado: "bg-danger/10 text-danger",
};
