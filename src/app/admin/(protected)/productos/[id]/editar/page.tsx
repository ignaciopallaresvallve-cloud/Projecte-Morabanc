import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { updateProduct } from "@/app/admin/actions";
import { getProductById } from "@/services/products";

export const metadata = {
  title: "Editar producte · Administració",
};

export default async function EditarProductoPage(props: PageProps<"/admin/productos/[id]/editar">) {
  const { id } = await props.params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-brand-deep">Editar producte</h1>
        <p className="text-sm text-text-muted">{product.name}</p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6 shadow-soft">
        <ProductForm
          action={updateProduct}
          submitLabel="Desar els canvis"
          defaultValues={{
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            stock: product.stock,
            category: product.category,
            status: product.status,
            images: product.imageUrls.map((url, index) => ({
              url,
              path: product.imagePaths[index],
            })),
            marketPrice: product.marketPrice,
            sku: product.sku,
            weight: product.weight,
            dimensions: product.dimensions,
          }}
        />
      </div>
    </div>
  );
}
