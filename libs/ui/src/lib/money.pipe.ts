import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'storeMoney',
  standalone: true
})
export class MoneyPipe implements PipeTransform {
  transform(value: number, currency = 'CUP'): string {
    return new Intl.NumberFormat('es-CU', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    }).format(value);
  }
}
