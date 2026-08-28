import { ProductForm } from "@/components/admin/ProductForm";
import { createProduct } from "@/app/admin/actions";

export const metadata = {
  title: "Afegir producte · Administració",
};

export default function NuevoProductoPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-brand-deep">Afegir producte</h1>
        <p className="text-sm text-text-muted">
          Completa les dades i puja una imatge. El producte apareixerà al catàleg públic.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6 shadow-soft">
        <ProductForm action={createProduct} submitLabel="Crear producte" />
      </div>
    </div>
  );
}
