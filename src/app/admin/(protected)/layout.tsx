import Link from "next/link";
import { LogOut, ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { AdminNavTabs } from "@/components/admin/AdminNavTabs";
import { requireUser } from "@/lib/auth";
import { logout } from "@/app/admin/actions";

export const metadata = {
  title: "Administració",
  robots: { index: false, follow: false },
};

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex flex-1 flex-col bg-surface-muted">
      <div className="border-b border-border bg-brand-deep text-white">
        <Container className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-navy-300">
              Panell d&apos;administració
            </p>
            <p className="text-sm text-white">{user.email}</p>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/catalogo"
              className="flex items-center gap-1.5 text-navy-300 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Tornar al catàleg
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-md border border-white/20 px-3 py-1.5 text-white transition-colors hover:bg-white/10"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Tancar sessió
              </button>
            </form>
          </div>
        </Container>

        <Container className="pb-3">
          <AdminNavTabs />
        </Container>
      </div>

      <Container className="flex-1 py-8">{children}</Container>
    </div>
  );
}
