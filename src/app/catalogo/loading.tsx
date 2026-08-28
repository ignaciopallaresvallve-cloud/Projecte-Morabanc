import { Container } from "@/components/ui/Container";

export default function CatalogoLoading() {
  return (
    <>
      <section className="border-b border-border bg-surface-soft">
        <Container className="flex flex-col gap-3 py-14 sm:py-16">
          <div className="h-4 w-20 animate-pulse rounded bg-white/60" />
          <div className="h-9 w-80 max-w-full animate-pulse rounded bg-white/60" />
          <div className="h-4 w-96 max-w-full animate-pulse rounded bg-white/60" />
        </Container>
      </section>

      <Container className="flex flex-col gap-8 py-10 sm:py-12">
        <div className="h-11 w-full animate-pulse rounded-md bg-surface-muted" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="h-80 animate-pulse rounded-xl border border-border bg-surface-muted"
            />
          ))}
        </div>
      </Container>
    </>
  );
}
