"use client";

import { Search } from "lucide-react";
import { PRODUCT_CATEGORIES } from "@/types/product";
import { useDebouncedSearchParam } from "@/hooks/useUrlSearchState";

const SELECT_CLASSES =
  "h-11 rounded-md border border-border bg-surface px-3 text-sm text-text focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

export function ProductFilters() {
  const { value: search, setValue: setSearch, searchParams, updateParam } = useDebouncedSearchParam("q");

  const category = searchParams.get("categoria") ?? "";
  const availability = searchParams.get("disponibilidad") ?? "";
  const sort = searchParams.get("orden") ?? "";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative flex-1 sm:min-w-[240px]">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
          aria-hidden="true"
        />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cerca mobiliari..."
          aria-label="Cercar productes"
          className="h-11 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </div>

      <select
        value={category}
        onChange={(event) => updateParam("categoria", event.target.value)}
        aria-label="Filtrar per categoria"
        className={SELECT_CLASSES}
      >
        <option value="">Totes les categories</option>
        {PRODUCT_CATEGORIES.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>

      <select
        value={availability}
        onChange={(event) => updateParam("disponibilidad", event.target.value)}
        aria-label="Filtrar per disponibilitat"
        className={SELECT_CLASSES}
      >
        <option value="">Qualsevol disponibilitat</option>
        <option value="disponible">Disponible</option>
        <option value="agotado">Esgotat</option>
      </select>

      <select
        value={sort}
        onChange={(event) => updateParam("orden", event.target.value)}
        aria-label="Ordenar productes"
        className={SELECT_CLASSES}
      >
        <option value="">Més recents</option>
        <option value="name-asc">Nom (A-Z)</option>
        <option value="name-desc">Nom (Z-A)</option>
        <option value="price-asc">Preu: menor a major</option>
        <option value="price-desc">Preu: major a menor</option>
      </select>
    </div>
  );
}
