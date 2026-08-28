import { siteConfig } from "@/lib/constants";

interface SpecialRequestEmailDetails {
  buyerName: string;
  productName: string | null;
  quantity: number;
}

/** Embolcall HTML mínim, comú a totes dues plantilles. */
function wrapEmailBody(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="ca">
  <body style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background-color:#0b2447;padding:20px 32px;">
                <span style="color:#ffffff;font-size:16px;font-weight:bold;">${siteConfig.name}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:#1f2933;font-size:14px;line-height:1.6;">
                <h1 style="margin:0 0 16px;font-size:18px;color:#0b2447;">${title}</h1>
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;background-color:#f4f6f8;color:#7b8794;font-size:11px;">
                Aquest és un missatge automàtic de ${siteConfig.name}. No responguis a aquest correu.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function buildSpecialRequestApprovedEmail(details: SpecialRequestEmailDetails): {
  subject: string;
  html: string;
} {
  const productLine = details.productName
    ? `<strong>${details.productName}</strong> (${details.quantity} unitats)`
    : `${details.quantity} unitats`;

  const html = wrapEmailBody(
    "La teva sol·licitud especial ha estat aprovada",
    `<p>Hola ${details.buyerName},</p>
     <p>Et confirmem que la teva sol·licitud especial de mobiliari per a
     ${productLine} ha estat <strong style="color:#1a7f37;">aprovada</strong>.</p>
     <p>L'equip de Facilities es posarà en contacte amb tu properament per
     coordinar els propers passos (recollida, terminis i, si escau, la
     transferència bancària corresponent).</p>
     <p>Gràcies per fer servir ${siteConfig.name}.</p>`
  );

  return { subject: "La teva sol·licitud especial ha estat aprovada", html };
}

export function buildSpecialRequestRejectedEmail(details: SpecialRequestEmailDetails): {
  subject: string;
  html: string;
} {
  const productLine = details.productName
    ? `<strong>${details.productName}</strong> (${details.quantity} unitats)`
    : `${details.quantity} unitats`;

  const html = wrapEmailBody(
    "La teva sol·licitud especial no ha estat aprovada",
    `<p>Hola ${details.buyerName},</p>
     <p>Lamentem informar-te que la teva sol·licitud especial de mobiliari
     per a ${productLine} <strong style="color:#c0392b;">no ha estat aprovada</strong>
     en aquesta ocasió.</p>
     <p>Si tens dubtes sobre aquesta decisió o vols proposar una alternativa,
     posa't en contacte amb l'equip de Facilities.</p>
     <p>Gràcies per la teva comprensió.</p>`
  );

  return { subject: "La teva sol·licitud especial no ha estat aprovada", html };
}
