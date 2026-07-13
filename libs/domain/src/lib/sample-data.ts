import { Category, DeliveryZone, Product, Promotion, StoreLocation } from './catalog.models';
import { CommerceSummary, Courier, CustomerSegment, DeliveryRoute, LoyaltyTier, Order } from './order.models';
import { Tenant } from './tenant.models';

export const demoTenant: Tenant = {
  id: 'tenant-demo-market',
  slug: 'demo-market',
  name: 'Mercado Caribe',
  legalName: 'Mercado Caribe S.R.L.',
  plan: 'growth',
  currency: 'CUP',
  supportPhone: '+53 7 555 0101',
  supportWhatsapp: '+53 5 555 0101',
  branding: {
    primaryColor: '#0f766e',
    accentColor: '#f59e0b',
    heroImageUrl:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1800&q=80'
  },
  features: {
    delivery: true,
    loyalty: true,
    promotions: true,
    import: true,
    dispatch: true,
    analytics: true
  },
  limits: {
    maxProducts: 1000,
    maxStores: 10,
    maxOrdersPerMonth: 5000,
    maxStaff: 20
  },
  settings: {
    businessHours: { open: '08:00', close: '20:00', days: [1, 2, 3, 4, 5, 6] },
    deliveryWindowOptions: ['Hoy 12:00 - 14:00', 'Hoy 18:00 - 20:00', 'Manana 09:00 - 12:00'],
    paymentMethods: ['cash', 'transfer', 'pos'],
    notificationChannels: ['whatsapp']
  },
  billing: {
    plan: 'growth',
    status: 'active'
  }
};

export const demoCategories: Category[] = [
  { id: 'cat-food', tenantId: demoTenant.id, name: 'Alimentos', icon: 'bag-handle-outline', featured: true },
  { id: 'cat-cleaning', tenantId: demoTenant.id, name: 'Aseo', icon: 'sparkles-outline', featured: true },
  { id: 'cat-home', tenantId: demoTenant.id, name: 'Hogar', icon: 'home-outline', featured: true },
  { id: 'cat-baby', tenantId: demoTenant.id, name: 'Bebe', icon: 'heart-outline', featured: false },
  { id: 'cat-tech', tenantId: demoTenant.id, name: 'Electro', icon: 'phone-portrait-outline', featured: false }
];

export const demoStores: StoreLocation[] = [
  {
    id: 'store-vedado',
    tenantId: demoTenant.id,
    name: 'Sucursal Vedado',
    type: 'mixed',
    address: 'Linea y Paseo',
    city: 'La Habana',
    municipality: 'Plaza',
    phone: '+53 7 830 0001',
    openNow: true,
    deliveryMinutes: 45,
    rating: 4.8,
    coverUrl: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1200&q=80',
    fulfillment: ['delivery', 'pickup', 'scheduled']
  },
  {
    id: 'store-playa',
    tenantId: demoTenant.id,
    name: 'Sucursal Playa',
    type: 'market',
    address: '5ta Avenida',
    city: 'La Habana',
    municipality: 'Playa',
    phone: '+53 7 204 0002',
    openNow: true,
    deliveryMinutes: 55,
    rating: 4.6,
    coverUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1200&q=80',
    fulfillment: ['delivery', 'pickup']
  }
];

export const demoProducts: Product[] = [
  {
    id: 'prod-rice',
    tenantId: demoTenant.id,
    storeId: 'store-vedado',
    categoryId: 'cat-food',
    sku: 'ALM-001',
    name: 'Arroz selecto',
    description: 'Paquete de arroz de grano largo para compras semanales.',
    imageUrl: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=900&q=80',
    price: 720,
    stock: 86,
    unit: '5 lb',
    status: 'active',
    tags: ['basico', 'popular']
  },
  {
    id: 'prod-oil',
    tenantId: demoTenant.id,
    storeId: 'store-vedado',
    categoryId: 'cat-food',
    sku: 'ALM-002',
    name: 'Aceite vegetal',
    description: 'Botella familiar, disponible para entrega hoy.',
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=900&q=80',
    price: 1180,
    compareAtPrice: 1320,
    stock: 34,
    unit: '1 L',
    status: 'active',
    tags: ['oferta']
  },
  {
    id: 'prod-detergent',
    tenantId: demoTenant.id,
    storeId: 'store-playa',
    categoryId: 'cat-cleaning',
    sku: 'ASE-014',
    name: 'Detergente liquido',
    description: 'Formula concentrada para lavado diario.',
    imageUrl: 'https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?auto=format&fit=crop&w=900&q=80',
    price: 890,
    stock: 12,
    unit: '900 ml',
    status: 'active',
    tags: ['bajo stock']
  },
  {
    id: 'prod-fan',
    tenantId: demoTenant.id,
    storeId: 'store-playa',
    categoryId: 'cat-home',
    sku: 'HOG-201',
    name: 'Ventilador de mesa',
    description: 'Tres velocidades, ideal para casa u oficina.',
    imageUrl: 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?auto=format&fit=crop&w=900&q=80',
    price: 6450,
    stock: 7,
    unit: 'unidad',
    status: 'active',
    tags: ['nuevo']
  }
];

export const demoDeliveryZones: DeliveryZone[] = [
  { id: 'zone-plaza', tenantId: demoTenant.id, name: 'Centro Habana - Plaza', fee: 350, etaMinutes: 45, municipalities: ['Centro Habana', 'Plaza'] },
  { id: 'zone-playa', tenantId: demoTenant.id, name: 'Playa - Marianao', fee: 450, etaMinutes: 60, municipalities: ['Playa', 'Marianao'] }
];

