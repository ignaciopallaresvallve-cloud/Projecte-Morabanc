# Configuración de Supabase

Esta carpeta contiene el esquema de base de datos que necesita el catálogo de
productos y el panel de administración.

## 1. Crear el proyecto

Crea un proyecto en [supabase.com](https://supabase.com) (o usa uno existente)
y copia la **URL** y la **anon key** desde *Project Settings → API*.

Pégalas en `.env.local` en la raíz del proyecto (usa `.env.local.example` como
plantilla):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon
```

## 2. Aplicar el esquema

Hay doce migraciones en [`migrations/`](migrations/), en orden:

1. [`20260806120000_init_products.sql`](migrations/20260806120000_init_products.sql) —
   tabla `products` (nombre, descripción, precio, stock, categoría, estado,
   imagen), con RLS de lectura pública / escritura solo autenticados, y el
   bucket de Storage `product-images` (lectura pública, escritura autenticada).
2. [`20260806130000_special_requests.sql`](migrations/20260806130000_special_requests.sql) —
   tabla `special_requests` para las solicitudes de más de 3 unidades del
   carrito, con RLS de inserción pública (cualquier empleado puede enviar el
   formulario, sin iniciar sesión) y lectura restringida a usuarios
   autenticados.
3. [`20260806140000_orders_and_payment_settings.sql`](migrations/20260806140000_orders_and_payment_settings.sql) —
   tabla `orders` (pedidos registrados como «pendiente_pago» al finalizar una
   solicitud del carrito, inserción pública / lectura solo autenticados) y
   `payment_settings`, una fila única con el titular de la cuenta, el IBAN y
   el concepto de pago que se muestran en el pop-up de "Finalizar solicitud"
   (lectura pública, edición solo autenticados desde `/admin/pagos`).
4. [`20260814150000_fix_public_grants.sql`](migrations/20260814150000_fix_public_grants.sql) —
   concede los `GRANT` base de PostgreSQL sobre `public` a los roles `anon` y
   `authenticated` para cada tabla. Necesaria porque RLS por sí sola no basta:
   si el rol no tiene también el privilegio de PostgreSQL sobre la tabla, las
   consultas fallan con `permission denied for table ...` antes de que RLS
   llegue a evaluarse.
5. [`20260814160000_reset_app_schema.sql`](migrations/20260814160000_reset_app_schema.sql) —
   elimina y vuelve a crear `products`, `special_requests`, `orders` y
   `payment_settings` desde cero (incluye de nuevo las políticas RLS, el
   bucket de Storage y los `GRANT`, así que ya incorpora la migración
   anterior). Solo hace falta si tu proyecto de Supabase acabó con tablas de
   esos nombres pero con columnas distintas a las que espera el código —
   p. ej. si `products` tiene `slug`/`dimensions`/`total_stock` en vez de
   `stock`/`image_url`/`image_path`, o si `status` es un tipo enum en vez de
   texto. **Borra cualquier fila que hubiera en esas 4 tablas** — solo
   ejecútala si no hay datos en ellas que necesites conservar.
6. [`20260817120000_place_order_rpc.sql`](migrations/20260817120000_place_order_rpc.sql) —
   crea la función `place_order`, que descuenta el stock de cada línea y
   registra el pedido en una única transacción (si falta stock de cualquier
   producto, no se descuenta nada y no se crea el pedido). Se expone como
   `security definer` para que `anon`/`authenticated` puedan invocarla sin
   necesitar `UPDATE` directo sobre `products`.
7. [`20260818120000_checkout_buyer_info_and_pickup_dates.sql`](migrations/20260818120000_checkout_buyer_info_and_pickup_dates.sql) —
   añade a `payment_settings` el SWIFT/BIC y las 4 opciones de fecha de
   recogida editables desde `/admin/pagos`; añade a `orders` los datos del
   comprador (nombre, código de empleado, departamento) y las 2 fechas de
   recogida elegidas; y sustituye `place_order` por una versión que también
   guarda esos datos del comprador junto con el pedido.
8. [`20260819120000_bulk_price_discount_rpc.sql`](migrations/20260819120000_bulk_price_discount_rpc.sql) —
   crea la función `apply_bulk_price_discount`, que usada por el botón
   "Segona tanda" del panel de administración: reduce el precio de todos
   los productos del catálogo un porcentaje dado, en una única `UPDATE`
   atómica. No es `security definer`: se ejecuta con los privilegios que ya
   tiene cualquier administrador autenticado.
9. [`20260819130000_fix_bulk_discount_where_clause.sql`](migrations/20260819130000_fix_bulk_discount_where_clause.sql) —
   corrige `apply_bulk_price_discount`: este proyecto de Supabase tiene
   activada alguna guardia (al estilo de la extensión `safeupdate`) que
   bloquea cualquier `UPDATE`/`DELETE` sin una cláusula `WHERE` literal,
   incluso dentro de una función. Añade `where true` a la actualización
   (sigue afectando a todas las filas, pero cumple la comprobación).
10. [`20260819140000_discount_toggle_and_reset.sql`](migrations/20260819140000_discount_toggle_and_reset.sql) —
    añade `payment_settings.is_discount_active` (impide aplicar "Segona
    tanda" dos veces) y `products.original_price` (guarda el precio exacto
    previo al descuento, para poder restaurarlo sin arrastrar redondeos).
    Actualiza `apply_bulk_price_discount` para que compruebe y active ese
    flag, y añade `reset_product_prices`, que restaura todos los precios
    originales y desactiva el flag.
11. [`20260820120000_enable_orders_realtime.sql`](migrations/20260820120000_enable_orders_realtime.sql) —
    añade `orders` a la publicación `supabase_realtime`, para que
    `/admin/comandes` se actualice al instante cuando se registra un pedido
    nuevo. Respeta la política RLS de lectura ya existente sobre `orders`
    (solo usuarios autenticados), así que solo las sesiones de
    administrador reciben estos eventos.
12. [`20260822120000_multi_image_products.sql`](migrations/20260822120000_multi_image_products.sql) —
    sustituye `image_url`/`image_path` (una sola imagen) por `image_urls`/
    `image_paths` (arrays, hasta 10 imágenes, mismo índice = misma imagen),
    migrando los datos existentes antes de eliminar las columnas antiguas.
    El máximo de 10 se exige a nivel de base de datos; el mínimo de 1 solo
    a nivel de aplicación (para no romper la migración si alguna fila ya
    existente se hubiera quedado sin imagen).

**Opción A — SQL Editor (recomendado si no usas la CLI de Supabase):**

1. Abre tu proyecto en el dashboard de Supabase → *SQL Editor*.
2. Pega el contenido de cada archivo de migración, en orden, y ejecútalo.

**Opción B — Supabase CLI:**

```bash
supabase link --project-ref <tu-project-ref>
supabase db push
```

## 3. Crear el usuario administrador

El panel (`/admin`) requiere iniciar sesión con Supabase Auth (email y
contraseña). No hay registro público: los usuarios administradores se crean
manualmente.

1. Dashboard de Supabase → *Authentication → Users → Add user*.
2. Crea el usuario con el email y contraseña que usará quien administre el
   catálogo (marca *Auto Confirm User* para que no necesite verificar el email).
3. Entra en `/admin` con esas credenciales.

Puedes crear tantos usuarios administradores como necesites repitiendo este
paso. Cualquier usuario autenticado puede crear, editar y eliminar productos:
si en el futuro necesitas roles distintos, añade una tabla `profiles` con un
campo de rol y ajusta las políticas RLS en consecuencia.

## 4. Configurar los datos bancarios

Antes de que los empleados puedan finalizar solicitudes, entra en
`/admin/pagos` (con el usuario administrador del paso anterior) y rellena:

- **Titular de la cuenta**
- **IBAN**
- **Concepto de pago**

La migración crea la fila de `payment_settings` vacía por defecto — hasta
que la configures, el pop-up de "Finalizar solicitud" avisará de que los
datos bancarios todavía no están disponibles en lugar de mostrar
información inventada.

## 5. (Opcional) Tipar el cliente de Supabase

Para obtener autocompletado y comprobación de tipos en las consultas, genera
los tipos de la base de datos con la CLI:

```bash
supabase gen types typescript --project-id <tu-project-ref> > src/types/supabase.ts
```

Y pásalos como genérico a `createBrowserClient<Database>` /
`createServerClient<Database>` en `src/lib/supabase/`.
