import { signal } from '@angular/core';
import { DashboardService } from './dashboard.service';
import { Order, Product, StoreLocation } from '@stores/domain';
import { SupabaseClientService } from './supabase.client';

const mockSupabase = {
  configured: false
} as unknown as SupabaseClientService;

const mockStores: StoreLocation[] = [
  {
    id: 'store-1',
    tenantId: 'tenant-1',
    name: 'Sucursal A',
    type: 'mixed',
    address: 'Calle 1',
    city: 'La Habana',
    municipality: 'Plaza',
    phone: '+53 1 234 5678',
    openNow: true,
    deliveryMinutes: 45,
    rating: 4.8,
    coverUrl: '',
    fulfillment: ['delivery']
  },
  {
    id: 'store-2',
    tenantId: 'tenant-1',
    name: 'Sucursal B',
    type: 'mixed',
    address: 'Calle 2',
    city: 'La Habana',
    municipality: 'Playa',
    phone: '+53 1 234 5679',
    openNow: true,
    deliveryMinutes: 55,
    rating: 4.6,
    coverUrl: '',
    fulfillment: ['delivery']
  }
];

const mockProducts: Product[] = [
  {
    id: 'prod-1',
    tenantId: 'tenant-1',
    storeId: 'store-1',
    categoryId: 'cat-1',
    name: 'Producto A',
    sku: 'SKU-001',
    description: '',
    imageUrl: '',
    price: 100,
    stock: 10,
    unit: 'unidad',
    status: 'active',
    tags: []
  },
  {
    id: 'prod-2',
    tenantId: 'tenant-1',
    storeId: 'store-1',
    categoryId: 'cat-1',
    name: 'Producto B',
    sku: 'SKU-002',
    description: '',
    imageUrl: '',
    price: 200,
    stock: 5,
    unit: 'unidad',
    status: 'active',
    tags: []
  },
  {
    id: 'prod-3',
    tenantId: 'tenant-1',
    storeId: 'store-1',
    categoryId: 'cat-1',
    name: 'Producto C',
    sku: 'SKU-003',
    description: '',
    imageUrl: '',
    price: 300,
    stock: 20,
    unit: 'unidad',
    status: 'archived',
    tags: []
  }
];

function createOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'ord-1',
    tenantId: 'tenant-1',
    storeId: 'store-1',
    code: 'MC-1001',
    customerName: 'Cliente A',
    customerPhone: '+53 5 555 0101',
    deliveryAddress: 'Calle 23',
    deliveryZone: 'Zona 1',
    deliveryWindow: 'Hoy 12:00 - 14:00',
    status: 'delivered',
    paymentMethod: 'cash',
    subtotal: 300,
    deliveryFee: 50,
    discount: 0,
    total: 350,
    notes: '',
    placedAt: new Date().toISOString(),
    lines: [{ productId: 'prod-1', name: 'Producto A', quantity: 1, unitPrice: 100, imageUrl: '' }],
    ...overrides
  };
}

