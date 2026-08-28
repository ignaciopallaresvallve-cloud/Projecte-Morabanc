"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";
import { deleteProduct, type DeleteProductState } from "@/app/admin/actions";
import { toast } from "@/components/ui/toast";

const initialState: DeleteProductState = {};

function DeleteSubmitButton({ name }: { name: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={`Eliminar ${name}`}
      title="Eliminar"
      className="flex h-8 w-8 items-center justify-center rounded-md text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

export function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const [state, formAction] = useActionState(deleteProduct, initialState);

  useEffect(() => {
    if (state.success) {
      toast(`«${name}» eliminat correctament.`, "success");
    } else if (state.error) {
      toast(state.error, "error");
    }
    // Solo debe reaccionar cuando el resultado de la acción cambia, no en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(`Vols eliminar "${name}"? Aquesta acció no es pot desfer.`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <DeleteSubmitButton name={name} />
    </form>
  );
}
