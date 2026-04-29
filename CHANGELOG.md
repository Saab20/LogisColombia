# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y este proyecto adhiere a [Versionamiento Semántico](https://semver.org/lang/es/).

## [No publicado]

### Agregado
- Se creó colección de Postman con todos los endpoints del API (auth, routes, tracking, health, errores comunes) en `postmanCollections/`

### Cambiado
- Se mejoró la barra de navegación para ser completamente responsive en mobile con menú hamburguesa animado y panel desplegable a pantalla completa

### Agregado
- Se creó estructura base del backend con Node.js + Express + TypeScript
- Se implementó módulo de autenticación con JWT (login, register) y roles OPERADOR/ADMIN
- Se implementó CRUD completo de rutas con paginación (20 por página), filtros y soft delete (RF-01)
- Se implementó endpoint de importación masiva de rutas desde CSV (RF-05)
- Se implementó TrackingAdapter como abstracción del servicio SOAP de rastreo con caché TTL 60s (RF-02)
- Se implementaron endpoints de dashboard: stats por estado, top 5 por costo, rutas por región, filtro por fecha (RF-03)
- Se configuró middleware de seguridad: Helmet, CORS explícito, rate limiting (5 intentos login/min)
- Se configuró manejo centralizado de errores con códigos HTTP semánticos
- Se configuró logging estructurado con pino y correlation-id por request
- Se crearon migraciones PostgreSQL para tablas users y routes con índices en campos de filtro
- Se creó script de seed con dataset de 100 rutas de Colombia
- Se creó archivo .http para pruebas de endpoints principales
- Se configuró Docker Compose con PostgreSQL 15
- Se creó proyecto frontend con Angular 19 + TypeScript + SCSS (standalone components)
- Se implementó módulo de autenticación: pantalla de login con validación
- Se implementó listado de rutas con tabla reutilizable, paginación, filtros y ordenamiento (RF-01)
- Se implementó formulario de creación/edición de rutas con validación (RF-01)
- Se implementó importación masiva de CSV desde el frontend (RF-05)
- Se implementó panel de monitoreo en tiempo real con auto-refresh cada 30s (RF-02)
- Se implementó dashboard con gráfico de barras por estado, top 5 por costo, mapa de calor por región y filtro de fecha (RF-03)
- Se configuraron interceptores HTTP: auth (JWT en cada petición) y error (401 → logout, 5xx → notificación)
- Se configuraron Angular Guards para protección de rutas (authGuard, adminGuard) (RF-04)
- Se implementó lazy loading en todos los módulos (Dashboard, Rutas, Monitoreo)
- Se implementó diseño responsivo (mobile + desktop)
- Se creó README.md con instrucciones de entorno, variables, decisiones de arquitectura, supuestos y diagrama
