"use client";

import { useCallback, useState } from "react";

/** Estado de un checkbox de consentimiento obligatorio (p. ej. antes de una acción irreversible). */
export function useMandatoryConsent() {
  const [accepted, setAccepted] = useState(false);

  const toggle = useCallback(() => setAccepted((prev) => !prev), []);
  const reset = useCallback(() => setAccepted(false), []);

  return { accepted, toggle, reset };
}
