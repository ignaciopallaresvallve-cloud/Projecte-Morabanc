"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/cn";

const TABS = [
  { href: "/admin", label: "Productes" },
  { href: "/admin/comandes", label: "Comandes" },
  { href: "/admin/vendes", label: "Historial de vendes" },
  { href: "/admin/sol-licituds", label: "Sol·licituds Especials" },
  { href: "/admin/pagos", label: "Ajustos de pagament" },
];

export function AdminNavTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="Seccions del panell" className="flex gap-1">
      {TABS.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-white text-brand-deep"
                : "text-navy-300 hover:bg-white/10 hover:text-white"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
