# MoraBanc Office Store

Plataforma web interna de MoraBanc para la gestión y venta de mobiliario de
oficina entre empleados.

> **Estado del proyecto:** catálogo público, panel de administración con CRUD
> completo de productos (conectados a Supabase), carrito con un límite de 3
> unidades totales, formulario de solicitud especial para pedidos mayores, y
> finalización de pedido mediante transferencia bancaria manual (sin
> pasarela de pago). Pulido de UI/UX, accesibilidad y SEO técnico
> completados (animaciones, skeletons, estados vacíos, `robots.ts`/
> `sitemap.ts`, metadata OG, iconos generados con `next/og`). Todavía no
> incluye el flujo de aprobación ni gestión de pedidos desde el panel: eso
> llegará en próximas fases (ver [Próximas fases](#próximas-fases-fuera-del-alcance-actual)).

> **Nota sobre el idioma:** la interfaz de la aplicación (todo lo que ve un
> empleado o un administrador) está en **catalán** (`lang="ca"`), el idioma
> de uso de MoraBanc/Andorra. Esta documentación técnica, los comentarios en
> el código y los mensajes de commit se mantienen en castellano, que es el
> idioma de trabajo del equipo de desarrollo.

## Stack técnico

- [Next.js 16](https://nextjs.org/) (App Router, Server Actions, Proxy)
- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS 4](https://tailwindcss.com/) (tema corporativo configurado vía `@theme`)
- [Supabase](https://supabase.com/): base de datos (Postgres + RLS), Auth y Storage
- [lucide-react](https://lucide.dev/) para iconografía

## Requisitos previos

- Node.js 20 o superior
- npm 10 o superior
- Un proyecto de [Supabase](https://supabase.com) (gratuito) para el catálogo y el panel de administración

## Instalación

```bash
npm install
```

## Configurar Supabase

El catálogo y el panel de administración necesitan una base de datos de
Supabase. Sigue la guía completa en [`supabase/README.md`](supabase/README.md):
crear el proyecto, aplicar el esquema SQL y crear el usuario administrador.

Copia el archivo de ejemplo y rellena las credenciales:

```bash
cp .env.local.example .env.local
```

| Variable | Descripción |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública (anon) del proyecto |

**La aplicación funciona sin estas variables**: el catálogo y el login de
administración muestran un aviso explicando qué falta configurar, en lugar de
fallar. Es la forma de comprobar que el resto del sitio sigue funcionando
mientras conectas Supabase.

## Ejecución en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) para ver la aplicación.

- **Catálogo público:** [http://localhost:3000/catalogo](http://localhost:3000/catalogo)
- **Panel de administración:** [http://localhost:3000/admin](http://localhost:3000/admin)
  (requiere el usuario administrador creado en Supabase, ver
  [`supabase/README.md`](supabase/README.md))

## Scripts disponibles

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Levanta el servidor de desarrollo |
| `npm run build` | Genera el build de producción |
| `npm run start` | Sirve el build de producción |
| `npm run lint` | Ejecuta ESLint sobre el proyecto |

## Funcionalidad actual

### Catálogo (`/catalogo`)

- Tarjetas de producto con imagen, nombre, categoría, descripción, precio,
  estado y disponibilidad.
- Buscador por nombre/descripción (con debounce).
- Filtro por categoría y por disponibilidad.
- Orden por nombre (A-Z / Z-A) y por precio (ascendente / descendente).
- Los productos «descatalogados» nunca se muestran en el catálogo público.
- Totalmente responsive (1 columna en móvil → 4 en escritorio).

### Carrito

Accesible desde el icono de la cabecera en cualquier página. Permite añadir
y quitar productos, cambiar cantidades, y ver el resumen y el importe total.

- **Límite de negocio: máximo 3 unidades por solicitud**, sumando todas las
  líneas del carrito (da igual si son productos iguales o distintos). Nunca
  se puede superar: el estado del carrito calcula el máximo permitido antes
  de aplicar cualquier cambio.
- También respeta el stock de cada producto como segundo tope (independiente
  del límite de 3 unidades).
- El carrito persiste en `localStorage` (clave `morabanc-office-store:cart`),
  por lo que sobrevive a recargas de página; es exclusivamente del
  navegador, no se guarda en Supabase hasta que se finaliza la solicitud.

#### Solicitud especial (más de 3 unidades)

Al intentar añadir una unidad que superaría el límite de 3 (desde la ficha de
producto o desde el «+» de una línea del carrito), la acción se bloquea y se
abre automáticamente un formulario modal — no se limita a deshabilitar el
control. El formulario:

- Recoge nombre, apellidos, email, departamento, teléfono (opcional),
  productos solicitados, cantidad, motivo y comentarios (opcional).
- Viene precompleto con los productos y cantidades que ya había en el
  carrito más el intento que ha disparado el límite, editable antes de
  enviar.
- Valida los campos en el servidor y guarda la solicitud en la tabla
  `special_requests` de Supabase (ver `supabase/migrations/`); no se pierde
  aunque el carrito del usuario se vacíe después.
- Es un canal independiente del carrito: enviarlo no modifica ni vacía el
  carrito normal de hasta 3 unidades.

#### Finalizar solicitud (pago por transferencia bancaria)

**No hay ninguna pasarela de pago integrada** (ni Stripe, ni PayPal, ni TPV,
ni Apple/Google Pay, ni Bizum): esta web nunca cobra nada directamente.

Al pulsar «Finalizar solicitud» en el carrito:

1. Se registra el pedido en Supabase con estado **«Pendiente de pago»** (el
   importe se recalcula en el servidor a partir del precio de cada producto,
   nunca se confía en el total enviado desde el navegador).
2. Se abre un pop-up con el resumen del pedido, el importe total, y los
   datos de la transferencia: **titular de la cuenta, IBAN y concepto de
   pago** (con un número de solicitud único, p. ej. `MB-A1B2C3`, para poder
   identificar cada transferencia).
3. El mensaje deja claro que el empleado debe completar el pago haciendo él
   mismo una transferencia desde su propio banco.

El carrito se vacía tras registrar el pedido correctamente. Si el pedido no
se puede registrar (o los datos bancarios no se han configurado todavía), se
muestra un aviso y el carrito se conserva intacto.

### Panel de administración (`/admin`)

Protegido con inicio de sesión (Supabase Auth). Desde el panel se puede, sin
tocar código:

- Añadir, editar y eliminar productos.
- Cambiar imagen, precio, stock, categoría y estado de cualquier producto.
- Buscar y filtrar el listado por categoría y estado (incluye
  «descatalogado», oculto en el catálogo público).
- Editar el titular de la cuenta, el IBAN y el concepto de pago que se
  muestran al finalizar una solicitud (`/admin/pagos`), con validación de
  formato e IBAN (checksum mod-97) antes de guardar.

Todas las mutaciones se ejecutan mediante **Server Actions** de Next.js con
verificación de sesión en el servidor (no solo en la navegación), y las
imágenes se guardan en Supabase Storage.

## Arquitectura del proyecto

```
src/
├── app/
│   ├── layout.tsx              # RootLayout: fuentes, Header, Footer
│   ├── page.tsx                # Home
│   ├── globals.css             # Tema corporativo (Tailwind @theme)
│   ├── catalogo/                # Catálogo público (Server Component + filtros)
│   └── admin/
│       ├── login/                # Login (Server Action + Supabase Auth)
│       ├── actions.ts             # Server Actions: productos, ajustes de pago, logout
│       └── (protected)/           # Rutas que exigen sesión
│           ├── page.tsx            # Dashboard de productos
│           ├── productos/          # Alta y edición de productos
│           └── pagos/              # Ajustes de pago (titular, IBAN, concepto)
├── proxy.ts                    # Protege /admin: sin sesión, redirige al login
├── components/
│   ├── layout/                  # Header, Footer, Navigation, MobileMenu
│   ├── ui/                       # Button, Card, Container, Logo, SetupNotice
│   ├── catalog/                  # ProductCard, ProductGrid, ProductFilters, StatusBadge
│   ├── admin/                    # ProductForm, ProductTable, AdminFilters, PaymentSettingsForm
│   └── cart/                     # CartContext, CartDrawer, SpecialRequestModal, CheckoutModal
├── hooks/                       # useDebouncedValue, useEscapeKey, useFocusTrap, useScrollPosition, useUrlSearchState
├── lib/
│   ├── constants.ts              # Configuración del sitio, navegación y MAX_CART_UNITS
│   ├── auth.ts                   # requireUser(): exige sesión en Server Actions
│   ├── actions/
│   │   ├── specialRequest.ts     # Server Action pública: envía la solicitud especial
│   │   └── order.ts              # Server Action pública: registra el pedido (pendiente_pago)
│   └── supabase/                 # Clientes de Supabase (browser, server) y config
├── services/
│   ├── products.ts               # Lectura de productos (búsqueda, filtros, orden)
│   └── paymentSettings.ts        # Lectura de los datos bancarios configurados
├── types/                        # Tipos compartidos (Product, Cart, Order, NavItem, ...)
└── utils/                        # cn (clases), formatPrice, iban (validación/formateo)
supabase/
├── migrations/                  # Esquema SQL (products, special_requests, orders, payment_settings)
└── README.md                    # Guía de configuración de Supabase
```

**Criterio de separación:**

- `components/ui` contiene piezas de interfaz genéricas y sin conocimiento de
  negocio.
- `components/catalog` y `components/admin` son componentes de presentación
  específicos de cada área, reutilizados entre sus páginas.
- `app/admin/actions.ts` concentra toda la lógica de escritura (Server
  Actions); las páginas solo leen datos y renderizan formularios.
- `services` contiene la lógica de lectura de datos (consultas a Supabase),
  independiente de las páginas que la consumen.
- `lib` agrupa configuración e integraciones externas (Supabase, auth,
  constantes).

### Por qué el panel de administración tiene login

El panel permite crear, editar y eliminar productos y subir imágenes: sin
autenticación, cualquier persona con la URL podría modificar el catálogo. Por
eso `/admin` exige iniciar sesión con Supabase Auth, protegido en dos capas:

1. `src/proxy.ts` redirige a `/admin/login` cualquier visita a `/admin/*` sin
   sesión (capa de navegación).
2. Cada Server Action de escritura (`createProduct`, `updateProduct`,
   `deleteProduct`) vuelve a comprobar la sesión con `requireUser()`, porque
   las Server Actions son alcanzables por POST directo y no solo a través de
   la navegación protegida por el proxy.

Los permisos de escritura en la base de datos están reforzados además con
Row Level Security en Supabase (ver `supabase/migrations/`): solo usuarios
autenticados pueden insertar, editar o borrar productos; la lectura es
pública.

## Identidad visual

El tema corporativo (`src/app/globals.css`) está definido mediante tokens de
Tailwind CSS 4 y reproduce la identidad visual de MoraBanc:

- **Color de marca:** azul marino corporativo (`--color-brand`, `#114274`) con
  variantes más oscuras para fondos y textos de alto contraste.
- **Acento:** dorado (`--color-accent`, `#f1c657`), usado en llamadas a la
  acción, igual que en morabanc.ad.
- **Superficies:** blanco y azul muy claro (`--color-surface-soft`) para
  tarjetas y secciones destacadas.
- **Tipografía:** [Source Sans 3](https://fonts.google.com/specimen/Source+Sans+3)
  para texto (equivalente abierto de "Source Sans Pro", la fuente de cuerpo de
  morabanc.ad) y [Manrope](https://fonts.google.com/specimen/Manrope) para
  titulares, como alternativa de uso libre a la tipografía corporativa
  "Oblik" (de licencia propietaria, no disponible para este proyecto).

Todos los tokens de color, tipografía, radios y sombras están centralizados en
`globals.css`, por lo que ajustar la marca en el futuro no requiere tocar los
componentes.

## Despliegue en producción

El proyecto es una aplicación Next.js estándar (App Router + Server Actions),
por lo que funciona en cualquier plataforma con soporte para Node.js/Next.js.
La opción recomendada es [Vercel](https://vercel.com/), por ser la de menor
fricción para Next.js y la que requiere menos configuración manual.

### Opción recomendada: Vercel

1. Sube el repositorio a GitHub/GitLab/Bitbucket (o usa la CLI de Vercel
   directamente desde local).
2. En el dashboard de Vercel, pulsa **Add New → Project** e importa el
   repositorio. Vercel detecta automáticamente que es un proyecto Next.js
   (no hace falta tocar el *build command* ni el *output directory*).
3. En **Settings → Environment Variables**, añade las mismas variables que
   en `.env.local`:

   | Variable | Entorno |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview y Development |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview y Development |

   Usa el proyecto de Supabase de **producción** en `Production` y, si
   quieres aislar los datos de prueba, un proyecto de Supabase distinto (o
   el mismo con cuidado) en `Preview`/`Development`.
4. Despliega. Cada `git push` a la rama de producción (normalmente `main`)
   genera un despliegue de producción; cada Pull Request genera un
   despliegue de *preview* con su propia URL, útil para revisar cambios
   antes de fusionarlos.
5. Configura el dominio definitivo en **Settings → Domains** (por ejemplo
   `office-store.morabanc.ad`), siguiendo las instrucciones de Vercel para
   apuntar el DNS.

No hace falta configurar nada relacionado con pagos: la aplicación nunca
procesa transacciones (ver [Finalizar solicitud](#finalizar-solicitud-pago-por-transferencia-bancaria)),
así que no hay claves de pasarela de pago que gestionar ni cumplimiento PCI
que considerar.

### Otras plataformas (Node.js genérico)

Si no se usa Vercel, cualquier host que soporte Node.js 20+ sirve:

```bash
npm install
npm run build
npm run start   # sirve en el puerto 3000 por defecto (usa $PORT si está definida)
```

Asegúrate de definir `NEXT_PUBLIC_SUPABASE_URL` y
`NEXT_PUBLIC_SUPABASE_ANON_KEY` como variables de entorno del proceso antes
de arrancar `npm run start`. Como son variables `NEXT_PUBLIC_*`, quedan
incluidas en el *build* del cliente: **hay que definirlas también en tiempo
de build**, no solo en tiempo de ejecución (en Vercel esto ya se gestiona
automáticamente).

### Checklist antes de cada despliegue

- [ ] `npm run build` y `npm run lint` pasan en local sin errores.
- [ ] El esquema de Supabase de producción está al día con
      `supabase/migrations/` (ver [`supabase/README.md`](supabase/README.md)).
- [ ] Existe al menos un usuario administrador en el proyecto de Supabase de
      producción (si no, nadie puede entrar a `/admin`).
- [ ] Los ajustes de pago (`/admin/pagos`: titular, IBAN, concepto) están
      rellenados en producción — si no, el pop-up de finalizar solicitud
      avisa de que faltan por configurar en lugar de mostrar datos bancarios.

## Mantenimiento

### Actualizar dependencias

```bash
npm outdated        # ver qué paquetes tienen versión más nueva
npm update           # actualiza dentro del rango permitido por package.json
```

Next.js, React y Tailwind CSS son las dependencias más sensibles a romper
cosas en un *major upgrade* — revisa siempre su *changelog* antes de subir
de versión mayor, y vuelve a ejecutar `npm run build` y una pasada manual
por `/catalogo`, `/admin` y el flujo de carrito completo tras cualquier
actualización de ese tipo.

### Cambios en el esquema de Supabase

Cualquier cambio de esquema (nueva columna, nueva tabla, cambio de política
RLS) debe añadirse como un nuevo archivo en `supabase/migrations/`, nunca
editando una migración ya aplicada en producción. Sigue el procedimiento
descrito en [`supabase/README.md`](supabase/README.md).

### Gestión de incidencias

No hay un tracker de incidencias definido todavía para este proyecto. Hasta
que se defina uno, cualquier bug o petición de cambio debe canalizarse a
través del equipo interno de Facilities/IT de MoraBanc responsable de esta
plataforma.

### Rotar credenciales de Supabase

Si se necesita rotar la `anon key` de Supabase (por ejemplo tras una fuga),
genera una nueva desde **Project Settings → API** en el dashboard de
Supabase y actualízala tanto en `.env.local` (desarrollo) como en las
variables de entorno de Vercel (producción y preview), redesplegando
después para que el nuevo valor se incluya en el build del cliente.

## Próximas fases (fuera del alcance actual)

- Ficha de producto individual
- Flujo de aprobación interna tras el pago (hoy el pedido queda registrado
  como «pendiente_pago» pero nadie lo marca como pagado desde el panel)
- Panel para consultar y gestionar los pedidos y las solicitudes especiales
  recibidas (hoy solo se guardan en Supabase; no hay vista de administración
  para ellos)
- Roles de administración diferenciados (hoy cualquier usuario autenticado
  tiene permisos completos sobre el catálogo, los ajustes de pago, los
  pedidos y las solicitudes especiales)
