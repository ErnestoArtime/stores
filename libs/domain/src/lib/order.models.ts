export type OrderStatus =
  | 'draft'
  | 'placed'
  | 'confirmed'
  | 'picking'
  | 'on_route'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod = 'cash' | 'transfer' | 'pos' | 'online';
export type DeliveryProofType = 'otp' | 'photo' | 'signature';

export interface CartLine {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  imageUrl: string;
}

export interface Order {
  id: string;
  tenantId: string;
  storeId: string;
  code: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryZone: string;
  deliveryWindow: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  notes: string;
  placedAt: string;
  lines: CartLine[];
  assignedCourierId?: string;
  proofType?: DeliveryProofType;
}

export interface CommerceSummary {
  todayRevenue: number;
  openOrders: number;
  activeProducts: number;
  lowStockProducts: number;
  deliverySlaMinutes: number;
  repeatCustomerRate: number;
  averageOrderValue: number;
}

export interface Courier {
  id: string;
  tenantId: string;
  fullName: string;
  phone: string;
  active: boolean;
  currentZone: string;
  openOrders: number;
}

export interface DeliveryRouteStop {
  orderId: string;
  code: string;
  address: string;
  customerName: string;
  status: OrderStatus;
  etaMinutes: number;
}

export interface DeliveryRoute {
  id: string;
  tenantId: string;
  courierId: string;
  zoneName: string;
  stops: DeliveryRouteStop[];
  startedAt?: string;
}

export interface LoyaltyTier {
  id: string;
  tenantId: string;
  name: string;
  minimumSpend: number;
  pointsMultiplier: number;
  perks: string[];
}

export interface CustomerSegment {
  id: string;
  tenantId: string;
  name: string;
  customerCount: number;
  criteria: string;
}
