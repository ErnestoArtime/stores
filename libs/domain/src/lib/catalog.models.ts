export type StoreType = 'market' | 'hardware' | 'pharmacy' | 'fashion' | 'mixed';
export type ProductStatus = 'draft' | 'active' | 'archived';
export type FulfillmentType = 'delivery' | 'pickup' | 'scheduled';
export type PromotionType = 'percent' | 'fixed' | 'bundle' | 'free_delivery';

export interface StoreLocation {
  id: string;
  tenantId: string;
  name: string;
  type: StoreType;
  address: string;
  city: string;
  municipality: string;
  phone: string;
  openNow: boolean;
  deliveryMinutes: number;
  rating: number;
  coverUrl: string;
  fulfillment: FulfillmentType[];
}

export interface Category {
  id: string;
  tenantId: string;
  name: string;
  icon: string;
  featured: boolean;
}

export interface Product {
  id: string;
  tenantId: string;
  storeId: string;
  categoryId: string;
  sku: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  unit: string;
  status: ProductStatus;
  tags: string[];
}

export interface Promotion {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  type: PromotionType;
  code?: string;
  value: number;
  startsAt: string;
  endsAt: string;
  active: boolean;
  targetCategoryIds: string[];
  minimumOrderTotal?: number;
}

export interface DeliveryZone {
  id: string;
  tenantId: string;
  name: string;
  fee: number;
  etaMinutes: number;
  municipalities: string[];
}

export interface ProductImportIssue {
  row: number;
  field: string;
  message: string;
}

export interface ProductImportPreview {
  validRows: number;
  issues: ProductImportIssue[];
  products: Pick<Product, 'sku' | 'name' | 'price' | 'stock' | 'unit'>[];
}
