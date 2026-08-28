-- MoraBanc Office Store — correcció d'un sku duplicat abans d'afegir la
-- restricció unique(sku).
--
-- Diagnòstic: dues files de `products` tenen actualment sku = 'CAD-004'
-- (un "Actiu" i un "Sedus"). Comparant preu/preu de mercat/pes/mides amb
-- l'inventari en Excel, el producte "Actiu" (35 €, 350 €, 25 kg,
-- 96x67x67) coincideix exactament amb la fila CAD-004; el producte
-- "Sedus" (90 €, 900 €, 15 kg, 120x68x69) coincideix exactament amb la
-- fila CAD-005 — es va etiquetar amb el sku equivocat en algun procés
-- anterior. Sense corregir això primer, `add constraint unique(sku)` fallaria
-- per valors duplicats.
--
-- Ejecutar en el SQL Editor de Supabase, o vía `supabase db push` si usas la CLI.

update public.products
set sku = 'CAD-005'
where id = '4237ca47-8bab-47e7-8aeb-7b9197bfd80a'
  and sku = 'CAD-004';

alter table public.products
  drop constraint if exists products_sku_unique;
alter table public.products
  add constraint products_sku_unique unique (sku);

NOTIFY pgrst, 'reload schema';
