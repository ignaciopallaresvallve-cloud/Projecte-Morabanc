"use client";

import { useEffect, useState } from "react";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { cn } from "@/utils/cn";

interface ModalShellProps {
  onClose: () => void;
  labelledBy: string;
  /** Desactiva el cierre por click en el fondo y por Escape (p. ej. mientras se envía un formulario). */
  closable?: boolean;
  maxWidthClassName?: string;
  children: React.ReactNode;
}

/**
 * Estructura común de los diálogos modales de la app: fondo con
 * desenfoque, panel centrado con transición de entrada, cierre con
 * Escape/click fuera, y foco de teclado atrapado dentro del panel
 * mientras está abierto (con retorno del foco al cerrar).
 */
export function ModalShell({
  onClose,
  labelledBy,
  closable = true,
  maxWidthClassName = "max-w-lg",
  children,
}: ModalShellProps) {
  const [entered, setEntered] = useState(false);
  const trapRef = useFocusTrap<HTMLDivElement>(true);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEscapeKey(closable, onClose);

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto">
      <div
        className={cn(
          "absolute inset-0 bg-brand-deep/40 backdrop-blur-sm transition-opacity duration-200",
          entered ? "opacity-100" : "opacity-0"
        )}
        onClick={() => closable && onClose()}
      />

      <div className="flex min-h-full items-center justify-center px-4 py-8">
        <div
          ref={trapRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
          className={cn(
            "relative w-full rounded-xl bg-surface shadow-lifted transition-all duration-200 focus:outline-none",
            maxWidthClassName,
            entered ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-95 opacity-0"
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
