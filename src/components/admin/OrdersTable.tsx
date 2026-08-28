"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { buildCsv, downloadCsv } from "@/utils/csv";
import { formatDateTime, formatPrice } from "@/utils/format";
import { ORDER_STATUS_LABELS, type Order, type OrderItemSnapshot, type OrderStatus } from "@/types/order";
import { cn } from "@/utils/cn";
import { STATUS_BADGE_STYLES } from "./salesHistoryStyles";

const CSV_HEADERS = [
  "Referència",
  "Data i hora",
  "Nom i cognoms",
  "Codi d'empleat",
  "Departament",
  "Productes",
  "Dates de recollida",
  "Import total (€)",
  "Estat",
];

function productsSummary(items: OrderItemSnapshot[]) {
  return items.map((item) => `${item.name} (x${item.quantity})`).join(", ");
}

function pickupDatesSummary(pickupDates: string[] | null) {
  return pickupDates && pickupDates.length > 0 ? pickupDates.join(", ") : "—";
}

function orderToCsvRow(order: Order): string[] {
  return [
    order.reference,
    formatDateTime(order.createdAt),
    order.buyerName ?? "",
    order.employeeCode ?? "",
    order.department ?? "",
    productsSummary(order.items),
    order.pickupDates?.join(", ") ?? "",
    order.total.toFixed(2),
    ORDER_STATUS_LABELS[order.status],
  ];
}

/** Convierte la fila cruda que llega por Realtime (snake_case) al tipo `Order` de la app. */
function mapRealtimeRow(row: Record<string, unknown>): Order {
  return {
    id: row.id as string,
    reference: row.reference as string,
    items: row.items as OrderItemSnapshot[],
    total: row.total as number,
    status: row.status as OrderStatus,
    buyerName: (row.buyer_name as string | null) ?? null,
    employeeCode: (row.employee_code as string | null) ?? null,
    department: (row.department as string | null) ?? null,
    pickupDates: (row.pickup_dates as string[] | null) ?? null,
    receiptUrl: (row.receipt_url as string | null) ?? null,
    receiptPath: (row.receipt_path as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

export function OrdersTable({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("admin-orders-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const order = mapRealtimeRow(payload.new as Record<string, unknown>);
          setOrders((current) => {
            if (current.some((existing) => existing.id === order.id)) return current;
            return [order, ...current];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function handleExport() {
    const csv = buildCsv(CSV_HEADERS, orders.map(orderToCsvRow));
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadCsv(csv, `comandes-morabanc-office-store-${timestamp}.csv`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-deep">Comandes</h1>
          <p className="text-sm text-text-muted">
            {orders.length} {orders.length === 1 ? "comanda registrada" : "comandes registrades"}.
          </p>
        </div>
        <Button type="button" variant="secondary" onClick={handleExport} disabled={orders.length === 0}>
          <Download className="h-4 w-4" aria-hidden="true" />
          Exportar dades (Excel / CSV)
        </Button>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-16 text-center text-sm text-text-muted">
          Encara no hi ha cap comanda registrada.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-soft">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-border bg-surface-muted text-xs uppercase tracking-wide text-text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Referència</th>
                <th className="px-4 py-3 font-semibold">Data i hora</th>
                <th className="px-4 py-3 font-semibold">Comprador</th>
                <th className="px-4 py-3 font-semibold">Codi</th>
                <th className="px-4 py-3 font-semibold">Departament</th>
                <th className="px-4 py-3 font-semibold">Nom del moble</th>
                <th className="px-4 py-3 font-semibold">Dates de recollida</th>
                <th className="px-4 py-3 text-right font-semibold">Import</th>
                <th className="px-4 py-3 font-semibold">Estat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((order) => (
                <tr key={order.id} className="align-middle">
                  <td className="px-4 py-3 font-mono font-medium text-text">{order.reference}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-text-muted">
                    {formatDateTime(order.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-text">{order.buyerName ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-text-muted">{order.employeeCode ?? "—"}</td>
                  <td className="px-4 py-3 text-text-muted">{order.department ?? "—"}</td>
                  <td className="px-4 py-3 text-text-muted">{productsSummary(order.items)}</td>
                  <td className="px-4 py-3 text-text-muted">{pickupDatesSummary(order.pickupDates)}</td>
                  <td className="px-4 py-3 text-right font-medium text-text">
                    {formatPrice(order.total)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                        STATUS_BADGE_STYLES[order.status]
                      )}
                    >
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
