-- MoraBanc Office Store — justificant de transferència adjunt a la comanda.
--
-- Afegeix `receipt_url`/`receipt_path` a `orders`, un bucket privat
-- `transfer-receipts` (a diferència de `product-images`, NO és públic: un
-- justificant bancari pot contenir dades personals/financeres, així que
-- només `authenticated` (admin) el pot llegir; qualsevol comprador anònim
-- el pot pujar). L'estoc i la creació de la comanda ja es fan de forma
-- atòmica a `place_order` en confirmar la compra (abans d'arribar a la
-- pantalla de dades bancàries): aquesta migració només afegeix la
-- possibilitat d'adjuntar el justificant a la comanda ja creada, via una
-- funció RPC dedicada (no es concedeix `update` directe sobre `orders` a
-- `anon`, per no obrir la porta a modificar cap altra columna).
--
-- Ejecutar en el SQL Editor de Supabase, o vía `supabase db push` si usas la CLI.

alter table public.orders
  add column if not exists receipt_url text,
  add column if not exists receipt_path text;

insert into storage.buckets (id, name, public)
values ('transfer-receipts', 'transfer-receipts', false)
on conflict (id) do nothing;

drop policy if exists "Anyone can upload a transfer receipt" on storage.objects;
create policy "Anyone can upload a transfer receipt"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'transfer-receipts');

drop policy if exists "Only authenticated users can read transfer receipts" on storage.objects;
create policy "Only authenticated users can read transfer receipts"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'transfer-receipts');

create or replace function public.attach_order_receipt(
  p_reference text,
  p_receipt_url text,
  p_receipt_path text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.orders
  set receipt_url = p_receipt_url,
      receipt_path = p_receipt_path
  where reference = p_reference;

  if not found then
    raise exception 'ORDER_NOT_FOUND: %', p_reference;
  end if;
end;
$$;

grant execute on function public.attach_order_receipt(text, text, text) to anon, authenticated;

NOTIFY pgrst, 'reload schema';
