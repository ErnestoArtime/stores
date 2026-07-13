-- Enable pg_net extension for HTTP requests from Postgres.
-- If the extension is not available, the trigger will be created but will no-op.
create extension if not exists pg_net;

-- Helper function to send a notification via the send-notification Edge Function.
-- It can also be invoked directly from the application layer.
create or replace function public.notify_order_status_change(
  p_order_id uuid,
  p_event_key text,
  p_channel text default 'whatsapp'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  order_record record;
  service_role_key text;
  supabase_url text;
  payload jsonb;
begin
  select * into order_record from public.orders where id = p_order_id;
  if order_record is null then
    return;
  end if;

  -- These GUC variables must be configured by the platform admin (e.g. via ALTER DATABASE ... SET).
  -- Example:
  --   ALTER DATABASE postgres SET app.settings.supabase_url = 'https://your-project.supabase.co';
  --   ALTER DATABASE postgres SET app.settings.service_role_key = 'your-service-role-key';
  service_role_key := current_setting('app.settings.service_role_key', true);
  supabase_url := current_setting('app.settings.supabase_url', true);

  if service_role_key is null or supabase_url is null then
    return;
  end if;

  payload := jsonb_build_object(
    'tenantId', order_record.tenant_id,
    'channel', p_channel,
    'eventKey', p_event_key,
    'recipient', order_record.customer_phone,
    'variables', jsonb_build_object(
      'customer_name', order_record.customer_name,
      'code', order_record.code,
      'total', order_record.total::text
    )
  );

  perform net.http_post(
    url := supabase_url || '/functions/v1/send-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := payload
  );
end;
$$;

-- Trigger function that dispatches notifications when the order status changes.
-- It respects tenant.settings.notification_channels and defaults to WhatsApp.
create or replace function public.orders_status_notification_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  event_key text;
  tenant_settings jsonb;
  channels text[];
  channel text;
  pg_net_available boolean;
begin
  if old.status is not distinct from new.status then
    return new;
  end if;

  event_key := 'order_' || new.status;

  -- Read tenant notification channels from the tenants table
  select settings into tenant_settings from public.tenants where id = new.tenant_id;
  channels := coalesce((tenant_settings->>'notification_channels')::text[], array['whatsapp']);

  select exists (select 1 from pg_extension where extname = 'pg_net') into pg_net_available;
  if not pg_net_available then
    return new;
  end if;

  foreach channel in array channels loop
    -- Only WhatsApp is supported automatically; other channels need specific recipients
    if channel = 'whatsapp' then
      perform public.notify_order_status_change(new.id, event_key, channel);
    end if;
  end loop;

  return new;
end;
$$;

-- Attach trigger to orders table.
drop trigger if exists orders_status_notification on public.orders;
create trigger orders_status_notification
after update of status on public.orders
for each row execute function public.orders_status_notification_trigger();
