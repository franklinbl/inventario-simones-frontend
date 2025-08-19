import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Pagination } from '../../interfaces/Pagination.interface';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss'
})
export class PaginationComponent {
  @Input() pagination!: Pagination;
  @Output() pageChange = new EventEmitter<number>();

  // Emitir el cambio de página
  goToPage(page: number) {
    if (page >= 1 && page <= this.pagination.totalPages) {
      this.pageChange.emit(page);
    }
  }
}
