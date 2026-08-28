"use client";

import { useSyncExternalStore } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { subscribeToasts, getToastsSnapshot, getToastsServerSnapshot } from "./store";
import { cn } from "@/utils/cn";
import type { ToastVariant } from "./store";

const ICONS: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const STYLES: Record<ToastVariant, string> = {
  success: "border-success/30 text-success",
  error: "border-danger/30 text-danger",
  info: "border-info/30 text-info",
};

/** Renderizado una única vez en el layout raíz; consume el store de toasts. */
export function Toaster() {
  const toasts = useSyncExternalStore(subscribeToasts, getToastsSnapshot, getToastsServerSnapshot);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      role="status"
      className="pointer-events-none fixed inset-x-0 top-4 z-[80] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end"
    >
      {toasts.map((item) => {
        const Icon = ICONS[item.variant];
        return (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-center gap-2 rounded-lg border bg-surface px-4 py-3 text-sm font-medium shadow-elevated transition-all duration-300 starting:-translate-y-2 starting:opacity-0",
              STYLES[item.variant]
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="text-text">{item.message}</span>
          </div>
        );
      })}
    </div>
  );
}
