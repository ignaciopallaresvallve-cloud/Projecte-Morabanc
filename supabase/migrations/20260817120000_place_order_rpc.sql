-- MoraBanc Office Store — descuento inmediato de stock al confirmar la compra.
--
-- Hasta ahora `createOrder` solo insertaba la fila en `orders`; el stock de
-- `products` nunca se tocaba. El "Compromís de compra" exige que, en cuanto
-- el empleado confirma, el stock se descuente al instante (sin esperar a que
-- se confirme el pago). Descuento e inserción del pedido deben ser atómicos:
-- si falta stock de cualquier línea, no debe crearse el pedido ni descontarse
-- nada de las demás líneas.
--
-- anon/authenticated no tienen (ni deben tener) UPDATE directo sobre
-- `products` — ver `20260814160000_reset_app_schema.sql`, que solo concede
-- UPDATE a `authenticated` (para el panel de administración). Por eso este
-- descuento se expone como una función `security definer`: se ejecuta con
-- los privilegios de quien la crea, y solo permite la mutación concreta y
-- validada de restar stock, nunca una actualización arbitraria de la tabla.
--
-- Ejecutar en el SQL Editor de Supabase, o vía `supabase db push` si usas la CLI.

create or replace function public.place_order(
  p_reference text,
  p_items jsonb,
  p_total numeric
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

  insert into public.orders (reference, items, total, status)
  values (p_reference, p_items, p_total, 'pendiente_pago')
  returning * into v_order;

  return v_order;
end;
$$;

grant execute on function public.place_order(text, jsonb, numeric) to anon, authenticated;
