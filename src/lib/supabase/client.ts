import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente de Supabase para uso en Client Components ("use client").
 * Requiere NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY
 * definidas en .env.local (ver .env.local.example).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
