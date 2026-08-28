import { cn } from "@/utils/cn";

interface ContainerProps extends React.ComponentPropsWithoutRef<"div"> {
  as?: React.ElementType;
}

export function Container({
  as: Tag = "div",
  className,
  children,
  ...props
}: ContainerProps) {
  return (
    <Tag
      className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}
      {...props}
    >
      {children}
    </Tag>
  );
}
