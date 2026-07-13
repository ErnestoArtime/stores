import { Injectable } from '@angular/core';
import { Product, ProductImportPreview } from '@stores/domain';

@Injectable({ providedIn: 'root' })
export class ImportService {
  previewProductCsv(csv: string): ProductImportPreview {
    const lines = csv
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const issues: { row: number; field: string; message: string }[] = [];
    const products = lines.slice(1).map((line, index) => {
      const row = index + 2;
      const [sku = '', name = '', price = '', stock = '', unit = 'unidad'] = line.split(',').map((value) => value.trim());
      const numericPrice = Number(price);
      const numericStock = Number(stock);

      if (!sku) issues.push({ row, field: 'sku', message: 'SKU requerido' });
      if (!name) issues.push({ row, field: 'name', message: 'Nombre requerido' });
      if (!Number.isFinite(numericPrice) || numericPrice < 0) issues.push({ row, field: 'price', message: 'Precio invalido' });
      if (!Number.isInteger(numericStock) || numericStock < 0) issues.push({ row, field: 'stock', message: 'Stock invalido' });

      return {
        sku,
        name,
        price: Number.isFinite(numericPrice) ? numericPrice : 0,
        stock: Number.isInteger(numericStock) ? numericStock : 0,
        unit
      };
    });

    return {
      validRows: Math.max(products.length - issues.length, 0),
      issues,
      products
    };
  }
}
