import { Component, Input, OnInit } from '@angular/core';

type ButtonType = 'primary' | 'secondary' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  imports: [],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss'
})
export class ButtonComponent implements OnInit {
  @Input() type: ButtonType = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() disabled = false;

  ngOnInit() {
    console.log('Tamaño:', this.size); // ✅ Debería mostrar "sm"
  }

  get classes(): string {
    const base = 'inline-block rounded-sm border border-indigo-600 bg-indigo-600 px-12 py-3 text-sm font-medium text-white hover:bg-transparent hover:text-indigo-600 focus:ring-3 focus:outline-hidden cursor-pointer';

    const types = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
      secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
      danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
      success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500'
    };

    const sizes = {
      sm: 'text-xs px-4 py-1 rounded border',
      md: 'text-sm px-6 py-2 rounded-sm',
      lg: 'text-base px-8 py-3 rounded'
    };

    const disabled = this.disabled
      ? 'opacity-60 cursor-not-allowed'
      : 'cursor-pointer';

    return `${base} ${types[this.type]} ${sizes[this.size]} ${disabled}`;
  }
}
