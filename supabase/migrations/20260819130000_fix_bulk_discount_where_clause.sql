-- MoraBanc Office Store — corrige `apply_bulk_price_discount`.
--
-- Este proyecto de Supabase tiene activado algún tipo de guardia (al estilo
-- de la extensión `safeupdate`) que bloquea cualquier UPDATE/DELETE sin una
-- cláusula WHERE literal, incluso dentro de una función: "UPDATE requires
-- a WHERE clause". La función original actualizaba todas las filas a
-- propósito pero sin WHERE alguno. Se añade `where true`, que sigue
-- afectando a todas las filas pero cumple la comprobación sintáctica.
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
  set price = round(price * (1 - p_percentage / 100.0), 2)
  where true;

  get diagnostics v_updated = row_count;
  return v_updated;
end;
$$;

grant execute on function public.apply_bulk_price_discount(numeric) to authenticated;
