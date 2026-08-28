"use client";

import { FileText, X } from "lucide-react";
import { ModalShell } from "@/components/ui/ModalShell";
import { formatDateTime, formatPrice } from "@/utils/format";
import { ORDER_STATUS_LABELS, type SaleLine } from "@/types/order";
import { STATUS_BADGE_STYLES } from "./salesHistoryStyles";
import { cn } from "@/utils/cn";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-text">{value ?? "—"}</dd>
    </div>
  );
}

export function SaleDetailModal({ sale, onClose }: { sale: SaleLine; onClose: () => void }) {
  return (
    <ModalShell onClose={onClose} labelledBy="sale-detail-title" maxWidthClassName="max-w-lg">
      <button
        type="button"
        onClick={onClose}
        aria-label="Tancar"
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-soft hover:text-text"
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>

      <div className="px-6 py-6 sm:px-8 sm:py-8">
        <div className="mb-5 flex items-start justify-between gap-4 pr-8">
          <div>
            <h2 id="sale-detail-title" className="font-heading text-lg font-bold text-brand-deep">
              {sale.productName}
            </h2>
            <p className="mt-0.5 font-mono text-sm text-text-muted">{sale.reference}</p>
          </div>
          <span
            className={cn(
              "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold",
              STATUS_BADGE_STYLES[sale.status]
            )}
          >
            {ORDER_STATUS_LABELS[sale.status]}
          </span>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-4 rounded-lg border border-border bg-surface-muted p-4">
          <DetailRow label="Data i hora" value={formatDateTime(sale.createdAt)} />
          <DetailRow
            label="Dates de recollida"
            value={sale.pickupDates && sale.pickupDates.length > 0 ? sale.pickupDates.join(", ") : "—"}
          />
          <DetailRow label="Comprador" value={sale.buyerName} />
          <DetailRow label="Codi d'empleat" value={sale.employeeCode} />
          <DetailRow label="Departament" value={sale.department} />
          <DetailRow label="Categoria" value={sale.category} />
          <DetailRow label="ID / SKU" value={sale.sku} />
          <DetailRow label="Pes" value={sale.weight} />
          <DetailRow label="Mides" value={sale.dimensions} />
        </dl>

        <div className="mt-4 flex items-center justify-between rounded-lg border border-border p-4">
          <div>
            <p className="text-xs text-text-muted">
              {sale.quantity} × {formatPrice(sale.unitPrice)}
            </p>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Import total
            </p>
          </div>
          <p className="font-heading text-xl font-bold text-brand-deep">{formatPrice(sale.amount)}</p>
        </div>

        {sale.receiptUrl && (
          <a
            href={sale.receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-brand/30 bg-surface-soft px-4 py-2.5 text-sm font-medium text-brand transition-colors hover:bg-white"
          >
            <FileText className="h-4 w-4" aria-hidden="true" />
            Veure justificant de transferència
          </a>
        )}
      </div>
    </ModalShell>
  );
}
