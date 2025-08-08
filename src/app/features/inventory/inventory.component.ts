import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from './services/inventory.service';
import { ProductAttributes } from './models/product.model';
import { AuthService } from '../../services/auth.service';
import { AddUpdateProductComponent } from './components/add-update-inventary/add-update-inventory.component';
import { MatDialog, MatDialogConfig, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    FormsModule,

  ],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss']
})
export class InventoryComponent implements OnInit {
  private inventoryService = inject(InventoryService);
  readonly dialog = inject(MatDialog);
  private authService = inject(AuthService);
  isAdmin = false;
  products: ProductAttributes[] = [];
  isModalOpen = false;
  editingProductId: number | null = null;
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  itemsPerPage = 0;
  hasNextPage = false;
  hasPreviousPage = false;
  searchQuery = '';

  constructor() {

  }

  ngOnInit(): void {
    this.loadProducts();
    const user = this.authService.getCurrentUser();
    this.isAdmin = user?.role.name === 'Administrador';
  }

  private loadProducts(page: number = 1): void {
    const currentlyDate = new Date().toISOString().split('T')[0];
    this.inventoryService.getAvailableProducts(currentlyDate, currentlyDate, this.searchQuery).subscribe({
      next: (response) => {
        this.products = response.products;
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
      }
    });
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.loadProducts(page);
    }
  }

  getPages(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 7;
    const halfVisible = Math.floor(maxVisiblePages / 2);

    // Si hay menos páginas que el máximo visible, mostramos todas
    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    // Calcular el rango de páginas a mostrar
    let startPage = Math.max(1, this.currentPage - halfVisible);
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

    // Ajustar el rango si estamos cerca del final
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Agregar la primera página
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push(-1); // -1 representa los puntos suspensivos
      }
    }

    // Agregar las páginas del rango
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Agregar la última página si es necesario
    if (endPage < this.totalPages) {
      if (endPage < this.totalPages - 1) {
        pages.push(-1); // -1 representa los puntos suspensivos
      }
      pages.push(this.totalPages);
    }

    return pages;
  }

  get modalTitle(): string {
    return this.editingProductId ? 'Editar Producto' : 'Nuevo Producto';
  }

  createEditProduct (product?: ProductAttributes | null) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.enterAnimationDuration = 0;

    const title = (!product ? 'Nuevo producto' : 'Actualizar producto')

    dialogConfig.data = {
      product: product || null,
      title
    };

    const dialogRef =  this.dialog.open(AddUpdateProductComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      if (!product) {
        this.products.unshift(result);
      } else {
        const index = this.products.findIndex(p => p.id === result.id);
        if (index !== -1) {
          this.products[index] = result;
        }
      }
    });
  }

  searchProduct() {
    this.loadProducts();
  }
}