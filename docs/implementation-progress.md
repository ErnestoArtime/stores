# Stores Cuba Implementation Progress

## Current State

The repository is an Nx monorepo for a commercial multi-tenant store/delivery platform.

Implemented so far:

- `apps/storefront`: Ionic Angular customer storefront with catalog hero, categories, stores, products, promotions, delivery windows, delivery zones, loyalty teaser, cart summary, checkout with payment/coupon and WhatsApp support link.
- `apps/admin`: Angular admin dashboard with real KPIs, orders, store state, inventory, delivery routes, couriers, marketing segments, promotions, product image upload and CSV import preview.
- `apps/superadmin`: skeleton for tenant management.
- `libs/domain`: shared TypeScript models and demo data for tenants, stores, products, orders, promotions, couriers, delivery routes, loyalty and segments.
- `libs/data-access`: runtime config, typed Supabase client, facades, auth guards, onboarding guard, dashboard service and cart service with localStorage + server sync.
- `libs/ui`: shared money pipe and order status labels.
- `libs/features/*`: domain services for catalog, orders, tenant onboarding, dispatch, marketing and superadmin.
- `supabase/migrations`: multi-tenant schema with RLS, value-added modules, order import audit hardening, product storage, customer carts, order assigned courier and notification templates/channels.
- `supabase/functions/send-notification`: Edge Function for WhatsApp/email/push/Telegram providers with templates and auth.
- `supabase/functions/create-order`: authenticated order creation with stock validation, coupon calculation, rate limiting and Deno tests.
- `supabase/functions/process-product-import`: product import processor with category/store fallback, import job counters and Deno tests.

Important validation note:

- JSON files parse correctly.
- Dependency installation is currently restored.
- `npx nx show projects` lists `data-access`, `storefront`, `domain`, `admin`, `ui`, `features/*` and `superadmin`.
- `npx nx build storefront --configuration=development` passes.
- `npx nx build admin --configuration=development` passes.
- `npm run test:data-access` passes (26/26 tests).
- Previous `ECONNRESET` failures against `registry.npmjs.org` were resolved before the latest changes.

Run these checks after future structural changes:

```sh
npm install
npx nx show projects
npx nx build storefront --configuration=development
npx nx build admin --configuration=development
```

## Product Direction

The product should be a commercial SaaS/customizable platform for Cuban store chains and retail operators. Keep all new features tenant-aware from the start.

Primary apps:

- Customer app: browse, cart, checkout, delivery tracking, loyalty and support.
- Admin app: catalog, inventory, orders, dispatch, reports, staff, branding and tenant configuration.
- Future superadmin: create/manage tenants, plans, feature flags and deployments.

## Engineering Rules For The Next Agent

- Prefer existing structure: `apps/*` for products, `libs/domain` for contracts, `libs/data-access` for Supabase/facades, `libs/ui` for reusable UI helpers.
- Keep tenant boundaries explicit. Every database table containing business data should include `tenant_id`.
- Do not expose `service_role` or secret keys in Angular environments.
- Enable RLS on every table in exposed schemas and grant table access explicitly.
- Use Supabase Edge Functions for trusted operations that should not run in the browser, such as stock reservation, payment confirmation, imports and provider notifications.
- Replace demo/mock data incrementally. Do not delete mocks until real Supabase flows are working; they are useful for offline demo mode.
- Keep UI dense and operational for admin. Avoid marketing-style landing pages inside the admin app.

## Priority Roadmap

### 1. Restore Tooling

Goal:
Get the repo building reliably.

Steps:

1. Run `npm install`.
2. If install fails due to corrupted `node_modules`, delete only `C:\Proyectos\stores\node_modules` after confirming the resolved path is inside the workspace.
3. Run `npm ci` once network is stable.
4. Run:

```sh
npx nx show projects
npx nx build storefront --configuration=development
npx nx build admin --configuration=development
```

Done when:

- Nx lists `storefront`, `admin`, `domain`, `data-access`, `ui`.
- Both apps build in development mode.

Current status:

- Done as of June 26, 2026.

### 2. Auth, Roles And Guards

Goal:
Separate customer and admin access with Supabase Auth and tenant staff roles.

Suggested implementation:

- Add auth models/services in `libs/data-access`.
- Use `profiles` table for staff role checks.
- Add Angular route guards for admin routes.
- Add simple login pages:
  - `apps/storefront/src/app/auth/login.page.ts`
  - `apps/admin/src/app/auth/login.page.ts`
- Admin should require `owner`, `manager`, `catalog`, `dispatch` or `viewer`.
- Customer checkout should require an authenticated user before order creation.

Done when:

- Unauthenticated users cannot access admin dashboard.
- Authenticated staff can load their tenant profile.
- Customer app can identify the current user.

### 3. Supabase Typed Data Access

Goal:
Replace mock reads with typed Supabase queries.

Suggested implementation:

- Generate database types after Supabase is linked:

```sh
npx supabase gen types typescript --project-id <project-ref> > libs/data-access/src/lib/database.types.ts
```

- Type `SupabaseClientService` with generated `Database`.
- Add repository/facade methods:
  - `loadTenantBySlug`
  - `loadStores`
  - `loadCategories`
  - `loadProducts`
  - `loadPromotions`
  - `loadDeliveryZones`
  - `loadOrdersForAdmin`

Done when:

- `CatalogFacade` can load real tenant data when env vars are configured.
- It falls back to demo data only when Supabase is not configured.

### 4. Admin CRUD For Catalog And Inventory

Goal:
Make the admin app operational for products and stock.

Suggested implementation:

