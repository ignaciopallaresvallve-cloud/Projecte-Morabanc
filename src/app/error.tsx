"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export default function ErrorBoundary({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/10 text-danger">
        <AlertTriangle className="h-7 w-7" aria-hidden="true" />
      </div>
      <h1 className="font-heading text-2xl font-bold text-brand-deep sm:text-3xl">
        Alguna cosa ha anat malament
      </h1>
      <p className="max-w-sm text-sm text-text-muted">
        S&apos;ha produït un error inesperat. Pots tornar-ho a provar; si el
        problema persisteix, contacta amb l&apos;equip de Facilities.
      </p>
      {error.digest && (
        <p className="text-xs text-text-muted">
          Referència de l&apos;error: <span className="font-mono">{error.digest}</span>
        </p>
      )}
      <Button variant="primary" onClick={retry} className="mt-2">
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Torna-ho a provar
      </Button>
    </Container>
  );
}
