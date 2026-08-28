-- MoraBanc Office Store — solicitudes especiales (más de 3 unidades)
-- Ejecutar en el SQL Editor de Supabase, o vía `supabase db push` si usas la CLI.

create table if not exists public.special_requests (
  id uuid primary key default gen_random_uuid(),
  first_name text not null check (char_length(first_name) between 2 and 100),
  last_name text not null check (char_length(last_name) between 2 and 100),
  email text not null,
  department text not null check (char_length(department) between 2 and 100),
  phone text,
  products text not null check (char_length(products) > 0),
  quantity integer not null check (quantity > 0),
  reason text not null check (char_length(reason) > 0),
  comments text,
  created_at timestamptz not null default now()
);

create index if not exists special_requests_created_at_idx
  on public.special_requests (created_at desc);

alter table public.special_requests enable row level security;

-- Cualquier empleado (autenticado o no) puede enviar una solicitud especial;
-- es un formulario de contacto, no requiere haber iniciado sesión.
drop policy if exists "Anyone can submit a special request" on public.special_requests;
create policy "Anyone can submit a special request"
  on public.special_requests for insert
  to anon, authenticated
  with check (true);

-- La lectura queda restringida: solo el equipo (usuarios autenticados del
-- panel de administración) puede consultar las solicitudes recibidas.
drop policy if exists "Only authenticated users can view special requests" on public.special_requests;
create policy "Only authenticated users can view special requests"
  on public.special_requests for select
  to authenticated
  using (true);
