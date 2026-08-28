# Despliegue en producción — Windows Server / IIS

Guía para el equipo de infraestructura: cómo desplegar MoraBanc Office
Store (Next.js 16 + Supabase) en un servidor Windows corporativo.

## 0. Arquitectura — leer esto primero

Esta app **no es** una app tradicional IIS/.NET ni necesita un
PostgreSQL propio. Tiene dos piezas:

1. **Frontend/backend Next.js**: un proceso Node.js (no .NET, no PHP) que
   hay que ejecutar como servicio de Windows. IIS **no ejecuta** el
   código Next.js directamente — actúa solo de **reverse proxy** (TLS en
   el puerto 443, reenvía a Node en `127.0.0.1:3000`).
2. **Base de datos y almacenamiento**: **Supabase Cloud** (servicio
   gestionado externo, no un servidor que haya que provisionar). El
   proyecto ya existe y ya tiene todas las migraciones aplicadas —
   ninguna acción de infraestructura requerida aquí, solo las
   credenciales (§2).

```
Internet ──HTTPS:443──▶ IIS (reverse proxy, ARR + URL Rewrite)
                              │ HTTP a 127.0.0.1:3000
                              ▼
                         Node.js (Next.js standalone, gestionado por PM2)
                              │ HTTPS (API REST/RPC de Supabase)
                              ▼
                         Supabase Cloud (Postgres + Storage + Auth)
```

Si la opción es viable, **Azure App Service (Linux, runtime Node) o un
contenedor Docker** es significativamente más sencillo para una app
Next.js que IIS/Windows Server (sin necesidad de ARR, PM2 como servicio
de Windows, ni gestión manual de certificados en IIS). Esta guía cubre
Windows Server + IIS porque es lo que se ha pedido, pero conviene
tenerlo presente como alternativa.

**No se recomienda `iisnode`**: es un módulo prácticamente sin
mantenimiento que no funciona bien con el App Router ni con el streaming
SSR que usa Next.js 13+. El enfoque robusto y mantenible es: Node como
proceso independiente (gestionado por PM2) + IIS solo como reverse
proxy.

---

## 1. Requisitos técnicos

