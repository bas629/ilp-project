import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'inr', standalone: true })
export class InrFormatPipe implements PipeTransform {
  transform(value: number | null | undefined, decimals = 0): string {
    if (value == null) return '₹0';
    return '₹' + value.toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }
}
