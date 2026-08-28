import { cn } from "@/utils/cn";

export function UnitsProgress({ used, max }: { used: number; max: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-1 gap-1.5" role="presentation">
        {Array.from({ length: max }).map((_, index) => (
          <span
            key={index}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              index < used ? "bg-accent" : "bg-surface-muted"
            )}
          />
        ))}
      </div>
      <span className="whitespace-nowrap text-xs font-semibold text-text-muted">
        {used}/{max} unitats
      </span>
    </div>
  );
}