export const demoPromotions: Promotion[] = [
  {
    id: 'promo-free-delivery',
    tenantId: demoTenant.id,
    title: 'Delivery gratis en compras grandes',
    description: 'Aplica automaticamente para pedidos superiores a 10 000 CUP en zonas seleccionadas.',
    type: 'free_delivery',
    code: 'ENVIOCARIBE',
    value: 100,
    startsAt: '2026-06-01T00:00:00-04:00',
    endsAt: '2026-07-15T23:59:00-04:00',
    active: true,
    targetCategoryIds: [],
    minimumOrderTotal: 10000
  },
  {
    id: 'promo-cleaning',
    tenantId: demoTenant.id,
    title: 'Aseo semanal',
    description: '10% de descuento en productos de limpieza marcados como promocion.',
    type: 'percent',
    code: 'ASEO10',
    value: 10,
    startsAt: '2026-06-20T00:00:00-04:00',
    endsAt: '2026-06-30T23:59:00-04:00',
    active: true,
    targetCategoryIds: ['cat-cleaning']
  }
];

export const demoOrders: Order[] = [
  {
    id: 'ord-1001',
    tenantId: demoTenant.id,
    storeId: 'store-vedado',
    code: 'MC-1001',
    customerName: 'Laura Perez',
    customerPhone: '+53 5 555 0102',
    deliveryAddress: 'Calle 23, Vedado',
    deliveryZone: 'Centro Habana - Plaza',
    deliveryWindow: 'Hoy 12:00 - 14:00',
    status: 'picking',
    paymentMethod: 'cash',
    subtotal: 1900,
    deliveryFee: 350,
    discount: 0,
    total: 2250,
    notes: '',
    placedAt: '2026-06-25T09:30:00-04:00',
    assignedCourierId: 'courier-ana',
    proofType: 'otp',
    lines: [
      { productId: 'prod-rice', name: 'Arroz selecto', quantity: 1, unitPrice: 720, imageUrl: '' },
      { productId: 'prod-oil', name: 'Aceite vegetal', quantity: 1, unitPrice: 1180, imageUrl: '' }
    ]
  },
  {
    id: 'ord-1002',
    tenantId: demoTenant.id,
    storeId: 'store-playa',
    code: 'MC-1002',
    customerName: 'Rafael Gomez',
    customerPhone: '+53 5 555 0120',
    deliveryAddress: '31 y 42, Playa',
    deliveryZone: 'Playa - Marianao',
    deliveryWindow: 'Hoy 14:00 - 16:00',
    status: 'confirmed',
    paymentMethod: 'transfer',
    subtotal: 7340,
    deliveryFee: 450,
    discount: 0,
    total: 7790,
    notes: '',
    placedAt: '2026-06-25T10:15:00-04:00',
    proofType: 'photo',
    lines: [
      { productId: 'prod-detergent', name: 'Detergente liquido', quantity: 1, unitPrice: 890, imageUrl: '' },
      { productId: 'prod-fan', name: 'Ventilador de mesa', quantity: 1, unitPrice: 6450, imageUrl: '' }
    ]
  }
];

export const demoSummary: CommerceSummary = {
  todayRevenue: 36450,
  openOrders: 12,
  activeProducts: 428,
  lowStockProducts: 18,
  deliverySlaMinutes: 52,
  repeatCustomerRate: 38,
  averageOrderValue: 3040
};

export const demoCouriers: Courier[] = [
  {
    id: 'courier-ana',
    tenantId: demoTenant.id,
    fullName: 'Ana Torres',
    phone: '+53 5 555 0220',
    active: true,
    currentZone: 'Centro Habana - Plaza',
    openOrders: 4
  },
  {
    id: 'courier-luis',
    tenantId: demoTenant.id,
    fullName: 'Luis Herrera',
    phone: '+53 5 555 0330',
    active: true,
    currentZone: 'Playa - Marianao',
    openOrders: 3
  }
];

export const demoRoutes: DeliveryRoute[] = [
  {
    id: 'route-plaza-1',
    tenantId: demoTenant.id,
    courierId: 'courier-ana',
    zoneName: 'Centro Habana - Plaza',
    startedAt: '2026-06-25T11:40:00-04:00',
    stops: [
      {
        orderId: 'ord-1001',
        code: 'MC-1001',
        address: 'Calle 23, Vedado',
        customerName: 'Laura Perez',
        status: 'on_route',
        etaMinutes: 22
      },
      {
        orderId: 'ord-1003',
        code: 'MC-1003',
        address: 'Infanta y San Lazaro',
        customerName: 'Marta Leon',
        status: 'confirmed',
        etaMinutes: 44
      }
    ]
  }
];

export const demoLoyaltyTiers: LoyaltyTier[] = [
  {
    id: 'tier-bronce',
    tenantId: demoTenant.id,
    name: 'Bronce',
    minimumSpend: 0,
    pointsMultiplier: 1,
    perks: ['Puntos por compra', 'Cupones mensuales']
  },
  {
    id: 'tier-oro',
    tenantId: demoTenant.id,
    name: 'Oro',
    minimumSpend: 50000,
    pointsMultiplier: 1.5,
    perks: ['Prioridad en delivery', 'Ofertas privadas', 'Soporte preferente']
  }
];

export const demoSegments: CustomerSegment[] = [
  {
    id: 'segment-frequent',
    tenantId: demoTenant.id,
    name: 'Clientes frecuentes',
    customerCount: 284,
    criteria: '3 o mas pedidos en los ultimos 45 dias'
  },
  {
    id: 'segment-dormant',
    tenantId: demoTenant.id,
    name: 'Por reactivar',
    customerCount: 91,
    criteria: 'Sin compra en mas de 60 dias'
  }
];
