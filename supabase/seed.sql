insert into public.tenants (
  slug,
  name,
  legal_name,
  plan,
  currency,
  support_phone,
  support_whatsapp,
  primary_color,
  accent_color,
  hero_image_url
) values (
  'demo-market',
  'Mercado Caribe',
  'Mercado Caribe S.R.L.',
  'growth',
  'CUP',
  '+53 7 555 0101',
  '+53 5 555 0101',
  '#0f766e',
  '#f59e0b',
  'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1800&q=80'
)
on conflict (slug) do nothing;

with tenant as (
  select id from public.tenants where slug = 'demo-market'
)
insert into public.promotions (tenant_id, title, description, type, code, value, starts_at, ends_at, active, minimum_order_total)
select
  id,
  'Delivery gratis en compras grandes',
  'Aplica para pedidos superiores a 10 000 CUP.',
  'free_delivery',
  'ENVIOCARIBE',
  100,
  now() - interval '1 day',
  now() + interval '30 days',
  true,
  10000
from tenant
on conflict (tenant_id, code) do nothing;

with tenant as (
  select id from public.tenants where slug = 'demo-market'
)
insert into public.loyalty_tiers (tenant_id, name, minimum_spend, points_multiplier, perks)
select id, 'Bronce', 0, 1, array['Puntos por compra', 'Cupones mensuales'] from tenant
union all
select id, 'Oro', 50000, 1.5, array['Prioridad en delivery', 'Ofertas privadas', 'Soporte preferente'] from tenant
on conflict (tenant_id, name) do nothing;

with tenant as (
  select id from public.tenants where slug = 'demo-market'
)
insert into public.customer_segments (tenant_id, name, criteria, customer_count)
select id, 'Clientes frecuentes', '3 o mas pedidos en los ultimos 45 dias', 284 from tenant
union all
select id, 'Por reactivar', 'Sin compra en mas de 60 dias', 91 from tenant
on conflict (tenant_id, name) do nothing;

with tenant as (
  select id from public.tenants where slug = 'demo-market'
)
insert into public.couriers (tenant_id, full_name, phone, active, current_zone)
select id, 'Ana Torres', '+53 5 555 0220', true, 'Centro Habana - Plaza' from tenant
union all
select id, 'Luis Herrera', '+53 5 555 0330', true, 'Playa - Marianao' from tenant;

with tenant as (
  select id from public.tenants where slug = 'demo-market'
)
insert into public.notification_templates (tenant_id, channel, event_key, title, body)
select
  id,
  'whatsapp',
  'order_confirmed',
  'Pedido confirmado',
  'Hola {{customerName}}, tu pedido {{orderCode}} fue confirmado. Total: {{total}}.'
from tenant
on conflict (tenant_id, channel, event_key) do nothing;
