"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/components/ui/toast";

const MESSAGES: Record<string, string> = {
  created: "Producte creat correctament.",
  updated: "Producte actualitzat correctament.",
};

/**
 * Tras crear/editar un producto, la Server Action redirige con `?toast=...`
 * (el redirect pierde cualquier estado en memoria, así que no hay otra
 * forma de pasar la confirmación de una página a otra). Este componente
 * consume ese aviso una sola vez y limpia la URL.
 */
export function ToastFromQuery() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const key = searchParams.get("toast");
    if (!key) return;

    const message = MESSAGES[key];
    if (message) toast(message, "success");

    const params = new URLSearchParams(searchParams.toString());
    params.delete("toast");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    // Solo debe ejecutarse cuando cambian los parámetros de la URL en sí.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return null;
}
