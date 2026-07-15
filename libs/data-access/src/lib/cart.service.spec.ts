import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { CartService } from './cart.service';
import { Product } from '@stores/domain';
import { SupabaseClientService } from './supabase.client';
import { AuthService } from './auth.service';

const mockProduct: Product = {
  id: 'p1',
  tenantId: 't1',
  storeId: 's1',
  categoryId: 'c1',
  name: 'Test Product',
  sku: 'TP001',
  description: 'A test product',
  price: 10,
  stock: 5,
  unit: 'unidad',
  imageUrl: '',
  status: 'active',
  tags: []
};

const mockSupabaseClientService = {
  configured: false,
  client: { from: () => ({}) }
} as unknown as SupabaseClientService;

const mockAuthService = {
  user: signal(null).asReadonly()
} as unknown as AuthService;

describe('CartService', () => {
  let service: CartService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        CartService,
        { provide: SupabaseClientService, useValue: mockSupabaseClientService },
        { provide: AuthService, useValue: mockAuthService }
      ]
    });
    service = TestBed.inject(CartService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should start empty', () => {
    expect(service.isEmpty()).toBe(true);
    expect(service.count()).toBe(0);
    expect(service.subtotal()).toBe(0);
  });

  it('should add items and update count/subtotal', () => {
    service.add(mockProduct, 2);
    expect(service.count()).toBe(2);
    expect(service.subtotal()).toBe(20);
    expect(service.isEmpty()).toBe(false);
  });

  it('should update quantity for existing product', () => {
    service.add(mockProduct, 1);
    service.add(mockProduct, 3);
    expect(service.count()).toBe(4);
  });

  it('should remove items', () => {
    service.add(mockProduct, 2);
    service.remove(mockProduct.id);
    expect(service.isEmpty()).toBe(true);
  });

  it('should update quantity', () => {
    service.add(mockProduct, 1);
    service.updateQuantity(mockProduct.id, 5);
    expect(service.count()).toBe(5);
  });

  it('should remove item when quantity is set to 0 or less', () => {
    service.add(mockProduct, 3);
    service.updateQuantity(mockProduct.id, 0);
    expect(service.isEmpty()).toBe(true);
  });

  it('should clear the cart', () => {
    service.add(mockProduct, 2);
    service.clear();
    expect(service.isEmpty()).toBe(true);
  });

  it('should ignore non-positive quantities in add', () => {
    service.add(mockProduct, 0);
    expect(service.isEmpty()).toBe(true);
    service.add(mockProduct, -1);
    expect(service.isEmpty()).toBe(true);
  });

  it('should not persist when updating quantity of unknown product', () => {
    service.add(mockProduct, 1);
    const before = localStorage.getItem('stores_cart_v1');
    service.updateQuantity('unknown', 3);
    expect(service.count()).toBe(1);
    expect(localStorage.getItem('stores_cart_v1')).toEqual(before);
  });

  it('should persist cart to localStorage', () => {
    service.add(mockProduct, 2);
    const raw = localStorage.getItem('stores_cart_v1');
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!)).toHaveLength(1);
  });

  it('should restore cart from localStorage', () => {
    localStorage.setItem('stores_cart_v1', JSON.stringify([{ product: mockProduct, quantity: 3 }]));
    const newService = TestBed.runInInjectionContext(() => new CartService());
    expect(newService.count()).toBe(3);
  });

  it('should calculate delivery fee', () => {
    expect(service.getDeliveryFee(350)).toBe(350);
  });

  it('should calculate total with delivery fee and discount', () => {
    service.add(mockProduct, 2); // subtotal = 20
    expect(service.calculateTotal(350, 5)).toBe(365); // 20 + 350 - 5
    expect(service.calculateTotal(350, 500)).toBe(0); // clamped to 0
  });
});
