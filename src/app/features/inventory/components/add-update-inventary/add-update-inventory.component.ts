import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { InventoryService } from '../../services/inventory.service';
import { ProductAttributes } from '../../models/product.model';
import { AlertService } from '../../../../shared/services/alert.service';

@Component({
  selector: 'app-add-update-inventory',
  standalone: true,
  imports: [MatDialogModule, ReactiveFormsModule],
  templateUrl: './add-update-inventory.component.html',
  styleUrls: ['./add-update-inventory.component.scss']
})
export class AddUpdateProductComponent implements OnInit {
  private fb = inject(FormBuilder);
  private inventoryService = inject(InventoryService);
  private alertService = inject(AlertService);
  readonly dialogRef = inject(MatDialogRef<AddUpdateProductComponent>);
  productForm: FormGroup;
  currentProductId: number | null = null;
  modalTitle = inject(MAT_DIALOG_DATA).title;
  oldProduct: ProductAttributes = inject(MAT_DIALOG_DATA).product;
  isEditing = false;

  constructor() {
    this.productForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(3)]],
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      total_quantity: [null, [Validators.required, Validators.min(0)]],
      price: [null, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    if (this.oldProduct) {
      this.isEditing = true;
      this.currentProductId = this.oldProduct.id;

      this.productForm.patchValue({
        code: this.oldProduct.code,
        name: this.oldProduct.name,
        description: this.oldProduct.description,
        total_quantity: this.oldProduct.total_quantity,
        price: this.oldProduct.price,
      });
    }
  }

  onSubmit(): void {
    if (this.productForm.valid) {
      const productData = this.productForm.value;

      if (this.oldProduct && this.currentProductId) {
        // Actualizar producto existente
        this.inventoryService.updateProduct(this.currentProductId, productData).subscribe({
          next: (updatedProduct) => {
            this.alertService.success(updatedProduct.message);
            this.closeModal(updatedProduct.product);
          },
          error: (error) => {
            this.alertService.error(error.message);
            console.error('Error al actualizar producto:', error);
          }
        });
      } else {
        // Crear nuevo producto
        this.inventoryService.createProduct(productData).subscribe({
          next: (createdProduct) => {
            this.alertService.success(createdProduct.message);
            this.closeModal(createdProduct.product);
          },
          error: (error) => {
            this.alertService.error(error.message);
            console.error('Error al crear producto:', error);
          }
        });
      }
    }
  }

  closeModal(data?: ProductAttributes) {
    this.dialogRef.close(data);
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
}