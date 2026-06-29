create schema if not exists app_private;

alter table public.orders
  add column if not exists delivery_zone text,
  add column if not exists delivery_window text,
  add column if not exists discount numeric(12,2) not null default 0 check (discount >= 0);

alter table public.orders drop column if exists total;
alter table public.orders
  add column total numeric(12,2) generated always as (greatest(subtotal + delivery_fee - discount, 0)) stored;

alter table public.import_jobs
  add column if not exists rows_imported integer not null default 0,
  add column if not exists rows_updated integer not null default 0;

create table if not exists public.order_status_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  from_status public.order_status,
  to_status public.order_status not null,
  actor_id uuid references auth.users(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists order_status_events_order_idx
  on public.order_status_events (order_id, created_at desc);

alter table public.order_status_events enable row level security;

create policy "Order status events follow order access"
on public.order_status_events for select
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_id
      and o.tenant_id = order_status_events.tenant_id
      and (
        o.customer_id = (select auth.uid())
        or public.current_profile_has_role(o.tenant_id, array['owner','manager','dispatch','viewer']::public.staff_role[])
      )
  )
);

grant select on public.order_status_events to authenticated;

create or replace function app_private.touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function app_private.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_tenant_id uuid;
  target_entity_id uuid;
begin
  target_tenant_id := coalesce(new.tenant_id, old.tenant_id);
  target_entity_id := coalesce(new.id, old.id);

  insert into public.audit_events (tenant_id, actor_id, entity_type, entity_id, action, metadata)
  values (
    target_tenant_id,
    (select auth.uid()),
    tg_table_name,
    target_entity_id,
    lower(tg_op),
    jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new))
  );

  return coalesce(new, old);
end;
$$;

create or replace function app_private.record_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_status_events (tenant_id, order_id, from_status, to_status, actor_id, note)
    values (new.tenant_id, new.id, null, new.status, (select auth.uid()), 'Pedido creado');
  elsif old.status is distinct from new.status then
    insert into public.order_status_events (tenant_id, order_id, from_status, to_status, actor_id)
    values (new.tenant_id, new.id, old.status, new.status, (select auth.uid()));
  end if;

  return new;
end;
$$;

drop trigger if exists tenants_touch_updated_at on public.tenants;
create trigger tenants_touch_updated_at
before update on public.tenants
for each row execute function app_private.touch_updated_at();

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function app_private.touch_updated_at();

drop trigger if exists store_locations_touch_updated_at on public.store_locations;
create trigger store_locations_touch_updated_at
before update on public.store_locations
for each row execute function app_private.touch_updated_at();

drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at
before update on public.products
for each row execute function app_private.touch_updated_at();

drop trigger if exists orders_touch_updated_at on public.orders;
create trigger orders_touch_updated_at
before update on public.orders
for each row execute function app_private.touch_updated_at();

drop trigger if exists promotions_touch_updated_at on public.promotions;
create trigger promotions_touch_updated_at
before update on public.promotions
for each row execute function app_private.touch_updated_at();

drop trigger if exists couriers_touch_updated_at on public.couriers;
create trigger couriers_touch_updated_at
before update on public.couriers
for each row execute function app_private.touch_updated_at();

drop trigger if exists orders_status_history on public.orders;
create trigger orders_status_history
after insert or update of status on public.orders
for each row execute function app_private.record_order_status_change();

drop trigger if exists products_audit_changes on public.products;
create trigger products_audit_changes
after insert or update or delete on public.products
for each row execute function app_private.audit_row_change();

drop trigger if exists orders_audit_changes on public.orders;
create trigger orders_audit_changes
after insert or update or delete on public.orders
for each row execute function app_private.audit_row_change();

drop trigger if exists promotions_audit_changes on public.promotions;
create trigger promotions_audit_changes
after insert or update or delete on public.promotions
for each row execute function app_private.audit_row_change();
