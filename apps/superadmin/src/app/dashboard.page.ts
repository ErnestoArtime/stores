import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@stores/data-access';
import { SuperadminService } from '@stores/features/superadmin';

@Component({
  selector: 'superadmin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
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
          <a routerLink="/" class="active">Dashboard</a>
          <a routerLink="/tenants">Tenants</a>
        </nav>
        <button type="button" (click)="auth.signOut()">Cerrar sesion</button>
      </aside>

      <main>
        <header class="topbar">
          <div>
            <p>Plataforma</p>
            <h1>Dashboard</h1>
          </div>
        </header>

        <section class="metrics">
          <article>
            <span>Tenants</span>
            <strong>{{ service.tenants().length }}</strong>
          </article>
          <article>
            <span>Plan Starter</span>
            <strong>{{ countByPlan('starter') }}</strong>
          </article>
          <article>
            <span>Plan Growth</span>
            <strong>{{ countByPlan('growth') }}</strong>
          </article>
          <article>
            <span>Plan Enterprise</span>
            <strong>{{ countByPlan('enterprise') }}</strong>
          </article>
        </section>

        <section class="panel">
          <div class="panel__header">
            <div>
              <p>Gestion</p>
              <h2>Acciones rapidas</h2>
            </div>
          </div>
          <div class="actions">
            <a routerLink="/tenants" class="btn primary">Ver tenants</a>
          </div>
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
    nav { display: grid; gap: 8px; margin-bottom: 24px; }
    nav a { padding: 11px 12px; border-radius: 8px; text-decoration: none; }
    nav a.active { color: white; background: rgba(255, 255, 255, 0.12); }
    button { width: 100%; min-height: 40px; border: 1px solid #374151; border-radius: 8px; background: transparent; color: white; cursor: pointer; }
    main { display: grid; gap: 22px; padding: 24px; }
    .topbar p { margin: 0 0 6px; font-size: 0.78rem; font-weight: 800; text-transform: uppercase; color: #6b7280; }
    .topbar h1 { margin: 0; font-size: clamp(1.7rem, 3vw, 2.45rem); }
    .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    .metrics article { padding: 18px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; }
    .metrics span { color: #6b7280; font-size: 0.84rem; }
    .metrics strong { font-size: 1.6rem; }
    .panel { padding: 18px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; }
    .panel__header { margin-bottom: 14px; }
    .panel__header p { margin: 0 0 6px; font-size: 0.78rem; font-weight: 800; text-transform: uppercase; color: #6b7280; }
    .panel__header h2 { margin: 0; }
    .actions { display: flex; gap: 10px; }
    .btn { display: inline-flex; align-items: center; min-height: 40px; padding: 0 14px; border: 1px solid #d1d5db; border-radius: 8px; background: white; color: #111827; font-weight: 800; text-decoration: none; }
    .btn.primary { border-color: #0f766e; background: #0f766e; color: white; }
    @media (max-width: 980px) { .layout { grid-template-columns: 1fr; } .sidebar { position: static; height: auto; } .metrics { grid-template-columns: 1fr 1fr; } }
  `]
})
export class DashboardPage implements OnInit {
  readonly auth = inject(AuthService);
  readonly service = inject(SuperadminService);

  ngOnInit(): void {
    this.service.loadTenants();
  }

  countByPlan(plan: string): number {
    return this.service.tenants().filter((t) => t.plan === plan).length;
  }
}
