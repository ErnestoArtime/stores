import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CatalogFacade, AuthService } from '@stores/data-access';

@Component({
  selector: 'admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="layout">
      <aside class="sidebar">
        <div class="brand">
          <span>MC</span>
          <div>
            <strong>{{ facade.tenant().name }}</strong>
            <small>Operacion comercial</small>
          </div>
        </div>
        <nav>
          <a routerLink="/dashboard">Panel</a>
          <a routerLink="/catalog/products">Productos</a>
          <a routerLink="/catalog/categories">Categorias</a>
          <a routerLink="/stores">Sucursales</a>
          <a routerLink="/inventory">Inventario</a>
          <a routerLink="/dispatch">Delivery</a>
          <a routerLink="/customers">Clientes</a>
          <a routerLink="/settings" class="active">Configuracion</a>
        </nav>
      </aside>

      <main>
        <header class="topbar">
          <div>
            <p>Configuracion</p>
            <h1>Multi-tenant y branding</h1>
          </div>
          <div class="actions">
            <button type="button" (click)="auth.signOut()">Cerrar sesion</button>
          </div>
        </header>

        <section class="panels-grid">
          <article class="panel">
            <div class="panel__header">
              <div>
                <p>Tenant</p>
                <h2>Informacion del negocio</h2>
              </div>
            </div>
            <div class="field">
              <label>Nombre comercial</label>
              <input [value]="facade.tenant().name" readonly />
            </div>
            <div class="field">
              <label>Razon legal</label>
              <input [value]="facade.tenant().legalName" readonly />
            </div>
            <div class="field">
              <label>Slug</label>
              <input [value]="facade.tenant().slug" readonly />
            </div>
            <div class="field">
              <label>Plan</label>
              <input [value]="facade.tenant().plan" readonly />
            </div>
            <div class="field">
              <label>Moneda</label>
              <input [value]="facade.tenant().currency" readonly />
            </div>
          </article>

          <article class="panel">
            <div class="panel__header">
              <div>
                <p>Contacto</p>
                <h2>Soporte al cliente</h2>
              </div>
            </div>
            <div class="field">
              <label>Telefono de soporte</label>
              <input [value]="facade.tenant().supportPhone" readonly />
            </div>
            <div class="field">
              <label>WhatsApp de soporte</label>
              <input [value]="facade.tenant().supportWhatsapp" readonly />
            </div>
          </article>

          <article class="panel">
            <div class="panel__header">
              <div>
                <p>Branding</p>
                <h2>Apariencia del storefront</h2>
              </div>
            </div>
            <div class="branding-preview">
              <div class="color-row">
                <div class="color-swatch" [style.background]="facade.tenant().branding.primaryColor"></div>
                <span>Color primario: {{ facade.tenant().branding.primaryColor }}</span>
              </div>
              <div class="color-row">
                <div class="color-swatch" [style.background]="facade.tenant().branding.accentColor"></div>
                <span>Color acento: {{ facade.tenant().branding.accentColor }}</span>
              </div>
              <div class="field" *ngIf="facade.tenant().branding.heroImageUrl">
                <label>Imagen hero</label>
                <img [src]="facade.tenant().branding.heroImageUrl" class="hero-preview" />
              </div>
              <div class="field" *ngIf="facade.tenant().branding.logoUrl">
                <label>Logo</label>
                <img [src]="facade.tenant().branding.logoUrl" class="logo-preview" />
              </div>
            </div>
          </article>

          <article class="panel">
            <div class="panel__header">
              <div>
                <p>Sesion</p>
                <h2>Sesion de staff</h2>
              </div>
            </div>
            <div class="field" *ngIf="auth.profile()">
              <label>Nombre</label>
              <input [value]="auth.profile()!.fullName" readonly />
            </div>
            <div class="field" *ngIf="auth.profile()">
              <label>Email</label>
              <input [value]="auth.profile()!.email" readonly />
            </div>
            <div class="field" *ngIf="auth.profile()">
              <label>Rol</label>
              <input [value]="auth.profile()!.role" readonly />
            </div>
            <button type="button" class="danger" (click)="auth.signOut()">Cerrar sesion</button>
          </article>
        </section>

        <section class="panel info-panel">
          <h3>SaaS y Multi-tenant</h3>
          <ul>
            <li>Cada tenant tiene su propio catlogo, pedidos, y configuracion.</li>
            <li>Los datos se separan por <code>tenant_id</code> con RLS en Supabase.</li>
            <li>El branding (colores, logo, hero) se aplica dinamicamente en el storefront.</li>
            <li>Los roles de staff (owner, manager, catalog, dispatch, viewer) controlan el acceso.</li>
            <li>Un solo codigo sirve a multiples clientes con configuracion independiente.</li>
          </ul>
        </section>
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; color: #111827; background: #f3f4f6; }
    .layout { display: grid; grid-template-columns: 260px minmax(0, 1fr); min-height: 100vh; }
    .sidebar { position: sticky; top: 0; height: 100vh; padding: 22px; color: white; background: #111827; }
    .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; }
    .brand span { display: grid; width: 42px; height: 42px; place-items: center; border-radius: 8px; background: #f59e0b; color: #111827; font-weight: 900; }
    .brand strong, .brand small { display: block; }
    .brand small, nav a { color: #9ca3af; }
    nav { display: grid; gap: 8px; }
    nav a { padding: 11px 12px; border-radius: 8px; text-decoration: none; }
    nav a.active { color: white; background: rgba(255, 255, 255, 0.12); }
    main { display: grid; gap: 22px; padding: 24px; }
    .topbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .topbar p { margin: 0 0 6px; font-size: 0.78rem; font-weight: 800; text-transform: uppercase; color: #6b7280; }
    .topbar h1 { margin: 0; font-size: clamp(1.7rem, 3vw, 2.45rem); }
    .actions { display: flex; gap: 10px; }
    button { min-height: 40px; padding: 0 14px; border: 1px solid #d1d5db; border-radius: 8px; background: white; color: #111827; font-weight: 800; cursor: pointer; }
    button.danger { border-color: #fca5a5; color: #b91c1c; background: #fef2f2; }
    .panels-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .panel { padding: 18px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; box-shadow: 0 16px 45px rgba(17, 24, 39, 0.05); }
    .panel__header { margin-bottom: 14px; }
    .panel__header p { margin: 0 0 6px; font-size: 0.78rem; font-weight: 800; text-transform: uppercase; color: #6b7280; }
    .panel__header h2 { margin: 0; }
    .field { margin-bottom: 12px; }
    label { display: block; margin-bottom: 4px; font-size: 0.78rem; font-weight: 600; color: #374151; }
    input { width: 100%; padding: 8px 10px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 0.9rem; background: #f9fafb; }
    .branding-preview { display: grid; gap: 12px; }
    .color-row { display: flex; align-items: center; gap: 10px; }
    .color-swatch { width: 32px; height: 32px; border-radius: 6px; border: 1px solid #e5e7eb; }
    .hero-preview { width: 100%; max-height: 160px; object-fit: cover; border-radius: 8px; }
    .logo-preview { max-height: 60px; }
    .info-panel { grid-column: 1 / -1; }
    .info-panel h3 { margin: 0 0 10px; }
    .info-panel ul { padding-left: 20px; color: #374151; }
    .info-panel li { margin-bottom: 6px; }
    .info-panel code { padding: 2px 6px; border-radius: 4px; background: #f3f4f6; font-size: 0.84rem; }
    a { text-decoration: none; color: inherit; }
    @media (max-width: 980px) { .layout { grid-template-columns: 1fr; } .sidebar { position: static; height: auto; } .panels-grid { grid-template-columns: 1fr; } }
  `]
})
export class SettingsPage implements OnInit {
  readonly facade = inject(CatalogFacade);
  readonly auth = inject(AuthService);

  ngOnInit(): void {
    this.facade.loadTenantBySlug();
  }
}
