const UTF8_BOM = String.fromCharCode(0xfeff);

function escapeCsvValue(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Construye el contenido de un CSV a partir de cabeceras y filas de texto. */
export function buildCsv(headers: string[], rows: string[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(escapeCsvValue).join(","));
  // BOM UTF-8: sin él, Excel en Windows interpreta el CSV como Latin-1 y
  // rompe los caracteres catalanes (ç, ï, ·, accents).
  return UTF8_BOM + lines.join("\r\n");
}

/** Dispara la descarga de un CSV en el navegador. */
export function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
