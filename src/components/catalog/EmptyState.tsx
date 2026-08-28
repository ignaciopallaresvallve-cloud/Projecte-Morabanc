import { SearchX } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface-muted px-6 py-16 text-center">
      <SearchX className="h-8 w-8 text-text-muted" aria-hidden="true" />
      <h2 className="font-heading text-lg font-semibold text-brand-deep">
        No s&apos;han trobat productes
      </h2>
      <p className="max-w-sm text-sm text-text-muted">
        Prova de canviar els filtres o el terme de cerca.
      </p>
    </div>
  );
}
