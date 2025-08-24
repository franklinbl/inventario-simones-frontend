import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ValidationService {
  static getErrorMessage(error: any, label?: string): string {
    if (!error) return '';

    if (error.required) {
      return `${label || 'Este campo'} es requerido`;
    }
    if (error.minlength) {
      const required = error.minlength.requiredLength;
      return `Mínimo ${required} caracteres`;
    }
    if (error.maxlength) {
      const required = error.maxlength.requiredLength;
      return `Máximo ${required} caracteres`;
    }
    if (error.email) {
      return 'Ingrese un email válido';
    }
    if (error.pattern) {
      return 'Formato inválido';
    }
    if (error.min) {
      return `El valor debe ser mayor o igual a ${error.min}`;
    }
    if (error.max) {
      return `El valor no puede ser mayor a ${error.max}`;
    }
    if (error.maxStock) {
      return `La cantidad no puede ser mayor al stock disponible (${error.maxStock.max})`;
    }

    return 'Valor inválido';
  }
}