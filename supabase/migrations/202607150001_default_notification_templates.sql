-- Default notification templates for all tenants.
-- These are inserted once and can be customized per tenant later.

insert into public.notification_templates (tenant_id, channel, event_key, title, body, active)
select
  t.id as tenant_id,
  c.channel,
  c.event_key,
  c.title,
  c.body,
  true
from public.tenants t
cross join lateral (
  values
    ('whatsapp', 'order_placed', 'Pedido recibido {{code}}', 'Hola {{customer_name}}, tu pedido {{code}} fue recibido. Total: {{total}}. Te mantendremos informado.'),
    ('email', 'order_placed', 'Pedido recibido {{code}}', 'Hola {{customer_name}},<br><br>Tu pedido <strong>{{code}}</strong> fue recibido.<br>Total: {{total}}.<br><br>Gracias por tu compra.'),
    ('telegram', 'order_placed', 'Pedido recibido {{code}}', 'Hola {{customer_name}}, tu pedido {{code}} fue recibido. Total: {{total}}.'),
    ('push', 'order_placed', 'Pedido recibido', 'Tu pedido {{code}} fue recibido. Total: {{total}}.')
) as c(channel, event_key, title, body)
where not exists (
  select 1
  from public.notification_templates nt
  where nt.tenant_id = t.id
    and nt.channel = c.channel
    and nt.event_key = c.event_key
);
