import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Tenant } from '@stores/domain';
import { NavItem } from './nav-item.model';

@Component({
  selector: 'stores-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <div class="brand">
        <span>{{ tenant?.name?.[0] || 'S' }}</span>
        <div>
          <strong>{{ tenant?.name || 'Stores' }}</strong>
          <small>Operacion comercial</small>
        </div>
      </div>
      <nav>
        <a
          *ngFor="let item of items"
          [routerLink]="item.path"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: item.path === '/dashboard' }"
        >
          {{ item.label }}
        </a>
      </nav>
    </aside>
  `,
  styles: [`
    .sidebar {
      position: sticky;
      top: 0;
      height: 100vh;
      padding: 22px;
      color: white;
      background: #111827;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 28px;
    }

    .brand span {
      display: grid;
      width: 42px;
      height: 42px;
      place-items: center;
      border-radius: 8px;
      background: #f59e0b;
      color: #111827;
      font-weight: 900;
    }

    .brand strong,
    .brand small {
      display: block;
    }

    .brand small,
    nav a {
      color: #9ca3af;
    }

    nav {
      display: grid;
      gap: 8px;
    }

    nav a {
      padding: 11px 12px;
      border-radius: 8px;
      text-decoration: none;
    }

    nav a.active {
      color: white;
      background: rgba(255, 255, 255, 0.12);
    }

    @media (max-width: 980px) {
      .sidebar {
        position: static;
        height: auto;
      }
      nav {
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      }
    }
  `]
})
export class AdminSidebarComponent {
  @Input() tenant: Tenant | null = null;
  @Input() items: NavItem[] = [];
}
