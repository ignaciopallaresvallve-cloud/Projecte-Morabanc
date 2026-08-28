-- MoraBanc Office Store — corregeix la generació de la URL signada del
-- justificant de transferència.
--
-- Diagnòstic: `createSignedUrl` necessita permís de lectura (select) sobre
-- l'objecte que es vol signar, no només d'escriptura. La política anterior
-- (20260825120000_order_transfer_receipts.sql) només concedia `select` a
-- `authenticated`, així que el comprador anònim podia pujar el justificant
-- però la crida a `createSignedUrl` immediatament després fallava amb
-- "Object not found" (RLS amagava l'objecte que ell mateix acabava de
-- pujar). Les rutes són UUID aleatoris (impossibles d'endevinar), així que
-- permetre `select` a `anon` en aquest bucket concret és un compromís
-- raonable: ningú pot llistar ni trobar un justificant sense conèixer-ne
-- la ruta exacta.
--
-- Ejecutar en el SQL Editor de Supabase, o vía `supabase db push` si usas la CLI.

drop policy if exists "Only authenticated users can read transfer receipts" on storage.objects;
drop policy if exists "Anyone can read a transfer receipt by exact path" on storage.objects;
create policy "Anyone can read a transfer receipt by exact path"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'transfer-receipts');

NOTIFY pgrst, 'reload schema';
