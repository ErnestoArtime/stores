import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonSelect,
  IonSelectOption,
  IonText,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import { AuthService, CartService, CatalogFacade, SupabaseClientService } from '@stores/data-access';
import { MoneyPipe } from '@stores/ui';

@Component({
  selector: 'stores-checkout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonSelect,
    IonSelectOption,
    IonText,
    IonTitle,
    IonToolbar,
    MoneyPipe
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/"></ion-back-button>
        </ion-buttons>
        <ion-title>Checkout</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="checkout-container" *ngIf="!orderCreated()">
        <h2>Resumen del pedido</h2>

        <div class="cart-summary">
          <div class="cart-item" *ngFor="let item of cart.items()">
            <div class="item-info">
              <img [src]="item.product.imageUrl" [alt]="item.product.name" />
              <div>
                <strong>{{ item.product.name }}</strong>
                <small>{{ item.product.unit }}</small>
              </div>
            </div>
            <div class="item-qty">
              <ion-button fill="clear" size="small" (click)="decreaseQty(item.product.id)">-</ion-button>
              <span>{{ item.quantity }}</span>
              <ion-button fill="clear" size="small" (click)="increaseQty(item.product.id)">+</ion-button>
            </div>
            <strong>{{ item.product.price * item.quantity | storeMoney: facade.tenant().currency }}</strong>
          </div>
        </div>

        <form (ngSubmit)="placeOrder()">
          <ion-list>
            <ion-item>
              <ion-label position="stacked">Nombre completo</ion-label>
              <ion-input [(ngModel)]="customerName" name="name" required placeholder="Tu nombre"></ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Telefono</ion-label>
              <ion-input [(ngModel)]="customerPhone" name="phone" required placeholder="53 5555 1234"></ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Direccion de entrega</ion-label>
              <ion-input [(ngModel)]="deliveryAddress" name="address" required placeholder="Calle, numero, entre que calles"></ion-input>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Zona de entrega</ion-label>
              <ion-select [(ngModel)]="deliveryZone" name="zone" placeholder="Seleccionar zona">
                <ion-select-option *ngFor="let zone of facade.deliveryZones()" [value]="zone.id">
                  {{ zone.name }} — {{ zone.fee | storeMoney: facade.tenant().currency }} ({{ zone.etaMinutes }} min)
                </ion-select-option>
              </ion-select>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Ventana de entrega</ion-label>
              <ion-select [(ngModel)]="deliveryWindow" name="window" placeholder="Seleccionar ventana">
                <ion-select-option *ngFor="let window of facade.tenant().settings.deliveryWindowOptions" [value]="window">
                  {{ window }}
                </ion-select-option>
              </ion-select>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Metodo de pago</ion-label>
              <ion-select [(ngModel)]="paymentMethod" name="payment" placeholder="Seleccionar metodo">
                <ion-select-option *ngFor="let method of facade.tenant().settings.paymentMethods" [value]="method">
                  {{ method | titlecase }}
                </ion-select-option>
              </ion-select>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">Codigo de cupon (opcional)</ion-label>
              <ion-input [(ngModel)]="couponCode" name="coupon" placeholder="Ej: DESCUENTO10"></ion-input>
            </ion-item>
          </ion-list>

          <div class="order-summary">
            <div class="summary-row">
              <span>Subtotal</span>
              <strong>{{ cart.subtotal() | storeMoney: facade.tenant().currency }}</strong>
            </div>
            <div class="summary-row">
              <span>Envio</span>
              <strong>{{ selectedZoneFee() | storeMoney: facade.tenant().currency }}</strong>
            </div>
            <div class="summary-row" *ngIf="discount() > 0">
              <span>Descuento</span>
              <strong class="discount">-{{ discount() | storeMoney: facade.tenant().currency }}</strong>
            </div>
            <div class="summary-row total">
              <span>Total</span>
              <strong>{{ orderTotal() | storeMoney: facade.tenant().currency }}</strong>
            </div>
          </div>

          <ion-text color="danger" *ngIf="error()">
            <p class="error-text">{{ error() }}</p>
          </ion-text>

          <ion-button
            expand="block"
            type="submit"
            [disabled]="submitting() || !isFormValid()"
            class="ion-margin-top"
          >
            {{ submitting() ? 'Procesando...' : 'Confirmar pedido' }}
          </ion-button>
        </form>
      </div>

      <div class="success-container" *ngIf="orderCreated()">
        <div class="success-card">
          <h2>Pedido creado</h2>
          <p>Tu codigo de pedido es:</p>
          <strong class="order-code">{{ orderCode() }}</strong>
          <p>Serás contactado por WhatsApp para confirmar los detalles.</p>
          <ion-button expand="block" routerLink="/" class="ion-margin-top">
            Volver al inicio
          </ion-button>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .checkout-container { max-width: 600px; margin: 0 auto; }
    h2 { margin: 0 0 16px; }
    .cart-summary { margin-bottom: 24px; }
    .cart-item { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
    .item-info { display: flex; align-items: center; gap: 10px; flex: 1; }
    .item-info img { width: 48px; height: 48px; border-radius: 8px; object-fit: cover; }
    .item-info strong { display: block; }
    .item-info small { color: #6b7280; }
    .item-qty { display: flex; align-items: center; gap: 4px; }
    .item-qty span { min-width: 24px; text-align: center; font-weight: 700; }
    .order-summary { margin: 20px 0; padding: 16px; border-radius: 8px; background: #f9fafb; }
    .summary-row { display: flex; justify-content: space-between; padding: 6px 0; }
    .summary-row.total { border-top: 1px solid #d1d5db; margin-top: 8px; padding-top: 12px; font-size: 1.1rem; }
    .discount { color: #0f766e; }
    .error-text { padding: 8px 0; font-size: 0.84rem; }
    .success-container { display: grid; place-items: center; min-height: 60vh; }
    .success-card { text-align: center; max-width: 400px; }
    .success-card h2 { color: #0f766e; }
    .order-code { display: block; margin: 16px 0; font-size: 2rem; color: #0f766e; }
  `]
})
export class CheckoutPage {
  readonly cart = inject(CartService);
  readonly facade = inject(CatalogFacade);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseClientService);

  customerName = '';
  customerPhone = '';
  deliveryAddress = '';
  deliveryZone = '';
  deliveryWindow = '';
  paymentMethod = 'cash';
  couponCode = '';

  constructor() {
    const settings = this.facade.tenant().settings;
    const windows = settings.deliveryWindowOptions;
    const methods = settings.paymentMethods;
    if (windows.length > 0) {
      this.deliveryWindow = windows[0];
    }
    if (methods.length > 0) {
      this.paymentMethod = methods[0];
    }
  }

  readonly submitting = signal(false);
  readonly error = signal('');
  readonly orderCreated = signal(false);
  readonly orderCode = signal('');

  readonly selectedZoneFee = signal(0);
  readonly discount = signal(0);
  readonly orderTotal = signal(0);

  isFormValid(): boolean {
    return (
      this.customerName.trim().length > 0 &&
      this.customerPhone.trim().length > 0 &&
      this.deliveryAddress.trim().length > 0 &&
      this.deliveryZone.length > 0 &&
      this.deliveryWindow.length > 0 &&
      this.paymentMethod.length > 0 &&
      !this.cart.isEmpty()
    );
  }

  increaseQty(productId: string): void {
    const item = this.cart.items().find((i) => i.product.id === productId);
    if (item) {
      this.cart.updateQuantity(productId, item.quantity + 1);
    }
  }

  decreaseQty(productId: string): void {
    const item = this.cart.items().find((i) => i.product.id === productId);
    if (item && item.quantity > 1) {
      this.cart.updateQuantity(productId, item.quantity - 1);
    }
  }

  async placeOrder(): Promise<void> {
    if (!this.isFormValid()) return;

    this.error.set('');
    this.submitting.set(true);

    const zone = this.facade.deliveryZones().find((z) => z.id === this.deliveryZone);
    const zoneFee = zone?.fee || 0;

    const orderLines = this.cart.items().map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      quantity: item.quantity,
      unitPrice: item.product.price,
      imageUrl: item.product.imageUrl
    }));

    const orderPayload = {
      tenant_id: this.facade.tenant().id,
      store_id: '',
      customer_name: this.customerName,
      customer_phone: this.customerPhone,
      delivery_address: this.deliveryAddress,
      delivery_zone: this.deliveryZone,
      delivery_window: this.deliveryWindow,
      payment_method: this.paymentMethod,
      subtotal: this.cart.subtotal(),
      delivery_fee: zoneFee,
      discount: this.discount(),
      total: this.cart.calculateTotal(zoneFee, this.discount()),
      lines: orderLines,
      coupon_code: this.couponCode || null
    };

    if (!this.supabase.configured) {
      const code = `ORD-${Date.now().toString(36).toUpperCase()}`;
      this.orderCode.set(code);
      this.orderCreated.set(true);
      this.cart.clear();
      this.submitting.set(false);
      return;
    }

    try {
      const { data, error } = await this.supabase.client.functions.invoke('create-order', {
        body: orderPayload
      });

      if (error) {
        this.error.set(error.message || 'Error al crear el pedido');
        this.submitting.set(false);
        return;
      }

      this.orderCode.set(data?.code || 'N/A');
      this.orderCreated.set(true);
      this.cart.clear();
    } catch {
      this.error.set('Error de conexion. Intente de nuevo.');
    } finally {
      this.submitting.set(false);
    }
  }
}
