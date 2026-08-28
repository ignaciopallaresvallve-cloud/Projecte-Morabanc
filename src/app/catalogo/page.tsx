import { Suspense } from "react";
import { Container } from "@/components/ui/Container";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { ProductFilters } from "@/components/catalog/ProductFilters";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { EmptyState } from "@/components/catalog/EmptyState";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getProducts } from "@/services/products";
import type { ProductSort, ProductStatus } from "@/types/product";

export const metadata = {
  title: "Catàleg",
  description:
    "Catàleg de mobiliari d'oficina disponible per als equips de MoraBanc: cadires, taules, emmagatzematge, il·luminació i complements.",
};

export default async function CatalogoPage(props: PageProps<"/catalogo">) {
  if (!isSupabaseConfigured()) {
    return (
      <SetupNotice
        title="Supabase no està configurat"
        description="Defineix NEXT_PUBLIC_SUPABASE_URL i NEXT_PUBLIC_SUPABASE_ANON_KEY a .env.local i aplica l'esquema de supabase/migrations per veure el catàleg."
      />
    );
  }

  const searchParams = await props.searchParams;
  const search = firstValue(searchParams.q);
  const category = firstValue(searchParams.categoria);
  const status = firstValue(searchParams.disponibilidad) as ProductStatus | undefined;
  const sort = firstValue(searchParams.orden) as ProductSort | undefined;

  const products = await getProducts({
    search,
    category,
    status,
    sort,
    scope: "public",
  });

  return (
    <>
      <section className="border-b border-border bg-surface-soft">
        <Container className="flex flex-col gap-3 py-14 sm:py-16">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand">
            Catàleg
          </span>
          <h1 className="font-heading text-3xl font-bold text-brand-deep sm:text-4xl">
            Mobiliari d&apos;oficina disponible
          </h1>
          <p className="max-w-2xl text-text-muted">
            Consulta el mobiliari disponible per als equips de MoraBanc.
            Utilitza els filtres per trobar ràpidament el que necessites.
          </p>
        </Container>
      </section>

      <Container className="flex flex-col gap-8 py-10 sm:py-12">
        <Suspense>
          <ProductFilters />
        </Suspense>

        {products.length === 0 ? <EmptyState /> : <ProductGrid products={products} />}
      </Container>
    </>
  );
}

function firstValue(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw ? raw : undefined;
}
