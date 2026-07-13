-- Set default notification channels for existing tenants that don't have them configured.
-- Default is WhatsApp only.

update public.tenants
set settings = jsonb_set(
  coalesce(settings, '{}'::jsonb),
  '{notification_channels}',
  '["whatsapp"]'::jsonb,
  true
)
where settings is null
   or settings->'notification_channels' is null;
