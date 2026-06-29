import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import { CatalogFacade } from '@stores/data-access';
import { Order, OrderStatus } from '@stores/domain';
import { ORDER_STATUS_LABELS, MoneyPipe } from '@stores/ui';

@Component({
  selector: 'stores-tracking',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonBackButton,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
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
        <ion-title>Sigue tu pedido</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="tracking-container" *ngIf="order()">
        <div class="order-header">
          <h2>Pedido {{ order()!.code }}</h2>
          <span class="status-badge" [class]="order()!.status">{{ labels[order()!.status] }}</span>
        </div>

        <div class="timeline">
          <div class="timeline-step" *ngFor="let step of steps" [class.active]="isStepActive(step.status)" [class.current]="order()!.status === step.status">
            <div class="step-marker">
              <span></span>
            </div>
            <div class="step-content">
              <strong>{{ step.label }}</strong>
              <small *ngIf="order()!.status === step.status">Estado actual</small>
            </div>
          </div>
        </div>

        <div class="order-details">
          <div class="detail-row">
            <span>Direccion</span>
            <strong>{{ order()!.deliveryAddress }}</strong>
          </div>
          <div class="detail-row">
            <span>Ventana de entrega</span>
            <strong>{{ order()!.deliveryWindow || 'No especificada' }}</strong>
          </div>
          <div class="detail-row">
            <span>Metodo de pago</span>
            <strong>{{ order()!.paymentMethod }}</strong>
          </div>
          <div class="detail-row total">
            <span>Total</span>
            <strong>{{ order()!.total | storeMoney: facade.tenant().currency }}</strong>
          </div>
        </div>
      </div>

      <div class="not-found" *ngIf="!order() && !loading()">
        <h2>Pedido no encontrado</h2>
        <p>No se encontro un pedido con el codigo {{ code }}.</p>
        <ion-button routerLink="/">Volver al inicio</ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    .tracking-container { max-width: 500px; margin: 0 auto; }
    .order-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
    .order-header h2 { margin: 0; }
    .status-badge { display: inline-flex; padding: 6px 12px; border-radius: 8px; font-size: 0.84rem; font-weight: 700; }
    .status-badge.placed { background: #fffbeb; color: #b45309; }
    .status-badge.confirmed { background: #eff6ff; color: #1d4ed8; }
    .status-badge.picking { background: #f0fdf4; color: #15803d; }
    .status-badge.on_route { background: #faf5ff; color: #7c3aed; }
    .status-badge.delivered { background: #ecfdf5; color: #0f766e; }
    .status-badge.cancelled { background: #fef2f2; color: #b91c1c; }
    .timeline { margin-bottom: 28px; }
    .timeline-step { display: flex; gap: 16px; padding: 12px 0; }
    .step-marker { display: flex; flex-direction: column; align-items: center; }
    .step-marker span { display: block; width: 14px; height: 14px; border-radius: 50%; background: #e5e7eb; }
    .timeline-step.active .step-marker span { background: #0f766e; }
    .timeline-step.current .step-marker span { background: #0f766e; box-shadow: 0 0 0 4px rgba(15, 118, 110, 0.2); }
    .step-content { flex: 1; }
    .step-content strong { display: block; }
    .step-content small { color: #6b7280; }
    .order-details { padding: 18px; border-radius: 8px; background: #f9fafb; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-row:last-child { border-bottom: none; }
    .detail-row span { color: #6b7280; }
    .detail-row.total { font-size: 1.1rem; margin-top: 4px; padding-top: 12px; border-top: 1px solid #d1d5db; border-bottom: none; }
    .not-found { text-align: center; padding: 48px 0; }
    .not-found h2 { color: #6b7280; }
  `]
})
export class TrackingPage implements OnInit {
  readonly facade = inject(CatalogFacade);
  private readonly route = inject(ActivatedRoute);

  readonly labels = ORDER_STATUS_LABELS;
  readonly order = signal<Order | null>(null);
  readonly loading = signal(true);
  code = '';

  readonly steps: { status: OrderStatus; label: string }[] = [
    { status: 'placed', label: 'Pedido recibido' },
    { status: 'confirmed', label: 'Confirmado' },
    { status: 'picking', label: 'Preparando' },
    { status: 'on_route', label: 'En ruta' },
    { status: 'delivered', label: 'Entregado' }
  ];

  ngOnInit(): void {
    this.code = this.route.snapshot.paramMap.get('code') || '';
    this.loading.set(false);
  }

  isStepActive(stepStatus: OrderStatus): boolean {
    const order = this.order();
    if (!order) return false;
    const orderIndex = this.steps.findIndex((s) => s.status === order.status);
    const stepIndex = this.steps.findIndex((s) => s.status === stepStatus);
    return stepIndex <= orderIndex;
  }
}
