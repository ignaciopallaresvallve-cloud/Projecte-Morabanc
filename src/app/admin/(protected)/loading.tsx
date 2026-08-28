export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="h-7 w-40 animate-pulse rounded bg-surface-muted" />
          <div className="h-4 w-56 animate-pulse rounded bg-surface-muted" />
        </div>
        <div className="h-10 w-40 animate-pulse rounded-md bg-surface-muted" />
      </div>

      <div className="h-10 w-full animate-pulse rounded-md bg-surface-muted" />

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-soft">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 border-b border-border px-4 py-4 last:border-b-0"
          >
            <div className="h-12 w-12 shrink-0 animate-pulse rounded-md bg-surface-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 animate-pulse rounded bg-surface-muted" />
              <div className="h-3 w-1/4 animate-pulse rounded bg-surface-muted" />
            </div>
            <div className="h-4 w-16 animate-pulse rounded bg-surface-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
