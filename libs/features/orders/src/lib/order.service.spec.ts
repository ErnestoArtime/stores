import { describe, it, expect, beforeEach } from 'vitest';
import { signal } from '@angular/core';
import { OrderService } from './order.service';
import { Order, demoOrders } from '@stores/domain';
import { SupabaseClientService } from '@stores/data-access';
import { TenantService } from '@stores/features/tenant';

const mockSupabase = {
  configured: false,
  client: {
    from: () => ({
      select: () => ({ eq: () => ({ order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }) }) }),
      update: () => ({ eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }) })
    })
  }
} as unknown as SupabaseClientService;

const mockTenantService = {
  tenant: signal({ id: 'tenant-1' } as any).asReadonly()
} as unknown as TenantService;

describe('OrderService', () => {
  let service: OrderService;

  beforeEach(() => {
    service = new OrderService();
    (service as any).supabase = mockSupabase;
    (service as any).tenantService = mockTenantService;
  });

  it('starts with demo orders', () => {
    expect(service.orders().length).toBe(demoOrders.length);
  });

  it('filters orders by status', () => {
    service.setFilters({ status: 'delivered' });
    expect(service.filteredOrders().every((o) => o.status === 'delivered')).toBe(true);
  });

  it('filters orders by search term', () => {
    const term = demoOrders[0].code.slice(0, 3).toLowerCase();
    service.setFilters({ search: term });
    expect(service.filteredOrders().every((o) =>
      o.code.toLowerCase().includes(term) || o.customerName.toLowerCase().includes(term)
    )).toBe(true);
  });

  it('updates order in state', () => {
    const order = { ...demoOrders[0], customerName: 'Updated Customer' };
    service.updateOrderInState(order);
    expect(service.orders().find((o) => o.id === order.id)?.customerName).toBe('Updated Customer');
  });

  it('adds order to state', () => {
    const initialCount = service.orders().length;
    const order: Order = {
      id: 'new-order',
      tenantId: 'tenant-1',
      storeId: 'store-1',
      code: 'ORD-NEW',
      customerName: 'New Customer',
      customerPhone: '+5355551234',
      deliveryAddress: 'Calle Nueva',
      deliveryZone: 'Centro',
      deliveryWindow: 'Hoy',
      status: 'placed',
      paymentMethod: 'cash',
      subtotal: 100,
      deliveryFee: 5,
      discount: 0,
      total: 105,
      notes: '',
      placedAt: new Date().toISOString(),
      lines: []
    };
    service.addOrderToState(order);
    expect(service.orders().length).toBe(initialCount + 1);
  });
});
