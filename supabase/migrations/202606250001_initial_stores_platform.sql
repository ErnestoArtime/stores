create extension if not exists "pgcrypto";

create type public.staff_role as enum ('owner', 'manager', 'catalog', 'dispatch', 'viewer');
create type public.product_status as enum ('draft', 'active', 'archived');
create type public.order_status as enum ('draft', 'placed', 'confirmed', 'picking', 'on_route', 'delivered', 'cancelled');
create type public.payment_method as enum ('cash', 'transfer', 'pos', 'online');
create type public.fulfillment_type as enum ('delivery', 'pickup', 'scheduled');

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  legal_name text not null,
  plan text not null default 'starter',
  currency text not null default 'CUP',
  support_phone text,
  support_whatsapp text,
  primary_color text not null default '#0f766e',
  accent_color text not null default '#f59e0b',
  logo_url text,
  hero_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  full_name text not null,
  email text not null,
  role public.staff_role not null default 'viewer',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.store_locations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  type text not null default 'mixed',
  address text not null,
  city text not null,
  municipality text not null,
  phone text,
  open_now boolean not null default false,
  delivery_minutes integer not null default 60 check (delivery_minutes > 0),
  rating numeric(2,1) not null default 5.0,
  cover_url text,
  fulfillment public.fulfillment_type[] not null default array['delivery']::public.fulfillment_type[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  icon text not null default 'bag-handle-outline',
  featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  store_id uuid not null references public.store_locations(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  sku text not null,
  name text not null,
  description text not null default '',
  image_url text,
  price numeric(12,2) not null check (price >= 0),
  compare_at_price numeric(12,2) check (compare_at_price is null or compare_at_price >= price),
  stock integer not null default 0 check (stock >= 0),
  unit text not null default 'unidad',
  status public.product_status not null default 'draft',
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, sku)
);

create table public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  fee numeric(12,2) not null default 0 check (fee >= 0),
  eta_minutes integer not null default 60 check (eta_minutes > 0),
  municipalities text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  store_id uuid not null references public.store_locations(id) on delete restrict,
  customer_id uuid references auth.users(id) on delete set null,
  code text not null,
  customer_name text not null,
  customer_phone text not null,
  delivery_address text not null,
  status public.order_status not null default 'placed',
  payment_method public.payment_method not null default 'cash',
  subtotal numeric(12,2) not null check (subtotal >= 0),
  delivery_fee numeric(12,2) not null default 0 check (delivery_fee >= 0),
  total numeric(12,2) generated always as (subtotal + delivery_fee) stored,
  placed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, code)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  line_total numeric(12,2) generated always as (quantity * unit_price) stored
);

create index profiles_tenant_role_idx on public.profiles (tenant_id, role) where active;
create index store_locations_tenant_idx on public.store_locations (tenant_id);
create index categories_tenant_idx on public.categories (tenant_id, sort_order);
create index products_tenant_status_idx on public.products (tenant_id, status);
create index products_store_idx on public.products (store_id);
create index orders_tenant_status_idx on public.orders (tenant_id, status, placed_at desc);
create index order_items_order_idx on public.order_items (order_id);

alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.store_locations enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create or replace function public.current_profile_has_role(target_tenant_id uuid, allowed_roles public.staff_role[])
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.tenant_id = target_tenant_id
      and p.active
      and p.role = any(allowed_roles)
  );
$$;

create policy "Public can read tenants" on public.tenants for select using (true);

create policy "Tenant staff can read profiles"
on public.profiles for select
using (public.current_profile_has_role(tenant_id, array['owner','manager']::public.staff_role[]) or id = (select auth.uid()));

create policy "Tenant owners can manage profiles"
on public.profiles for all
using (public.current_profile_has_role(tenant_id, array['owner']::public.staff_role[]))
with check (public.current_profile_has_role(tenant_id, array['owner']::public.staff_role[]));

create policy "Public can read active storefront catalog" on public.store_locations for select using (true);
create policy "Public can read categories" on public.categories for select using (true);
create policy "Public can read active products" on public.products for select using (status = 'active');
create policy "Public can read active delivery zones" on public.delivery_zones for select using (active);

create policy "Tenant staff can manage store locations"
on public.store_locations for all
using (public.current_profile_has_role(tenant_id, array['owner','manager']::public.staff_role[]))
with check (public.current_profile_has_role(tenant_id, array['owner','manager']::public.staff_role[]));

create policy "Tenant staff can manage categories"
on public.categories for all
using (public.current_profile_has_role(tenant_id, array['owner','manager','catalog']::public.staff_role[]))
with check (public.current_profile_has_role(tenant_id, array['owner','manager','catalog']::public.staff_role[]));

create policy "Tenant staff can manage products"
on public.products for all
using (public.current_profile_has_role(tenant_id, array['owner','manager','catalog']::public.staff_role[]))
with check (public.current_profile_has_role(tenant_id, array['owner','manager','catalog']::public.staff_role[]));

create policy "Tenant staff can manage delivery zones"
on public.delivery_zones for all
using (public.current_profile_has_role(tenant_id, array['owner','manager','dispatch']::public.staff_role[]))
with check (public.current_profile_has_role(tenant_id, array['owner','manager','dispatch']::public.staff_role[]));

create policy "Customers can create their own orders"
on public.orders for insert
with check ((select auth.uid()) is not null and customer_id = (select auth.uid()));

create policy "Customers and staff can read orders"
on public.orders for select
using (customer_id = (select auth.uid()) or public.current_profile_has_role(tenant_id, array['owner','manager','dispatch','viewer']::public.staff_role[]));

create policy "Tenant staff can update orders"
on public.orders for update
using (public.current_profile_has_role(tenant_id, array['owner','manager','dispatch']::public.staff_role[]))
with check (public.current_profile_has_role(tenant_id, array['owner','manager','dispatch']::public.staff_role[]));

create policy "Customers can create order items for own order"
on public.order_items for insert
with check (
  exists (
    select 1
    from public.orders o
    where o.id = order_id
      and o.customer_id = (select auth.uid())
      and o.tenant_id = order_items.tenant_id
  )
);

create policy "Order items follow order access"
on public.order_items for select
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_id
      and o.tenant_id = order_items.tenant_id
      and (o.customer_id = (select auth.uid()) or public.current_profile_has_role(o.tenant_id, array['owner','manager','dispatch','viewer']::public.staff_role[]))
  )
);

grant usage on schema public to anon, authenticated;
grant select on public.tenants, public.store_locations, public.categories, public.products, public.delivery_zones to anon, authenticated;
grant select on public.profiles to authenticated;
grant select, insert, update on public.orders to authenticated;
grant select, insert on public.order_items to authenticated;
grant all on public.store_locations, public.categories, public.products, public.delivery_zones to authenticated;
grant execute on function public.current_profile_has_role(uuid, public.staff_role[]) to authenticated;
