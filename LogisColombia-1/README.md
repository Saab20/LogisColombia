# TrackRoute — Panel de Gestión de Rutas Logísticas en Tiempo Real

Plataforma web fullstack para **LogisColombia S.A.S.** que centraliza la gestión de rutas de envío, permite monitorear el estado en tiempo real consumiendo un servicio SOAP de rastreo, y expone una API REST robusta hacia un frontend en Angular.

## Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Angular 19)                    │
│                        http://localhost:4200                    │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌───────────────┐  │
│  │  Login   │  │  Rutas   │  │ Monitoreo │  │   Dashboard   │  │
│  │          │  │  (CRUD)  │  │ (30s poll)│  │ (Indicadores) │  │
│  └──────────┘  └──────────┘  └───────────┘  └───────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Core: AuthService · RouteService · Guards · Interceptors│   │
│  └─────────────────────────────────────────────────────────┘    │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP (JWT Bearer)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (Node.js + Express + TypeScript)       │
│                        http://localhost:3000                     │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Middleware: Helmet · CORS · RateLimit · Auth · Correlation│ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Auth Module  │  │ Routes Module│  │  Tracking Module     │  │
│  │ controller   │  │ controller   │  │  controller          │  │
│  │ service      │  │ service      │  │  adapter (SOAP mock) │  │
│  │ repository   │  │ repository   │  │  cache (TTL 60s)     │  │
│  │ dto (Zod)    │  │ dto (Zod)    │  │  dto                 │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────────┘  │
│         │                 │                                     │
│         ▼                 ▼                                     │
│  ┌─────────────────────────────┐    ┌────────────────────────┐  │
│  │     PostgreSQL 15           │    │  Servicio SOAP Legado  │  │
│  │     (Docker, puerto 5433)   │    │  (Mock / TrackingAdapter│ │
│  │                             │    │   abstrae la comunicación│ │
│  │  Tables: users, routes      │    └────────────────────────┘  │
│  │  Indexes: origin, dest,     │                                │
│  │    status, vehicle, carrier │                                │
│  └─────────────────────────────┘                                │
└─────────────────────────────────────────────────────────────────┘
```

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Angular 19 · TypeScript · SCSS · Standalone Components |
| Backend | Node.js 20 · TypeScript · Express 4 |
| Base de datos | PostgreSQL 15 (Docker) |
| Validación | Zod (backend) · Template-driven forms (frontend) |
| Autenticación | JWT (jsonwebtoken) · bcrypt (cost factor 12) |
| Seguridad | Helmet · CORS explícito · Rate limiting |
| Logging | Pino (structured logs con correlation-id) |
| Migraciones | node-pg-migrate |
| Testing | Jest · Supertest (backend) |
| Integración SOAP | TrackingAdapter (mock con caché TTL 60s) |

## Requisitos Previos

- **Node.js** >= 20.x LTS
- **npm** >= 10.x
- **Docker** y **Docker Compose** (para PostgreSQL)
- **Angular CLI** 19 (`npm install -g @angular/cli@19`)

## Levantar el Entorno Local

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd trackroute
```

### 2. Levantar PostgreSQL con Docker

```bash
docker compose up -d
```

Esto levanta PostgreSQL 15 en el puerto **5433** (para no chocar con instalaciones locales).

### 3. Backend

```bash
cd backend
cp .env.example .env        # Configurar variables si es necesario
npm install
npm run migrate:up           # Crear tablas (users, routes)
npm run seed                 # Cargar dataset de 100 rutas + usuarios de prueba
npm run dev                  # Servidor en http://localhost:3000
```

### 4. Frontend

```bash
cd frontend
npm install
npx ng serve                 # Aplicación en http://localhost:4200
```

### 5. Acceder a la aplicación

Abrir `http://localhost:4200` en el navegador.

**Usuarios de prueba (creados por el seed):**

| Usuario | Contraseña | Rol | Permisos |
|---------|-----------|-----|----------|
| `admin` | `admin123` | ADMIN | Lectura + escritura (CRUD, importar CSV) |
| `operador` | `operador123` | OPERADOR | Solo lectura |

## Variables de Entorno

Referencia completa en `backend/.env.example`:

| Variable | Descripción | Valor por defecto |
|----------|------------|-------------------|
| `PORT` | Puerto del servidor backend | `3000` |
| `NODE_ENV` | Entorno de ejecución | `development` |
| `DATABASE_URL` | URL de conexión a PostgreSQL | `postgresql://trackroute:trackroute_pass@localhost:5433/trackroute_db` |
| `JWT_SECRET` | Clave secreta para firmar tokens JWT | (requerido, mínimo 16 caracteres) |
| `JWT_EXPIRES_IN` | Tiempo de expiración del token | `8h` |
| `SOAP_TRACKING_URL` | URL del servicio SOAP de rastreo | `http://localhost:8080/tracking?wsdl` |
| `SOAP_CACHE_TTL_SECONDS` | TTL del caché de respuestas SOAP | `60` |
| `CORS_ORIGIN` | Origen permitido para CORS | `http://localhost:4200` |
| `RATE_LIMIT_WINDOW_MS` | Ventana de rate limiting global (ms) | `60000` |
| `RATE_LIMIT_MAX_REQUESTS` | Máximo de requests por ventana | `100` |
| `LOGIN_RATE_LIMIT_MAX` | Máximo de intentos de login por minuto por IP | `5` |

## Decisiones de Arquitectura

### PostgreSQL

Los datos de rutas son inherentemente relacionales: tienen estructura fija (origen, destino, vehículo, transportista, costo, estado) y requieren filtros complejos por múltiples campos con paginación eficiente. PostgreSQL maneja esto nativamente con índices B-tree. MongoDB no aporta ventaja aquí — los datos son tabulares, no documentales.

### Express

Express tiene mayor ecosistema para integración SOAP en Node.js, más middleware maduro (helmet, cors, express-rate-limit), y es el estándar más documentado. Fastify gana en throughput puro, pero este proyecto no tiene requisitos de alta concurrencia que lo justifiquen.

### Standalone Components

Angular 17+ promueve standalone components como el estándar. Simplifican el lazy loading (cada ruta carga solo su componente), reducen boilerplate, y eliminan la necesidad de módulos intermedios. Todas las rutas usan `loadComponent()` para lazy loading.

### Signals para manejo de estado

El estado de la aplicación es simple: usuario autenticado, lista de rutas paginada, datos de tracking. No hay flujos complejos que justifiquen NgRx. Angular Signals (v17+) proporcionan reactividad granular, son más ligeros, y están integrados nativamente en el framework. El `AuthService` usa signals para exponer `user`, `isAuthenticated` e `isAdmin` como estado reactivo.

### TrackingAdapter como abstracción del servicio SOAP

El documento requiere que "el resto del sistema nunca debe conocer que hay SOAP detrás". El `TrackingAdapter` expone una interfaz TypeScript limpia (`trackRoute(routeId): Promise<TrackingResponse>`) con caché in-memory (TTL 60s). En producción se reemplazaría el mock por llamadas SOAP reales sin cambiar ningún consumidor.

### Soft Delete en lugar de eliminación física

El documento lo requiere explícitamente. Las rutas nunca se eliminan de la base de datos — se marcan como `is_active = false` y `status = 'INACTIVA'`. Esto preserva el historial para auditoría y reportes.

### sessionStorage sobre localStorage para tokens

Los tokens JWT se almacenan en `sessionStorage` en lugar de `localStorage`. `sessionStorage` se limpia al cerrar la pestaña, reduciendo la ventana de exposición si el equipo es compartido. En un entorno ideal se usarían cookies httpOnly, pero para esta implementación con CORS cross-origin, sessionStorage es el balance adecuado.

## Supuestos

1. **Servicio SOAP**: Se implementó como mock con respuestas determinísticas basadas en el routeId. En producción se conectaría al WSDL real sin cambiar la interfaz del adaptador.
2. **Dataset**: El archivo `routes_dataset.csv` con 100 rutas se carga automáticamente con `npm run seed`. El seed es idempotente para los usuarios (usa `ON CONFLICT DO NOTHING`).
3. **Autenticación**: El endpoint de registro está abierto en desarrollo. En producción debería protegerse con el guard de ADMIN.
4. **Mapa de calor**: Se implementó como un componente visual simplificado (grid de celdas con opacidad proporcional al conteo) en lugar de un mapa geográfico real, como permite el documento.
5. **Polling vs WebSockets**: El monitoreo usa polling cada 30 segundos como requiere el documento base. WebSockets sería una mejora opcional.
6. **Puerto PostgreSQL**: Se usa el puerto 5433 en el host para evitar conflictos con instalaciones locales de PostgreSQL. Dentro de Docker el puerto interno sigue siendo 5432.

## Estructura del Proyecto

```
trackroute/
├── backend/
│   ├── src/
│   │   ├── auth/                  # Módulo de autenticación (RF-04)
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.repository.ts
│   │   │   └── auth.dto.ts
│   │   ├── routes/                # Módulo de rutas (RF-01, RF-03, RF-05)
│   │   │   ├── route.controller.ts
│   │   │   ├── route.service.ts
│   │   │   ├── route.repository.ts
│   │   │   └── route.dto.ts
│   │   ├── tracking/              # Módulo de rastreo SOAP (RF-02)
│   │   │   ├── tracking.controller.ts
│   │   │   ├── tracking.adapter.ts   # Abstracción del servicio SOAP
│   │   │   └── tracking.dto.ts
│   │   ├── config/                # Configuración (DB, env, logger)
│   │   ├── shared/                # Middleware y errores compartidos
│   │   ├── scripts/seed.ts        # Script de carga del dataset CSV
│   │   ├── app.ts                 # Configuración de Express
│   │   └── server.ts              # Entry point con graceful shutdown
│   ├── migrations/                # Migraciones PostgreSQL
│   ├── routes_dataset.csv         # Dataset de 100 rutas de Colombia
│   ├── api-tests.http             # Colección de pruebas HTTP
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/app/
│   │   ├── core/
│   │   │   ├── guards/            # authGuard, adminGuard
│   │   │   ├── interceptors/      # auth (JWT), error (401/5xx)
│   │   │   ├── models/            # Interfaces TypeScript
│   │   │   └── services/          # AuthService, RouteService
│   │   ├── features/
│   │   │   ├── auth/login/        # Pantalla de login
│   │   │   ├── routes/            # Lista + formulario de rutas
│   │   │   ├── monitoring/        # Panel de monitoreo en tiempo real
│   │   │   └── dashboard/         # Dashboard de indicadores
│   │   ├── app.routes.ts          # Rutas con lazy loading
│   │   └── app.config.ts          # Providers (HTTP, interceptors)
│   └── package.json
├── docker-compose.yml             # PostgreSQL 15
├── CHANGELOG.md
└── README.md
```

## Endpoints de la API

### Autenticación

| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| POST | `/api/auth/login` | Iniciar sesión | Público |
| POST | `/api/auth/register` | Registrar usuario | Público (dev) |

### Rutas

| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| GET | `/api/routes` | Listar rutas (paginado, filtros) | OPERADOR, ADMIN |
| GET | `/api/routes/:id` | Obtener ruta por ID | OPERADOR, ADMIN |
| POST | `/api/routes` | Crear ruta | ADMIN |
| PUT | `/api/routes/:id` | Actualizar ruta | ADMIN |
| DELETE | `/api/routes/:id` | Inhabilitar ruta (soft delete) | ADMIN |
| POST | `/api/routes/import` | Importar rutas desde CSV | ADMIN |

### Dashboard

| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| GET | `/api/routes/stats` | Rutas por estado | OPERADOR, ADMIN |
| GET | `/api/routes/top-cost` | Top 5 rutas por costo | OPERADOR, ADMIN |
| GET | `/api/routes/by-region` | Rutas activas por región | OPERADOR, ADMIN |
| GET | `/api/routes/stats-by-date` | Stats filtradas por fecha | OPERADOR, ADMIN |

### Tracking

| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| GET | `/api/tracking/:routeId` | Datos de rastreo en tiempo real | OPERADOR, ADMIN |

### Health

| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| GET | `/api/health` | Estado del servidor | Público |

## Pruebas de Endpoints

El archivo `backend/api-tests.http` contiene una colección completa para probar todos los endpoints con un cliente HTTP (VS Code REST Client, IntelliJ HTTP Client, etc.).

## Construido Con

- [Angular 19](https://angular.dev/) — Framework frontend
- [Express 4](https://expressjs.com/) — Framework backend
- [PostgreSQL 15](https://www.postgresql.org/) — Base de datos relacional
- [Zod](https://zod.dev/) — Validación de DTOs
- [Pino](https://getpino.io/) — Logging estructurado
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) — Autenticación JWT
- [bcrypt](https://github.com/kelektiv/node.bcrypt.js) — Hash de contraseñas
- [node-pg-migrate](https://github.com/salsita/node-pg-migrate) — Migraciones de base de datos

