"use client";

import { startTransition, useActionState, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { inputClasses, textareaClasses } from "@/components/ui/formStyles";
import { ImageGalleryInput, type ExistingProductImage } from "./ImageGalleryInput";
import { PRODUCT_CATEGORIES, PRODUCT_STATUSES, type ProductStatus } from "@/types/product";
import type { ProductFormState } from "@/app/admin/actions";

const PRODUCT_IMAGES_BUCKET = "product-images";

interface ProductFormDefaults {
  id?: string;
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  category?: string;
  status?: ProductStatus;
  images?: ExistingProductImage[];
  marketPrice?: number | null;
  sku?: string | null;
  weight?: string | null;
  dimensions?: string | null;
}

interface ProductFormProps {
  action: (prevState: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  defaultValues?: ProductFormDefaults;
  submitLabel: string;
}

const initialState: ProductFormState = {};

export function ProductForm({ action, defaultValues, submitLabel }: ProductFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [existingImages, setExistingImages] = useState<ExistingProductImage[]>(
    defaultValues?.images ?? []
  );
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [removedPaths, setRemovedPaths] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  function handleRemoveExisting(path: string) {
    setExistingImages((current) => current.filter((image) => image.path !== path));
    setRemovedPaths((current) => [...current, path]);
  }

  function handleAddFiles(files: File[]) {
    setNewFiles((current) => [...current, ...files]);
  }

  function handleRemoveNewFile(index: number) {
    setNewFiles((current) => current.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formEl = event.currentTarget;
    const supabase = createClient();
    const uploaded: ExistingProductImage[] = [];

    setUploading(true);
    try {
      for (const file of newFiles) {
        const extension = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
        const path = `${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from(PRODUCT_IMAGES_BUCKET)
          .upload(path, file, { contentType: file.type, upsert: false });

        if (uploadError) throw new Error(uploadError.message);

        const {
          data: { publicUrl },
        } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);

        uploaded.push({ url: publicUrl, path });
      }
    } catch (err) {
      // Si una imagen falla a mitad de la subida, se limpian las que sí se
      // llegaron a subir en este intento, para no dejar archivos huérfanos.
      await Promise.all(
        uploaded.map((image) => supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([image.path]))
      );
      setUploading(false);
      toast(
        err instanceof Error ? `No s'han pogut pujar les imatges: ${err.message}` : "Error en pujar les imatges.",
        "error"
      );
      return;
    }
    setUploading(false);

    const finalImages = [...existingImages, ...uploaded];
    const formData = new FormData(formEl);
    formData.set("images", JSON.stringify(finalImages));
    formData.set("removedImagePaths", JSON.stringify(removedPaths));

    startTransition(() => {
      formAction(formData);
    });
  }

  const busy = pending || uploading;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {defaultValues?.id && <input type="hidden" name="id" value={defaultValues.id} />}

      {state.error && (
        <p role="alert" className="rounded-md bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
          {state.error}
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <FormField label="Nom" htmlFor="name" error={state.fieldErrors?.name}>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={defaultValues?.name}
            className={inputClasses}
          />
        </FormField>

        <FormField label="Categoria" htmlFor="category" error={state.fieldErrors?.category}>
          <select
            id="category"
            name="category"
            required
            defaultValue={defaultValues?.category ?? ""}
            className={inputClasses}
          >
            <option value="" disabled>
              Selecciona una categoria
            </option>
            {PRODUCT_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Preu (€)" htmlFor="price" error={state.fieldErrors?.price}>
          <input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={defaultValues?.price}
            className={inputClasses}
          />
        </FormField>

        <FormField label="Quantitat disponible" htmlFor="stock" error={state.fieldErrors?.stock}>
          <input
            id="stock"
            name="stock"
            type="number"
            min="0"
            step="1"
            required
            defaultValue={defaultValues?.stock}
            className={inputClasses}
          />
        </FormField>

        <FormField
          label="Preu de mercat (€)"
          htmlFor="marketPrice"
          error={state.fieldErrors?.marketPrice}
          optional
          hint="PVP original, per mostrar l'estalvi respecte al preu de segona mà."
        >
          <input
            id="marketPrice"
            name="marketPrice"
            type="number"
            min="0"
            step="0.01"
            defaultValue={defaultValues?.marketPrice ?? undefined}
            placeholder="Ex: 249.90"
            className={inputClasses}
          />
        </FormField>

        <FormField label="ID / Codi de producte" htmlFor="sku" error={state.fieldErrors?.sku} optional>
          <input
            id="sku"
            name="sku"
            type="text"
            defaultValue={defaultValues?.sku ?? undefined}
            placeholder="Ex: SKU-00123"
            className={inputClasses}
          />
        </FormField>

        <FormField label="Pes" htmlFor="weight" error={state.fieldErrors?.weight} optional>
          <input
            id="weight"
            name="weight"
            type="text"
            defaultValue={defaultValues?.weight ?? undefined}
            placeholder="Ex: 12 kg"
            className={inputClasses}
          />
        </FormField>

        <FormField
          label="Mides / Dimensions"
          htmlFor="dimensions"
          error={state.fieldErrors?.dimensions}
          optional
        >
          <input
            id="dimensions"
            name="dimensions"
            type="text"
            defaultValue={defaultValues?.dimensions ?? undefined}
            placeholder="Ex: 120 x 60 x 75 cm"
            className={inputClasses}
          />
        </FormField>

        <FormField label="Estat" htmlFor="status" error={state.fieldErrors?.status}>
          <select
            id="status"
            name="status"
            required
            defaultValue={defaultValues?.status ?? "disponible"}
            className={inputClasses}
          >
            {PRODUCT_STATUSES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          label="Descripció"
          htmlFor="description"
          error={state.fieldErrors?.description}
          className="sm:col-span-2"
          optional
        >
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={defaultValues?.description}
            className={textareaClasses}
          />
        </FormField>

        <div className="sm:col-span-2">
          <ImageGalleryInput
            existingImages={existingImages}
            onRemoveExisting={handleRemoveExisting}
            newFiles={newFiles}
            onAddFiles={handleAddFiles}
            onRemoveNewFile={handleRemoveNewFile}
            disabled={busy}
            error={state.fieldErrors?.images}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={busy}>
          {uploading ? "Pujant imatges..." : pending ? "Desant..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
