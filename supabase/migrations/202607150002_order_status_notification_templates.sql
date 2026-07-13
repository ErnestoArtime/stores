-- Default notification templates for order status changes.
-- These complement the existing order_placed templates.

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
    ('whatsapp', 'order_confirmed', 'Pedido confirmado {{code}}', 'Hola {{customer_name}}, tu pedido {{code}} fue confirmado. Te avisamos cuando este en camino.'),
    ('email', 'order_confirmed', 'Pedido confirmado {{code}}', 'Hola {{customer_name}},<br><br>Tu pedido <strong>{{code}}</strong> fue confirmado.<br>Te avisamos cuando este en camino.'),
    ('telegram', 'order_confirmed', 'Pedido confirmado {{code}}', 'Hola {{customer_name}}, tu pedido {{code}} fue confirmado. Te avisamos cuando este en camino.'),
    ('push', 'order_confirmed', 'Pedido confirmado', 'Tu pedido {{code}} fue confirmado.'),

    ('whatsapp', 'order_picking', 'Pedido en preparacion {{code}}', 'Hola {{customer_name}}, estamos preparando tu pedido {{code}}.'),
    ('email', 'order_picking', 'Pedido en preparacion {{code}}', 'Hola {{customer_name}},<br><br>Estamos preparando tu pedido <strong>{{code}}</strong>.'),
    ('telegram', 'order_picking', 'Pedido en preparacion {{code}}', 'Hola {{customer_name}}, estamos preparando tu pedido {{code}}.'),
    ('push', 'order_picking', 'Pedido en preparacion', 'Estamos preparando tu pedido {{code}}.'),

    ('whatsapp', 'order_on_route', 'Pedido en camino {{code}}', 'Hola {{customer_name}}, tu pedido {{code}} esta en camino.'),
    ('email', 'order_on_route', 'Pedido en camino {{code}}', 'Hola {{customer_name}},<br><br>Tu pedido <strong>{{code}}</strong> esta en camino.'),
    ('telegram', 'order_on_route', 'Pedido en camino {{code}}', 'Hola {{customer_name}}, tu pedido {{code}} esta en camino.'),
    ('push', 'order_on_route', 'Pedido en camino', 'Tu pedido {{code}} esta en camino.'),

    ('whatsapp', 'order_delivered', 'Pedido entregado {{code}}', 'Hola {{customer_name}}, tu pedido {{code}} fue entregado. Gracias por tu compra.'),
    ('email', 'order_delivered', 'Pedido entregado {{code}}', 'Hola {{customer_name}},<br><br>Tu pedido <strong>{{code}}</strong> fue entregado.<br>Gracias por tu compra.'),
    ('telegram', 'order_delivered', 'Pedido entregado {{code}}', 'Hola {{customer_name}}, tu pedido {{code}} fue entregado. Gracias por tu compra.'),
    ('push', 'order_delivered', 'Pedido entregado', 'Tu pedido {{code}} fue entregado. Gracias por tu compra.'),

    ('whatsapp', 'order_cancelled', 'Pedido cancelado {{code}}', 'Hola {{customer_name}}, tu pedido {{code}} fue cancelado. Contactanos si tienes dudas.'),
    ('email', 'order_cancelled', 'Pedido cancelado {{code}}', 'Hola {{customer_name}},<br><br>Tu pedido <strong>{{code}}</strong> fue cancelado.<br>Contactanos si tienes dudas.'),
    ('telegram', 'order_cancelled', 'Pedido cancelado {{code}}', 'Hola {{customer_name}}, tu pedido {{code}} fue cancelado. Contactanos si tienes dudas.'),
    ('push', 'order_cancelled', 'Pedido cancelado', 'Tu pedido {{code}} fue cancelado. Contactanos si tienes dudas.')
) as c(channel, event_key, title, body)
where not exists (
  select 1
  from public.notification_templates nt
  where nt.tenant_id = t.id
    and nt.channel = c.channel
    and nt.event_key = c.event_key
);
