# Stores Cuba Platform Architecture

## Goal

Build a commercial, customizable platform for Cuban store chains with:

- Customer app for catalog, pickup, scheduled delivery and order tracking.
- Admin app for catalog, stock, branches, orders, dispatch and reporting.
- Multi-tenant model so each client can have its own brand, stores, catalog, users and rules.
- Supabase-ready backend with Postgres, Auth, Storage, Realtime and RLS.

## Monorepo Shape

- `apps/storefront`: Ionic Angular app for mobile/PWA customer experience.
- `apps/admin`: Angular web dashboard for store managers and operators.
- `libs/domain`: pure TypeScript contracts and sample data.
- `libs/data-access`: runtime config, Supabase client and facades.
- `libs/ui`: shared pipes and UI helpers.
- `supabase`: local Supabase config, migration and seed data.

## Value Added Modules

The platform now includes first-pass support for:

- Promotions and coupons by tenant, category and order total.
- Scheduled delivery windows and delivery zones.
- Courier dispatch, route stops and delivery proof placeholders.
- Loyalty tiers and customer segmentation.
- Product CSV import preview with validation issues before writing data.
- Notification templates and a provider-ready Edge Function for WhatsApp, email, push or Telegram.
- Audit event storage for sensitive admin actions.

## Tenancy Model

Every commercial table carries `tenant_id`. Public storefront data can be read by anonymous users only when it is safe: tenants, active stores, categories, active products and active delivery zones. Staff operations are protected by `profiles.role` and RLS policies.

Recommended customer deployment modes:

- Shared SaaS: one Supabase project, many tenants.
- Dedicated client: one deployed frontend per customer, same codebase, tenant fixed by env.
- Hybrid: shared admin, branded storefronts per chain.

## Supabase Notes

As of April 28, 2026, new Supabase tables may not be exposed to Data API/GraphQL automatically. The initial migration grants schema/table access explicitly and enables RLS on every exposed table.

Use only publishable/anon keys in Angular apps. Never place service role keys in `apps/*/src/environments`.

## Next Milestones

1. Connect real Supabase credentials through environment replacement.
2. Add auth screens and guards for the admin app.
3. Replace mock facade reads with typed Supabase queries.
4. Add order creation flow with inventory validation.
5. Add Capacitor Android/iOS projects once dependencies are installed.
6. Connect `send-notification` to the chosen WhatsApp Business or messaging provider.
7. Add provider-specific CSV/XLSX import processors for client catalog formats.
