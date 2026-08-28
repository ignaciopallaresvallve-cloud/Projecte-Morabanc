import Image from "next/image";
import Link from "next/link";
import { ImageOff, Pencil } from "lucide-react";
import { StatusBadge } from "@/components/catalog/StatusBadge";
import { DeleteProductButton } from "./DeleteProductButton";
import type { Product } from "@/types/product";
import { formatPrice } from "@/utils/format";

export function ProductTable({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-16 text-center text-sm text-text-muted">
        No hi ha cap producte que coincideixi amb els filtres.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-soft">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-border bg-surface-muted text-xs uppercase tracking-wide text-text-muted">
          <tr>
            <th className="px-4 py-3 font-semibold">Producte</th>
            <th className="px-4 py-3 font-semibold">Categoria</th>
            <th className="px-4 py-3 font-semibold">Preu</th>
            <th className="px-4 py-3 font-semibold">Stock</th>
            <th className="px-4 py-3 font-semibold">Estat</th>
            <th className="px-4 py-3 font-semibold text-right">Accions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {products.map((product) => (
            <tr key={product.id} className="align-middle">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-surface-soft">
                    {product.imageUrls[0] ? (
                      <Image
                        src={product.imageUrls[0]}
                        alt={product.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-text-muted">
                        <ImageOff className="h-4 w-4" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <span className="font-medium text-text">{product.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-text-muted">{product.category}</td>
              <td className="px-4 py-3 font-medium text-text">{formatPrice(product.price)}</td>
              <td className="px-4 py-3 text-text-muted">{product.stock}</td>
              <td className="px-4 py-3">
                <StatusBadge status={product.status} />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={`/admin/productos/${product.id}/editar`}
                    aria-label={`Editar ${product.name}`}
                    title="Editar"
                    className="flex h-8 w-8 items-center justify-center rounded-md text-brand transition-colors hover:bg-surface-soft"
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <DeleteProductButton id={product.id} name={product.name} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
