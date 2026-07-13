import { Injectable, inject } from '@angular/core';
import { TenantService, StoreService } from '@stores/features/tenant';
import { CatalogService, InventoryService, ImportService } from '@stores/features/catalog';
import { OrderService } from '@stores/features/orders';
import { DispatchService } from '@stores/features/dispatch';
import { MarketingService } from '@stores/features/marketing';
import { Product } from '@stores/domain';

@Injectable({ providedIn: 'root' })
export class CatalogFacade {
  private readonly tenantService = inject(TenantService);
  private readonly storeService = inject(StoreService);
  private readonly catalogService = inject(CatalogService);
  private readonly inventoryService = inject(InventoryService);
  private readonly importService = inject(ImportService);
  private readonly orderService = inject(OrderService);
  private readonly dispatchService = inject(DispatchService);
  private readonly marketingService = inject(MarketingService);

  readonly tenant = this.tenantService.tenant;
  readonly stores = this.storeService.stores;
  readonly categories = this.catalogService.categories;
  readonly products = this.catalogService.products;
  readonly orders = this.orderService.orders;
  readonly summary = this.orderService.summary;
  readonly deliveryZones = this.dispatchService.deliveryZones;
  readonly promotions = this.marketingService.promotions;
  readonly couriers = this.dispatchService.couriers;
  readonly routes = this.dispatchService.routes;
  readonly loyaltyTiers = this.marketingService.loyaltyTiers;
  readonly segments = this.marketingService.segments;

  async loadTenantBySlug(slug?: string): Promise<void> {
    return this.tenantService.loadTenantBySlug(slug);
  }

  async loadStores(): Promise<void> {
    return this.storeService.loadStores();
  }

  async loadCategories(): Promise<void> {
    return this.catalogService.loadCategories();
  }

  async loadProducts(): Promise<void> {
    return this.catalogService.loadProducts();
  }

  async loadPromotions(): Promise<void> {
    return this.marketingService.loadPromotions();
  }

  async loadDeliveryZones(): Promise<void> {
    return this.dispatchService.loadDeliveryZones();
  }

  async loadOrdersForAdmin(): Promise<void> {
    return this.orderService.loadOrdersForAdmin();
  }

  async loadAllForTenant(): Promise<void> {
    await this.loadTenantBySlug();
    await Promise.all([
      this.loadStores(),
      this.loadCategories(),
      this.loadProducts(),
      this.loadPromotions(),
      this.loadDeliveryZones()
    ]);
  }

  async createProduct(product: Omit<Product, 'id'>): Promise<Product | null> {
    return this.inventoryService.createProduct(product);
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    return this.inventoryService.updateProduct(id, updates);
  }

  async updateStock(id: string, newStock: number): Promise<boolean> {
    return this.inventoryService.updateStock(id, newStock);
  }

  async archiveProduct(id: string): Promise<boolean> {
    return this.inventoryService.archiveProduct(id);
  }

  previewProductCsv(csv: string) {
    return this.importService.previewProductCsv(csv);
  }

  buildWhatsappOrderUrl(orderId: string) {
    return this.orderService.buildWhatsappOrderUrl(orderId);
  }
}
