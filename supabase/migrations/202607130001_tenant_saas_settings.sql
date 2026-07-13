-- Tenant SaaS settings: features, limits, settings
alter table public.tenants
  add column if not exists features jsonb not null default '{}'::jsonb,
  add column if not exists limits jsonb not null default '{}'::jsonb,
  add column if not exists settings jsonb not null default '{}'::jsonb;

-- Billing/plan data lives in a separate table to prevent owners from self-upgrading
create table if not exists public.tenant_billing (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  plan text not null default 'starter',
  status text not null default 'active',
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

-- Owners can update tenant branding and operational settings, but not plan/billing.
create policy "Tenant owners can update tenant branding and settings"
on public.tenants for update
using (public.current_profile_has_role(id, array['owner']::public.staff_role[]))
with check (public.current_profile_has_role(id, array['owner']::public.staff_role[]));

-- Prevent owners from self-upgrading plan or changing protected columns directly.
create or replace function app_private.prevent_tenant_protected_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.plan is distinct from new.plan or old.slug is distinct from new.slug then
    raise exception 'Plan and slug can only be changed by platform administrators.';
  end if;
  return new;
end;
$$;

drop trigger if exists tenants_protect_columns on public.tenants;
create trigger tenants_protect_columns
before update on public.tenants
for each row execute function app_private.prevent_tenant_protected_changes();

-- Only superadmins/Stripe webhooks should manage tenant_billing.
alter table public.tenant_billing enable row level security;

create policy "Tenant owners can read their billing"
on public.tenant_billing for select
using (public.current_profile_has_role(tenant_id, array['owner']::public.staff_role[]));

grant select on public.tenant_billing to authenticated;
