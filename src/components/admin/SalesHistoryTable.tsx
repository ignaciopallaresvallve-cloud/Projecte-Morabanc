"use client";

import { useMemo, useState } from "react";
import { Download, Eye, Search, ShoppingBag, Wallet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { inputClasses } from "@/components/ui/formStyles";
import { buildCsv, downloadCsv } from "@/utils/csv";
import { formatDateTime, formatPrice } from "@/utils/format";
import { ORDER_STATUS_LABELS, type SaleLine } from "@/types/order";
import { STATUS_BADGE_STYLES } from "./salesHistoryStyles";
import { SaleDetailModal } from "./SaleDetailModal";
import { cn } from "@/utils/cn";

const CSV_HEADERS = [
  "Codi de comanda",
  "Data i hora",
  "Nom i cognoms",
  "Codi d'empleat",
  "Departament",
  "Dates de recollida",
  "Nom del producte",
  "ID / SKU",
  "Categoria",
  "Pes",
  "Mides",
  "Unitats",
  "Preu unitari (€)",
  "Import total (€)",
  "Estat",
];

function saleLineToCsvRow(sale: SaleLine): string[] {
  return [
    sale.reference,
    formatDateTime(sale.createdAt),
    sale.buyerName ?? "",
    sale.employeeCode ?? "",
    sale.department ?? "",
    sale.pickupDates?.join(" / ") ?? "",
    sale.productName,
    sale.sku ?? "",
    sale.category ?? "",
    sale.weight ?? "",
    sale.dimensions ?? "",
    String(sale.quantity),
    sale.unitPrice.toFixed(2),
    sale.amount.toFixed(2),
    ORDER_STATUS_LABELS[sale.status],
  ];
}

/** Converteix una data ISO a "YYYY-MM-DD" en horari local, per comparar-la amb un `<input type="date">`. */
function toLocalDateKey(value: string) {
  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10);
}

export function SalesHistoryTable({ saleLines }: { saleLines: SaleLine[] }) {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedSale, setSelectedSale] = useState<SaleLine | null>(null);

  const filteredLines = useMemo(() => {
    const query = search.trim().toLowerCase();

    return saleLines.filter((sale) => {
      const matchesQuery =
        query.length === 0 ||
        sale.employeeCode?.toLowerCase().includes(query) ||
        sale.buyerName?.toLowerCase().includes(query) ||
        sale.reference.toLowerCase().includes(query);
      const matchesDate = dateFilter.length === 0 || toLocalDateKey(sale.createdAt) === dateFilter;

      return matchesQuery && matchesDate;
    });
  }, [saleLines, search, dateFilter]);

  const totalSales = new Set(filteredLines.map((sale) => sale.orderId)).size;
  const totalRevenue = filteredLines.reduce((sum, sale) => sum + sale.amount, 0);

  function handleExport() {
    const csv = buildCsv(CSV_HEADERS, filteredLines.map(saleLineToCsvRow));
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadCsv(csv, `historial-vendes-morabanc-office-store-${timestamp}.csv`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-deep">Historial de vendes</h1>
          <p className="text-sm text-text-muted">
            Registre de tots els productes venuts a través de la plataforma.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={handleExport}
          disabled={filteredLines.length === 0}
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Exportar a Excel (.csv)
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-xl border border-border bg-surface p-5 shadow-soft">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-surface-soft text-brand">
            <ShoppingBag className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Total de vendes realitzades
            </p>
            <p className="font-heading text-2xl font-bold text-brand-deep">{totalSales}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-border bg-surface p-5 shadow-soft">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-surface-soft text-brand">
            <Wallet className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Import total
            </p>
            <p className="font-heading text-2xl font-bold text-brand-deep">
              {formatPrice(totalRevenue)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cerca per codi d'empleat, nom del comprador o referència..."
            aria-label="Cercar per codi d'empleat, nom del comprador o referència"
            className={`${inputClasses} pl-9`}
          />
        </div>
        <input
          type="date"
          value={dateFilter}
          onChange={(event) => setDateFilter(event.target.value)}
          aria-label="Filtrar per data"
          className={`${inputClasses} sm:w-48`}
        />
      </div>

      {filteredLines.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-16 text-center text-sm text-text-muted">
          {saleLines.length === 0
            ? "Encara no hi ha cap venda registrada."
            : "Cap venda coincideix amb els filtres aplicats."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-soft">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-border bg-surface-muted text-xs uppercase tracking-wide text-text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Data</th>
                <th className="px-4 py-3 font-semibold">Referència</th>
                <th className="px-4 py-3 font-semibold">Nom del moble</th>
                <th className="px-4 py-3 text-right font-semibold">Unitats</th>
                <th className="px-4 py-3 text-right font-semibold">Import</th>
                <th className="px-4 py-3 font-semibold">Comprador</th>
                <th className="px-4 py-3 font-semibold">Codi</th>
                <th className="px-4 py-3 font-semibold">Estat</th>
                <th className="px-4 py-3 font-semibold">
                  <span className="sr-only">Detalls</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLines.map((sale) => (
                <tr key={sale.id} className="align-middle">
                  <td className="whitespace-nowrap px-4 py-3 text-text-muted">
                    {formatDateTime(sale.createdAt)}
                  </td>
                  <td className="px-4 py-3 font-mono text-text-muted">{sale.reference}</td>
                  <td className="px-4 py-3 text-text">{sale.productName}</td>
                  <td className="px-4 py-3 text-right text-text-muted">{sale.quantity}</td>
                  <td className="px-4 py-3 text-right font-medium text-text">
                    {formatPrice(sale.amount)}
                  </td>
                  <td className="px-4 py-3 text-text">{sale.buyerName ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-text-muted">
                    {sale.employeeCode ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                        STATUS_BADGE_STYLES[sale.status]
                      )}
                    >
                      {ORDER_STATUS_LABELS[sale.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedSale(sale)}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand transition-colors hover:bg-surface-soft"
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      Detalls
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedSale && (
        <SaleDetailModal sale={selectedSale} onClose={() => setSelectedSale(null)} />
      )}
    </div>
  );
}
