-- MoraBanc Office Store — múltiples imatges per producte (fins a 10).
--
-- Sustituye las columnas singulares `image_url`/`image_path` por arrays
-- `image_urls`/`image_paths` (paralelos, mismo índice = misma imagen).
-- Migra los datos existentes a arrays de un elemento antes de eliminar las
-- columnas antiguas, así que no se pierde ninguna imagen ya subida.
--
-- Ejecutar en el SQL Editor de Supabase, o vía `supabase db push` si usas la CLI.

alter table public.products
  add column if not exists image_urls text[] not null default '{}',
  add column if not exists image_paths text[] not null default '{}';

update public.products
set image_urls = case when image_url is not null then array[image_url] else '{}' end,
    image_paths = case when image_path is not null then array[image_path] else '{}' end
where true;

-- Solo se limita el máximo (10) a nivel de base de datos, no el mínimo: si
-- alguna fila existente se quedó sin imagen por cualquier motivo, forzar
-- aquí un mínimo de 1 rompería esta migración. El mínimo de 1 imagen para
-- productos nuevos/editados ya se exige en la capa de aplicación (Server
-- Actions), igual que antes se exigía la imagen única obligatoria.
alter table public.products
  drop constraint if exists products_image_urls_count;
alter table public.products
  add constraint products_image_urls_count
    check (coalesce(array_length(image_urls, 1), 0) <= 10);

alter table public.products
  drop constraint if exists products_image_paths_count;
alter table public.products
  add constraint products_image_paths_count
    check (coalesce(array_length(image_paths, 1), 0) <= 10);

alter table public.products
  drop constraint if exists products_images_paired;
alter table public.products
  add constraint products_images_paired
    check (coalesce(array_length(image_urls, 1), 0) = coalesce(array_length(image_paths, 1), 0));

alter table public.products
  drop column if exists image_url,
  drop column if exists image_path;

-- Este proyecto de Supabase ya mostró antes una caché de PostgREST que no
-- se refresca sola tras un cambio de esquema hecho por SQL Editor/CLI
-- (ver 20260814150000_fix_public_grants.sql): sin este NOTIFY, la API
-- puede seguir devolviendo "Could not find the 'image_paths' column..."
-- durante un rato aunque la columna ya exista.
NOTIFY pgrst, 'reload schema';
