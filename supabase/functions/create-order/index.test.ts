import { assertEquals } from 'https://deno.land/std@0.177.0/testing/asserts.ts';
import { handleRequest, CreateOrderRequest } from './index.ts';

function createRequest(body: unknown, token = 'valid-token'): Request {
  return new Request('http://localhost/functions/v1/create-order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-forwarded-for': '127.0.0.1',
    },
    body: JSON.stringify(body),
  });
}

function createMockSupabase(overrides: Record<string, unknown> = {}) {
  const defaults = {
    auth: {
      getUser: async (_token: string) => ({
        data: { user: { id: 'user-123' } },
        error: null,
      }),
    },
    from: (table: string) => ({
      select: (_columns?: string, _options?: unknown) => ({
        eq: (_col: string, _val: unknown) => ({
          eq: (_col2: string, _val2: unknown) => ({
            single: async () => ({ data: null, error: null }),
          }),
          single: async () => ({ data: null, error: null }),
          limit: (_n: number) => ({
            single: async () => ({ data: null, error: null }),
          }),
        }),
        single: async () => ({ data: null, error: null }),
        limit: (_n: number) => ({
          single: async () => ({ data: null, error: null }),
        }),
      }),
      insert: (_rows: unknown) => ({
        select: (_columns?: string) => ({
          single: async () => ({ data: { id: 'order-123', code: 'ORD-TEST' }, error: null }),
        }),
      }),
      update: (_values: unknown) => ({
        eq: (_col: string, _val: unknown) => Promise.resolve({ data: null, error: null }),
      }),
    }),
  };
  return { ...defaults, ...overrides } as unknown as any;
}

Deno.test('create-order returns 401 when user is not authenticated', async () => {
  const supabase = createMockSupabase({
    auth: {
      getUser: async (_token: string) => ({ data: { user: null }, error: new Error('unauthorized') }),
    },
  });
  const req = createRequest({});
  const res = await handleRequest(req, { supabase });
  assertEquals(res.status, 401);
});

Deno.test('create-order returns 400 when required fields are missing', async () => {
  const supabase = createMockSupabase();
  const req = createRequest({ customer_name: 'John' });
  const res = await handleRequest(req, { supabase });
  assertEquals(res.status, 400);
});

Deno.test('create-order returns 400 for invalid phone number', async () => {
  const supabase = createMockSupabase();
  const body: CreateOrderRequest = {
    tenant_id: 'tenant-123',
    store_id: 'store-123',
    customer_name: 'John',
    customer_phone: '123',
    delivery_address: 'Calle 1',
    payment_method: 'cash',
    subtotal: 100,
    delivery_fee: 10,
    lines: [{ productId: 'prod-1', name: 'Product', quantity: 1, unitPrice: 100 }],
  };
  const req = createRequest(body);
  const res = await handleRequest(req, { supabase });
  assertEquals(res.status, 400);
});

Deno.test('create-order returns 404 when tenant is not found', async () => {
  const supabase = createMockSupabase({
    from: (table: string) => ({
      select: () => ({
        eq: () => ({ single: async () => ({ data: null, error: new Error('not found') }) }),
      }),
      insert: () => ({ select: () => ({ single: async () => ({ data: { id: 'order-123', code: 'ORD-TEST' }, error: null }) }) }),
      update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
    }),
  });
  const body: CreateOrderRequest = {
    tenant_id: 'tenant-123',
    store_id: 'store-123',
    customer_name: 'John',
    customer_phone: '+5355551234',
    delivery_address: 'Calle 1',
    payment_method: 'cash',
    subtotal: 100,
    delivery_fee: 10,
    lines: [{ productId: 'prod-1', name: 'Product', quantity: 1, unitPrice: 100 }],
  };
  const req = createRequest(body);
  const res = await handleRequest(req, { supabase });
  assertEquals(res.status, 404);
});
