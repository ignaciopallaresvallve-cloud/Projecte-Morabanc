-- MoraBanc Office Store — quan una comanda esgota l'estoc d'un producte,
-- el seu estat passa automàticament a "agotado" (Esgotat) dins la mateixa
-- transacció que descompta l'estoc, perquè desaparegui del catàleg públic
-- sense cap pas manual per part de l'administrador.
--
-- Ejecutar en el SQL Editor de Supabase, o vía `supabase db push` si usas la CLI.

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
    set stock = stock - v_quantity,
        status = case when stock - v_quantity <= 0 then 'agotado' else status end
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

NOTIFY pgrst, 'reload schema';
