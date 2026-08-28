import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import { SetupNotice } from "@/components/ui/SetupNotice";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Accés administració",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  if (!isSupabaseConfigured()) {
    return (
      <SetupNotice
        title="Supabase no està configurat"
        description="Defineix NEXT_PUBLIC_SUPABASE_URL i NEXT_PUBLIC_SUPABASE_ANON_KEY a .env.local, aplica l'esquema de supabase/migrations i crea un usuari administrador abans d'accedir al panell."
      />
    );
  }

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8 shadow-elevated">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <Logo />
          <p className="text-sm text-text-muted">Accés al panell d&apos;administració</p>
        </div>
        <LoginForm />
      </div>
    </Container>
  );
}
