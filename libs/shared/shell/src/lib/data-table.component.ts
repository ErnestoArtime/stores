import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DataColumn<T = Record<string, unknown>> {
  header: string;
  value: (row: T) => string | number | boolean | undefined;
}

@Component({
  selector: 'stores-data-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <table>
      <thead>
        <tr>
          <th *ngFor="let col of columns">{{ col.header }}</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let row of rows">
          <td *ngFor="let col of columns">{{ col.value(row) }}</td>
        </tr>
      </tbody>
    </table>
  `,
  styles: [`
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 12px 10px;
      border-bottom: 1px solid #e5e7eb;
      text-align: left;
      vertical-align: middle;
    }
    th {
      color: #6b7280;
      font-size: 0.76rem;
      text-transform: uppercase;
    }
  `]
})
export class DataTableComponent<T = Record<string, unknown>> {
  @Input() columns: DataColumn<T>[] = [];
  @Input() rows: T[] = [];
}
