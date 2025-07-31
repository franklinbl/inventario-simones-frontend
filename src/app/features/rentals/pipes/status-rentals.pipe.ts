import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'statusRentals'
})
export class StatusRentalsPipe implements PipeTransform {
  transform(value: unknown): string {
    // Si no hay valor, devolvemos cadena vacía o "Desconocido"
    if (!value) {
      return 'Desconocido';
    }

    // Mapeo de estados
    const statusMap: { [key: string]: string } = {
      'completed': 'Completada',
      'with_issues': 'Con inconvenientes',
      'pending_return': 'Pendiente de devolución'
    };

    // Convertimos el valor a string y en minúsculas para evitar problemas de casing
    const status = value.toString().toLowerCase();

    // Retornamos la traducción o "Desconocido" si no existe
    return statusMap[status] || 'Desconocido';
  }

}
