#!/usr/bin/env node
/**
 * Genera una migració SQL (upsert per `sku`) a partir de l'inventari en
 * Excel, per importar-lo massivament a `products` sense imatges. Es genera
 * un fitxer .sql en comptes d'escriure directament a Supabase perquè aquest
 * projecte no exposa cap clau de servei: l'script només necessita el fitxer
 * Excel en local, i el SQL resultant es revisa i s'executa des del SQL
 * Editor de Supabase, igual que la resta de migracions d'aquest repo.
 *
 * Ús: node scripts/import-inventory.js <ruta-al-xlsx>
 */

const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");

const SHEET_NAME = "Inventari";
const HEADER_ROW_INDEX = 1; // fila 0 és el títol, fila 1 són les capçaleres reals
const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 120;
const SKU_MAX_LENGTH = 100;
const WEIGHT_MAX_LENGTH = 50;
const DIMENSIONS_MAX_LENGTH = 100;
const DEFAULT_STOCK_WHEN_MISSING = 1;

const COLUMN = {
  REFERENCE: 0,
  CATEGORY: 1,
  BRAND: 2,
  MATERIAL: 3,
  ACQUISITION_PRICE: 4,
  SALE_PRICE_90: 6,
  DIMENSIONS: 13,
  WEIGHT_KG: 14,
  STOCK: 17,
};

