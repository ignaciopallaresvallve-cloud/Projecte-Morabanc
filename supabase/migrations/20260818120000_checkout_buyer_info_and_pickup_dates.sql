-- MoraBanc Office Store — pas 2 del checkout: dades del comprador i
-- recollida, i control administratiu de les dades bancàries i les dates
-- de recollida disponibles.
--
-- Ejecutar en el SQL Editor de Supabase, o vía `supabase db push` si usas la CLI.

-- 1. payment_settings: SWIFT/BIC y las 4 opciones de fecha de recogida ----------
--
-- `pickup_dates` son las 4 fechas que se ofrecen en el paso "Dades del
-- comprador i recollida" del checkout; el admin las edita en /admin/pagos.

alter table public.payment_settings
  add column if not exists swift_bic text not null default '',
  add column if not exists pickup_dates text[] not null default array['20/08', '21/08', '22/08', '23/08'];

alter table public.payment_settings
  drop constraint if exists payment_settings_pickup_dates_length;
alter table public.payment_settings
  add constraint payment_settings_pickup_dates_length check (array_length(pickup_dates, 1) = 4);

-- 2. orders: datos del comprador y las 2 fechas de recogida elegidas ------------
--
-- Nullable a propósito: son columnas nuevas sobre una tabla que puede tener
-- filas previas sin estos datos. La función `place_order` (más abajo)
-- siempre los exige para los pedidos nuevos; las constraints solo validan
-- la forma de los valores cuando no son null, así que no rompen filas
-- antiguas.

alter table public.orders
  add column if not exists buyer_name text,
  add column if not exists employee_code text,
  add column if not exists department text,
  add column if not exists pickup_dates text[];

alter table public.orders
  drop constraint if exists orders_employee_code_length;
alter table public.orders
  add constraint orders_employee_code_length
    check (employee_code is null or char_length(employee_code) = 4);

alter table public.orders
  drop constraint if exists orders_pickup_dates_length;
alter table public.orders
  add constraint orders_pickup_dates_length
    check (pickup_dates is null or array_length(pickup_dates, 1) = 2);

-- 3. place_order: añade los datos del comprador y las fechas de recogida --------
--
-- Cambia la firma de la función (se añaden 4 parámetros), así que hay que
-- eliminar la versión anterior antes de crear la nueva: `create or replace`
-- con una lista de parámetros distinta crearía una función sobrecargada en
-- vez de sustituir la original.

drop function if exists public.place_order(text, jsonb, numeric);

create or replace function public.place_order(
  p_reference text,
  p_items jsonb,
  p_total numeric,
  p_buyer_name text,
  p_employee_code text,
  p_department text,
  p_pickup_dates text[]
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_updated integer;
  v_product_name text;
  v_order public.orders;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_ITEMS';
  end if;

  -- Bloquea de antemano, en un orden estable (por id), todas las filas de
  -- producto implicadas: evita interbloqueos si dos compras concurrentes
  -- comparten productos, y congela su stock mientras dura la transacción.
  perform 1
  from public.products
  where id in (
    select (item->>'productId')::uuid
    from jsonb_array_elements(p_items) as item
  )
  order by id
  for update;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item->>'productId')::uuid;
    v_quantity := (v_item->>'quantity')::integer;

    update public.products
    set stock = stock - v_quantity
    where id = v_product_id
      and stock >= v_quantity;

    get diagnostics v_updated = row_count;

    if v_updated = 0 then
      select name into v_product_name from public.products where id = v_product_id;
      raise exception 'INSUFFICIENT_STOCK: %', coalesce(v_product_name, v_product_id::text);
    end if;
  end loop;

  insert into public.orders (
    reference, items, total, status,
    buyer_name, employee_code, department, pickup_dates
  )
  values (
    p_reference, p_items, p_total, 'pendiente_pago',
    p_buyer_name, p_employee_code, p_department, p_pickup_dates
  )
  returning * into v_order;

  return v_order;
end;
$$;

grant execute on function public.place_order(text, jsonb, numeric, text, text, text, text[]) to anon, authenticated;
