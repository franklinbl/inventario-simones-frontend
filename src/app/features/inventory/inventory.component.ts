import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InventoryService } from './services/inventory.service';
import { ProductAttributes } from './models/product.model';

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

  products: ProductAttributes[] = [];
  isModalOpen = false;
  productForm: FormGroup;
  editingProductId: number | null = null;

  constructor() {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required]],
      total_quantity: [null, [Validators.required, Validators.min(0)]],
      available_quantity: [null, [Validators.required, Validators.min(0)]],
      price: [null, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.loadProducts();
  }

  private loadProducts(): void {
    this.inventoryService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
      }
    });
  }

  openModal(product?: ProductAttributes): void {
    if (product) {
      this.editingProductId = product.id;
      this.productForm.patchValue({
        name: product.name,
        description: product.description,
        total_quantity: product.total_quantity,
        available_quantity: product.available_quantity
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
            this.products.push(response);
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