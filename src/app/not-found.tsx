import { Compass } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Pàgina no trobada",
};

export default function NotFound() {
  return (
    <Container className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-soft text-brand">
        <Compass className="h-7 w-7" aria-hidden="true" />
      </div>
      <p className="text-sm font-semibold uppercase tracking-wide text-brand">Error 404</p>
      <h1 className="font-heading text-2xl font-bold text-brand-deep sm:text-3xl">
        No hem trobat aquesta pàgina
      </h1>
      <p className="max-w-sm text-sm text-text-muted">
        Pot ser que l&apos;enllaç estigui trencat o que la pàgina s&apos;hagi
        mogut. Prova de tornar a l&apos;inici o d&apos;explorar el catàleg.
      </p>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <Button href="/" variant="primary">
          Anar a l&apos;inici
        </Button>
        <Button href="/catalogo" variant="secondary">
          Veure el catàleg
        </Button>
      </div>
    </Container>
  );
}
