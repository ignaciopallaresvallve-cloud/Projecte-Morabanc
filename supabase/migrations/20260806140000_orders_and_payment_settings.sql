-- MoraBanc Office Store — pedidos (pago por transferencia bancaria manual)
-- y ajustes de pago editables desde el panel de administración.
-- Ejecutar en el SQL Editor de Supabase, o vía `supabase db push` si usas la CLI.

-- 1. Ajustes de pago (fila única) ---------------------------------------------
--
-- Esta tabla guarda los datos bancarios que se muestran al finalizar una
-- solicitud: titular de la cuenta, IBAN y concepto de pago. Se edita desde
-- /admin/pagos; nunca se procesa ningún cobro desde la web, solo se
-- muestran estos datos para que el empleado haga una transferencia por su
-- cuenta desde su propio banco.

create table if not exists public.payment_settings (
  id integer primary key default 1,
  account_holder text not null default '',
  iban text not null default '',
  payment_concept text not null default 'Mobiliario MoraBanc Office Store',
  updated_at timestamptz not null default now(),
  constraint payment_settings_singleton check (id = 1)
);

insert into public.payment_settings (id)
values (1)
on conflict (id) do nothing;

drop trigger if exists set_payment_settings_updated_at on public.payment_settings;
create trigger set_payment_settings_updated_at
  before update on public.payment_settings
  for each row
  execute function public.set_updated_at();

alter table public.payment_settings enable row level security;

-- Lectura pública: el pop-up de "Finalizar solicitud" no requiere sesión.
drop policy if exists "Payment settings are viewable by everyone" on public.payment_settings;
create policy "Payment settings are viewable by everyone"
  on public.payment_settings for select
  using (true);

drop policy if exists "Only authenticated users can update payment settings" on public.payment_settings;
create policy "Only authenticated users can update payment settings"
  on public.payment_settings for update
  to authenticated
  using (true)
  with check (true);

-- 2. Pedidos --------------------------------------------------------------------
--
-- Un pedido es una fotografía del carrito en el momento de "Finalizar
-- solicitud": no hay pasarela de pago, solo queda registrado como
-- "pendiente_pago" a la espera de que el empleado haga la transferencia.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  items jsonb not null,
  total numeric(10, 2) not null check (total >= 0),
  status text not null default 'pendiente_pago'
    check (status in ('pendiente_pago', 'pagado', 'cancelado')),
  created_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);

alter table public.orders enable row level security;

-- Cualquier empleado puede registrar un pedido (no hay login de empleados).
drop policy if exists "Anyone can create an order" on public.orders;
create policy "Anyone can create an order"
  on public.orders for insert
  to anon, authenticated
  with check (true);

-- La consulta de pedidos queda restringida al equipo (panel de administración).
drop policy if exists "Only authenticated users can view orders" on public.orders;
create policy "Only authenticated users can view orders"
  on public.orders for select
  to authenticated
  using (true);
