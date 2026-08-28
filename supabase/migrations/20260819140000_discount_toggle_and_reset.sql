-- MoraBanc Office Store — impide aplicar "Segona Tanda" más de una vez y
-- añade la función para restablecer los precios originales.
--
-- `payment_settings.is_discount_active` es el flag global que dice si el
-- descuento del 20% está aplicado ahora mismo. `products.original_price`
-- guarda el precio exacto de antes del descuento, para poder restaurarlo
-- sin arrastrar errores de redondeo en vez de intentar invertir la
-- multiplicación (dividir entre 0.8 no siempre reproduce el valor exacto
-- original una vez redondeado a 2 decimales).
--
-- Ambas funciones actualizan `products` y `payment_settings` en una sola
-- transacción, así que el flag y los precios nunca quedan desincronizados.
-- Ninguna es `security definer`: `authenticated` ya tiene UPDATE sobre
-- ambas tablas (ver 20260814160000_reset_app_schema.sql), y la Server
-- Action que las invoca llama a `requireUser()` antes.
--
-- Ejecutar en el SQL Editor de Supabase, o vía `supabase db push` si usas la CLI.

alter table public.payment_settings
  add column if not exists is_discount_active boolean not null default false;

alter table public.products
  add column if not exists original_price numeric(10, 2);

create or replace function public.apply_bulk_price_discount(p_percentage numeric)
returns integer
language plpgsql
set search_path = public
as $$
declare
  v_updated integer;
  v_active boolean;
begin
  if p_percentage <= 0 or p_percentage >= 100 then
    raise exception 'INVALID_PERCENTAGE';
  end if;

  select is_discount_active into v_active from public.payment_settings where id = 1;

  if coalesce(v_active, false) then
    raise exception 'DISCOUNT_ALREADY_ACTIVE';
  end if;

  update public.products
  set original_price = price,
      price = round(price * (1 - p_percentage / 100.0), 2)
  where true;

  get diagnostics v_updated = row_count;

  update public.payment_settings
  set is_discount_active = true
  where id = 1;

  return v_updated;
end;
$$;

create or replace function public.reset_product_prices()
returns integer
language plpgsql
set search_path = public
as $$
declare
  v_updated integer;
  v_active boolean;
begin
  select is_discount_active into v_active from public.payment_settings where id = 1;

  if not coalesce(v_active, false) then
    raise exception 'DISCOUNT_NOT_ACTIVE';
  end if;

  update public.products
  set price = coalesce(original_price, price),
      original_price = null
  where original_price is not null;

  get diagnostics v_updated = row_count;

  update public.payment_settings
  set is_discount_active = false
  where id = 1;

  return v_updated;
end;
$$;

grant execute on function public.apply_bulk_price_discount(numeric) to authenticated;
grant execute on function public.reset_product_prices() to authenticated;
