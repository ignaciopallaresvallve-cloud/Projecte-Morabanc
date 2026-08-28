-- MoraBanc Office Store — estat i aprovació de sol·licituds especials.
--
-- Afegeix `product_id` (referència real a un producte del catàleg, no text
-- lliure — necessari per poder descomptar estoc de forma segura en
-- aprovar) i `status` a `special_requests`. `product_id` és nullable
-- perquè les files existents (creades abans d'aquesta columna) no en
-- tenen; les noves sol·licituds sempre en portaran una des del formulari.
--
-- Dues funcions RPC noves, només per a `authenticated` (admin):
--   - `approve_special_request`: marca com a 'aprobado' i, si la
--     sol·licitud té un producte vinculat, en descompta l'estoc de forma
--     atòmica (mateix patró que `place_order`: falla si no hi ha prou
--     estoc, en comptes de deixar estoc negatiu).
--   - `reject_special_request`: marca com a 'rechazado', sense tocar estoc.
--
-- Ejecutar en el SQL Editor de Supabase, o vía `supabase db push` si usas la CLI.

alter table public.special_requests
  add column if not exists product_id uuid references public.products(id) on delete set null,
  add column if not exists status text not null default 'pendiente';

alter table public.special_requests
  drop constraint if exists special_requests_status_check;
alter table public.special_requests
  add constraint special_requests_status_check
    check (status in ('pendiente', 'aprobado', 'rechazado'));

create index if not exists special_requests_status_idx
  on public.special_requests (status);

create or replace function public.approve_special_request(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product_id uuid;
  v_quantity integer;
  v_updated integer;
begin
  select product_id, quantity into v_product_id, v_quantity
  from public.special_requests
  where id = p_id;

  if not found then
    raise exception 'SPECIAL_REQUEST_NOT_FOUND: %', p_id;
  end if;

  if v_product_id is not null then
    update public.products
    set stock = stock - v_quantity,
        status = case when stock - v_quantity <= 0 then 'agotado' else status end
    where id = v_product_id
      and stock >= v_quantity;

    get diagnostics v_updated = row_count;
    if v_updated = 0 then
      raise exception 'INSUFFICIENT_STOCK';
    end if;
  end if;

  update public.special_requests
  set status = 'aprobado'
  where id = p_id;
end;
$$;

create or replace function public.reject_special_request(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.special_requests
  set status = 'rechazado'
  where id = p_id;

  if not found then
    raise exception 'SPECIAL_REQUEST_NOT_FOUND: %', p_id;
  end if;
end;
$$;

grant execute on function public.approve_special_request(uuid) to authenticated;
grant execute on function public.reject_special_request(uuid) to authenticated;

NOTIFY pgrst, 'reload schema';
