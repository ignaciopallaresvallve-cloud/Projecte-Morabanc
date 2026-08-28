/** Normaliza un SWIFT/BIC: sin espacios, en mayúsculas. */
export function normalizeSwiftBic(raw: string) {
  return raw.replace(/\s+/g, "").toUpperCase();
}

/** Valida el formato de un código SWIFT/BIC (8 u 11 caracteres). */
export function isValidSwiftBic(raw: string) {
  const value = normalizeSwiftBic(raw);
  return /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(value);
}
