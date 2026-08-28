import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Order, OrderItemSnapshot, OrderStatus } from "@/types/order";

interface OrderRow {
  id: string;
  reference: string;
  items: OrderItemSnapshot[];
  total: number;
  status: OrderStatus;
  buyer_name: string | null;
  employee_code: string | null;
  department: string | null;
  pickup_dates: string[] | null;
  receipt_url: string | null;
  receipt_path: string | null;
  created_at: string;
}

function mapRow(row: OrderRow): Order {
  return {
    id: row.id,
    reference: row.reference,
    items: row.items,
    total: row.total,
    status: row.status,
    buyerName: row.buyer_name,
    employeeCode: row.employee_code,
    department: row.department,
    pickupDates: row.pickup_dates,
    receiptUrl: row.receipt_url,
    receiptPath: row.receipt_path,
    createdAt: row.created_at,
  };
}

export async function getOrders(): Promise<Order[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, reference, items, total, status, buyer_name, employee_code, department, pickup_dates, receipt_url, receipt_path, created_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`No s'han pogut carregar les comandes: ${error.message}`);
  }

  return ((data as OrderRow[] | null) ?? []).map(mapRow);
}
