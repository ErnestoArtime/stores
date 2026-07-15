import { Signal, computed } from '@angular/core';
import { Order, OrderStatus, Product, StoreLocation } from '@stores/domain';
import { SupabaseClientService } from './supabase.client';

export interface DashboardKpis {
  todayRevenue: number;
  todayOrders: number;
  openOrders: number;
  activeProducts: number;
  lowStockProducts: number;
  deliverySlaMinutes: number;
  repeatCustomerRate: number;
  averageOrderValue: number;
  conversionRate: number;
  topSellingProducts: { name: string; quantity: number; revenue: number }[];
  ordersByStatus: Record<OrderStatus, number>;
  revenueByDay: { label: string; value: number }[];
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

const LOW_STOCK_THRESHOLD = 15;

export class DashboardService {
  readonly orders: Signal<Order[]>;
  readonly products: Signal<Product[]>;
  readonly stores: Signal<StoreLocation[]>;

  constructor(
    private readonly supabase: SupabaseClientService,
    orders: Signal<Order[]>,
    products: Signal<Product[]>,
    stores: Signal<StoreLocation[]>
  ) {
    this.orders = orders;
    this.products = products;
    this.stores = stores;
  }

  readonly activeProducts = computed(() => this.products().filter((p) => p.status === 'active').length);
  readonly lowStockProducts = computed(() => this.products().filter((p) => p.status === 'active' && p.stock <= LOW_STOCK_THRESHOLD).length);

  readonly kpis = computed<DashboardKpis>(() => {
    const all = this.orders();
    const referenceDate = this.supabase.configured ? new Date() : this.latestOrderDate(all);
    const today = startOfDay(referenceDate);

    const todayOrders = all.filter((o) => isSameDay(new Date(o.placedAt), today));
    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);

    const openStatuses: OrderStatus[] = ['placed', 'confirmed', 'picking', 'on_route'];
    const openOrders = all.filter((o) => openStatuses.includes(o.status)).length;

    const finished = all.filter((o) => o.status === 'delivered' || o.status === 'cancelled');
    const completed = all.filter((o) => o.status === 'delivered');
    const averageOrderValue = completed.length
      ? completed.reduce((sum, o) => sum + o.total, 0) / completed.length
      : 0;

    const customerNames = new Map<string, number>();
    for (const order of all) {
      const count = customerNames.get(order.customerName) ?? 0;
      customerNames.set(order.customerName, count + 1);
    }
    const repeatCustomers = Array.from(customerNames.values()).filter((c) => c > 1).length;
    const repeatCustomerRate = customerNames.size ? Math.round((repeatCustomers / customerNames.size) * 100) : 0;

    const productSales = new Map<string, { name: string; quantity: number; revenue: number }>();
    for (const order of all) {
      for (const line of order.lines) {
        const existing = productSales.get(line.productId);
        const revenue = line.quantity * line.unitPrice;
        if (existing) {
          existing.quantity += line.quantity;
          existing.revenue += revenue;
        } else {
          productSales.set(line.productId, { name: line.name, quantity: line.quantity, revenue });
        }
      }
    }
    const topSellingProducts = Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const ordersByStatus = all.reduce<Record<string, number>>((acc, order) => {
      acc[order.status] = (acc[order.status] ?? 0) + 1;
      return acc;
    }, {} as Record<OrderStatus, number>);

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      return d;
    });
    const revenueByDay = last7Days.map((day) => {
      const value = all
        .filter((o) => isSameDay(new Date(o.placedAt), day))
        .reduce((sum, o) => sum + o.total, 0);
      return {
        label: day.toLocaleDateString('es-ES', { weekday: 'short' }),
        value
      };
    });

    const conversionRate = finished.length ? Math.round((completed.length / finished.length) * 100) : 0;

    return {
      todayRevenue,
      todayOrders: todayOrders.length,
      openOrders,
      activeProducts: this.activeProducts(),
      lowStockProducts: this.lowStockProducts(),
      deliverySlaMinutes: this.averageDeliveryMinutes(),
      repeatCustomerRate,
      averageOrderValue,
      conversionRate,
      topSellingProducts,
      ordersByStatus,
      revenueByDay
    };
  });

  private averageDeliveryMinutes(): number {
    const stores = this.stores();
    if (!stores.length) return 0;
    return Math.round(stores.reduce((sum, s) => sum + s.deliveryMinutes, 0) / stores.length);
  }

  /**
   * Demo-only fallback: when Supabase is not configured, demo orders have fixed
   * dates. Use the latest order date as "today" so the dashboard still shows
   * meaningful "today" metrics while running against demo data.
   */
  private latestOrderDate(orders: Order[]): Date {
    if (!orders.length) return new Date();
    const latest = orders.reduce((max, order) => {
      const date = new Date(order.placedAt);
      return date > max ? date : max;
    }, new Date(orders[0].placedAt));
    return latest;
  }
}
