import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpResponse } from '@angular/common/http';
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
import { AuthService } from '../../services/auth.service';
import { ClientsService } from '../clients/services/clients.service';

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
  private authService = inject(AuthService);
  private clientsService = inject(ClientsService);
  private fb = inject(FormBuilder);

  rentals: (RentalAttributes & { expanded?: boolean })[] = [];
  isModalOpen = false;
  isEditing = false;
  currentRentalId: number | null = null;
  rentalForm: FormGroup;
  clientForm: FormGroup;
  products: ProductAttributes[] = [];
  filteredProducts: Observable<ProductAttributes[]>;
  productFilterCtrl = this.fb.control('');
  selectedProductCtrl = this.fb.control<ProductAttributes | null>(null);
  selectedProducts: { product: ProductAttributes; index: number }[] = [];
  isAdmin = false;

  customInputValue: string = '';

  constructor() {
    this.rentalForm = this.fb.group({
      client_id: [null],
      start_date: ['', [Validators.required]],
      end_date: ['', [Validators.required]],
      notes: [''],
      is_delivery_by_us: [false, [Validators.required]],
      delivery_price: [{value: null, disabled: true}, [Validators.min(0)]],
      discount: [0, [Validators.min(0)]],
      products: this.fb.array([])
    });

    this.clientForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      dni: ['', [Validators.required, Validators.minLength(7)]],
      phone: ['', [Validators.required, Validators.minLength(7)]]
    });

    // Suscribirse a cambios en is_delivery_by_us para habilitar/deshabilitar delivery_price
    this.rentalForm.get('is_delivery_by_us')?.valueChanges.subscribe(isDeliveryByUs => {
      const deliveryPriceControl = this.rentalForm.get('delivery_price');
      if (isDeliveryByUs) {
        deliveryPriceControl?.enable();
      } else {
        deliveryPriceControl?.disable();
        deliveryPriceControl?.setValue(null);
      }
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

  get productsFormArray() {
    return this.rentalForm.get('products') as FormArray;
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.isAdmin = user?.role.name === 'Administrador';
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
        this.products = data.products;
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

  openModal(rental?: RentalAttributes): void {
    this.isModalOpen = true;
    if (rental) {
      this.isEditing = true;
      this.currentRentalId = rental.id;

      // Formatear las fechas al formato YYYY-MM-DD
      const startDate = new Date(rental.start_date);
      const endDate = new Date(rental.end_date);

      this.rentalForm.patchValue({
        client_id: rental.client.id,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        notes: rental.notes,
        status: rental.status,
        is_delivery_by_us: rental.is_delivery_by_us || false,
        delivery_price: rental.delivery_price || 0
      });

      this.clientForm.patchValue({
        name: rental.client.name,
        dni: rental.client.dni,
        phone: rental.client.phone
      });

      // Manejar el estado disabled/enabled del delivery_price
      const deliveryPriceControl = this.rentalForm.get('delivery_price');
      if (rental.is_delivery_by_us) {
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
      rental.products.forEach(product => {
        const index = this.productsFormArray.length;
        const currentQuantity = product.RentalProduct?.quantity || 0;
        this.productsFormArray.push(this.fb.group({
          product_id: [product.id],
          quantity: [currentQuantity, [
            Validators.required,
            Validators.min(1),
            this.maxStockValidator(product.available_quantity, currentQuantity)
          ]]
        }));
        this.selectedProducts.push({ product, index });
      });
    } else {
      this.isEditing = false;
      this.currentRentalId = null;
      this.rentalForm.reset();
      this.selectedProducts = [];
      while (this.productsFormArray.length) {
        this.productsFormArray.removeAt(0);
      }
    }
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.isEditing = false;
    this.currentRentalId = null;
    this.rentalForm.reset();
    // Resetear el estado disabled del delivery_price
    this.rentalForm.get('delivery_price')?.disable();
    this.selectedProducts = [];
    while (this.productsFormArray.length) {
      this.productsFormArray.removeAt(0);
    }
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
            const index = this.rentals.findIndex(r => r.id === this.currentRentalId);
            if (index !== -1) {
              this.rentals[index] = response.rental;
            }
            this.closeModal();
          },
          error: (error) => {
            console.error('Error al actualizar renta:', error);
          }
        });
      } else {
        this.rentalService.createRental(rentalData, this.clientForm.value).subscribe({
          next: (response) => {
            this.rentals.unshift(response.rental);
            this.clientForm.reset();
            this.customInputValue = '';
            this.rentalForm.patchValue({
              client_id: null
            });
            this.closeModal();
          },
          error: (error) => {
            console.error('Error al crear renta:', error);
          }
        });
      }
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
    if (control?.hasError('maxStock')) {
      const error = control.errors?.['maxStock'];
      return `La cantidad no puede ser mayor al stock disponible (${error.max})`;
    }
    return '';
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

  rentalCompleted(rentalId: number) {
    this.rentalService.completedRental(rentalId).subscribe({
      next: () => {
        const index = this.rentals.findIndex(r => r.id === rentalId);
        if (index !== -1) {
          this.rentals[index].status = 'completed';
        }
      },
      error: (error) => {
        console.error('Error al cerrar una renta:', error);
      }
    });
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

  downloadInvoice(rental: RentalAttributes) {
    this.rentalService.downloadInvoice(rental.id).subscribe({
      next: (response: HttpResponse<Blob>) => {
        const blob = response.body;
        if (!blob) {
          console.error('No se recibió el PDF');
          return;
        }
        const contentDisposition = response.headers.get('Content-Disposition');

        // Extraer el nombre del archivo del encabezado Content-Disposition
        let fileName = 'archivo.pdf'; // Valor por defecto
        if (contentDisposition && contentDisposition.includes('filename=')) {
          fileName = contentDisposition.split('filename=')[1].split(';')[0].replace(/"/g, '');
        }

        // Crear un objeto URL temporal para el Blob
        const url = window.URL.createObjectURL(blob);

        // Crear un enlace dinámico
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName; // Asignar el nombre del archivo

        // Simular un clic en el enlace para iniciar la descarga
        document.body.appendChild(a);
        a.click();

        // Limpiar el enlace y liberar el objeto URL
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error al obtener el PDF:', err);
        alert('Ocurrió un error al intentar abrir el PDF.');
      }
    });
  }

  calculateTotalPrice(rental: RentalAttributes): number {
    const totalPriceItems = rental.products.reduce((total, product) => {
      const quantity = product.RentalProduct?.quantity || 0;
      const price = product.price || 0;
      return total + (quantity * price);
    }, 0);

    if (rental.discount > 0) {
      return (totalPriceItems - (totalPriceItems * (rental.discount / 100)) + (Number(rental.delivery_price) || 0));
    }

    return totalPriceItems + (Number(rental.delivery_price) || 0);
  }

  logCustomInput(): void {
    this.clientsService.getClientByDni(this.customInputValue).subscribe({
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
          this.customInputValue = '';
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
}