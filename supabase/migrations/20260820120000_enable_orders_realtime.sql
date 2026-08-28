-- MoraBanc Office Store — habilita Supabase Realtime sobre `orders`.
--
-- /admin/comandes se suscribe a los INSERT de esta tabla para actualizarse
-- al instante cuando se registra un pedido nuevo, sin recargar la página.
-- Realtime respeta la política RLS de lectura ya existente ("Only
-- authenticated users can view orders"), así que solo las sesiones de
-- administrador reciben estos eventos.
--
-- El bloque `do` comprueba si la tabla ya está en la publicación antes de
-- añadirla: `alter publication ... add table` lanza un error si se repite,
-- así que esto hace la migración segura de re-ejecutar.
--
-- Ejecutar en el SQL Editor de Supabase, o vía `supabase db push` si usas la CLI.

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;
