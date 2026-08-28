import { cn } from "@/utils/cn";

const VARIANT_STYLES = {
  default: "bg-surface border border-border",
  soft: "bg-surface-soft border border-transparent",
} as const;

interface CardProps extends React.ComponentPropsWithoutRef<"div"> {
  variant?: keyof typeof VARIANT_STYLES;
}

export function Card({ variant = "default", className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl p-6 shadow-soft transition-shadow duration-200 hover:shadow-elevated",
        VARIANT_STYLES[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
