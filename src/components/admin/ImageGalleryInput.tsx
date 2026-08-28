"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { labelClasses, errorClasses } from "@/components/ui/formStyles";
import { MAX_PRODUCT_IMAGES, MAX_PRODUCT_IMAGE_SIZE_BYTES } from "@/lib/constants";
import { cn } from "@/utils/cn";

export interface ExistingProductImage {
  url: string;
  path: string;
}

interface ImageGalleryInputProps {
  existingImages: ExistingProductImage[];
  onRemoveExisting: (path: string) => void;
  newFiles: File[];
  onAddFiles: (files: File[]) => void;
  onRemoveNewFile: (index: number) => void;
  disabled?: boolean;
  error?: string;
}

/** Selector de fins a `MAX_PRODUCT_IMAGES` imatges, amb previsualització i eliminació individual. */
export function ImageGalleryInput({
  existingImages,
  onRemoveExisting,
  newFiles,
  onAddFiles,
  onRemoveNewFile,
  disabled,
  error,
}: ImageGalleryInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const totalCount = existingImages.length + newFiles.length;
  const remainingSlots = Math.max(0, MAX_PRODUCT_IMAGES - totalCount);

  function handleFilesSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (picked.length === 0) return;

    const validFiles: File[] = [];
    for (const file of picked) {
      if (!file.type.startsWith("image/")) {
        toast(`«${file.name}» no és una imatge.`, "error");
        continue;
      }
      if (file.size > MAX_PRODUCT_IMAGE_SIZE_BYTES) {
        toast(`«${file.name}» supera els 5 MB.`, "error");
        continue;
      }
      validFiles.push(file);
    }

    const accepted = validFiles.slice(0, remainingSlots);
    if (validFiles.length > accepted.length) {
      toast(`Només es poden pujar ${MAX_PRODUCT_IMAGES} imatges com a màxim.`, "error");
    }
    if (accepted.length > 0) onAddFiles(accepted);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className={labelClasses}>
        Imatges <span className="text-text-muted">({totalCount}/{MAX_PRODUCT_IMAGES})</span>
      </label>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {existingImages.map((image) => (
          <div
            key={image.path}
            className="group relative aspect-square overflow-hidden rounded-md border border-border bg-surface-soft"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- miniatura administrativa, no cal l'optimització d'Image */}
            <img src={image.url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onRemoveExisting(image.path)}
              disabled={disabled}
              aria-label="Eliminar imatge"
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand-deep/70 text-white transition-colors hover:bg-danger disabled:pointer-events-none"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        ))}

        {newFiles.map((file, index) => (
          <NewFileThumbnail
            key={`${file.name}-${index}`}
            file={file}
            disabled={disabled}
            onRemove={() => onRemoveNewFile(index)}
          />
        ))}

        {remainingSlots > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border text-text-muted transition-colors hover:border-brand hover:text-brand disabled:pointer-events-none disabled:opacity-50"
          >
            <ImagePlus className="h-5 w-5" aria-hidden="true" />
            <span className="text-xs font-medium">Afegir</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFilesSelected}
        className="sr-only"
      />

      {error ? (
        <p className={errorClasses}>{error}</p>
      ) : (
        <p className="text-xs text-text-muted">
          Fins a {MAX_PRODUCT_IMAGES} imatges, 5 MB com a màxim cadascuna. La primera es fa servir com
          a imatge principal.
        </p>
      )}
    </div>
  );
}

function NewFileThumbnail({
  file,
  disabled,
  onRemove,
}: {
  file: File;
  disabled?: boolean;
  onRemove: () => void;
}) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  // Creación y revocación en el mismo efecto (no en un useMemo aparte): con
  // React Strict Mode, el efecto se invoca, limpia y reinvoca una vez en
  // desarrollo. Si la URL se creara en un useMemo, esa doble pasada
  // revocaría la única URL creada sin generar una nueva, dejando el <img>
  // apuntando a un blob ya revocado.
  useEffect(() => {
    const url = URL.createObjectURL(file);
    // URL.createObjectURL no existe durante el render de servidor, así que
    // esta sincronización solo puede ocurrir aquí, tras el montaje en
    // cliente.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div
      className={cn(
        "group relative aspect-square overflow-hidden rounded-md border border-brand/40 bg-surface-soft"
      )}
    >
      {objectUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- URL d'objecte local, no una imatge remota optimitzable
        <img src={objectUrl} alt="" className="h-full w-full object-cover" />
      )}
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label="Eliminar imatge"
        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand-deep/70 text-white transition-colors hover:bg-danger disabled:pointer-events-none"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
