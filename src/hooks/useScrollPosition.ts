"use client";

import { useEffect, useState } from "react";

/**
 * Devuelve `true` cuando la página se ha desplazado más allá de `threshold`.
 * Útil para aplicar sombra/fondo al header al hacer scroll.
 */
export function useScrollPosition(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > threshold);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  return scrolled;
}
