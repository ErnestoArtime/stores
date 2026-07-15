import { Order } from '@stores/domain';

export function mapOrderRow(row: Record<string, unknown>): Order {
  return {
    id: row['id'] as string,
    tenantId: row['tenant_id'] as string,
    storeId: (row['store_id'] as string) || '',
    code: row['code'] as string,
    customerName: row['customer_name'] as string,
    customerPhone: row['customer_phone'] as string,
    deliveryAddress: row['delivery_address'] as string,
    deliveryZone: (row['delivery_zone'] as string) ?? '',
    deliveryWindow: (row['delivery_window'] as string) ?? '',
    status: row['status'] as Order['status'],
    paymentMethod: row['payment_method'] as Order['paymentMethod'],
    subtotal: row['subtotal'] as number,
    deliveryFee: row['delivery_fee'] as number,
    discount: (row['discount'] as number) ?? 0,
    total: row['total'] as number,
    notes: '',
    placedAt: (row['placed_at'] as string) || '',
    lines: [],
    assignedCourierId: (row['assigned_courier_id'] as string) ?? undefined
  };
}
