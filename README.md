# Barber Nova

SaaS multi-tenant para gestión de barberías. Cada barbería opera en su propio espacio aislado (`barberia_id`), con dashboard administrativo, panel de barbero, landing pública responsive y panel matriz para superadministración.

---

## Tabla de contenidos

- [Características](#características)
- [Stack tecnológico](#stack-tecnológico)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Requisitos](#requisitos)
- [Instalación rápida](#instalación-rápida)
- [Variables de entorno](#variables-de-entorno)
- [Roles y permisos](#roles-y-permisos)
- [Rutas del frontend](#rutas-del-frontend)
- [Landing pública](#landing-pública)
- [API REST — resumen de endpoints](#api-rest--resumen-de-endpoints)
- [Seguridad multi-tenant](#seguridad-multi-tenant)
- [Modelo de datos relevante](#modelo-de-datos-relevante)
- [Despliegue](#despliegue)
- [Solución de problemas](#solución-de-problemas)

---

## Características

### Panel de barbería (admin)
- Dashboard con métricas del negocio
- CRUD de **barberos**, **servicios** y **productos**
- **Turnos**: agenda, confirmación, cancelación, cambio de estado
- **Clientes** registrados desde la reserva online
- **Inventario**: entradas, salidas, alertas de stock bajo
- **Reportes** por periodo (ingresos, turnos, barberos, servicios)
- **Galería de cortes** para la landing pública
- **Configuración**: marca, colores, banner, textos, redes sociales y vista previa en tiempo real

### Panel de barbero
- Mis citas del día / pendientes
- Confirmación de turnos vía enlace **wa.me** (abre WhatsApp con mensaje prellenado)
- Validación de servicio por **código QR**
- Edición de perfil

### Landing pública (`/b/:slug`)
- Diseño **100 % responsive** (móvil, tablet, desktop)
- Hero personalizable (logo, banner, colores, mensaje)
- Reserva online paso a paso (servicio → barbero → horario → datos → QR)
- Galería de cortes con lightbox
- Footer con contacto y redes
- Botón flotante de WhatsApp

### Panel Matriz (superadmin)
- Dashboard global del ecosistema
- Gestión de barberías (crear, activar, bloquear)
- Registro de pagos de suscripción (+30 días)
- Historial de pagos y reportes
- Estados de suscripción (activo, en gracia, bloqueado)

### Otros
- Autenticación JWT con roles
- Suscripciones con periodo de gracia y bloqueo automático
- Integración WhatsApp mediante enlaces **wa.me** (sin API de Meta)
- Identificadores públicos con **UUID** (barberos, servicios, turnos)

---

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Backend | Laravel 12, PHP 8.2+ |
| Frontend | React 19, Vite 8, TypeScript |
| Estilos | Tailwind CSS v4 |
| Auth | JWT (`firebase/php-jwt`) |
| Base de datos | SQLite (dev) / MySQL / SQL Server |
| QR | `qrcode` + `html5-qrcode` |

---

## Estructura del proyecto

```
Barber-nova-/
├── Backend-barbers/          # API REST Laravel
│   ├── app/
│   │   ├── Http/Controllers/Api/
│   │   ├── Models/
│   │   ├── Services/
│   │   └── Http/Middleware/
│   ├── config/
│   ├── database/migrations/
│   └── routes/api.php
│
└── Frontend-barbers/         # SPA React
    ├── src/
    │   ├── components/
    │   │   ├── landing/      # Landing pública
    │   │   ├── config/       # Configuración + preview
    │   │   └── ui/
    │   ├── layouts/          # Dashboard, Matriz, Auth
    │   ├── pages/
    │   └── services/api.ts
    └── vite.config.ts
```

---

## Requisitos

- **PHP** 8.2 o superior
- **Composer** 2.x
- **Node.js** 20 o superior
- **npm** 10+
- **MySQL** 8+ (recomendado) o SQLite para desarrollo

---

## Instalación rápida

### 1. Backend

```bash
cd Backend-barbers
composer install
cp .env.example .env   # si no existe, copia manualmente
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan storage:link
php artisan serve
```

API disponible en: `http://127.0.0.1:8000/api`

> Si aparecen errores de columnas faltantes (`uuid`, `api_key`, etc.), ejecuta de nuevo `php artisan migrate`.

### 2. Frontend

```bash
cd Frontend-barbers
npm install
npm run dev
```

App disponible en: `http://localhost:5173`

El proxy de Vite redirige `/api` y `/storage` hacia Laravel en desarrollo.

### 3. Credenciales de prueba

Tras `db:seed`, revisa el seeder para usuarios de prueba (superadmin, admin barbería, barbero).

---

## Variables de entorno

### Backend (`Backend-barbers/.env`)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `APP_NAME` | Nombre de la app | `Barber Nova` |
| `APP_URL` | URL del backend | `http://localhost:8000` |
| `APP_KEY` | Clave Laravel (auto) | — |
| `APP_TIMEZONE` | Zona horaria | `America/Bogota` |
| `DB_CONNECTION` | Driver BD | `mysql` |
| `DB_HOST` | Host BD | `127.0.0.1` |
| `DB_PORT` | Puerto BD | `3306` |
| `DB_DATABASE` | Nombre BD | `barber_nova` |
| `DB_USERNAME` | Usuario BD | `root` |
| `DB_PASSWORD` | Contraseña BD | — |
| `JWT_SECRET` | Secreto JWT (opcional, usa `APP_KEY`) | — |
| `JWT_TTL_HOURS` | Duración del token | `24` |
| `CORS_ALLOWED_ORIGINS` | Orígenes permitidos (CSV) | `http://localhost:5173` |
| `FRONTEND_URL` | URL del frontend (links QR, citas, wa.me) | `http://localhost:5173` |
| `MATRIZ_MONTO_SUSCRIPCION` | Monto referencia suscripción | `100` |

> **WhatsApp:** no se usa la API de Meta. Al confirmar una cita, el sistema genera un enlace `https://wa.me/...?text=...` que abre WhatsApp con el mensaje al cliente (barbero o admin envía manualmente).

### Frontend (`Frontend-barbers/.env`)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_API_URL` | Base URL API | `/api` (proxy dev) |

En producción, apunta `VITE_API_URL` a la URL real del backend.

---

## Roles y permisos

| Rol | Acceso |
|-----|--------|
| `superadmin` | Panel Matriz (`/matriz/*`) |
| `admin_barberia` | Dashboard completo de su barbería |
| `barbero` | Mis citas, validar QR, mi perfil |

El middleware `SubscriptionGuard` bloquea el acceso si la suscripción está vencida (excepto superadmin).

---

## Rutas del frontend

| Ruta | Descripción | Auth |
|------|-------------|------|
| `/login` | Inicio de sesión | Pública |
| `/b/:slug` | Landing pública de la barbería | Pública |
| `/cita/:uuid` | Detalle de cita + QR | Pública |
| `/dashboard` | Home del panel | JWT |
| `/dashboard/barberos` | Gestión barberos | Admin |
| `/dashboard/servicios` | Gestión servicios | Admin |
| `/dashboard/productos` | Catálogo productos | Admin |
| `/dashboard/clientes` | Clientes registrados | Admin |
| `/dashboard/turnos` | Agenda de turnos | Admin |
| `/dashboard/inventario` | Inventario | Admin |
| `/dashboard/reportes` | Reportes | Admin |
| `/dashboard/galeria` | Galería de cortes | Admin |
| `/dashboard/configuracion` | Config landing | Admin |
| `/dashboard/mis-citas` | Citas del barbero | Barbero |
| `/dashboard/validar-qr` | Escáner QR | Barbero |
| `/dashboard/mi-perfil` | Perfil barbero | Barbero |
| `/matriz/dashboard` | Panel superadmin | Superadmin |
| `/matriz/barberias` | Gestión barberías | Superadmin |
| `/matriz/pagos` | Historial pagos | Superadmin |
| `/matriz/estados` | Estados suscripción | Superadmin |
| `/matriz/reportes` | Reportes globales | Superadmin |

---

## Landing pública

URL: `http://localhost:5173/b/{slug}`

### Secciones

1. **Navbar** — menú hamburguesa en móvil, navegación fija en desktop
2. **Hero** — banner, logo, CTA reservar / WhatsApp
3. **Reserva** — wizard de 4 pasos con barra de progreso en móvil
4. **Galería** — grid adaptativo 2→3→4 columnas + lightbox
5. **Footer** — contacto, redes, texto personalizable
6. **WhatsApp flotante** — respeta safe-area en móviles

### Responsive

- Breakpoints Tailwind: `sm` (640px), `md` (768px), `lg` (1024px)
- Sin scroll horizontal (`overflow-x: hidden`)
- QR adaptativo al ancho de pantalla
- Menú móvil con overlay y bloqueo de scroll
- Padding inferior para no tapar contenido con el FAB de WhatsApp

### Personalización

Desde **Dashboard → Configuración**:
- Colores principal y secundario
- Logo y banner
- Mensaje de bienvenida y descripción
- WhatsApp, footer, Facebook, Instagram, TikTok
- Galería de cortes (Dashboard → Galería cortes)

---

## API REST — resumen de endpoints

Base: `/api`

### Autenticación

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/auth/login` | Login → JWT |
| GET | `/auth/me` | Usuario autenticado |

### Público (sin JWT, por slug)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/public/b/{slug}` | Datos landing (barbería, servicios, barberos, galería) |
| GET | `/public/b/{slug}/barberos/{uuid}/disponibilidad?fecha=` | Horarios libres |
| POST | `/public/b/{slug}/turnos` | Crear reserva |
| GET | `/public/cita/{uuid}` | Detalle cita pública |

### Tenant (JWT + barberia_id)

| Grupo | Rutas principales |
|-------|-------------------|
| Configuración | `GET/PUT /configuracion`, `PUT /configuracion/landing`, upload logo/banner |
| Galería | `GET/POST /configuracion/galeria`, `DELETE /configuracion/galeria/{id}` |
| Barberos | `apiResource /barberos` + horarios/bloqueos por UUID |
| Servicios | `apiResource /servicios` |
| Productos | `apiResource /productos` |
| Turnos admin | `GET/POST/PUT/DELETE /admin/turnos`, confirmar, cambiar estado |
| Clientes | `GET /admin/clientes` |
| Inventario | `GET /inventario/resumen`, movimientos |
| Reportes | `GET /reportes?desde=&hasta=` |
| Barbero | `/barbero/mis-turnos`, confirmar, validar QR, perfil |

### Matriz (JWT + superadmin)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/matriz/dashboard` | Resumen + listado barberías |
| GET | `/matriz/pagos` | Historial pagos |
| GET | `/matriz/estados` | Estados suscripción |
| GET | `/matriz/reportes` | Reportes globales |
| POST | `/matriz/barberias` | Registrar barbería |
| POST | `/matriz/barberias/{id}/registrar-pago` | Pago +30 días |
| POST | `/matriz/barberias/{id}/bloquear` | Bloquear acceso |
| POST | `/matriz/barberias/{id}/activar` | Activar manualmente |

### Público legacy (X-API-KEY)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/public/servicios` | Servicios (header `X-API-KEY`) |
| GET | `/public/barberos` | Barberos activos |
| POST | `/turnos` | Reserva (API key) |

---

## Seguridad multi-tenant

| Middleware | Función |
|------------|---------|
| `JwtAuthMiddleware` | Valida token JWT |
| `MultiTenantMiddleware` | Inyecta y valida `barberia_id`; impide acceso cruzado |
| `SubscriptionMiddleware` | Verifica suscripción activa o en gracia |
| `SuperAdminMiddleware` | Restringe rutas matriz |
| `ResolveBarberiaByApiKey` | Resuelve tenant por API key en endpoints legacy |

### Identificadores públicos (UUID)

- `barberos.uuid`
- `servicios.uuid`
- `turnos.uuid` (citas públicas)

Evita enumeración de IDs enteros en URLs y APIs públicas.

---

## Modelo de datos relevante

- **Barbería** — tenant principal; slug único para landing (`/b/{slug}`)
- **Usuario** — pertenece a una barbería; roles: superadmin, admin_barberia, barbero
- **Suscripción** — fecha vencimiento, estado pago, estado sistema (activo/gracia/bloqueado)
- **Barbero** — horarios semanales + bloqueos por fecha
- **Servicio** — precio, duración, estado activo
- **Cliente** — puede no tener cuenta; se identifica por teléfono
- **Turno** — cliente + barbero + servicio + estado (pendiente/confirmado/completado/cancelado)
- **Producto / Inventario** — stock, movimientos entrada/salida
- **Galería corte** — imágenes para landing pública
- **Landing config** — colores, textos, banner, redes

---

## Despliegue

### Backend (Laravel)

```bash
composer install --optimize-autoloader --no-dev
php artisan config:cache
php artisan route:cache
php artisan migrate --force
php artisan storage:link
```

Configura el servidor web (Nginx/Apache) apuntando a `public/`.

### Frontend (React)

```bash
npm run build
```

Sirve la carpeta `dist/` como SPA. Configura rewrite a `index.html` para rutas del cliente.

Variables de producción:
- `APP_URL` → URL del backend
- `FRONTEND_URL` → URL del frontend
- `CORS_ALLOWED_ORIGINS` → dominio del frontend
- `VITE_API_URL` → URL completa del API en build time

---

## Solución de problemas

| Problema | Solución |
|----------|----------|
| CORS en producción | Agrega el dominio frontend en `CORS_ALLOWED_ORIGINS` |
| Imágenes no cargan | Ejecuta `php artisan storage:link` y verifica permisos en `storage/` |
| Landing no encontrada | Verifica que la barbería tenga `slug` configurado |
| WhatsApp no abre | Verifica que el teléfono del cliente tenga código de país (ej. 57...) |
| Token expirado | Aumenta `JWT_TTL_HOURS` o vuelve a iniciar sesión |
| Migraciones pendientes | `php artisan migrate` |
| Proxy API en dev | Confirma que Laravel corre en `:8000` y Vite en `:5173` |

---

## Scripts útiles

```bash
# Backend
php artisan serve
php artisan migrate:fresh --seed
php artisan tinker

# Frontend
npm run dev
npm run build
npm run preview
```

---

## Licencia

Proyecto privado — Barber Nova.