- Add admin routes/components:
  - `/catalog/products`
  - `/catalog/categories`
  - `/stores`
  - `/inventory`
- Add forms for product create/edit:
  - name, SKU, category, store, price, stock, unit, image URL/status/tags.
- Add stock adjustment flow with audit event creation.
- Use Supabase Storage later for product images; initial version can keep URL input.

Done when:

- Admin can create/edit/archive products.
- Admin can update stock.
- Changes are tenant-scoped.

### 5. Checkout And Order Creation

Goal:
Create real orders from the customer app.

Suggested implementation:

- Add cart state service in `libs/data-access` or `apps/storefront/src/app/cart`.
- Add checkout page with:
  - customer name/phone
  - delivery address
  - delivery zone
  - delivery window
  - payment method
  - coupon code
- Create a Supabase Edge Function `create-order`.
- The function should:
  - validate tenant, products and stock;
  - calculate subtotal, delivery fee, discounts and total;
  - insert `orders` and `order_items`;
  - reduce or reserve stock;
  - return order code.

Done when:

- Customer can place an order.
- Admin sees the new order.
- Invalid stock cannot create an order.

### 6. Realtime Order Operations

Goal:
Admin dashboard updates when orders change.

Suggested implementation:

- Add Supabase Realtime subscription in data-access facade.
- Subscribe to tenant-scoped `orders` changes.
- Add UI state for new order, confirmed, picking, on route, delivered, cancelled.

Done when:

- Admin sees new/updated orders without refreshing.
- Customer order tracking updates after admin status changes.

### 7. CSV/XLSX Import

Goal:
Turn current CSV preview into a real import workflow.

Suggested implementation:

- Keep `previewProductCsv` as client-side quick validation.
- Add `import_jobs` row for each upload.
- Store source file in Supabase Storage.
- Add Edge Function `process-product-import`.
- Function should validate rows, upsert categories/products, store issues in `import_jobs.issues`.
- Later support XLSX with a server-side parser or convert to CSV first.

Done when:

- Admin uploads CSV.
- Admin sees valid rows/issues.
- Valid rows can be applied to catalog.

### 8. Delivery Dispatch

Goal:
Make dispatch routes operational.

Suggested implementation:

- Add screens:
  - `/dispatch/orders`
  - `/dispatch/routes`
  - `/dispatch/couriers`
- Add assignment from order to courier/route.
- Add proof placeholders:
  - OTP code
  - photo URL
  - signature later
- Add customer tracking page by order code.

Done when:

- Admin assigns orders to couriers.
- Route stops are ordered.
- Order status can move to `on_route` and `delivered`.

### 9. Promotions, Loyalty And Segmentation

Goal:
Make marketing modules configurable.

Suggested implementation:

- Add CRUD for `promotions`.
- Add coupon validation in checkout.
- Add `loyalty_points` or customer spend table if needed.
- Generate customer segments from order history.

Done when:

- Coupons affect checkout totals.
- Loyalty tier can be shown for authenticated customer.
- Admin can see useful customer segments.

### 10. Notifications

Goal:
Send real customer/operator notifications.

Suggested implementation:

- Keep `send-notification` Edge Function as provider adapter.
- Add provider integrations behind environment variables:
  - WhatsApp Business API
  - SMTP/Resend
  - Firebase Cloud Messaging
  - Telegram Bot API
- Add notification events:
  - `order_confirmed`
  - `order_on_route`
  - `order_delivered`
  - `low_stock`
  - `payment_pending`

Done when:

- Order confirmation can send via one real provider.
- Provider secrets stay only in Supabase function secrets.

### 11. Multi-Tenant Branding And SaaS Controls

Goal:
Make the product sellable to multiple chains.

Suggested implementation:

- Load tenant by slug/domain.
- Apply tenant colors/logo/hero dynamically.
- Add tenant settings page in admin.
- Add future `apps/superadmin` for:
  - tenant creation
  - plan selection
  - feature flags
  - billing/account status

Done when:

- Changing tenant config changes storefront look and behavior.
- One codebase can serve multiple clients.

## Supabase Security Checklist

Before considering backend work complete:

- RLS enabled on every public table.
- Explicit grants for `anon` and `authenticated`.
- No use of `user_metadata` for authorization.
- No service role key in frontend.
- Sensitive writes performed through RLS-safe queries or Edge Functions.
- Views, if added, must use `security_invoker = true` on Postgres 15+.
- Admin updates must have matching SELECT policies, because PostgreSQL UPDATE requires SELECT visibility.

## Known Gaps

- Auth UI and guards exist, but need real Supabase project testing.
- Checkout page and `create-order` function are implemented, but need integration testing against a live/local Supabase database.
- CRUD screens exist for the main admin areas, but writes need full Supabase-backed persistence coverage.
- CSV import has preview, Storage upload UX and Edge Function scaffolding, but still needs live function testing.
- Edge Function notification provider is a stub; no real WhatsApp/email/push provider connected.
- Supabase migrations have not been applied in this session.
- No e2e tests yet; unit tests cover data-access only.
- No CI yet.
- Onboarding is admin-only; public tenant self-registration and plan selection are pending.
- i18n, PWA/Capacitor builds and push notifications are pending.

## Suggested Next Commit Scope

Best next commit:

1. Apply migrations to local Supabase.
2. Integration-test `create-order` and `process-product-import` against a live/local database.
3. Connect `send-notification` to at least one real provider (WhatsApp Business, Resend or Telegram).
4. Add public tenant onboarding form with plan selection.

Keep that commit small. Do not mix unrelated superadmin or PWA work into it.
