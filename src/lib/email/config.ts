import "server-only";

/**
 * Aquesta app no tenia cap integració de correu fins ara. `RESEND_API_KEY`
 * i `RESEND_FROM_EMAIL` són secrets NOMÉS de servidor (sense prefix
 * NEXT_PUBLIC_): mai s'incrusten al codi del navegador, a diferència de
 * les variables de Supabase.
 */
export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}
