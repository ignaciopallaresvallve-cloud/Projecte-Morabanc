import { ClipboardCheck, Sofa, Truck } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const phases = [
  {
    icon: Sofa,
    title: "Catàleg i sol·licitud",
    description:
      "Explora el mobiliari de segona mà disponible, afegeix-lo al carret i finalitza la teva sol·licitud (fins a 3 unitats, o mitjançant petició especial si en necessites més).",
    done: true,
  },
  {
    icon: ClipboardCheck,
    title: "Pagament per transferència",
    description:
      "En finalitzar la sol·licitud reps les dades bancàries per completar tu mateix el pagament, que té una finalitat benèfica. La web mai fa cap cobrament.",
    done: true,
  },
  {
    icon: Truck,
    title: "Logística",
    description:
      "La recollida es fa a un dels nostres dos magatzems: Carrer de na Maria Pla, 24 (AD500, Andorra la Vella) o CG-6, 8 (AD600, Sant Julià de Lòria).",
    done: true,
  },
];

export default function Home() {
  return (
    <>
      <section className="border-b border-border bg-surface-soft">
        <Container className="flex flex-col items-start gap-6 py-20 sm:py-28">
          <span className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-brand shadow-soft">
            Catàleg i sol·licituds disponibles
          </span>
          <h1 className="max-w-2xl font-heading text-4xl font-bold leading-tight tracking-tight text-brand-deep sm:text-5xl">
            Mobiliari d&apos;oficina, gestionat internament a MoraBanc
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-text-muted">
            Consulta el catàleg, afegeix el que necessitis al carret i
            finalitza la teva sol·licitud. El pagament es fa mitjançant
            transferència bancària: aquesta web mai fa cap cobrament.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button href="/catalogo" variant="primary" size="lg">
              Explorar el catàleg
            </Button>
          </div>
        </Container>
      </section>

      <section className="py-20 sm:py-24">
        <Container>
          <div className="mb-12 max-w-2xl">
            <h2 className="font-heading text-2xl font-bold text-brand-deep sm:text-3xl">
              Com funciona
            </h2>
            <p className="mt-3 text-text-muted">
              Aquest és el desglossament operatiu del projecte.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {phases.map(({ icon: Icon, title, description, done }) => (
              <Card key={title} variant="soft">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-brand shadow-soft">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <span
                    className={
                      done
                        ? "rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success"
                        : "rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold text-text-muted"
                    }
                  >
                    {done ? "Disponible" : "Pròximament"}
                  </span>
                </div>
                <h3 className="font-heading text-lg font-semibold text-brand-deep">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">
                  {description}
                </p>
              </Card>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
