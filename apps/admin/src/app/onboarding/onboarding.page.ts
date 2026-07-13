import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@stores/data-access';
import { OnboardingService } from '@stores/features/tenant';

@Component({
  selector: 'admin-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="onboarding">
      <div class="card">
        <h1>Crea tu tienda</h1>
        <p>Configura tu negocio en minutos.</p>

        <div class="field">
          <label>Nombre comercial</label>
          <input [(ngModel)]="form.name" placeholder="Ej: Mercado Habana" />
        </div>

        <div class="field">
          <label>Razon legal</label>
          <input [(ngModel)]="form.legalName" placeholder="Ej: Mercado Habana SRL" />
        </div>

        <div class="field">
          <label>Slug (URL unica)</label>
          <input [(ngModel)]="form.slug" (blur)="form.slug = slugify(form.slug)" placeholder="mercado-habana" />
          <small>Tu tienda estara en /t/{{ form.slug }}</small>
        </div>

        <div class="field">
          <label>Plan</label>
          <div class="plans">
            <label *ngFor="let plan of plans" class="plan" [class.selected]="form.plan === plan.key">
              <input type="radio" [value]="plan.key" [(ngModel)]="form.plan" />
              <strong>{{ plan.label }}</strong>
              <span>{{ plan.description }}</span>
            </label>
          </div>
        </div>

        <div class="field">
          <label>Moneda</label>
          <select [(ngModel)]="form.currency">
            <option value="CUP">CUP</option>
            <option value="USD">USD</option>
            <option value="MLC">MLC</option>
          </select>
        </div>

        <div class="error" *ngIf="error()">{{ error() }}</div>

        <button type="button" class="primary" (click)="submit()" [disabled]="submitting()">
          {{ submitting() ? 'Creando...' : 'Crear tienda' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; background: #f3f4f6; }
    .onboarding { display: grid; place-items: center; min-height: 100vh; padding: 24px; }
    .card { width: 100%; max-width: 520px; padding: 32px; border-radius: 12px; background: white; box-shadow: 0 16px 45px rgba(17, 24, 39, 0.05); }
    h1 { margin: 0 0 8px; }
    p { margin: 0 0 24px; color: #6b7280; }
    .field { margin-bottom: 18px; }
    label { display: block; margin-bottom: 6px; font-size: 0.84rem; font-weight: 600; color: #374151; }
    input, select { width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.95rem; }
    small { display: block; margin-top: 4px; color: #6b7280; font-size: 0.78rem; }
    .plans { display: grid; gap: 10px; }
    .plan { display: grid; gap: 2px; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; cursor: pointer; }
    .plan.selected { border-color: #0f766e; background: #f0fdfa; }
    .plan input { display: none; }
    .plan strong { font-size: 1rem; }
    .plan span { font-size: 0.8rem; color: #6b7280; }
    .error { margin-bottom: 14px; padding: 10px; border-radius: 8px; background: #fef2f2; color: #b91c1c; font-size: 0.84rem; }
    button { width: 100%; min-height: 44px; border: none; border-radius: 8px; background: #0f766e; color: white; font-weight: 800; cursor: pointer; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
  `]
})
export class OnboardingPage {
  private readonly onboarding = inject(OnboardingService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly error = signal('');

  form = {
    name: '',
    legalName: '',
    slug: '',
    plan: 'starter' as 'starter' | 'growth' | 'enterprise',
    currency: 'CUP' as 'CUP' | 'USD' | 'MLC'
  };

  plans = [
    { key: 'starter', label: 'Starter', description: 'Hasta 100 productos, 1 sucursal y 500 pedidos/mes.' },
    { key: 'growth', label: 'Growth', description: 'Hasta 1,000 productos, 5 sucursales y 5,000 pedidos/mes.' },
    { key: 'enterprise', label: 'Enterprise', description: 'Todo ilimitado con analytics y soporte prioritario.' }
  ];

  slugify(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async submit(): Promise<void> {
    this.error.set('');
    this.form.slug = this.slugify(this.form.slug);

    if (!this.form.name.trim() || !this.form.legalName.trim() || !this.form.slug.trim()) {
      this.error.set('Completa todos los campos.');
      return;
    }

    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(this.form.slug)) {
      this.error.set('El slug solo puede contener letras, numeros y guiones (sin guiones al inicio, final o consecutivos).');
      return;
    }

    this.submitting.set(true);
    try {
      await this.onboarding.createTenant(this.form);
      await this.auth.loadProfile();
      this.router.navigate(['/dashboard']);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Error al crear la tienda.');
    } finally {
      this.submitting.set(false);
    }
  }
}
