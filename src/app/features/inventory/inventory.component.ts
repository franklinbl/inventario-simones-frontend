import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InventoryService, PaginationResponse } from './services/inventory.service';
import { ProductAttributes } from './models/product.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, HttpClientModule, ReactiveFormsModule],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss']
})
export class InventoryComponent implements OnInit {
  private inventoryService = inject(InventoryService);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  isAdmin = false;
  products: ProductAttributes[] = [];
  isModalOpen = false;
  productForm: FormGroup;
  editingProductId: number | null = null;
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  itemsPerPage = 0;
  hasNextPage = false;
  hasPreviousPage = false;

  constructor() {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      total_quantity: [null, [Validators.required, Validators.min(0)]],
      available_quantity: [null, [Validators.required, Validators.min(0)]],
      price: [null, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.loadProducts();
    const user = this.authService.getCurrentUser();
    this.isAdmin = user?.role.name === 'Administrador';
  }

  private loadProducts(page: number = 1): void {
    this.inventoryService.getProducts(page, 20).subscribe({
      next: (response: PaginationResponse) => {
        this.products = response.products;
        this.currentPage = response.pagination.currentPage;
        this.totalPages = response.pagination.totalPages;
        this.totalItems = response.pagination.total;
        this.itemsPerPage = response.pagination.limit;
        this.hasNextPage = response.pagination.hasNextPage;
        this.hasPreviousPage = response.pagination.hasPreviousPage;
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

  openModal(product?: ProductAttributes): void {
    if (product) {
      this.editingProductId = product.id;
      this.productForm.patchValue({
        name: product.name,
        description: product.description,
        total_quantity: product.total_quantity,
        available_quantity: product.available_quantity,
        price: product.price
      });
    } else {
      this.editingProductId = null;
      this.productForm.reset();
    }
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.editingProductId = null;
    this.productForm.reset();
  }

  onSubmit(): void {
    if (this.productForm.valid) {
      const productData = this.productForm.value;

      if (this.editingProductId) {
        // Actualizar producto existente
        this.inventoryService.updateProduct(this.editingProductId, productData).subscribe({
          next: (updatedProduct) => {
            const index = this.products.findIndex(p => p.id === this.editingProductId);
            if (index !== -1) {
              this.products[index] = updatedProduct;
            }
            this.closeModal();
          },
          error: (error) => {
            console.error('Error al actualizar producto:', error);
          }
        });
      } else {
        // Crear nuevo producto
        this.inventoryService.createProduct(productData).subscribe({
          next: (response) => {
            this.products.push(response.product);
            this.closeModal();
          },
          error: (error) => {
            console.error('Error al crear producto:', error);
          }
        });
      }
    }
  }

  getErrorMessage(controlName: string): string {
    const control = this.productForm.get(controlName);
    if (control?.hasError('required')) {
      return 'Este campo es requerido';
    }
    if (control?.hasError('minlength')) {
      return `Mínimo ${control.errors?.['minlength'].requiredLength} caracteres`;
    }
    if (control?.hasError('min')) {
      return 'El valor debe ser mayor o igual a 0';
    }
    return '';
  }

  get modalTitle(): string {
    return this.editingProductId ? 'Editar Producto' : 'Nuevo Producto';
  }
}