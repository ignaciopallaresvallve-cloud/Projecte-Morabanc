import { cn } from "@/utils/cn";
import type { ProductStatus } from "@/types/product";

const STATUS_STYLES: Record<ProductStatus, string> = {
  disponible: "bg-success/10 text-success",
  agotado: "bg-warning/10 text-warning",
  descatalogado: "bg-ink-200 text-text-muted",
};

const STATUS_LABELS: Record<ProductStatus, string> = {
  disponible: "Disponible",
  agotado: "Esgotat",
  descatalogado: "Descatalogat",
};

export function StatusBadge({ status, className }: { status: ProductStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        STATUS_STYLES[status],
        className
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
