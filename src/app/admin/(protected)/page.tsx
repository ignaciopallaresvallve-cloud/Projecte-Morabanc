import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AdminFilters } from "@/components/admin/AdminFilters";
import { ProductTable } from "@/components/admin/ProductTable";
import { ToastFromQuery } from "@/components/admin/ToastFromQuery";
import { PricingDiscountControls } from "@/components/admin/PricingDiscountControls";
import { getProducts } from "@/services/products";
import { getPaymentSettings } from "@/services/paymentSettings";
import type { ProductStatus } from "@/types/product";

export default async function AdminDashboardPage(props: PageProps<"/admin">) {
  const searchParams = await props.searchParams;
  const search = firstValue(searchParams.q);
  const category = firstValue(searchParams.categoria);
  const status = firstValue(searchParams.estado) as ProductStatus | undefined;

  const [products, paymentSettings] = await Promise.all([
    getProducts({
      search,
      category,
      status,
      sort: "name-asc",
      scope: "admin",
    }),
    getPaymentSettings(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <Suspense>
        <ToastFromQuery />
      </Suspense>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-deep">Productes</h1>
          <p className="text-sm text-text-muted">
            {products.length} producte{products.length === 1 ? "" : "s"} al catàleg.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PricingDiscountControls isDiscountActive={paymentSettings.isDiscountActive} />
          <Button href="/admin/productos/nuevo">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Afegir producte
          </Button>
        </div>
      </div>

      <Suspense>
        <AdminFilters />
      </Suspense>

      <ProductTable products={products} />

      <p className="text-xs text-text-muted">
        Busques alguna cosa que no apareix?{" "}
        <Link href="/admin?estado=descatalogado" className="font-medium text-brand hover:underline">
          Veure productes descatalogats
        </Link>
        .
      </p>
    </div>
  );
}

function firstValue(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw ? raw : undefined;
}
