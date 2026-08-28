-- MoraBanc Office Store — "Segona Tanda": descompte global d'un percentatge
-- sobre el preu de tots els productes del catàleg, en una sola transacció
-- atòmica (una UPDATE de tota la taula, no una fila a la vegada).
--
-- No hace falta `security definer`: `authenticated` ya tiene UPDATE sobre
-- `products` y la política RLS "Authenticated users can update products"
-- (ver 20260814160000_reset_app_schema.sql), así que la función se ejecuta
-- con los mismos privilegios que ya tiene cualquier administrador con
-- sesión iniciada. La Server Action que la invoca llama a `requireUser()`
-- antes, igual que el resto de acciones de escritura del panel.
--
-- Ejecutar en el SQL Editor de Supabase, o vía `supabase db push` si usas la CLI.

create or replace function public.apply_bulk_price_discount(p_percentage numeric)
returns integer
language plpgsql
set search_path = public
as $$
declare
  v_updated integer;
begin
  if p_percentage <= 0 or p_percentage >= 100 then
    raise exception 'INVALID_PERCENTAGE';
  end if;

  update public.products
  set price = round(price * (1 - p_percentage / 100.0), 2);

  get diagnostics v_updated = row_count;
  return v_updated;
end;
$$;

grant execute on function public.apply_bulk_price_discount(numeric) to authenticated;
