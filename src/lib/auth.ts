import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Exige una sesión válida. Se llama tanto en el layout de /admin como al
 * inicio de cada Server Action de escritura: el proxy solo protege la
 * navegación, no las acciones invocadas directamente por POST.
 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  return user;
}
