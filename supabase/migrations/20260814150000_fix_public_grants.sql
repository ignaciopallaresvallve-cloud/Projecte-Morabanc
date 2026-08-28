-- MoraBanc Office Store — corrige los privilegios base de PostgreSQL sobre
-- el esquema public.
--
-- Las políticas de RLS creadas en las migraciones anteriores controlan qué
-- filas puede ver o modificar cada rol, pero NO sustituyen al GRANT de
-- PostgreSQL: sin el privilegio base sobre la tabla, Postgres deniega el
-- acceso antes incluso de evaluar RLS ("permission denied for table ..."),
-- que es el error que estaba rompiendo /catalogo. Esta migración concede
-- exactamente los privilegios que cada rol necesita según las políticas ya
-- definidas en `20260806120000_init_products.sql`,
-- `20260806130000_special_requests.sql` y
-- `20260806140000_orders_and_payment_settings.sql`.
--
-- Ejecutar en el SQL Editor de Supabase, o vía `supabase db push` si usas la CLI.

grant usage on schema public to anon, authenticated;

-- products: lectura pública, escritura solo autenticados.
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;

-- special_requests: cualquiera puede enviar el formulario; solo el equipo lo lee.
grant insert on public.special_requests to anon, authenticated;
grant select on public.special_requests to authenticated;

-- orders: cualquiera puede registrar un pedido; solo el equipo los consulta.
grant insert on public.orders to anon, authenticated;
grant select on public.orders to authenticated;

-- payment_settings: lectura pública, edición solo autenticados.
grant select on public.payment_settings to anon, authenticated;
grant update on public.payment_settings to authenticated;
