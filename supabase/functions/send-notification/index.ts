import { createClient, SupabaseClient } from '@supabase/supabase-js';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 60;

async function checkRateLimit(ip: string): Promise<boolean> {
  try {
    const kv = await Deno.openKv();
    const key = ['rate_limit', 'send-notification', ip];
    const { value } = await kv.get(key);
    const count = (value as number) || 0;
    if (count >= RATE_LIMIT_MAX_REQUESTS) return false;
    await kv.set(key, count + 1, { expireIn: RATE_LIMIT_WINDOW_MS });
    return true;
  } catch {
    return true;
  }
}

function validateNotificationPayload(body: unknown): { valid: false; error: string } | { valid: true; data: NotificationPayload } {
  const b = body as Record<string, unknown>;
  if (!b.tenantId || typeof b.tenantId !== 'string') return { valid: false, error: 'tenantId requerido' };
  if (!b.channel || !['whatsapp', 'email', 'push', 'telegram'].includes(b.channel as string)) return { valid: false, error: 'channel invalido' };
  if (!b.eventKey || typeof b.eventKey !== 'string') return { valid: false, error: 'eventKey requerido' };
  if (!b.recipient || typeof b.recipient !== 'string') return { valid: false, error: 'recipient requerido' };
  return { valid: true, data: b as NotificationPayload };
}

type NotificationChannel = 'whatsapp' | 'email' | 'push' | 'telegram';

type NotificationPayload = {
  tenantId: string;
  channel: NotificationChannel;
  eventKey: string;
  recipient: string;
  variables?: Record<string, string>;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sendWhatsApp(to: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const token = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
  const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

  if (!token || !phoneNumberId) {
    return { ok: false, error: 'WhatsApp credentials not configured' };
  }

  const response = await fetch(
    `https://graph.facebook/v18.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to.replace(/\D/g, ''),
        type: 'text',
        text: { body },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    return { ok: false, error: err };
  }
  return { ok: true };
}

async function sendEmail(to: string, subject: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@mercado.cu';

  if (!apiKey) {
    return { ok: false, error: 'Resend API key not configured' };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [to],
      subject,
      html: body.replace(/\n/g, '<br>'),
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    return { ok: false, error: err };
  }
  return { ok: true };
}

async function sendTelegram(to: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');

  if (!botToken) {
    return { ok: false, error: 'Telegram bot token not configured' };
  }

  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: to,
        text: body,
        parse_mode: 'HTML',
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    return { ok: false, error: err };
  }
  return { ok: true };
}

async function sendPush(
  _to: string,
  _title: string,
  _body: string
): Promise<{ ok: boolean; error?: string }> {
  const fcmKey = Deno.env.get('FCM_SERVER_KEY');

  if (!fcmKey) {
    return { ok: false, error: 'FCM server key not configured' };
  }

  // FCM push requires a device token; placeholder for future implementation
  return { ok: false, error: 'FCM push requires device token registration' };
}

async function canNotifyTenant(req: Request, serviceRoleKey: string, supabaseUrl: string, tenantId: string, supabase: SupabaseClient): Promise<boolean> {
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return false;
  }
  const token = authHeader.replace('Bearer ', '');

  // Service role keys are allowed for inter-function calls.
  if (token === serviceRoleKey) {
    return true;
  }

  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData.user) {
    return false;
  }

  // Superadmins are always authorized
  const { data: superadmin } = await supabase
    .from('superadmins')
    .select('id')
    .eq('id', authData.user.id)
    .single();
  if (superadmin) {
    return true;
  }

  // Active staff members of the tenant are authorized
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', authData.user.id)
    .eq('tenant_id', tenantId)
    .eq('active', true)
    .single();

  return !!profile;
}

export async function handleRequest(req: Request, deps: { supabase: SupabaseClient }): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  if (!(await checkRateLimit(ip))) {
    return Response.json(
      { error: 'Demasiadas solicitudes. Intente mas tarde.' },
      { status: 429, headers: corsHeaders }
    );
  }

  const rawBody = await req.json();
  const validation = validateNotificationPayload(rawBody);
  if (!validation.valid) {
    return Response.json(
      { error: validation.error },
      { status: 400, headers: corsHeaders }
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json(
      { error: 'Missing Supabase function secrets' },
      { status: 500, headers: corsHeaders }
    );
  }

  const payload = validation.data;
  const supabase = deps.supabase ?? createClient(supabaseUrl, serviceRoleKey);

  if (!(await canNotifyTenant(req, serviceRoleKey, supabaseUrl, payload.tenantId, supabase))) {
    return Response.json(
      { error: 'Unauthorized' },
      { status: 401, headers: corsHeaders }
    );
  }

  // Load template
  const { data: template, error } = await supabase
    .from('notification_templates')
    .select('title, body')
    .eq('tenant_id', payload.tenantId)
    .eq('channel', payload.channel)
    .eq('event_key', payload.eventKey)
    .eq('active', true)
    .single();

  if (error || !template) {
    return Response.json(
      { error: 'Template not found', details: error?.message },
      { status: 404, headers: corsHeaders }
    );
  }

  // Interpolate variables
  const variables = payload.variables ?? {};
  const title = Object.entries(variables).reduce(
    (t, [key, value]) => t.replaceAll(`{{${key}}}`, value),
    template.title
  );
  const body = Object.entries(variables).reduce(
    (b, [key, value]) => b.replaceAll(`{{${key}}}`, value),
    template.body
  );

  // Dispatch to provider
  let result: { ok: boolean; error?: string };

  switch (payload.channel) {
    case 'whatsapp':
      result = await sendWhatsApp(payload.recipient, body);
      break;
    case 'email':
      result = await sendEmail(payload.recipient, title, body);
      break;
    case 'telegram':
      result = await sendTelegram(payload.recipient, body);
      break;
    case 'push':
      result = await sendPush(payload.recipient, title, body);
      break;
    default:
      result = { ok: false, error: `Unsupported channel: ${payload.channel}` };
  }

  // Log notification event
  await supabase.from('audit_events').insert({
    tenant_id: payload.tenantId,
    event_type: 'notification_sent',
    entity_type: payload.channel,
    metadata: {
      event_key: payload.eventKey,
      recipient: payload.recipient,
      channel: payload.channel,
      success: result.ok,
      error: result.error,
    },
  });

  if (!result.ok) {
    return Response.json(
      { queued: false, error: result.error },
      { status: 502, headers: corsHeaders }
    );
  }

  return Response.json(
    { queued: true, channel: payload.channel, recipient: payload.recipient, title, body },
    { status: 200, headers: corsHeaders }
  );
}

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  return handleRequest(req, { supabase });
});