function parseNumeric(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const cleaned = String(value)
    .replace(/[€$]/g, "")
    .replace(/[^0-9,.-]/g, "")
    .trim();
  if (!cleaned) return null;
  // Formato "1.800,50" (separador de miles ".", decimal ",") vs "1800.50".
  const normalized = cleaned.includes(",") ? cleaned.replace(/\./g, "").replace(",", ".") : cleaned;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatDimensions(raw) {
  if (raw === null || raw === undefined || raw === "") return null;
  const parts = String(raw)
    .replace(/cm/gi, "")
    .split(/x/i)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return null;
  return `${parts.join(" x ")} cm`.slice(0, DIMENSIONS_MAX_LENGTH);
}

function formatWeight(raw) {
  const parsed = parseNumeric(raw);
  if (parsed === null) return null;
  const trimmed = Number.isInteger(parsed) ? String(parsed) : String(parsed);
  return `${trimmed} kg`.slice(0, WEIGHT_MAX_LENGTH);
}

function buildName(brand, category, material) {
  const brandLabel = brand || "Marca desconeguda";
  const base = `${brandLabel} - ${category}`;
  const withMaterial = material ? `${base} (${material})` : base;
  return withMaterial.slice(0, NAME_MAX_LENGTH);
}

function buildDescription(brand, material, sku) {
  const parts = [`Marca: ${brand || "desconeguda"}.`];
  if (material) parts.push(`Material: ${material}.`);
  parts.push(`Referència interna: ${sku}.`);
  return parts.join(" ");
}

function sqlString(value) {
  if (value === null || value === undefined) return "null";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlNumber(value) {
  if (value === null || value === undefined) return "null";
  return String(value);
}

function main() {
  const sourceFile = process.argv[2];
  if (!sourceFile) {
    console.error("Ús: node scripts/import-inventory.js <ruta-al-xlsx>");
    process.exit(1);
  }
  if (!fs.existsSync(sourceFile)) {
    console.error(`No s'ha trobat el fitxer: ${sourceFile}`);
    process.exit(1);
  }

  const workbook = xlsx.readFile(sourceFile);
  const sheet = workbook.Sheets[SHEET_NAME];
  if (!sheet) {
    console.error(`No s'ha trobat el full "${SHEET_NAME}". Fulls disponibles: ${workbook.SheetNames.join(", ")}`);
    process.exit(1);
  }

  const allRows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });
  const dataRows = allRows.slice(HEADER_ROW_INDEX + 1);

  const skuCounts = new Map();
  const records = [];
  const warnings = [];

  dataRows.forEach((row, index) => {
    const rowNumber = index + HEADER_ROW_INDEX + 2; // fila real a l'Excel (1-indexada)
    const referenceRaw = row[COLUMN.REFERENCE];
    if (!referenceRaw) return; // fila buida (p. ex. al final del full)

    let sku = String(referenceRaw).trim();
    if (skuCounts.has(sku)) {
      const nextCount = skuCounts.get(sku) + 1;
      skuCounts.set(sku, nextCount);
      const original = sku;
      sku = `${sku}-${nextCount}`;
      warnings.push(
        `Fila ${rowNumber}: sku duplicat a l'Excel ("${original}") -> renombrat a "${sku}" per poder importar totes dues files.`
      );
    } else {
      skuCounts.set(sku, 1);
    }
    if (sku.length > SKU_MAX_LENGTH) {
      warnings.push(`Fila ${rowNumber}: sku truncat perquè superava ${SKU_MAX_LENGTH} caràcters.`);
      sku = sku.slice(0, SKU_MAX_LENGTH);
    }

    const category = row[COLUMN.CATEGORY] ? String(row[COLUMN.CATEGORY]).trim() : "Altres";
    if (!row[COLUMN.CATEGORY]) {
      warnings.push(`Fila ${rowNumber} (${sku}): categoria buida -> importat com a "Altres".`);
    }

    const brand = row[COLUMN.BRAND] ? String(row[COLUMN.BRAND]).trim() : null;
    const material = row[COLUMN.MATERIAL] ? String(row[COLUMN.MATERIAL]).trim() : null;

    const price = parseNumeric(row[COLUMN.SALE_PRICE_90]) ?? 0;
    if (parseNumeric(row[COLUMN.SALE_PRICE_90]) === null) {
      warnings.push(`Fila ${rowNumber} (${sku}): preu (90%) buit o no numèric -> importat com a 0.`);
    } else if (price === 0) {
      warnings.push(`Fila ${rowNumber} (${sku}): preu (90%) és exactament 0 a l'Excel.`);
    }

    const marketPrice = parseNumeric(row[COLUMN.ACQUISITION_PRICE]);

    const stockRaw = parseNumeric(row[COLUMN.STOCK]);
    const stock = stockRaw === null ? DEFAULT_STOCK_WHEN_MISSING : Math.max(0, Math.round(stockRaw));
    if (stockRaw === null) {
      warnings.push(
        `Fila ${rowNumber} (${sku}): "Total per unitat" buit -> importat amb stock ${DEFAULT_STOCK_WHEN_MISSING}.`
      );
    }

    const name = buildName(brand, category, material);
    if (name.length < NAME_MIN_LENGTH) {
      warnings.push(`Fila ${rowNumber} (${sku}): nom resultant massa curt, s'ha omès la fila.`);
      return;
    }

    records.push({
      sku,
      name,
      description: buildDescription(brand, material, sku),
      category,
      price,
      marketPrice,
      weight: formatWeight(row[COLUMN.WEIGHT_KG]),
      dimensions: formatDimensions(row[COLUMN.DIMENSIONS]),
      stock,
    });
  });

  console.log(`Files llegides de l'Excel: ${dataRows.length}`);
  console.log(`Productes preparats per importar: ${records.length}`);
  console.log(`Avisos: ${warnings.length}`);
  warnings.forEach((warning) => console.log(`  - ${warning}`));

  const valuesSql = records
    .map(
      (r) =>
        `  (${sqlString(r.sku)}, ${sqlString(r.name)}, ${sqlString(r.description)}, ${sqlNumber(r.price)}, ${sqlNumber(
          r.stock
        )}, ${sqlString(r.category)}, 'disponible', ${sqlNumber(r.marketPrice)}, ${sqlString(r.weight)}, ${sqlString(
          r.dimensions
        )})`
    )
    .join(",\n");

  const outputPath = path.join(
    __dirname,
    "..",
    "supabase",
    "migrations",
    "20260826120000_import_inventory_products.sql"
  );

  const sql = `-- MoraBanc Office Store — importació massiva de l'inventari (${records.length} articles)
-- des de "inventari_mobles_catala_complet.xlsx". Generat automàticament amb
-- \`node scripts/import-inventory.js\` — no editar a mà: si cal canviar el
-- mapatge de camps, torna a generar aquest fitxer des de l'script.
--
-- Idempotent per sku, però amb "do nothing" (no "do update"): 6 dels skus
-- d'aquest lot (CAD-001, CAD-002, CAD-004, CAD-005, CAD-007, CAD-009) ja
-- existeixen com a productes gestionats a mà, amb descripcions redactades i
-- fotos reals pujades — un "do update" els sobreescriuria amb la
-- descripció genèrica i les dades planes de l'Excel. "do nothing" deixa
-- aquests 6 intactes i només insereix els productes que encara no existien.
-- Requereix la restricció unique(sku) de 20260824130000_products_sku_unique.sql
-- (ha d'executar-se abans que aquesta migració).
--
-- Ejecutar en el SQL Editor de Supabase, o vía \`supabase db push\` si usas la CLI.

insert into public.products
  (sku, name, description, price, stock, category, status, market_price, weight, dimensions)
values
${valuesSql}
on conflict (sku) do nothing;

NOTIFY pgrst, 'reload schema';
`;

  fs.writeFileSync(outputPath, sql, "utf8");
  console.log(`\nSQL generat a: ${outputPath}`);
}

main();
