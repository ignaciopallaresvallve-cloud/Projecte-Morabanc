import Link from "next/link";
import { cn } from "@/utils/cn";

const VARIANT_STYLES = {
  primary:
    "bg-accent text-brand-deep hover:bg-accent-hover shadow-soft hover:shadow-elevated",
  secondary:
    "border border-brand text-brand bg-transparent hover:bg-surface-soft",
  ghost: "text-brand hover:bg-surface-soft",
  inverse: "bg-white text-brand hover:bg-surface-soft",
} as const;

const SIZE_STYLES = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-13 px-8 text-base",
} as const;

type ButtonVariant = keyof typeof VARIANT_STYLES;
type ButtonSize = keyof typeof SIZE_STYLES;

interface SharedProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
}

type ButtonAsButton = SharedProps &
  React.ComponentPropsWithoutRef<"button"> & { href?: undefined };

type ButtonAsLink = SharedProps &
  React.ComponentPropsWithoutRef<typeof Link> & { href: string };

type ButtonProps = ButtonAsButton | ButtonAsLink;

const baseStyles =
  "inline-flex items-center justify-center gap-2 rounded-md font-heading font-semibold tracking-tight transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:pointer-events-none disabled:opacity-50";

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  const styles = cn(baseStyles, VARIANT_STYLES[variant], SIZE_STYLES[size], className);

  if (props.href) {
    const { href, ...linkProps } = props as ButtonAsLink;
    return (
      <Link href={href} className={styles} {...linkProps}>
        {children}
      </Link>
    );
  }

  return (
    <button className={styles} {...(props as ButtonAsButton)}>
      {children}
    </button>
  );
}
