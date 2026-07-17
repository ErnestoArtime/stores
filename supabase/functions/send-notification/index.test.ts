import { assertEquals } from 'https://deno.land/std@0.177.0/testing/asserts.ts';
import { handleRequest } from './index.ts';

function createRequest(body: unknown, method = 'POST', token = 'service-role-token'): Request {
  return new Request('http://localhost/functions/v1/send-notification', {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-forwarded-for': '127.0.0.1',
    },
    body: JSON.stringify(body),
  });
}

Deno.test('send-notification returns 200 for OPTIONS', async () => {
  const req = new Request('http://localhost/functions/v1/send-notification', { method: 'OPTIONS' });
  const res = await handleRequest(req, { supabase: {} as any });
  assertEquals(res.status, 200);
});

Deno.test('send-notification returns 405 for non-POST methods', async () => {
  const req = new Request('http://localhost/functions/v1/send-notification', { method: 'GET' });
  const res = await handleRequest(req, { supabase: {} as any });
  assertEquals(res.status, 405);
});

Deno.test('send-notification returns 400 for invalid payload', async () => {
  const req = createRequest({ tenantId: 'tenant-123', channel: 'invalid', eventKey: 'x', recipient: 'r' });
  const res = await handleRequest(req, { supabase: {} as any });
  assertEquals(res.status, 400);
});

Deno.test('send-notification returns 400 when required fields are missing', async () => {
  const req = createRequest({});
  const res = await handleRequest(req, { supabase: {} as any });
  assertEquals(res.status, 400);
});
