import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'stores-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="topbar">
      <div>
        <p>{{ section }}</p>
        <h1>{{ title }}</h1>
      </div>
      <div class="actions" *ngIf="hasActions">
        <ng-content select="[actions]"></ng-content>
      </div>
    </header>
  `,
  styles: [`
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .topbar p {
      margin: 0 0 6px;
      font-size: 0.78rem;
      font-weight: 800;
      text-transform: uppercase;
      color: #6b7280;
    }

    .topbar h1 {
      margin: 0;
      font-size: clamp(1.7rem, 3vw, 2.45rem);
    }

    .actions {
      display: flex;
      gap: 10px;
      align-items: center;
    }
  `]
})
export class PageHeaderComponent {
  @Input() section = '';
  @Input() title = '';
  @Input() hasActions = false;
}
