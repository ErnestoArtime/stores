# Stores Cuba

Monorepo Nx para una plataforma comercial de cadenas de tiendas con delivery, app cliente Ionic/Angular, panel administrativo Angular y backend preparado para Supabase.

## Apps

- `storefront`: experiencia cliente mobile/PWA para comprar, reservar delivery y navegar tiendas.
- `admin`: panel operativo para pedidos, inventario, sucursales, catalogo y despacho.

## Librerias

- `@stores/domain`: contratos de tenant, catalogo, tiendas, productos y pedidos.
- `@stores/data-access`: configuracion runtime, Supabase client y facades.
- `@stores/ui`: helpers compartidos de UI.

## Comandos

```sh
npm install
npm run start
npm run start:admin
npm run build
```

`storefront` corre en `http://localhost:4200` y `admin` en `http://localhost:4300`.

## Supabase

La carpeta `supabase/` incluye:

- `config.toml`: configuracion local base.
- `migrations/202606250001_initial_stores_platform.sql`: schema multi-tenant con RLS y grants.
- `migrations/202606250002_value_added_modules.sql`: promociones, couriers, rutas, fidelizacion, segmentos, importaciones, notificaciones y auditoria.
- `seed.sql`: datos demo.
- `functions/send-notification`: Edge Function base para integrar WhatsApp, email, push o Telegram.

Configura las credenciales reales en los environments de cada app usando una publishable key. No uses `service_role` en frontend.

## Documentacion

Ver [docs/architecture.md](docs/architecture.md) para decisiones de arquitectura, tenancy y roadmap.

## Modulos de valor agregado incluidos

- Promociones/cupones y delivery gratis por reglas.
- Ventanas de entrega programada y tarifas por zona.
- Panel de rutas, mensajeros y prueba de entrega preparada.
- Fidelizacion por niveles y segmentos de clientes.
- Importacion CSV con preview y validacion.
- Plantillas de notificacion multi-canal.
- Auditoria para acciones administrativas sensibles.
