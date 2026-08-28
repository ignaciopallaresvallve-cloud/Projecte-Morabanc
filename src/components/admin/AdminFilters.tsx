"use client";

import { Search } from "lucide-react";
import { PRODUCT_CATEGORIES, PRODUCT_STATUSES } from "@/types/product";
import { useDebouncedSearchParam } from "@/hooks/useUrlSearchState";

const SELECT_CLASSES =
  "h-10 rounded-md border border-border bg-surface px-3 text-sm text-text focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

export function AdminFilters() {
  const { value: search, setValue: setSearch, searchParams, updateParam } = useDebouncedSearchParam("q");

  const category = searchParams.get("categoria") ?? "";
  const status = searchParams.get("estado") ?? "";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative flex-1 sm:min-w-[220px]">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
          aria-hidden="true"
        />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cerca per nom o descripció..."
          aria-label="Cercar productes"
          className="h-10 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
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
        value={status}
        onChange={(event) => updateParam("estado", event.target.value)}
        aria-label="Filtrar per estat"
        className={SELECT_CLASSES}
      >
        <option value="">Tots els estats</option>
        {PRODUCT_STATUSES.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  );
}
