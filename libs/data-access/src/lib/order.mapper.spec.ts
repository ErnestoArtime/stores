import { describe, it, expect } from 'vitest';
import { mapOrderRow } from './order.mapper';

describe('mapOrderRow', () => {
  it('maps a complete order row', () => {
    const row: Record<string, unknown> = {
      id: 'order-1',
      tenant_id: 'tenant-1',
      store_id: 'store-1',
      code: 'ORD-001',
      customer_name: 'John Doe',
      customer_phone: '+5355551234',
      delivery_address: 'Calle 1',
      delivery_zone: 'Centro',
      delivery_window: 'Hoy 12:00 - 14:00',
      status: 'placed',
      payment_method: 'cash',
      subtotal: 100,
      delivery_fee: 5,
      discount: 0,
      total: 105,
      placed_at: '2026-07-15T10:00:00Z',
      assigned_courier_id: null
    };

    const order = mapOrderRow(row);

    expect(order.id).toBe('order-1');
    expect(order.code).toBe('ORD-001');
    expect(order.customerName).toBe('John Doe');
    expect(order.deliveryZone).toBe('Centro');
    expect(order.total).toBe(105);
    expect(order.notes).toBe('');
    expect(order.lines).toEqual([]);
  });

  it('defaults optional fields', () => {
    const row: Record<string, unknown> = {
      id: 'order-2',
      tenant_id: 'tenant-1',
      store_id: 'store-1',
      code: 'ORD-002',
      customer_name: 'Jane Doe',
      customer_phone: '+5355555678',
      delivery_address: 'Calle 2',
      status: 'confirmed',
      payment_method: 'transfer',
      subtotal: 50,
      delivery_fee: 0,
      discount: 0,
      total: 50,
      placed_at: '2026-07-15T11:00:00Z'
    };

    const order = mapOrderRow(row);

    expect(order.deliveryZone).toBe('');
    expect(order.deliveryWindow).toBe('');
    expect(order.assignedCourierId).toBeUndefined();
  });

  it('maps assigned courier id when present', () => {
    const row: Record<string, unknown> = {
      id: 'order-3',
      tenant_id: 'tenant-1',
      store_id: 'store-1',
      code: 'ORD-003',
      customer_name: 'Bob',
      customer_phone: '+5355559012',
      delivery_address: 'Calle 3',
      status: 'on_route',
      payment_method: 'pos',
      subtotal: 75,
      delivery_fee: 5,
      discount: 0,
      total: 80,
      placed_at: '2026-07-15T12:00:00Z',
      assigned_courier_id: 'courier-1'
    };

    const order = mapOrderRow(row);

    expect(order.status).toBe('on_route');
    expect(order.paymentMethod).toBe('pos');
    expect(order.assignedCourierId).toBe('courier-1');
  });
});
