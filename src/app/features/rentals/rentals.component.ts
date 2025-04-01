import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule, FormControl, FormArray } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RentalService } from './services/rental.service';
import { RentalAttributes } from './models/rental.model';
import { InventoryService } from '../inventory/services/inventory.service';
import { ProductAttributes } from '../inventory/models/product.model';
import { Observable, map, startWith } from 'rxjs';

@Component({
  selector: 'app-rentals',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    MatSelectModule,
    NgxMatSelectSearchModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './rentals.component.html',
  styleUrls: ['./rentals.component.scss']
})
export class RentalsComponent implements OnInit {
  private rentalService = inject(RentalService);
  private inventoryService = inject(InventoryService);
  private fb = inject(FormBuilder);

  rentals: (RentalAttributes & { expanded?: boolean })[] = [];
  isModalOpen = false;
  rentalForm: FormGroup;
  products: ProductAttributes[] = [];
  filteredProducts: Observable<ProductAttributes[]>;
  productFilterCtrl = this.fb.control('');
  selectedProductCtrl = this.fb.control<ProductAttributes | null>(null);
  selectedProducts: { product: ProductAttributes; index: number }[] = [];

  constructor() {
    this.rentalForm = this.fb.group({
      customer_name: ['', [Validators.required, Validators.minLength(3)]],
      // client_email: ['', [Validators.required, Validators.email]],
      // client_phone: ['', [Validators.required, Validators.pattern(/^\+?[1-9]\d{1,14}$/)]],
      start_date: ['', [Validators.required]],
      end_date: ['', [Validators.required]],
      // total_amount: [null, [Validators.required, Validators.min(0)]],
      status: ['pending', [Validators.required]],
      products: this.fb.array([])
    });

    this.filteredProducts = this.productFilterCtrl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterProducts(value || ''))
    );

    // Suscribirse a cambios en la selección de producto
    this.selectedProductCtrl.valueChanges.subscribe(product => {
      if (product && !this.selectedProducts.some(sp => sp.product.id === product.id)) {
        const index = this.productsFormArray.length;
        this.productsFormArray.push(this.fb.group({
          product_id: [product.id],
          quantity: [null, [Validators.required, Validators.min(1)]]
        }));
        this.selectedProducts.push({ product, index });
        this.selectedProductCtrl.setValue(null); // Limpiar la selección
      }
    });
  }

  get productsFormArray() {
    return this.rentalForm.get('products') as FormArray;
  }

  ngOnInit(): void {
    this.loadRentals();
    this.loadProducts();
  }

  private loadRentals(): void {
    this.rentalService.getRentals().subscribe({
      next: (data) => {
        this.rentals = data;
      },
      error: (error) => {
        console.error('Error al cargar rentas:', error);
      }
    });
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

  private _filterProducts(value: string): ProductAttributes[] {
    const filterValue = value.toLowerCase();
    return this.products.filter(product =>
      product.name.toLowerCase().includes(filterValue) ||
      product.description.toLowerCase().includes(filterValue)
    );
  }

  toggleDetails(rental: RentalAttributes & { expanded?: boolean }): void {
    rental.expanded = !rental.expanded;
  }

  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.rentalForm.reset();
  }

  updateQuantity(productId: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const quantity = parseInt(input.value);
    const index = this.selectedProducts.findIndex(sp => sp.product.id === productId);
    if (index !== -1) {
      this.productsFormArray.at(index).get('quantity')?.setValue(quantity);
    }
  }

  removeProduct(productId: number): void {
    const index = this.selectedProducts.findIndex(sp => sp.product.id === productId);
    if (index !== -1) {
      this.productsFormArray.removeAt(this.selectedProducts[index].index);
      this.selectedProducts = this.selectedProducts.filter((_, i) => i !== index);
      // Actualizar índices
      this.selectedProducts.forEach((sp, i) => {
        sp.index = i;
      });
    }
  }

  onSubmit(): void {
    if (this.rentalForm.valid && this.selectedProducts.length > 0) {
      const rentalData = this.rentalForm.value;
      this.rentalService.createRental(rentalData).subscribe({
        next: (response) => {
          this.rentals.push(response);
          this.closeModal();
        },
        error: (error) => {
          console.error('Error al crear renta:', error);
        }
      });
    }
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
    return '';
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'status-pending';
      case 'active':
        return 'status-active';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  }

  getStatusText(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Pendiente';
      case 'active':
        return 'Activa';
      case 'completed':
        return 'Completada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  }
}