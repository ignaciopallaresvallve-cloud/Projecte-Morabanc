/** Normaliza un IBAN: sin espacios, en mayúsculas. */
export function normalizeIban(raw: string) {
  return raw.replace(/\s+/g, "").toUpperCase();
}

/** Agrupa un IBAN en bloques de 4 caracteres para mostrarlo (formato estándar). */
export function formatIban(raw: string) {
  const clean = normalizeIban(raw);
  return clean.match(/.{1,4}/g)?.join(" ") ?? clean;
}

/** Valida el formato y el checksum (mod 97) de un IBAN. */
export function isValidIban(raw: string) {
  const iban = normalizeIban(raw);

  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/.test(iban)) {
    return false;
  }

  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const converted = rearranged.replace(/[A-Z]/g, (letter) => String(letter.charCodeAt(0) - 55));

  let remainder = converted;
  while (remainder.length > 9) {
    const block = remainder.slice(0, 9);
    remainder = String(Number.parseInt(block, 10) % 97) + remainder.slice(block.length);
  }

  return Number.parseInt(remainder, 10) % 97 === 1;
}

/** Como `isValidIban`, pero exige además el formato d'Andorra (prefix "AD", 24 caràcters). */
export function isValidAndorranIban(raw: string) {
  const iban = normalizeIban(raw);
  return iban.startsWith("AD") && iban.length === 24 && isValidIban(iban);
}