### Servidor
- **Windows Server 2019 o 2022** (o superior).
- **IIS 10** con los módulos:
  - [URL Rewrite 2.1](https://www.iis.net/downloads/microsoft/url-rewrite)
  - [Application Request Routing (ARR) 3.0](https://www.iis.net/downloads/microsoft/application-request-routing)
- **Node.js 20.9 LTS o superior** (recomendado: **Node.js 24.x LTS**, la
  versión con la que se ha desarrollado y probado este proyecto).
  Descargar el MSI oficial de [nodejs.org](https://nodejs.org/) (incluye
  npm).
- **PM2** (gestor de procesos Node, instalado globalmente):
  ```powershell
  npm install -g pm2
  npm install -g pm2-windows-startup
  pm2-startup install
  ```
  `pm2-windows-startup` es lo que permite que PM2 (y por tanto la app)
  arranque solo cuando se reinicia el servidor. Alternativa válida:
  [NSSM](https://nssm.cc/) para registrar `node server.js` directamente
  como servicio de Windows, sin PM2.
- Certificado TLS válido para el dominio público (gestionado por IT,
  vinculado a IIS en el paso 6).

### Node.js — paquetes
Ningún requisito especial más allá de `npm ci` (instala exactamente lo
que hay en `package-lock.json`). Dependencias clave: `next@16.3.0`,
`react@19.2.8`, `@supabase/supabase-js`, `@supabase/ssr`.

### Base de datos — Supabase (no un PostgreSQL propio)
- El proyecto de Supabase **ya existe** y **ya tiene aplicadas** todas
  las migraciones de este repositorio (`supabase/migrations/*.sql`),
  incluyendo Row Level Security (RLS) en todas las tablas y las
  funciones RPC (`place_order`, `confirm_order_payment`,
  `approve_special_request`, etc.). No hace falta ninguna acción de
  infraestructura sobre la base de datos para este despliegue.
- Si alguna vez hiciera falta un entorno nuevo (staging, por ejemplo):
  crear un proyecto en [supabase.com](https://supabase.com), y ejecutar
  **en orden cronológico por el nombre del fichero** todo el contenido
  de `supabase/migrations/*.sql` en el SQL Editor del nuevo proyecto.

### Almacenamiento — Supabase Storage
Dos buckets, ya creados por las migraciones:
- `product-images` — **público** (fotos de producto, se muestran en el
  catálogo sin autenticación).
- `transfer-receipts` — **privado** (justificantes de transferencia;
  actualmente sin uso activo desde que se eliminó este paso del
  checkout, pero se mantiene para no perder los ficheros ya subidos).

Ninguna configuración de infraestructura propia: es almacenamiento
gestionado por Supabase, no un file share ni un blob storage que haya
que provisionar.

---

## 2. Variables de entorno de producción

Esta app **no necesita ninguna "service role key" ni secreto de base de
datos**: toda la escritura privilegiada se hace vía RLS y funciones RPC
`security definer`, no con credenciales de acceso total. Sí necesita,
desde la incorporación de las notificaciones por correo de las
solicitudes especiales, un secreto de servidor para Resend (ver más
abajo).

| Variable | Obligatoria | Descripción |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Sí | URL del proyecto de Supabase (Project Settings → API). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí | Clave anon (pública) del proyecto. |
| `NEXT_PUBLIC_SITE_URL` | Recomendada | URL pública real del sitio (p. ej. `https://office-store.morabanc.ad`). Sin esto, el sitemap/robots.txt y metadata caen a `http://localhost:3000`. |
| `RESEND_API_KEY` | Recomendada | Clave de API de [Resend](https://resend.com), para enviar el correo de aprobación/rechazo de solicitudes especiales. Sin ella, la app funciona con normalidad: la aprobación/rechazo se completa igual, simplemente no se envía el correo. |
| `RESEND_FROM_EMAIL` | Recomendada | Dirección remitente verificada en Resend (p. ej. `no-reply@office-store.morabanc.ad`). Obligatoria si se define `RESEND_API_KEY`. |

Plantilla en `.env.production.example` (copiar a `.env.production` y
rellenar con los valores reales; **no versionar `.env.production` con
credenciales reales**).

**⚠️ Importante — momento de compilación, no de ejecución**: las
variables `NEXT_PUBLIC_*` se incrustan en el código del navegador
**durante `npm run build`**, no se leen en cada arranque del servidor.
`.env.production` debe existir **antes** de ejecutar `npm run build` —
si se definen solo en el servicio de Windows/PM2 después de compilar,
el build ya tendrá `undefined` incrustado y habrá que volver a
compilar. `RESEND_API_KEY`/`RESEND_FROM_EMAIL` son la excepción: al no
llevar el prefijo `NEXT_PUBLIC_`, no se incrustan en el bundle y sí se
leen en cada arranque del servidor standalone (`server.js`), así que
basta con que existan en `.env.production` en el momento del
`deploy.ps1` (paso 6 de la lista más abajo, que copia ese fichero
dentro de `.next/standalone/`).

---

## 3. `deploy.ps1` — qué hace

Fichero: [`deploy.ps1`](../deploy.ps1) (raíz del repositorio). Asume que
el código ya está en el servidor (vía vuestro propio proceso de CI/CD o
copia manual) y que `.env.production` ya está presente.

1. Comprueba que Node, npm y PM2 están instalados.
2. Comprueba que `.env.production` existe (falla con un mensaje claro si
   no — evita el problema del punto anterior).
3. `npm ci` — instalación limpia y reproducible según
   `package-lock.json`.
4. `npm run build` — compila (incrusta las variables `NEXT_PUBLIC_*`,
   genera `.next/standalone`).
5. Copia `public/` y `.next/static/` dentro de `.next/standalone/` (paso
   manual obligatorio de Next.js en modo `standalone`: no lo hace solo).
6. Copia `.env.production` dentro de `.next/standalone/` (el servidor
   standalone también lo lee al arrancar, para variables que no sean
   `NEXT_PUBLIC_*` en el futuro).
7. Arranca o recarga el proceso con PM2 (`pm2 startOrReload
   ecosystem.config.js --env production`), con downtime prácticamente
   nulo si ya había una versión anterior en marcha.
8. Guarda la lista de procesos de PM2 (`pm2 save`) para que
   `pm2-windows-startup` la recupere si el servidor se reinicia.

Ejecución:
```powershell
cd C:\inetpub\morabanc-office-store
.\deploy.ps1
```

## 4. `ecosystem.config.js` — configuración de PM2

Fichero: [`ecosystem.config.js`](../ecosystem.config.js). Define el
proceso `morabanc-office-store`, apuntando a
`.next/standalone/server.js`, escuchando solo en `127.0.0.1:3000` (IIS
es quien expone el sitio a Internet; el proceso Node no debe estar
accesible directamente).

---

## 5. Reverse proxy IIS (ARR + URL Rewrite)

Fichero plantilla: [`deploy/web.config`](../deploy/web.config).

1. Instalar los módulos **URL Rewrite** y **Application Request
   Routing** (enlaces en §1).
2. Habilitar el proxy a nivel de servidor: IIS Manager → nodo del
   servidor → *Application Request Routing Cache* → *Server Proxy
   Settings* → marcar **Enable proxy** → Apply.
3. Crear un sitio IIS nuevo:
   - Physical path: p. ej. `C:\inetpub\morabanc-office-store` (el mismo
     directorio donde vive el código y donde se ejecuta `deploy.ps1`).
   - Binding HTTP en el puerto 80 (se redirigirá a HTTPS, ver el
     `web.config`).
   - Binding HTTPS en el puerto 443 con el certificado TLS del dominio.
4. Copiar `deploy/web.config` a la raíz física del sitio IIS (mismo
   directorio que el `binding` anterior), como `web.config`.
5. Reiniciar el sitio IIS (`iisreset` o desde IIS Manager).

El `web.config` hace dos cosas: redirige todo el tráfico HTTP a HTTPS, y
reenvía (`proxy`, no `redirect`) todas las peticiones HTTPS hacia
`http://127.0.0.1:3000`, donde escucha el proceso Node gestionado por
PM2.

---

## 6. Guía paso a paso para IT

1. Instalar Node.js 20.9+ LTS (recomendado 24.x) en el servidor.
2. Instalar PM2 y `pm2-windows-startup` globalmente (§1).
3. Instalar los módulos IIS **URL Rewrite** y **ARR**, y habilitar el
   proxy a nivel de servidor (§5, paso 1–2).
4. Copiar el código del repositorio a
   `C:\inetpub\morabanc-office-store` (o la ruta que se elija).
5. Copiar `.env.production.example` a `.env.production` dentro de esta
   carpeta y rellenar `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `NEXT_PUBLIC_SITE_URL` con los
   valores reales (pedirlos a quien tenga acceso al dashboard de
   Supabase — Project Settings → API). Rellenar también
   `RESEND_API_KEY`/`RESEND_FROM_EMAIL` si se quiere que se envíen los
   correos de aprobación/rechazo de solicitudes especiales (opcional:
   sin ellas la app funciona igual, solo que sin ese correo).
6. Ejecutar `.\deploy.ps1` desde una PowerShell con permisos de
   administrador, dentro de esta carpeta.
7. Confirmar que el proceso está vivo: `pm2 status` debería mostrar
   `morabanc-office-store` como `online`. `pm2 logs
   morabanc-office-store` para ver los logs en directo.
8. Crear el sitio IIS y el `web.config` (§5, pasos 3–5).
9. Vincular el certificado TLS al binding HTTPS 443 del sitio IIS.
10. Configurar el DNS del dominio público para que apunte a este
    servidor.

### Verificación final
- `https://<dominio>/` carga el catálogo público.
- `https://<dominio>/admin/login` muestra el formulario de login (y
  `https://<dominio>/admin` redirige ahí si no hay sesión).
- `https://<dominio>/sitemap.xml` y `/robots.txt` usan el dominio real
  (confirma que `NEXT_PUBLIC_SITE_URL` se ha incrustado correctamente en
  el build).
- `http://<dominio>/` (sin S) redirige automáticamente a `https://`.
- Reiniciar el servidor Windows y confirmar que `pm2 status` vuelve a
  mostrar el proceso `online` solo, sin intervención manual (valida
  `pm2-windows-startup`).

### Actualizar una versión ya desplegada
```powershell
cd C:\inetpub\morabanc-office-store
git pull   # o vuestro método de copia de código
.\deploy.ps1
```
No hace falta tocar IIS ni el `web.config` en actualizaciones normales
de código — solo cuando cambien el dominio, el certificado o el puerto
interno.
