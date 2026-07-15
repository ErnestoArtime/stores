alter table public.orders
  add column if not exists assigned_courier_id uuid references public.couriers(id) on delete set null;
