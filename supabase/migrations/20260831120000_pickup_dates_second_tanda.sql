-- MoraBanc Office Store — segona tanda de dates de recollida.
--
-- Afegeix un segon joc de 4 dates de recollida ("Segona Tanda") a
-- `payment_settings`, independent del joc actual ("Primera Tanda", ja
-- existent a `pickup_dates` des de 20260818120000 — es queda tal qual,
-- amb el mateix valor per defecte, cap canvi de comportament per als
-- compradors que no facin servir la segona tanda).
--
-- No té res a veure amb el descompte "Segona Tanda" del 20% que ja
-- existeix a `apply_bulk_price_discount`/`is_discount_active`: aquell és
-- un descompte de preus per a l'admin, aquest és un joc alternatiu de
-- dates de recollida per al comprador. Coincideixen de nom perquè el
-- negoci fa servir "tanda" per referir-se a qualsevol tongada/ronda
-- addicional, però són funcionalitats independents.
--
-- Ejecutar en el SQL Editor de Supabase, o vía `supabase db push` si usas la CLI.

alter table public.payment_settings
  add column if not exists pickup_dates_second_tanda text[]
    not null default array['27/08', '28/08', '29/08', '30/08'];

alter table public.payment_settings
  drop constraint if exists payment_settings_pickup_dates_second_tanda_length;
alter table public.payment_settings
  add constraint payment_settings_pickup_dates_second_tanda_length
    check (array_length(pickup_dates_second_tanda, 1) = 4);

NOTIFY pgrst, 'reload schema';
