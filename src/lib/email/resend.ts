import "server-only";

import { isEmailConfigured } from "./config";

const RESEND_API_URL = "https://api.resend.com/emails";

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

/**
 * Enviament d'un correu via l'API HTTP de Resend directa (fetch), sense
 * afegir el SDK com a dependència: només calen dues crides d'aquest tipus
 * a tota l'app, no val la pena la dependència extra.
 *
 * Si `RESEND_API_KEY`/`RESEND_FROM_EMAIL` no estan configurats, no llança
 * cap error: retorna `ok: false` perquè qui ho crida decideixi com
 * degradar (les accions d'aprovar/rebutjar una sol·licitud especial han de
 * funcionar igualment encara que el correu no s'arribi a enviar).
 */
export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<{
  ok: boolean;
  error?: string;
}> {
  if (!isEmailConfigured()) {
    return { ok: false, error: "L'enviament de correus no està configurat (falta RESEND_API_KEY)." };
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL,
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return { ok: false, error: `Resend ha respost ${response.status}: ${body}` };
    }

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error de xarxa en enviar el correu.",
    };
  }
}
