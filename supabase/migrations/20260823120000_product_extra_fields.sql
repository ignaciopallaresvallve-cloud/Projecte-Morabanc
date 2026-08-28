-- MoraBanc Office Store — camps addicionals de producte: preu de mercat
-- (per comparar l'estalvi respecte al preu de segona mà), codi/SKU, pes i
-- mides. Tots opcionals: els productes ja existents es queden amb aquests
-- camps a null sense trencar res.
--
-- Ejecutar en el SQL Editor de Supabase, o vía `supabase db push` si usas la CLI.

alter table public.products
  add column if not exists market_price numeric(10, 2),
  add column if not exists sku text,
  add column if not exists weight text,
  add column if not exists dimensions text;

alter table public.products
  drop constraint if exists products_market_price_check;
alter table public.products
  add constraint products_market_price_check
    check (market_price is null or market_price >= 0);

alter table public.products
  drop constraint if exists products_sku_length;
alter table public.products
  add constraint products_sku_length
    check (sku is null or char_length(sku) <= 100);

alter table public.products
  drop constraint if exists products_weight_length;
alter table public.products
  add constraint products_weight_length
    check (weight is null or char_length(weight) <= 50);

alter table public.products
  drop constraint if exists products_dimensions_length;
alter table public.products
  add constraint products_dimensions_length
    check (dimensions is null or char_length(dimensions) <= 100);

-- Este proyecto de Supabase ya mostró antes una caché de PostgREST que no
-- se refresca sola tras un cambio de esquema hecho por SQL Editor/CLI.
NOTIFY pgrst, 'reload schema';
