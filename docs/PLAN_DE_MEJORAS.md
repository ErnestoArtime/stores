# Plan Maestro de Mejoras - Stores Cuba

> Documento vivo. Se actualiza a medida que se implementan las fases.

## Estado actual (baseline)

- **Monorepo**: Nx + Angular + Ionic (storefront) + Supabase.
- **Apps**: `storefront`, `admin`, `superadmin`.
- **Backend**: Edge Functions (`create-order`, `send-notification`, `process-product-import`) + PostgreSQL + RLS + triggers.
- **Datos**: la mayoría de los servicios ya hacen queries a Supabase, pero aún dependen de datos de demo/mocks en algunos flujos y no hay tipos typed de Supabase generados.
- **Notificaciones**: ya se implementaron plantillas, canales configurables, auth en `send-notification`, trigger de cambio de estado y validación E.164.
- **Tracking**: recarga completa de orden en realtime.

## Objetivo del plan

Llevar la plataforma a un estado productivo estable, con datos reales, tests, seguridad reforzada y experiencia de usuario completa.

---

## Fases y tareas

### Fase 1: Conexión real con Supabase

| # | Tarea | Estado | Notas |
|---|-------|--------|-------|
| 1.1 | Generar `database.types.ts` desde Supabase | ✅ Hecho | `libs/data-access/src/lib/database.types.ts` existe |
| 1.2 | Tipar `SupabaseClientService` con `Database` | ✅ Hecho | Cliente tipado en uso |
| 1.3 | Auditar servicios: reemplazar mocks por queries reales | 🔄 En progreso | Catalog, Orders, Dispatch, Marketing, Stores |
| 1.4 | Manejo unificado de errores y loading en facades | ✅ Hecho | Estados `error` + `loading` en servicios |
| 1.5 | Fallback a demo data solo cuando no haya Supabase configurado | ✅ Hecho | Demo data como fallback inicial |

### Fase 2: Carrito persistente y checkout completo

| # | Tarea | Estado | Notas |
|---|-------|--------|-------|
| 2.1 | Persistir carrito en `localStorage` | ✅ Hecho | Sobrevive a recargas; tests unitarios pasan |
| 2.2 | Sincronizar carrito con usuario autenticado | ✅ Hecho | `CartService` carga/guarda en tabla `carts` |
| 2.3 | Soporte de cupones/promociones en checkout | ✅ Hecho | `create-order` aplica descuentos por cupón |
| 2.4 | Selección de método de pago y propina | 🔄 En progreso | Método de pago configurable; propina pendiente |
| 2.5 | Resumen de orden previo a confirmar | ✅ Hecho | Checkout muestra resumen con subtotal/envío/total |

### Fase 3: Tests de integración

| # | Tarea | Estado | Notas |
|---|-------|--------|-------|
| 3.1 | Tests para `create-order` | ✅ Hecho | Deno + mock de Supabase |
| 3.2 | Tests para `send-notification` | ✅ Hecho | Auth, plantillas, canales |
| 3.3 | Tests para `process-product-import` | ✅ Hecho | CSV válido e inválido |
| 3.4 | Tests unitarios para servicios Angular clave | ✅ Hecho | CartService, DashboardService y OrderMapper pasan |

### Fase 4: Dashboard admin operacional

| # | Tarea | Estado | Notas |
|---|-------|--------|-------|
| 4.1 | Métricas reales en dashboard | ✅ Hecho | `DashboardService.loadKpis` desde Supabase |
| 4.2 | Lista de pedidos con filtros y búsqueda | ✅ Hecho | Por estado, fecha, cliente |
| 4.3 | Cambio de estado masivo y manual | 🔄 En progreso | confirmed → picking → on_route → delivered |
| 4.4 | Asignación de courier y rutas | 🔄 En progreso | Migración `order_assigned_courier`; UI de asignación pendiente |
| 4.5 | Reportes exportables CSV/PDF | ⏳ Pendiente | Ventas e inventario |

### Fase 5: Onboarding autoservicio de tenants

| # | Tarea | Estado | Notas |
|---|-------|--------|-------|
| 5.1 | Formulario público de registro de tenant | ⏳ Pendiente | Nombre, slug, plan, admin |
| 5.2 | Selección de plan y límites | ⏳ Pendiente | starter/growth/enterprise |
| 5.3 | Creación automática de tenant + staff owner | ✅ Hecho | RPC `create_new_tenant` |
| 5.4 | Flujo de verificación de email | ⏳ Pendiente | Supabase Auth OTP |

### Fase 6: Seguridad y robustez

| # | Tarea | Estado | Notas |
|---|-------|--------|-------|
| 6.1 | Revisión completa de RLS | ⏳ Pendiente | Todas las tablas expuestas |
| 6.2 | Rate limiting en Edge Functions | ✅ Hecho | `create-order` con KV rate limit |
| 6.3 | Validaciones de entrada robustas | 🔄 En progreso | Validación manual en Edge Functions; Zod pendiente |
| 6.4 | Manejo de errores y logs estructurados | 🔄 En progreso | Consistente en todas las funciones |

### Fase 7: Mejoras de UX y escalabilidad

| # | Tarea | Estado | Notas |
|---|-------|--------|-------|
| 7.1 | Buscador y filtros en catálogo | ✅ Hecho | Full-text + filtros |
| 7.2 | Imágenes de producto en Storage | ✅ Hecho | Upload desde admin al bucket `products` |
| 7.3 | i18n (es/en) | ⏳ Pendiente | Angular i18n o ngx-translate |
| 7.4 | PWA / Capacitor | ⏳ Pendiente | Android/iOS |
| 7.5 | Notificaciones push reales | ⏳ Pendiente | FCM |

---

## Registro de cambios

| Fecha | Fase | Cambio realizado |
|-------|------|------------------|
| 2026-07-14 | Notificaciones | Implementadas plantillas, canales configurables, auth en send-notification, trigger de estado |
| 2026-07-14 | Tracking | Recarga completa de orden en realtime |
| 2026-07-15 | Carrito | Persistencia en localStorage con restauración automática |
| 2026-07-15 | Catálogo | Filtros por búsqueda, categoría, rango de precio y tags |
| 2026-07-15 | Pedidos | Filtros por búsqueda, estado y fecha |
| 2026-07-15 | Servicios | Estados de loading/error en store, dispatch, marketing |
| 2026-07-15 | Tests | Tests unitarios para CartService |
| 2026-07-17 | Edge Functions | Tests de integración con Deno para create-order, send-notification y process-product-import |
| 2026-07-17 | Dashboard | Métricas reales desde Supabase con loadKpis |
| 2026-07-17 | Seguridad | Rate limiting y validación de entrada en Edge Functions |
| 2026-07-17 | Storage | Subida de imágenes de producto a Supabase Storage |
| 2026-07-20 | Documentación | Sincronización del plan de mejoras con el estado real del código |

---

## Cómo usar este documento

1. Cada fase se implementa en una o más PRs/commits pequeños.
2. Al completar una tarea, actualizar la columna **Estado** a ✅.
3. Al finalizar una fase, actualizar el **Registro de cambios**.
4. Las nuevas ideas que surjan se agregan al final de la fase correspondiente.
