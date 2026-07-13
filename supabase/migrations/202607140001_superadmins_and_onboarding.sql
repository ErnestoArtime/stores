-- Superadmin configuration

create table if not exists public.superadmins (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.superadmins enable row level security;

create policy "Superadmins can read superadmins"
  on public.superadmins for select
  using (public.is_superadmin());

create or replace function public.is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.superadmins where id = (select auth.uid()));
$$;

-- Superadmins can manage tenants and billing
create policy "Superadmins can manage tenants"
  on public.tenants for all
  using (public.is_superadmin())
  with check (public.is_superadmin());

create policy "Superadmins can manage billing"
  on public.tenant_billing for all
  using (public.is_superadmin())
  with check (public.is_superadmin());

-- Onboarding RPC: creates tenant, billing and owner profile in one transaction
create or replace function public.create_new_tenant(
  p_name text,
  p_legal_name text,
  p_slug text,
  p_plan text,
  p_currency text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_tenant_id uuid;
  default_features jsonb;
  default_limits jsonb;
  existing_slug uuid;
begin
  if auth.uid() is null then
    raise exception 'Autenticacion requerida.';
  end if;

  if p_plan not in ('starter', 'growth', 'enterprise') then
    raise exception 'Plan invalido. Use starter, growth o enterprise.';
  end if;

  select id into existing_slug from public.tenants where slug = p_slug limit 1;
  if existing_slug is not null then
    raise exception 'El slug ya esta en uso.';
  end if;

  default_features := case p_plan
    when 'starter' then '{"delivery": true, "loyalty": false, "promotions": false, "import": false, "dispatch": false, "analytics": false}'::jsonb
    when 'growth' then '{"delivery": true, "loyalty": true, "promotions": true, "import": false, "dispatch": false, "analytics": true}'::jsonb
    else '{"delivery": true, "loyalty": true, "promotions": true, "import": true, "dispatch": true, "analytics": true}'::jsonb
  end;

  default_limits := case p_plan
    when 'starter' then '{"max_products": 100, "max_stores": 1, "max_orders_per_month": 500, "max_staff": 2}'::jsonb
    when 'growth' then '{"max_products": 1000, "max_stores": 5, "max_orders_per_month": 5000, "max_staff": 10}'::jsonb
    else '{"max_products": 10000, "max_stores": 50, "max_orders_per_month": 100000, "max_staff": 100}'::jsonb
  end;

  insert into public.tenants (name, legal_name, slug, plan, currency, features, limits, settings)
  values (p_name, p_legal_name, p_slug, p_plan, p_currency, default_features, default_limits, '{"notification_channels": ["whatsapp"]}'::jsonb)
  returning id into new_tenant_id;

  insert into public.tenant_billing (tenant_id, plan, status)
  values (new_tenant_id, p_plan, 'active');

  insert into public.profiles (id, tenant_id, full_name, email, role)
  values (
    auth.uid(),
    new_tenant_id,
    coalesce(auth.jwt() -> 'user_metadata' ->> 'full_name', 'Owner'),
    coalesce(auth.email(), ''),
    'owner'
  );

  -- Seed default notification templates for the new tenant
  insert into public.notification_templates (tenant_id, channel, event_key, title, body, active)
  values
    (new_tenant_id, 'whatsapp', 'order_placed', 'Pedido recibido {{code}}', 'Hola {{customer_name}}, tu pedido {{code}} fue recibido. Total: {{total}}. Te mantendremos informado.', true),
    (new_tenant_id, 'email', 'order_placed', 'Pedido recibido {{code}}', 'Hola {{customer_name}},<br><br>Tu pedido <strong>{{code}}</strong> fue recibido.<br>Total: {{total}}.<br><br>Gracias por tu compra.', true),
    (new_tenant_id, 'telegram', 'order_placed', 'Pedido recibido {{code}}', 'Hola {{customer_name}}, tu pedido {{code}} fue recibido. Total: {{total}}.', true),
    (new_tenant_id, 'push', 'order_placed', 'Pedido recibido', 'Tu pedido {{code}} fue recibido. Total: {{total}}.', true),
    (new_tenant_id, 'whatsapp', 'order_confirmed', 'Pedido confirmado {{code}}', 'Hola {{customer_name}}, tu pedido {{code}} fue confirmado. Te avisamos cuando este en camino.', true),
    (new_tenant_id, 'email', 'order_confirmed', 'Pedido confirmado {{code}}', 'Hola {{customer_name}},<br><br>Tu pedido <strong>{{code}}</strong> fue confirmado.<br>Te avisamos cuando este en camino.', true),
    (new_tenant_id, 'telegram', 'order_confirmed', 'Pedido confirmado {{code}}', 'Hola {{customer_name}}, tu pedido {{code}} fue confirmado. Te avisamos cuando este en camino.', true),
    (new_tenant_id, 'push', 'order_confirmed', 'Pedido confirmado', 'Tu pedido {{code}} fue confirmado.', true),
    (new_tenant_id, 'whatsapp', 'order_picking', 'Pedido en preparacion {{code}}', 'Hola {{customer_name}}, estamos preparando tu pedido {{code}}.', true),
    (new_tenant_id, 'email', 'order_picking', 'Pedido en preparacion {{code}}', 'Hola {{customer_name}},<br><br>Estamos preparando tu pedido <strong>{{code}}</strong>.', true),
    (new_tenant_id, 'telegram', 'order_picking', 'Pedido en preparacion {{code}}', 'Hola {{customer_name}}, estamos preparando tu pedido {{code}}.', true),
    (new_tenant_id, 'push', 'order_picking', 'Pedido en preparacion', 'Estamos preparando tu pedido {{code}}.', true),
    (new_tenant_id, 'whatsapp', 'order_on_route', 'Pedido en camino {{code}}', 'Hola {{customer_name}}, tu pedido {{code}} esta en camino.', true),
    (new_tenant_id, 'email', 'order_on_route', 'Pedido en camino {{code}}', 'Hola {{customer_name}},<br><br>Tu pedido <strong>{{code}}</strong> esta en camino.', true),
    (new_tenant_id, 'telegram', 'order_on_route', 'Pedido en camino {{code}}', 'Hola {{customer_name}}, tu pedido {{code}} esta en camino.', true),
    (new_tenant_id, 'push', 'order_on_route', 'Pedido en camino', 'Tu pedido {{code}} esta en camino.', true),
    (new_tenant_id, 'whatsapp', 'order_delivered', 'Pedido entregado {{code}}', 'Hola {{customer_name}}, tu pedido {{code}} fue entregado. Gracias por tu compra.', true),
    (new_tenant_id, 'email', 'order_delivered', 'Pedido entregado {{code}}', 'Hola {{customer_name}},<br><br>Tu pedido <strong>{{code}}</strong> fue entregado.<br>Gracias por tu compra.', true),
    (new_tenant_id, 'telegram', 'order_delivered', 'Pedido entregado {{code}}', 'Hola {{customer_name}}, tu pedido {{code}} fue entregado. Gracias por tu compra.', true),
    (new_tenant_id, 'push', 'order_delivered', 'Pedido entregado', 'Tu pedido {{code}} fue entregado. Gracias por tu compra.', true),
    (new_tenant_id, 'whatsapp', 'order_cancelled', 'Pedido cancelado {{code}}', 'Hola {{customer_name}}, tu pedido {{code}} fue cancelado. Contactanos si tienes dudas.', true),
    (new_tenant_id, 'email', 'order_cancelled', 'Pedido cancelado {{code}}', 'Hola {{customer_name}},<br><br>Tu pedido <strong>{{code}}</strong> fue cancelado.<br>Contactanos si tienes dudas.', true),
    (new_tenant_id, 'telegram', 'order_cancelled', 'Pedido cancelado {{code}}', 'Hola {{customer_name}}, tu pedido {{code}} fue cancelado. Contactanos si tienes dudas.', true),
    (new_tenant_id, 'push', 'order_cancelled', 'Pedido cancelado', 'Tu pedido {{code}} fue cancelado. Contactanos si tienes dudas.', true);

  return new_tenant_id;
end;
$$;
