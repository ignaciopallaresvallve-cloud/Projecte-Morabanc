import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Container } from "@/components/ui/Container";
import { mainNavItems } from "@/lib/constants";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-brand-deep text-white">
      <Container className="flex flex-col gap-8 py-12 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-3">
          <Logo inverse />
          <p className="max-w-sm text-sm text-navy-300">
            Plataforma interna de MoraBanc per a la gestió i venda de
            mobiliari d&apos;oficina entre empleats.
          </p>
        </div>

        <nav aria-label="Enllaços del peu de pàgina">
          <ul className="flex flex-col gap-2 text-sm">
            {mainNavItems.map((item) => (
              <li key={item.href} className="text-navy-300">
                {item.disabled ? (
                  <>
                    {item.label}
                    <span className="ml-2 text-xs uppercase tracking-wide text-navy-400">
                      pròximament
                    </span>
                  </>
                ) : (
                  <Link href={item.href} className="transition-colors hover:text-white">
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-2 py-6 text-xs text-navy-300 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} MoraBanc. Ús intern exclusiu.</p>
          <Link href="/admin" className="transition-colors hover:text-white">
            Accés administració
          </Link>
        </Container>
      </div>
    </footer>
  );
}
