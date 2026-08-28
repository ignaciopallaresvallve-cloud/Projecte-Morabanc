"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainNavItems } from "@/lib/constants";
import { cn } from "@/utils/cn";

interface NavigationProps {
  className?: string;
  itemClassName?: string;
  onNavigate?: () => void;
}

export function Navigation({ className, itemClassName, onNavigate }: NavigationProps) {
  const pathname = usePathname();
  // Els elements "pròximament" (encara sense pàgina) es mostren al peu de
  // pàgina com a avançament, però no a la navegació principal, on no tenen
  // cap destinació navegable.
  const visibleNavItems = mainNavItems.filter((item) => !item.disabled);

  return (
    <nav className={cn("flex", className)} aria-label="Navegació principal">
      {visibleNavItems.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "font-medium text-text transition-colors hover:text-brand",
              isActive && "text-brand",
              itemClassName
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
