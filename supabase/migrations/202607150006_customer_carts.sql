create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, tenant_id)
);

alter table public.carts enable row level security;

create policy "Users can manage their own cart"
  on public.carts for all
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant all on public.carts to authenticated;
