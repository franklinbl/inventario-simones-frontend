import { Component, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { RentalAttributes } from '../../models/rental.model';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { ProductAttributes } from '../../../inventory/models/product.model';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { RentalService } from '../../services/rental.service';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-completed-rental',
  standalone: true,
  imports: [
    MatDialogModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatIconModule
  ],
  templateUrl: './completed-rental.component.html',
  styleUrls: ['./completed-rental.component.scss']
})
export class CompletedRentalComponent implements OnInit {
  private matIconRegistry = inject(MatIconRegistry);
  private domSanitizer = inject(DomSanitizer);
  private formBuilder = inject(FormBuilder);
  private rentalService = inject(RentalService);
  private rental: RentalAttributes = inject(MAT_DIALOG_DATA).rental;
  readonly dialogRef = inject(MatDialogRef<CompletedRentalComponent>);
  selectedProducts: { product: ProductAttributes; index: number }[] = [];
  rentalForm: FormGroup;

  constructor() {
    this.rentalForm = this.formBuilder.group({
      id: ['', [Validators.required]],
      date_returned: ['', [Validators.required]],
      status: [null, [Validators.required]],
      return_notes: [''],
      products: this.formBuilder.array([])
    }, {
      validators: this.notesRequiredIfWithIssues() // ← Validador personalizado
    });
  }

  ngOnInit(): void {
    const date_returned = new Date(this.rental.date_returned);
    this.rentalForm.patchValue({
      id: this.rental.id,
      date_returned: date_returned.toISOString().split('T')[0],
      status: this.rental.status,
      return_notes: this.rental.return_notes
    });

    // Agregar productos del rental
    this.rental.products.forEach(product => {
      const index = this.productsFormArray.length;
      const currentQuantity = product.rental_product?.quantity_returned || product.rental_product?.quantity_rented || 0;
      this.productsFormArray.push(this.formBuilder.group({
        product_id: [product.id],
        quantity_returned: [currentQuantity, [
          Validators.required,
          Validators.min(1),
          Validators.max(product.rental_product?.quantity_rented || 0)
        ]]
      }));
      this.selectedProducts.push({ product, index });
    });

    const iconFolder = '/assets/icons/';
    const icons = ['triangle-alert', 'circle-check'];

    icons.forEach(icon => {
      this.matIconRegistry.addSvgIcon(
        icon,
        this.domSanitizer.bypassSecurityTrustResourceUrl(iconFolder + icon + '.svg')
      );
    });
  }

  get productsFormArray() {
    return this.rentalForm.get('products') as FormArray;
  }

  getErrorMessage(controlName: string): string {
    const control = this.rentalForm.get(controlName);
    if (control?.hasError('required')) {
      return 'Este campo es requerido';
    }
    if (control?.hasError('minlength')) {
      return `Mínimo ${control.errors?.['minlength'].requiredLength} caracteres`;
    }
    if (control?.hasError('email')) {
      return 'Ingrese un email válido';
    }
    if (control?.hasError('pattern')) {
      return 'Ingrese un número de teléfono válido';
    }
    if (control?.hasError('min')) {
      return 'El valor debe ser mayor o igual a 0';
    }
    if (control?.hasError('maxStock')) {
      const error = control.errors?.['maxStock'];
      return `La cantidad no puede ser mayor al stock disponible (${error.max})`;
    }
    return '';
  }

  private notesRequiredIfWithIssues() {
    return (formGroup: FormGroup) => {
      const status = formGroup.get('status')?.value;
      const notes = formGroup.get('return_notes')?.value;

      if (status === 'with_issues') {
        // Si el estado es "with_issues", las notas deben tener al menos 10 caracteres
        if (!notes || notes.trim().length < 10) {
          return { notesRequired: true }; // marca el error
        }
      }
      return null;
    };
  }

  onSubmit() {
    this.rentalService.completedRental(this.rentalForm.value).subscribe({
      next: (response) => {
        this.closeModal(response.rental);
      },
      error: (error) => {
        console.error('Error al cerrar una renta:', error);
      }
    });
  }

  closeModal(data?: RentalAttributes) {
    this.dialogRef.close(data);
  }
}