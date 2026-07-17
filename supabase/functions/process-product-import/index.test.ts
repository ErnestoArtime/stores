import { assertEquals } from 'https://deno.land/std@0.177.0/testing/asserts.ts';
import { handleRequest } from './index.ts';

function createRequest(body: unknown): Request {
  return new Request('http://localhost/functions/v1/process-product-import', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': '127.0.0.1',
    },
    body: JSON.stringify(body),
  });
}

Deno.test('process-product-import returns 200 for OPTIONS', async () => {
  const req = new Request('http://localhost/functions/v1/process-product-import', { method: 'OPTIONS' });
  const res = await handleRequest(req, { supabase: {} as any });
  assertEquals(res.status, 200);
});

Deno.test('process-product-import returns 400 when tenant_id is missing', async () => {
  const req = createRequest({ rows: [] });
  const res = await handleRequest(req, { supabase: {} as any });
  assertEquals(res.status, 400);
});

Deno.test('process-product-import returns 400 when rows is empty', async () => {
  const req = createRequest({ tenant_id: 'tenant-123', rows: [] });
  const res = await handleRequest(req, { supabase: {} as any });
  assertEquals(res.status, 400);
});

Deno.test('process-product-import returns 400 when rows is not an array', async () => {
  const req = createRequest({ tenant_id: 'tenant-123', rows: 'invalid' });
  const res = await handleRequest(req, { supabase: {} as any });
  assertEquals(res.status, 400);
});
