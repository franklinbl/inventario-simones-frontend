import { CommonModule } from '@angular/common';
import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable, of } from 'rxjs';

interface SelectOptionType {
  label: string;
  value: string | boolean;
}

@Component({
  selector: 'app-input-field',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './input-field.component.html',
  styleUrls: ['./input-field.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputFieldComponent),
      multi: true
    }
  ]
})
export class InputFieldComponent implements ControlValueAccessor {
  @Input() type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'calendar' | 'select' | 'search-select' = 'text';
  @Input() placeholder = '';
  @Input() label = '';
  @Input() disabled = false;
  @Input() selectOption: SelectOptionType[] = [{ label: '', value: '' }];
  @Input() min?: number;
  @Input() max?: number;

  @Input() filteredProducts: Observable<any[]> = of([]);
  @Input() noResultsText = 'No se encontraron elementos';

  @Output() searchChange = new EventEmitter<string>();
  @Output() productSelected = new EventEmitter<any>();

  classBase = `w-full border border-[#EFF0E5] rounded-lg py-1 px-3 text-slate-700 placeholder-slate-400 bg-[#fcfdf6] focus:outline-none focus:ring-1
               focus:ring-[#556995] disabled:bg-gray-100 disabled:text-slate-500 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-[#556995]`;

  value = '';
  selectedOption: any = null;

  onChange = (value: any) => {};
  onTouched = () => {};

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const parsedValue = value === 'true' ? true : value === 'false' ? false : value;
    this.value = value;
    this.onChange(parsedValue);
    this.searchChange.emit(value);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  writeValue(value: any): void {
    if (this.type === 'search-select') {
      this.value = typeof value === 'string' ? value : '';
    } else {
      this.value = value || '';
    }
  }

  selectProductInputWithSearch(option: any): void {
    this.productSelected.emit(option); // Notifica al padre
    this.onTouched();
  }
}