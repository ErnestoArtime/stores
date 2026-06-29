create type public.promotion_type as enum ('percent', 'fixed', 'bundle', 'free_delivery');
create type public.notification_channel as enum ('whatsapp', 'email', 'push', 'telegram');
create type public.import_job_status as enum ('draft', 'validating', 'ready', 'processing', 'completed', 'failed');

create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  title text not null,
  description text not null default '',
  type public.promotion_type not null,
  code text,
  value numeric(12,2) not null default 0,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  active boolean not null default true,
  target_category_ids uuid[] not null default '{}',
  minimum_order_total numeric(12,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  unique (tenant_id, code)
);

create table public.couriers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  full_name text not null,
  phone text not null,
  active boolean not null default true,
  current_zone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.delivery_routes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  courier_id uuid not null references public.couriers(id) on delete restrict,
  zone_name text not null,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.delivery_route_stops (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  route_id uuid not null references public.delivery_routes(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  stop_order integer not null,
  eta_minutes integer not null default 30 check (eta_minutes > 0),
  proof_code text,
  proof_photo_url text,
  delivered_at timestamptz,
  unique (route_id, stop_order),
  unique (route_id, order_id)
);

create table public.loyalty_tiers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  minimum_spend numeric(12,2) not null default 0,
  points_multiplier numeric(5,2) not null default 1,
  perks text[] not null default '{}',
  active boolean not null default true,
  unique (tenant_id, name)
);

create table public.customer_segments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  criteria text not null,
  customer_count integer not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create table public.notification_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  channel public.notification_channel not null,
  event_key text not null,
  title text not null,
  body text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tenant_id, channel, event_key)
);

create table public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  type text not null default 'products',
  status public.import_job_status not null default 'draft',
  source_file_url text,
  valid_rows integer not null default 0,
  issue_count integer not null default 0,
  issues jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index promotions_tenant_active_idx on public.promotions (tenant_id, active, starts_at, ends_at);
create index couriers_tenant_active_idx on public.couriers (tenant_id, active);
create index delivery_routes_tenant_idx on public.delivery_routes (tenant_id, started_at desc);
create index delivery_route_stops_route_idx on public.delivery_route_stops (route_id, stop_order);
create index loyalty_tiers_tenant_idx on public.loyalty_tiers (tenant_id, minimum_spend);
create index customer_segments_tenant_idx on public.customer_segments (tenant_id, active);
create index notification_templates_tenant_idx on public.notification_templates (tenant_id, channel, event_key);
create index import_jobs_tenant_idx on public.import_jobs (tenant_id, created_at desc);
create index audit_events_tenant_idx on public.audit_events (tenant_id, created_at desc);

alter table public.promotions enable row level security;
alter table public.couriers enable row level security;
alter table public.delivery_routes enable row level security;
alter table public.delivery_route_stops enable row level security;
alter table public.loyalty_tiers enable row level security;
alter table public.customer_segments enable row level security;
alter table public.notification_templates enable row level security;
alter table public.import_jobs enable row level security;
alter table public.audit_events enable row level security;

create policy "Public can read active promotions"
on public.promotions for select
using (active and now() between starts_at and ends_at);

create policy "Public can read active loyalty tiers"
on public.loyalty_tiers for select
using (active);

create policy "Tenant managers can manage promotions"
on public.promotions for all
using (public.current_profile_has_role(tenant_id, array['owner','manager','catalog']::public.staff_role[]))
with check (public.current_profile_has_role(tenant_id, array['owner','manager','catalog']::public.staff_role[]));

create policy "Tenant dispatch can manage couriers"
on public.couriers for all
using (public.current_profile_has_role(tenant_id, array['owner','manager','dispatch']::public.staff_role[]))
with check (public.current_profile_has_role(tenant_id, array['owner','manager','dispatch']::public.staff_role[]));

create policy "Tenant dispatch can manage routes"
on public.delivery_routes for all
using (public.current_profile_has_role(tenant_id, array['owner','manager','dispatch']::public.staff_role[]))
with check (public.current_profile_has_role(tenant_id, array['owner','manager','dispatch']::public.staff_role[]));

create policy "Tenant dispatch can manage route stops"
on public.delivery_route_stops for all
using (public.current_profile_has_role(tenant_id, array['owner','manager','dispatch']::public.staff_role[]))
with check (public.current_profile_has_role(tenant_id, array['owner','manager','dispatch']::public.staff_role[]));

create policy "Tenant managers can manage loyalty tiers"
on public.loyalty_tiers for all
using (public.current_profile_has_role(tenant_id, array['owner','manager']::public.staff_role[]))
with check (public.current_profile_has_role(tenant_id, array['owner','manager']::public.staff_role[]));

create policy "Tenant managers can read customer segments"
on public.customer_segments for select
using (public.current_profile_has_role(tenant_id, array['owner','manager','viewer']::public.staff_role[]));

create policy "Tenant managers can manage notification templates"
on public.notification_templates for all
using (public.current_profile_has_role(tenant_id, array['owner','manager']::public.staff_role[]))
with check (public.current_profile_has_role(tenant_id, array['owner','manager']::public.staff_role[]));

create policy "Tenant staff can manage import jobs"
on public.import_jobs for all
using (public.current_profile_has_role(tenant_id, array['owner','manager','catalog']::public.staff_role[]))
with check (public.current_profile_has_role(tenant_id, array['owner','manager','catalog']::public.staff_role[]));

create policy "Tenant staff can read audit events"
on public.audit_events for select
using (public.current_profile_has_role(tenant_id, array['owner','manager']::public.staff_role[]));

grant select on public.promotions, public.loyalty_tiers to anon, authenticated;
grant all on public.promotions, public.couriers, public.delivery_routes, public.delivery_route_stops to authenticated;
grant all on public.loyalty_tiers, public.customer_segments, public.notification_templates, public.import_jobs to authenticated;
grant select on public.audit_events to authenticated;
