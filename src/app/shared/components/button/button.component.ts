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

  ngOnInit() {}

  get classes(): string {
    const base = 'inline-block rounded-lg text font-medium focus:outline-hidden cursor-pointer flex items-center';

    const types = {
      primary: 'bg-[#5A6C96] text-white ',
      secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
      danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
      success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500'
    };

    const sizes = {
      sm: 'text-xs px-4 py-1 rounded border',
      md: 'text-sm px-8 py-2 rounded-lg',
      lg: 'text-base px-12 py-6 rounded-2xl'
    };

    const disabled = this.disabled
      ? 'opacity-60 cursor-not-allowed'
      : 'cursor-pointer';

    return `${base} ${types[this.type]} ${sizes[this.size]} ${disabled}`;
  }
}
