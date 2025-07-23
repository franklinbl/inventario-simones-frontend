import { Component, OnInit, inject } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { ProductAttributes } from '../../../inventory/models/product.model';
import { map, Observable, startWith } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { AuthService } from '../../../../services/auth.service';
import { InventoryService } from '../../../inventory/services/inventory.service';
import { ClientsService } from '../../../clients/services/clients.service';
import { RentalService } from '../../services/rental.service';
import { RentalAttributes } from '../../models/rental.model';

@Component({
  selector: 'app-add-update-rental',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatSelectModule,
    MatIcon,
    MatInputModule,
    MatFormFieldModule,
    NgxMatSelectSearchModule
  ],
  templateUrl: './add-update-rental.component.html',
  styleUrls: ['./add-update-rental.component.scss']
})
export class AddUpdateRentalComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private inventoryService = inject(InventoryService);
  private clientsService = inject(ClientsService);
  private rentalService = inject(RentalService);

  private oldRental: RentalAttributes = inject(MAT_DIALOG_DATA).rental;
  modalTitle = inject(MAT_DIALOG_DATA).title;
  readonly dialogRef = inject(MatDialogRef<AddUpdateRentalComponent>);

  rentalForm: FormGroup;
  clientForm: FormGroup;
  isEditing = false;
  isAdmin = false;
  clientDniInput = '';
  productFilterCtrl = this.formBuilder.control('');
  selectedProductCtrl = this.formBuilder.control<ProductAttributes | null>(null);
  selectedProducts: { product: ProductAttributes; index: number }[] = [];
  filteredProducts: Observable<ProductAttributes[]> = this.productFilterCtrl.valueChanges.pipe(
    startWith(''),
    map(value => this._filterProducts(value || ''))
  );
  products: ProductAttributes[] = [];
  currentRentalId: number | null = null;

  constructor() {
    this.rentalForm = this.formBuilder.group({
      client_id: [null],
      start_date: ['', [Validators.required]],
      end_date: ['', [Validators.required]],
      notes: [''],
      is_delivery_by_us: [false, [Validators.required]],
      delivery_price: [{value: null, disabled: true}, [Validators.min(0)]],
      discount: [0, [Validators.min(0)]],
      products: this.formBuilder.array([])
    });

    this.clientForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      dni: ['', [Validators.required, Validators.minLength(7)]],
      phone: ['', [Validators.required, Validators.minLength(7)]]
    });

    this.rentalForm.get('is_delivery_by_us')?.valueChanges.subscribe(isDeliveryByUs => {
      const deliveryPriceControl = this.rentalForm.get('delivery_price');
      if (isDeliveryByUs) {
        deliveryPriceControl?.enable();
      } else {
        deliveryPriceControl?.disable();
        deliveryPriceControl?.setValue(null);
      }
    });

    // Suscribirse a cambios en la selección de producto
    this.selectedProductCtrl.valueChanges.subscribe(product => {
      if (product && !this.selectedProducts.some(sp => sp.product.id === product.id)) {
        const index = this.productsFormArray.length;
        this.productsFormArray.push(this.formBuilder.group({
          product_id: [product.id],
          quantity: [null, [
            Validators.required,
            Validators.min(1),
            this.maxStockValidator(product.available_quantity)
          ]]
        }));
        this.selectedProducts.push({ product, index });
        this.selectedProductCtrl.setValue(null); // Limpiar la selección
      }
    });
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.isAdmin = user?.role.name === 'Administrador';
    this.loadProducts();

    if (this.oldRental) {
      this.isEditing = true;
      this.currentRentalId = this.oldRental.id;

      // Formatear las fechas al formato YYYY-MM-DD
      const startDate = new Date(this.oldRental.start_date);
      const endDate = new Date(this.oldRental.end_date);

      this.rentalForm.patchValue({
        client_id: this.oldRental.client.id,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        notes: this.oldRental.notes,
        status: this.oldRental.status,
        is_delivery_by_us: this.oldRental.is_delivery_by_us || false,
        delivery_price: this.oldRental.delivery_price || 0
      });

      this.clientForm.patchValue({
        name: this.oldRental.client.name,
        dni: this.oldRental.client.dni,
        phone: this.oldRental.client.phone
      });

      // Manejar el estado disabled/enabled del delivery_price
      const deliveryPriceControl = this.rentalForm.get('delivery_price');
      if (this.oldRental.is_delivery_by_us) {
        deliveryPriceControl?.enable();
      } else {
        deliveryPriceControl?.disable();
      }

      // Limpiar productos existentes
      this.selectedProducts = [];
      while (this.productsFormArray.length) {
        this.productsFormArray.removeAt(0);
      }

      // Agregar productos del rental
      this.oldRental.products.forEach(product => {
        const index = this.productsFormArray.length;
        const currentQuantity = product.RentalProduct?.quantity || 0;
        this.productsFormArray.push(this.formBuilder.group({
          product_id: [product.id],
          quantity: [currentQuantity, [
            Validators.required,
            Validators.min(1),
            this.maxStockValidator(product.available_quantity, currentQuantity)
          ]]
        }));
        this.selectedProducts.push({ product, index });
      });
    }
  }

  private loadProducts(): void {
    this.inventoryService.getProducts().subscribe({
      next: (data) => {
        this.products = data.products;
        this.filteredProducts = this.productFilterCtrl.valueChanges.pipe(
          startWith(''),
          map(value => this._filterProducts(value || ''))
        );
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
      }
    });
  }

  onSubmit() {
    if (this.selectedProducts.length > 0) {
      const rentalData = this.rentalForm.getRawValue();

      // Validar que los campos requeridos estén llenos
      if (!this.rentalForm.valid) {
        return;
      }

      // Validar que todas las cantidades sean válidas
      const hasInvalidQuantities = this.productsFormArray.controls.some(control => {
        const quantity = control.get('quantity')?.value;
        const product = this.selectedProducts.find(sp => sp.index === this.productsFormArray.controls.indexOf(control))?.product;
        if (!product) return true;

        const currentQuantity = product.RentalProduct?.quantity || 0;
        const maxAllowed = this.isEditing ? product.available_quantity + currentQuantity : product.available_quantity;

        return quantity <= 0 || quantity > maxAllowed;
      });

      if (hasInvalidQuantities) {
        return;
      }

      if (this.isEditing && this.currentRentalId) {
          this.rentalService.updateRental(this.currentRentalId, rentalData).subscribe({
            next: (response) => {
              this.closeModal(response.rental);
            },
            error: (error) => {
              console.error('Error al actualizar renta:', error);
            }
          });
      } else {
        this.rentalService.createRental(rentalData, this.clientForm.value).subscribe({
          next: (response) => {
            this.clientForm.reset();
            this.clientDniInput = '';
            this.rentalForm.patchValue({
              client_id: null
            });
            this.closeModal(response.rental);
          },
          error: (error) => {
            console.error('Error al crear renta:', error);
          }
        });
      }
    }
  }

  closeModal(data?: RentalAttributes) {
    this.dialogRef.close(data);
  }

  searchClient() {
    if (!this.clientDniInput) return;
    this.clientsService.getClientByDni(this.clientDniInput).subscribe({
      next: (client) => {
        if (client) {
          this.clientForm.patchValue({
            name: client.name,
            dni: client.dni,
            phone: client.phone
          });
          this.rentalForm.patchValue({
            client_id: client.id
          });
        } else {
          alert('Cliente no encontrado, por favor ingrese los datos del cliente');
          this.clientForm.reset();
          this.clientDniInput = '';
          this.rentalForm.patchValue({
            client_id: null
          });
        }
      },
      error: (error) => {
        console.error('Error al obtener el cliente:', error);
      }
    });
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

  private _filterProducts(value: string): ProductAttributes[] {
    const filterValue = value.toLowerCase();
    return this.products.filter(product =>
      product.name.toLowerCase().includes(filterValue) ||
      product.description.toLowerCase().includes(filterValue)
    );
  }

  get productsFormArray() {
    return this.rentalForm.get('products') as FormArray;
  }

  getQuantityErrorMessage(index: number): string {
    const control = this.productsFormArray.at(index).get('quantity');
    if (control?.hasError('required')) {
      return 'La cantidad es requerida';
    }
    if (control?.hasError('min')) {
      return 'La cantidad debe ser mayor a 0';
    }
    if (control?.hasError('maxStock')) {
      const error = control.errors?.['maxStock'];
      return `La cantidad no puede ser mayor al stock disponible (${error.max})`;
    }
    return '';
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

  maxStockValidator(maxStock: number, currentRentalQuantity: number = 0) {
    return (control: FormControl) => {
      const value = control.value;
      const maxAllowed = this.isEditing ? maxStock + currentRentalQuantity : maxStock;
      if (value > maxAllowed) {
        return { maxStock: { max: maxAllowed, actual: value } };
      }
      return null;
    };
  }
}