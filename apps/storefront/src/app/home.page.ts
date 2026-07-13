import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonLabel,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import { CartService, CatalogFacade } from '@stores/data-access';
import { Product } from '@stores/domain';
import { MoneyPipe } from '@stores/ui';

@Component({
  selector: 'stores-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonBadge,
    IonButton,
    IonButtons,
    IonCard,
    IonChip,
    IonContent,
    IonHeader,
    IonIcon,
    IonLabel,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    IonSegment,
    IonSegmentButton,
    IonTitle,
    IonToolbar,
    MoneyPipe
  ],
  template: `
    <ion-header translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button fill="clear" aria-label="Abrir menu">
            <ion-icon name="menu-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>{{ facade.tenant().name }}</ion-title>
        <ion-buttons slot="end">
          <ion-button fill="solid" shape="round">
            <ion-icon name="bag-handle-outline" slot="start"></ion-icon>
            {{ cart.count() }}
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content fullscreen="true">
      <section class="hero" [style.background-image]="'linear-gradient(90deg, color-mix(in srgb, var(--tenant-primary) 88%, transparent), color-mix(in srgb, var(--tenant-primary) 42%, transparent)), url(' + facade.tenant().branding.heroImageUrl + ')'">
        <div class="hero__copy">
          <p>Entrega hoy en La Habana</p>
          <h1>Compra de mercado, hogar y tiendas locales con delivery.</h1>
          <div class="hero__actions">
            <ion-searchbar placeholder="Buscar productos, marcas o tiendas" show-clear-button="focus"></ion-searchbar>
            <ion-segment value="delivery">
              <ion-segment-button value="delivery">
                <ion-icon name="bicycle-outline"></ion-icon>
                Delivery
              </ion-segment-button>
              <ion-segment-button value="pickup">
                <ion-icon name="location-outline"></ion-icon>
                Recogida
              </ion-segment-button>
            </ion-segment>
          </div>
          <div class="hero__schedule">
            <ion-select label="Ventana de entrega" label-placement="stacked" value="today">
              <ion-select-option value="today">Hoy 12:00 - 14:00</ion-select-option>
              <ion-select-option value="evening">Hoy 18:00 - 20:00</ion-select-option>
              <ion-select-option value="tomorrow">Manana 09:00 - 12:00</ion-select-option>
            </ion-select>
            <a [href]="supportUrl()" target="_blank" rel="noreferrer">Soporte WhatsApp</a>
          </div>
        </div>
      </section>

      <main class="shell">
        <section class="category-strip" aria-label="Categorias">
          <ion-chip *ngFor="let category of facade.categories()">
            <ion-icon [name]="category.icon"></ion-icon>
            <ion-label>{{ category.name }}</ion-label>
          </ion-chip>
        </section>

        <section class="value-grid" aria-label="Beneficios">
          <article *ngFor="let promo of facade.promotions()">
            <span>{{ promo.code }}</span>
            <h3>{{ promo.title }}</h3>
            <p>{{ promo.description }}</p>
          </article>
          <article>
            <span>{{ facade.loyaltyTiers()[1].name }}</span>
            <h3>Programa de puntos</h3>
            <p>{{ facade.loyaltyTiers()[1].perks.join(' · ') }}</p>
          </article>
        </section>

        <section class="section-heading">
          <div>
            <p>Tiendas disponibles</p>
            <h2>Sucursales listas para despacho</h2>
          </div>
          <ion-button fill="clear">
            Ver mapa
            <ion-icon name="chevron-forward-outline" slot="end"></ion-icon>
          </ion-button>
        </section>

        <section class="stores-grid">
          <ion-card class="store-card" *ngFor="let store of facade.stores()">
            <img [src]="store.coverUrl" [alt]="store.name" />
            <div class="store-card__body">
              <div>
                <h3>{{ store.name }}</h3>
                <p>{{ store.address }} · {{ store.municipality }}</p>
              </div>
              <ion-badge color="success" *ngIf="store.openNow">Abierta</ion-badge>
              <div class="store-card__meta">
                <span><ion-icon name="star"></ion-icon>{{ store.rating }}</span>
                <span><ion-icon name="time-outline"></ion-icon>{{ store.deliveryMinutes }} min</span>
              </div>
            </div>
          </ion-card>
        </section>

        <section class="section-heading">
          <div>
            <p>Catalogo destacado</p>
            <h2>Productos con inventario confirmado</h2>
          </div>
          <ion-button fill="clear">Todos</ion-button>
        </section>

        <section class="product-grid">
          <article class="product-card" *ngFor="let product of facade.products()">
            <img [src]="product.imageUrl" [alt]="product.name" />
            <div class="product-card__body">
              <span>{{ product.unit }}</span>
              <h3>{{ product.name }}</h3>
              <p>{{ product.description }}</p>
              <div class="product-card__footer">
                <strong>{{ product.price | storeMoney: facade.tenant().currency }}</strong>
                <ion-button size="small" (click)="add(product)">Agregar</ion-button>
              </div>
            </div>
          </article>
        </section>

        <section class="section-heading">
          <div>
            <p>Zonas y tarifas</p>
            <h2>Entrega configurada por municipio</h2>
          </div>
        </section>

        <section class="zones">
          <article *ngFor="let zone of facade.deliveryZones()">
            <strong>{{ zone.name }}</strong>
            <span>{{ zone.fee | storeMoney: facade.tenant().currency }}</span>
            <small>{{ zone.etaMinutes }} min · {{ zone.municipalities.join(', ') }}</small>
          </article>
        </section>

        <aside class="checkout">
          <div>
            <p>Pedido rapido</p>
            <strong>{{ cart.subtotal() | storeMoney: facade.tenant().currency }}</strong>
          </div>
          <ion-button expand="block" [disabled]="cart.isEmpty()" routerLink="/checkout">
            Reservar delivery ({{ cart.count() }})
          </ion-button>
        </aside>
      </main>
    </ion-content>
  `,
  styleUrl: './home.page.scss'
})
export class HomePage {
  readonly cart = inject(CartService);
  readonly facade = inject(CatalogFacade);

  add(product: Product) {
    this.cart.add(product);
  }

  supportUrl() {
    return this.facade.buildWhatsappOrderUrl('');
  }
}
