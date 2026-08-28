"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedValue } from "./useDebouncedValue";

/** Lee/actualiza los parámetros de búsqueda de la URL actual sin recargar la página. */
export function useUrlParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return { searchParams, updateParam };
}

/**
 * Campo de texto con debounce sincronizado con un parámetro de la URL —
 * usado por los buscadores del catálogo público y del panel de
 * administración, que comparten el mismo patrón de interacción.
 */
export function useDebouncedSearchParam(key: string, debounceMs = 350) {
  const { searchParams, updateParam } = useUrlParams();
  const [value, setValue] = useState(searchParams.get(key) ?? "");
  const debounced = useDebouncedValue(value, debounceMs);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    updateParam(key, debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return { value, setValue, searchParams, updateParam };
}
