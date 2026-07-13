import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@stores/data-access';
import { SuperadminService, TenantRow } from '@stores/features/superadmin';

@Component({
  selector: 'superadmin-tenant-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="layout">
      <aside class="sidebar">
        <div class="brand">
          <span>S</span>
          <div>
            <strong>Stores</strong>
            <small>Superadmin</small>
          </div>
        </div>
        <nav>
          <a routerLink="/">Dashboard</a>
          <a routerLink="/tenants" class="active">Tenants</a>
        </nav>
        <button type="button" (click)="auth.signOut()">Cerrar sesion</button>
      </aside>

      <main>
        <header class="topbar">
          <div>
            <p>Tenant</p>
            <h1>{{ tenant()?.name || 'Detalle' }}</h1>
          </div>
        </header>

        <section class="panel" *ngIf="tenant(); else loadingTpl">
          <div class="field">
            <label>Plan</label>
            <select [(ngModel)]="form.plan">
              <option value="starter">Starter</option>
              <option value="growth">Growth</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          <div class="field">
            <label>Estado de billing</label>
            <select [(ngModel)]="form.status">
              <option value="active">Activo</option>
              <option value="past_due">Pago atrasado</option>
              <option value="cancelled">Cancelado</option>
              <option value="trialing">Prueba</option>
            </select>
          </div>

          <div class="field">
            <label>Maximo de productos</label>
            <input type="number" [(ngModel)]="form.maxProducts" />
          </div>

          <div class="field">
            <label>Maximo de sucursales</label>
            <input type="number" [(ngModel)]="form.maxStores" />
          </div>

          <div class="field">
            <label>Maximo de pedidos/mes</label>
            <input type="number" [(ngModel)]="form.maxOrdersPerMonth" />
          </div>

          <div class="field">
            <label>Maximo de staff</label>
            <input type="number" [(ngModel)]="form.maxStaff" />
          </div>

          <div class="features">
            <label>Features</label>
            <label><input type="checkbox" [(ngModel)]="form.features.delivery" /> Delivery</label>
            <label><input type="checkbox" [(ngModel)]="form.features.loyalty" /> Lealtad</label>
            <label><input type="checkbox" [(ngModel)]="form.features.promotions" /> Promociones</label>
            <label><input type="checkbox" [(ngModel)]="form.features.import" /> Importacion</label>
            <label><input type="checkbox" [(ngModel)]="form.features.dispatch" /> Despacho</label>
            <label><input type="checkbox" [(ngModel)]="form.features.analytics" /> Analytics</label>
          </div>

          <div class="error" *ngIf="error()">{{ error() }}</div>
          <div class="success" *ngIf="success()">Guardado correctamente.</div>
          <div class="actions">
            <button type="button" class="primary" (click)="save()" [disabled]="saving()">
              {{ saving() ? 'Guardando...' : 'Guardar cambios' }}
            </button>
            <button type="button" (click)="router.navigate(['/tenants'])">Cancelar</button>
          </div>
        </section>

        <ng-template #loadingTpl>
          <div class="panel loading" *ngIf="loading()">Cargando tenant...</div>
          <div class="panel error" *ngIf="!loading() && !tenant() && !error()">Tenant no encontrado.</div>
        </ng-template>
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
    nav { display: grid; gap: 8px; margin-bottom: 24px; }
    nav a { padding: 11px 12px; border-radius: 8px; text-decoration: none; }
    nav a.active { color: white; background: rgba(255, 255, 255, 0.12); }
    button { min-height: 40px; padding: 0 14px; border: 1px solid #d1d5db; border-radius: 8px; background: white; color: #111827; font-weight: 800; cursor: pointer; }
    button.primary { border-color: #0f766e; background: #0f766e; color: white; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
    main { display: grid; gap: 22px; padding: 24px; }
    .topbar p { margin: 0 0 6px; font-size: 0.78rem; font-weight: 800; text-transform: uppercase; color: #6b7280; }
    .topbar h1 { margin: 0; font-size: clamp(1.7rem, 3vw, 2.45rem); }
    .panel { max-width: 640px; padding: 18px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; }
    .field { margin-bottom: 16px; }
    label { display: block; margin-bottom: 6px; font-size: 0.84rem; font-weight: 600; color: #374151; }
    input, select { width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.95rem; }
    .features { display: grid; gap: 8px; margin-bottom: 16px; }
    .features label { display: flex; align-items: center; gap: 8px; font-weight: normal; }
    .features input { width: auto; }
    .actions { display: flex; gap: 10px; }
    .error { margin-bottom: 14px; padding: 10px; border-radius: 8px; background: #fef2f2; color: #b91c1c; font-size: 0.84rem; }
    .success { margin-bottom: 14px; padding: 10px; border-radius: 8px; background: #ecfdf5; color: #0f766e; font-size: 0.84rem; }
    @media (max-width: 980px) { .layout { grid-template-columns: 1fr; } .sidebar { position: static; height: auto; } }
  `]
})
export class TenantDetailPage implements OnInit {
  readonly auth = inject(AuthService);
  readonly service = inject(SuperadminService);
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly tenantId = signal('');
  readonly tenant = signal<TenantRow | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly success = signal(false);

  form = {
    plan: 'starter' as 'starter' | 'growth' | 'enterprise',
    status: 'active' as 'active' | 'past_due' | 'cancelled' | 'trialing',
    maxProducts: 0,
    maxStores: 0,
    maxOrdersPerMonth: 0,
    maxStaff: 0,
    features: {
      delivery: false,
      loyalty: false,
      promotions: false,
      import: false,
      dispatch: false,
      analytics: false
    }
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') || '';
    this.tenantId.set(id);
    this.service.loadTenants().then(() => {
      const found = this.service.tenants().find((t) => t.id === id);
      this.tenant.set(found || null);
      if (found) {
        this.form = {
          plan: found.plan,
          status: (found.billing?.status || 'active') as typeof this.form.status,
          maxProducts: found.limits.maxProducts,
          maxStores: found.limits.maxStores,
          maxOrdersPerMonth: found.limits.maxOrdersPerMonth,
          maxStaff: found.limits.maxStaff,
          features: { ...found.features }
        };
      }
      this.loading.set(false);
    });
  }

  async save(): Promise<void> {
    this.error.set('');
    this.success.set(false);
    this.saving.set(true);

    try {
      await this.service.updateTenant(this.tenantId(), {
        plan: this.form.plan,
        status: this.form.status,
        features: { ...this.form.features },
        limits: {
          maxProducts: this.form.maxProducts,
          maxStores: this.form.maxStores,
          maxOrdersPerMonth: this.form.maxOrdersPerMonth,
          maxStaff: this.form.maxStaff
        }
      });
      this.success.set(true);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Error al guardar.');
    } finally {
      this.saving.set(false);
    }
  }
}
