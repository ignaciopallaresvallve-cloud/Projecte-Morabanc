-- MoraBanc Office Store — reinicio del esquema de la app.
--
-- Diagnóstico: las tablas products/orders/payment_settings/special_requests
-- de este proyecto no coinciden con lo que espera el código de la app
-- (columnas distintas — p. ej. products tenía slug/dimensions/total_stock/
-- available_stock/reserved_stock/sold_stock/active en vez de stock/
-- image_url/image_path — y status era un enum `product_status` en vez de
-- texto). No fueron creadas por las migraciones de este repo. Se confirmó
-- con el usuario que este proyecto de Supabase se creó específicamente para
-- esta app y que es seguro eliminar y recrear estas 4 tablas.
--
-- Esta migración NO toca admin_users, payments, product_images,
-- reservations ni site_settings: esta app no las usa, así que se dejan
-- intactas por si sirven para otra cosa.
--
-- ATENCIÓN: esto borra cualquier fila que hubiera en products, orders,
-- payment_settings y special_requests.
--
-- Ejecutar en el SQL Editor de Supabase, o vía `supabase db push` si usas la CLI.

drop table if exists public.special_requests cascade;
drop table if exists public.orders cascade;
drop table if exists public.payment_settings cascade;
drop table if exists public.products cascade;
drop type if exists public.product_status cascade;

-- 1. products -------------------------------------------------------------------

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  description text not null default '',
  price numeric(10, 2) not null default 0 check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  category text not null,
  status text not null default 'disponible'
    check (status in ('disponible', 'agotado', 'descatalogado')),
  image_url text,
  image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_idx on public.products (category);
create index products_status_idx on public.products (status);
create index products_created_at_idx on public.products (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_products_updated_at
  before update on public.products
  for each row
  execute function public.set_updated_at();

alter table public.products enable row level security;

create policy "Products are viewable by everyone"
  on public.products for select
  using (true);

create policy "Authenticated users can insert products"
  on public.products for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update products"
  on public.products for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete products"
  on public.products for delete
  to authenticated
  using (true);

-- 2. Storage: bucket de imágenes de producto -------------------------------------

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "Public read product images" on storage.objects;
create policy "Public read product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "Authenticated users can upload product images" on storage.objects;
create policy "Authenticated users can upload product images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images');

drop policy if exists "Authenticated users can update product images" on storage.objects;
create policy "Authenticated users can update product images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images');

drop policy if exists "Authenticated users can delete product images" on storage.objects;
create policy "Authenticated users can delete product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images');

-- 3. special_requests -------------------------------------------------------------

create table public.special_requests (
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

create index special_requests_created_at_idx
  on public.special_requests (created_at desc);

alter table public.special_requests enable row level security;

create policy "Anyone can submit a special request"
  on public.special_requests for insert
  to anon, authenticated
  with check (true);

create policy "Only authenticated users can view special requests"
  on public.special_requests for select
  to authenticated
  using (true);

-- 4. payment_settings + orders -----------------------------------------------------

create table public.payment_settings (
  id integer primary key default 1,
  account_holder text not null default '',
  iban text not null default '',
  payment_concept text not null default 'Mobiliario MoraBanc Office Store',
  updated_at timestamptz not null default now(),
  constraint payment_settings_singleton check (id = 1)
);

insert into public.payment_settings (id) values (1);

create trigger set_payment_settings_updated_at
  before update on public.payment_settings
  for each row
  execute function public.set_updated_at();

alter table public.payment_settings enable row level security;

create policy "Payment settings are viewable by everyone"
  on public.payment_settings for select
  using (true);

create policy "Only authenticated users can update payment settings"
  on public.payment_settings for update
  to authenticated
  using (true)
  with check (true);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  items jsonb not null,
  total numeric(10, 2) not null check (total >= 0),
  status text not null default 'pendiente_pago'
    check (status in ('pendiente_pago', 'pagado', 'cancelado')),
  created_at timestamptz not null default now()
);

create index orders_created_at_idx on public.orders (created_at desc);
create index orders_status_idx on public.orders (status);

alter table public.orders enable row level security;

create policy "Anyone can create an order"
  on public.orders for insert
  to anon, authenticated
  with check (true);

create policy "Only authenticated users can view orders"
  on public.orders for select
  to authenticated
  using (true);

-- 5. Grants -------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;

grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;

grant insert on public.special_requests to anon, authenticated;
grant select on public.special_requests to authenticated;

grant insert on public.orders to anon, authenticated;
grant select on public.orders to authenticated;

grant select on public.payment_settings to anon, authenticated;
grant update on public.payment_settings to authenticated;