describe('DashboardService', () => {
  it('should calculate active and low stock products', () => {
    const service = new DashboardService(
      mockSupabase,
      signal<Order[]>([]),
      signal<Product[]>(mockProducts),
      signal<StoreLocation[]>(mockStores)
    );

    expect(service.kpis().activeProducts).toBe(2);
    expect(service.kpis().lowStockProducts).toBe(2); // prod-1 (10) and prod-2 (5) are both <= 15
  });

  it('should calculate today revenue and orders', () => {
    const today = new Date().toISOString();
    const orders = signal<Order[]>([
      createOrder({ id: 'ord-1', total: 350, placedAt: today }),
      createOrder({ id: 'ord-2', total: 700, placedAt: today, customerName: 'Cliente B' })
    ]);

    const service = new DashboardService(
      mockSupabase,
      orders,
      signal<Product[]>(mockProducts),
      signal<StoreLocation[]>(mockStores)
    );

    expect(service.kpis().todayRevenue).toBe(1050);
    expect(service.kpis().todayOrders).toBe(2);
  });

  it('should calculate open orders', () => {
    const orders = signal<Order[]>([
      createOrder({ id: 'ord-1', status: 'confirmed' }),
      createOrder({ id: 'ord-2', status: 'picking' }),
      createOrder({ id: 'ord-3', status: 'delivered' })
    ]);

    const service = new DashboardService(
      mockSupabase,
      orders,
      signal<Product[]>(mockProducts),
      signal<StoreLocation[]>(mockStores)
    );

    expect(service.kpis().openOrders).toBe(2);
  });

  it('should calculate average order value from delivered orders', () => {
    const orders = signal<Order[]>([
      createOrder({ id: 'ord-1', total: 100, status: 'delivered' }),
      createOrder({ id: 'ord-2', total: 300, status: 'delivered', customerName: 'Cliente B' })
    ]);

    const service = new DashboardService(
      mockSupabase,
      orders,
      signal<Product[]>(mockProducts),
      signal<StoreLocation[]>(mockStores)
    );

    expect(service.kpis().averageOrderValue).toBe(200);
  });

  it('should calculate top selling products', () => {
    const orders = signal<Order[]>([
      createOrder({
        id: 'ord-1',
        lines: [
          { productId: 'prod-1', name: 'Producto A', quantity: 2, unitPrice: 100, imageUrl: '' },
          { productId: 'prod-2', name: 'Producto B', quantity: 1, unitPrice: 200, imageUrl: '' }
        ]
      }),
      createOrder({
        id: 'ord-2',
        customerName: 'Cliente B',
        lines: [{ productId: 'prod-2', name: 'Producto B', quantity: 3, unitPrice: 200, imageUrl: '' }]
      })
    ]);

    const service = new DashboardService(
      mockSupabase,
      orders,
      signal<Product[]>(mockProducts),
      signal<StoreLocation[]>(mockStores)
    );

    const top = service.kpis().topSellingProducts;
    expect(top).toHaveLength(2);
    expect(top[0].name).toBe('Producto B');
    expect(top[0].revenue).toBe(800);
    expect(top[1].name).toBe('Producto A');
    expect(top[1].revenue).toBe(200);
  });

  it('should calculate delivery SLA average', () => {
    const service = new DashboardService(
      mockSupabase,
      signal<Order[]>([]),
      signal<Product[]>(mockProducts),
      signal<StoreLocation[]>(mockStores)
    );

    expect(service.kpis().deliverySlaMinutes).toBe(50);
  });

  it('should react to signal changes', () => {
    const ordersSignal = signal<Order[]>([createOrder({ id: 'ord-1', total: 100, status: 'delivered' })]);
    const service = new DashboardService(
      mockSupabase,
      ordersSignal,
      signal<Product[]>(mockProducts),
      signal<StoreLocation[]>(mockStores)
    );

    expect(service.kpis().todayRevenue).toBe(100);

    ordersSignal.update((orders) => [...orders, createOrder({ id: 'ord-2', total: 200, status: 'delivered', customerName: 'Cliente B' })]);

    expect(service.kpis().todayRevenue).toBe(300);
  });

  it('should group orders by status', () => {
    const orders = signal<Order[]>([
      createOrder({ id: 'ord-1', status: 'delivered' }),
      createOrder({ id: 'ord-2', status: 'delivered' }),
      createOrder({ id: 'ord-3', status: 'confirmed' })
    ]);

    const service = new DashboardService(
      mockSupabase,
      orders,
      signal<Product[]>(mockProducts),
      signal<StoreLocation[]>(mockStores)
    );

    expect(service.kpis().ordersByStatus['delivered']).toBe(2);
    expect(service.kpis().ordersByStatus['confirmed']).toBe(1);
  });

  it('should calculate conversion rate', () => {
    const orders = signal<Order[]>([
      createOrder({ id: 'ord-1', status: 'delivered' }),
      createOrder({ id: 'ord-2', status: 'delivered' }),
      createOrder({ id: 'ord-3', status: 'cancelled' })
    ]);

    const service = new DashboardService(
      mockSupabase,
      orders,
      signal<Product[]>(mockProducts),
      signal<StoreLocation[]>(mockStores)
    );

    expect(service.kpis().conversionRate).toBe(67);
  });

  it('should handle empty state gracefully', () => {
    const service = new DashboardService(
      mockSupabase,
      signal<Order[]>([]),
      signal<Product[]>([]),
      signal<StoreLocation[]>([])
    );

    expect(service.kpis().todayRevenue).toBe(0);
    expect(service.kpis().todayOrders).toBe(0);
    expect(service.kpis().openOrders).toBe(0);
    expect(service.kpis().activeProducts).toBe(0);
    expect(service.kpis().lowStockProducts).toBe(0);
    expect(service.kpis().averageOrderValue).toBe(0);
    expect(service.kpis().conversionRate).toBe(0);
    expect(service.kpis().topSellingProducts).toEqual([]);
    expect(service.kpis().deliverySlaMinutes).toBe(0);
  });
});
