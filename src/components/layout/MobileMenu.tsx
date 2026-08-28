"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Navigation } from "./Navigation";
import { cn } from "@/utils/cn";

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Tancar el menú" : "Obrir el menú"}
        className="flex h-10 w-10 items-center justify-center rounded-md text-brand hover:bg-surface-soft"
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      <div
        id="mobile-menu"
        className={cn(
          "absolute inset-x-0 top-full origin-top border-b border-border bg-surface shadow-elevated transition-all duration-200",
          open
            ? "pointer-events-auto scale-y-100 opacity-100"
            : "pointer-events-none scale-y-95 opacity-0"
        )}
      >
        <Navigation
          className="flex flex-col gap-1 px-4 py-4"
          itemClassName="rounded-md px-3 py-3 text-base"
          onNavigate={() => setOpen(false)}
        />
      </div>
    </div>
  );
}
