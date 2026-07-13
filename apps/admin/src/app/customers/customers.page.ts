import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CatalogFacade } from '@stores/data-access';
import { AdminShellComponent, PageHeaderComponent } from '@stores/shared/shell';
import { Promotion } from '@stores/domain';

@Component({
  selector: 'admin-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminShellComponent, PageHeaderComponent],
  template: `
    <stores-admin-shell [tenant]="facade.tenant()">
      <stores-page-header section="Clientes" title="Promociones y lealtad" [hasActions]="true">
        <div actions>
          <button type="button" class="primary" (click)="showForm.set(!showForm())">
            {{ showForm() ? 'Cancelar' : 'Nueva promocion' }}
          </button>
        </div>
      </stores-page-header>

        <section class="panel" *ngIf="showForm()">
          <h3>{{ editingId() ? 'Editar promocion' : 'Nueva promocion' }}</h3>
          <div class="form-grid">
            <div class="field">
              <label>Codigo</label>
              <input [(ngModel)]="form.code" placeholder="Ej: DESCUENTO10" />
            </div>
            <div class="field">
              <label>Titulo</label>
              <input [(ngModel)]="form.title" placeholder="Nombre de la promocion" />
            </div>
            <div class="field full">
              <label>Descripcion</label>
              <input [(ngModel)]="form.description" placeholder="Descripcion corta" />
            </div>
            <div class="field">
              <label>Tipo</label>
              <select [(ngModel)]="form.type">
                <option value="percent">Porcentaje</option>
                <option value="fixed">Monto fijo</option>
                <option value="free_delivery">Envio gratis</option>
              </select>
            </div>
            <div class="field">
              <label>Valor</label>
              <input type="number" [(ngModel)]="form.value" min="0" />
            </div>
            <div class="field">
              <label>Inicio</label>
              <input type="date" [(ngModel)]="form.startsAt" />
            </div>
            <div class="field">
              <label>Fin</label>
              <input type="date" [(ngModel)]="form.endsAt" />
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="primary" (click)="savePromo()">
              {{ editingId() ? 'Actualizar' : 'Crear' }}
            </button>
          </div>
        </section>

        <section class="panel">
          <table>
            <thead>
              <tr>
                <th>Codigo</th>
                <th>Titulo</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Vigencia</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let promo of facade.promotions()">
                <td><code>{{ promo.code }}</code></td>
                <td><strong>{{ promo.title }}</strong></td>
                <td>{{ promo.type }}</td>
                <td>{{ promo.value }}</td>
                <td>
                  <small>{{ promo.startsAt | date:'dd/MM/yy' }} - {{ promo.endsAt | date:'dd/MM/yy' }}</small>
                </td>
                <td>
                  <span class="badge" [class.active]="promo.active">
                    {{ promo.active ? 'Activa' : 'Inactiva' }}
                  </span>
                </td>
                <td>
                  <div class="row-actions">
                    <button (click)="editPromo(promo)">Editar</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="empty" *ngIf="facade.promotions().length === 0">No hay promociones.</div>
        </section>

        <section class="panel">
          <div class="panel__header">
            <div>
              <p>Fidelizacion</p>
              <h2>Programa de lealtad</h2>
            </div>
          </div>
          <div class="loyalty-list">
            <div class="loyalty-card" *ngFor="let tier of facade.loyaltyTiers()">
              <strong>{{ tier.name }}</strong>
              <span>Gasto minimo: {{ tier.minimumSpend }}</span>
              <small>{{ tier.perks.join(' · ') }}</small>
            </div>
          </div>
        </section>

        <section class="panel">
          <div class="panel__header">
            <div>
              <p>Segmentacion</p>
              <h2>Segmentos de clientes</h2>
            </div>
          </div>
          <div class="segment-list">
            <div class="segment-card" *ngFor="let segment of facade.segments()">
              <strong>{{ segment.name }}</strong>
              <span>{{ segment.customerCount }} clientes</span>
              <small>{{ segment.criteria }}</small>
            </div>
          </div>
        </section>
    </stores-admin-shell>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; color: #111827; background: #f3f4f6; }
    button { min-height: 40px; padding: 0 14px; border: 1px solid #d1d5db; border-radius: 8px; background: white; color: #111827; font-weight: 800; cursor: pointer; }
    button.primary { border-color: #0f766e; background: #0f766e; color: white; }
    .panel { padding: 18px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; box-shadow: 0 16px 45px rgba(17, 24, 39, 0.05); }
    .panel__header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 14px; }
    .panel__header p { margin: 0 0 6px; font-size: 0.78rem; font-weight: 800; text-transform: uppercase; color: #6b7280; }
    .panel__header h2 { margin: 0; }
    h3 { margin: 0 0 14px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .field.full { grid-column: 1 / -1; }
    label { display: block; margin-bottom: 4px; font-size: 0.78rem; font-weight: 600; color: #374151; }
    input, select { width: 100%; padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.9rem; }
    .form-actions { margin-top: 14px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px 10px; border-bottom: 1px solid #e5e7eb; text-align: left; vertical-align: middle; }
    th { color: #6b7280; font-size: 0.76rem; text-transform: uppercase; }
    code { padding: 2px 6px; border-radius: 4px; background: #f3f4f6; font-size: 0.84rem; }
    .badge { display: inline-flex; padding: 4px 8px; border-radius: 6px; font-size: 0.78rem; font-weight: 700; background: #f3f4f6; color: #6b7280; }
    .badge.active { background: #ecfdf5; color: #0f766e; }
    .row-actions { display: flex; gap: 8px; }
    .row-actions button { min-height: auto; padding: 6px 10px; font-size: 0.78rem; }
    .loyalty-list, .segment-list { display: grid; gap: 12px; }
    .loyalty-card, .segment-card { padding: 14px; border-radius: 8px; background: #f9fafb; }
    .loyalty-card strong, .segment-card strong { display: block; }
    .loyalty-card span, .segment-card span { display: block; margin: 4px 0; font-size: 0.84rem; color: #0f766e; font-weight: 700; }
    .loyalty-card small, .segment-card small { color: #6b7280; }
    .empty { padding: 32px; text-align: center; color: #6b7280; }
    a { text-decoration: none; color: inherit; }
    @media (max-width: 980px) { .form-grid { grid-template-columns: 1fr; } }
  `]
})
export class CustomersPage {
  readonly facade = inject(CatalogFacade);

  showForm = signal(false);
  editingId = signal('');
  form = {
    code: '',
    title: '',
    description: '',
    type: 'percent' as Promotion['type'],
    value: 0,
    startsAt: '',
    endsAt: ''
  };

  editPromo(promo: Promotion): void {
    this.editingId.set(promo.id);
    this.form = {
      code: promo.code || '',
      title: promo.title,
      description: promo.description,
      type: promo.type,
      value: promo.value,
      startsAt: promo.startsAt.split('T')[0],
      endsAt: promo.endsAt.split('T')[0]
    };
    this.showForm.set(true);
  }

  savePromo(): void {
    this.showForm.set(false);
    this.editingId.set('');
    this.form = { code: '', title: '', description: '', type: 'percent', value: 0, startsAt: '', endsAt: '' };
  }
}
