import { Component, Input, OnInit } from '@angular/core';

type ButtonHtmlType = 'button' | 'submit' | 'reset';
type ButtonStyle = 'primary' | 'secondary' | 'danger' | 'success' | 'secondary-outline';
type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  imports: [],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss'
})
export class ButtonComponent implements OnInit {
  @Input() htmlType: ButtonHtmlType = 'button';
  @Input() styleType: ButtonStyle = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() disabled = false;

  ngOnInit() {}

  get classes(): string {
    const base = 'inline-block rounded-lg text font-medium focus:outline-hidden cursor-pointer flex items-center';

    const types = {
      primary: 'bg-[#5A6C96] border border-[#5A6C96] text-white hover:bg-[#677bab]',
      secondary: 'bg-[#E2E9B4] text-black border border-[#E2E9B4]',
      danger: 'bg-red-400 text-white border border-red-600 hover:bg-red-700 focus:ring-red-500',
      success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
      'secondary-outline': 'border border-[#4a5c89] text-[#4a5c89] bg-[#F8F9EB] hover:bg-[#f4f6fa]'
    };

    const sizes = {
      sm: 'text-xs px-4 py-1 rounded border',
      md: 'text-sm px-8 py-2 rounded-lg',
      lg: 'text-base px-12 py-6 rounded-2xl'
    };

    const disabled = this.disabled
      ? 'opacity-60 cursor-not-allowed'
      : 'cursor-pointer';

    return `${base} ${types[this.styleType]} ${sizes[this.size]} ${disabled}`;
  }
}
