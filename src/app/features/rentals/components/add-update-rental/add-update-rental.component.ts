import { Component, Input, OnInit, inject } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { ProductAttributes } from '../../../inventory/models/product.model';
import { BehaviorSubject, debounceTime, distinctUntilChanged } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatIcon, MatIconRegistry } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { AuthService } from '../../../../shared/services/auth.service';
import { InventoryService } from '../../../inventory/services/inventory.service';
import { ClientsService } from '../../../clients/services/clients.service';
import { RentalService } from '../../services/rental.service';
import { RentalAttributes } from '../../models/rental.model';
import { Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputFieldComponent } from "../../../../shared/components/input-field/input-field.component";
import { ValidationService } from '../../../../shared/services/validation.service';
import { AlertService } from '../../../../shared/services/alert.service';

@Component({
  selector: 'app-add-update-rental',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatSelectModule,
    MatIcon,
    MatInputModule,
    MatFormFieldModule,
    NgxMatSelectSearchModule,
    ButtonComponent,
    InputFieldComponent
],
  templateUrl: './add-update-rental.component.html',
  styleUrls: ['./add-update-rental.component.scss']
})
export class AddUpdateRentalComponent implements OnInit {
  private matIconRegistry = inject(MatIconRegistry);
  private domSanitizer = inject(DomSanitizer);
  private formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private inventoryService = inject(InventoryService);
  private clientsService = inject(ClientsService);
  private rentalService = inject(RentalService);
  private alertService = inject(AlertService);
  private router = inject(Router);
  @Input() private rentalId: number | null = null;

  private oldRental: RentalAttributes | null= null;
  modalTitle = '';

  rentalForm: FormGroup;
  clientForm: FormGroup;
  isEditing = false;
  isAdmin = false;
  clientDniCtrl = new FormControl<string>('');
  productFilterCtrl = this.formBuilder.control<string>('');
  selectedProductCtrl = new FormControl<ProductAttributes | null>(null);
  selectedProducts: { product: ProductAttributes; index: number }[] = [];
  private _filteredProductsSubject = new BehaviorSubject<ProductAttributes[]>([]);
  filteredProducts = this._filteredProductsSubject.asObservable();
  currentRentalId: number | null = null;
  selectOption = [
    {label: 'Transporte por cliente', value: false},
    {label: 'Transporte por nosotros', value: true},
  ];

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
      name: [{ value: null, disabled: true }, [Validators.required, Validators.minLength(3)]],
      dni: [{ value: null, disabled: true }, [Validators.required, Validators.minLength(7)]],
      phone: [{ value: null, disabled: true }, [Validators.required, Validators.minLength(7)]]
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
  }

  ngOnInit(): void {
    const iconFolder = '/assets/icons/';
    const icons = ['arrow-left-to-line', 'search', 'user', 'calendar', 'package', 'trash'];

    icons.forEach(icon => {
      this.matIconRegistry.addSvgIcon(
        icon,
        this.domSanitizer.bypassSecurityTrustResourceUrl(iconFolder + icon + '.svg')
      );
    });

    const user = this.authService.getCurrentUser();
    this.isAdmin = user?.role.name === 'Administrador';

    if (this.rentalId) {
      this.rentalService.getRentalForId(this.rentalId).subscribe({
        next: (data) => {
          this.oldRental = data.rental;
          this.currentRentalId = data.rental.id;
          this.isEditing = true;
          this.loadEditRental();
        },
        error: (error) => {
          console.error('Error al cargar productos:', error);
        }
      })
    }

    this.productFilterCtrl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      if (value && value.trim() !== '' && value.length > 2) {
        this.loadProducts();
      }
    });
  }

  loadEditRental() {
    if (!this.oldRental) return;
    // Formatear las fechas al formato YYYY-MM-DD
    const startDate = new Date(this.oldRental.start_date);
    const endDate = new Date(this.oldRental.end_date);

    this.rentalForm.patchValue({
      client_id: this.oldRental.client?.id,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      notes: this.oldRental.notes,
      status: this.oldRental.status,
      is_delivery_by_us: this.oldRental.is_delivery_by_us || false,
      delivery_price: this.oldRental.delivery_price || 0
    });

    this.clientForm.patchValue({
      name: this.oldRental.client?.name,
      dni: this.oldRental.client?.dni,
      phone: this.oldRental.client?.phone
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
      const currentQuantity = product.rental_product?.quantity_rented || 0;
      this.productsFormArray.push(this.formBuilder.group({
        product_id: [product.id],
        quantity_rented: [currentQuantity, [
          Validators.required,
          Validators.min(1),
          this.maxStockValidator(product.available_quantity, currentQuantity)
        ]]
      }));
      this.selectedProducts.push({ product, index });
    });
  }

  loadProducts(): void {
    const value = this.productFilterCtrl.value;
    if (value && value.trim() !== '' && value.length > 2) {
      this.inventoryService.getAvailableProducts(
        this.rentalForm.get('start_date')?.value,
        this.rentalForm.get('end_date')?.value,
        value
      ).subscribe({
        next: (data) => {
          // Emite los productos al Subject para que el dropdown los muestre
          this._filteredProductsSubject.next(data.products);
        },
        error: (error) => {
          console.error('Error al cargar productos:', error);
          // En caso de error, emite una lista vacía
          this._filteredProductsSubject.next([]);
        }
      });
    } else {
      // Si no hay texto, no mostrar resultados
      this._filteredProductsSubject.next([]);
    }
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
        const quantity_rented = control.get('quantity_rented')?.value;
        const product = this.selectedProducts.find(sp => sp.index === this.productsFormArray.controls.indexOf(control))?.product;
        if (!product) return true;

        const currentQuantity = product.rental_product?.quantity_rented || 0;
        const maxAllowed = this.isEditing ? product.available_quantity + currentQuantity : product.available_quantity;

        return quantity_rented <= 0 || quantity_rented > maxAllowed;
      });

      if (hasInvalidQuantities) {
        return;
      }

      if (this.isEditing && this.currentRentalId) {
          this.rentalService.updateRental(this.currentRentalId, rentalData, this.clientForm.value).subscribe({
            next: (response) => {
              this.alertService.success(response.message);
              this.redirectToRentals();
            },
            error: (error) => {
              console.error('Error al actualizar renta:', error);
              this.alertService.error(error.message);
            }
          });
      } else {
        this.rentalService.createRental(rentalData, this.clientForm.value).subscribe({
          next: (response) => {
            this.clientForm.reset();
            this.clientDniCtrl.patchValue(null);
            this.rentalForm.patchValue({
              client_id: null
            });
            this.alertService.success(response.message);
            this.redirectToRentals();
          },
          error: (error) => {
            console.error('Error al crear renta:', error);
            this.alertService.error(error.message);
          }
        });
      }
    }
  }

  redirectToRentals() {
    const state = history.state as { page?: number; pageSize?: number };
    this.router.navigate(['/rentals'], {
      state: {
        page: state?.page || 1,
      }
    });
  }

  searchClient() {
    if (!this.clientDniCtrl.value) return;
    this.clientsService.getClientByDni(this.clientDniCtrl.value).subscribe({
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
          this.clientForm.get('name')?.disable();
          this.clientForm.get('dni')?.disable();
          this.clientForm.get('phone')?.disable();
        } else {
          alert('Cliente no encontrado, por favor verifique la cédula del cliente');
          this.clientForm.reset();
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

  newClient() {
    this.clientDniCtrl.patchValue(null);
    this.clientForm.reset();
    this.clientForm.get('name')?.enable();
    this.clientForm.get('dni')?.enable();
    this.clientForm.get('phone')?.enable();
    this.rentalForm.patchValue({
      client_id: null
    });
  }

  getErrorMessage(controlName: string): string {
    const control = this.rentalForm.get(controlName) || this.clientForm.get(controlName);

    if (control?.invalid && control.touched) {
      return ValidationService.getErrorMessage(control.errors, this.getLabel(controlName));
    }
    return '';
  }
  private getLabel(controlName: string): string {
    const labels: Record<string, string> = {
      start_date: 'Fecha de inicio',
      end_date: 'Fecha de fin',
      client_id: 'Cliente',
      notes: 'Notas',
      is_delivery_by_us: 'Tipo de transporte',
      delivery_price: 'Precio de transporte',
      discount: 'Descuento',
      name: 'Nombre del cliente',
      dni: 'Cédula del cliente',
      phone: 'Teléfono del cliente'
    };
    return labels[controlName] || 'Este campo';
  }

  get productsFormArray() {
    return this.rentalForm.get('products') as FormArray;
  }

  getQuantityErrorMessage(index: number): string {
    const control = this.productsFormArray.at(index).get('quantity_rented');
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
    return (control: AbstractControl) => {
      const value = control.value;
      if (value > maxStock) {
        return { maxStock: { max: maxStock, actual: currentRentalQuantity } };
      }
      return null;
    };
  }

  onProductSelected(product: ProductAttributes) {
    if (product && !this.selectedProducts.some(sp => sp.product.id === product.id)) {
      const index = this.productsFormArray.length;
      this.productsFormArray.push(this.formBuilder.group({
        product_id: [product.id],
        quantity_rented: [null, [
          Validators.required,
          Validators.min(1),
          this.maxStockValidator(product.available_quantity)
        ]]
      }));
      this.selectedProducts.push({ product, index });

      // Actualizar validadores después de agregar
      this.updateValidators();
    }
    this.productFilterCtrl.setValue('');
    this._filteredProductsSubject.next([]);
  }

  updateAvailabilityProduct() {
    const startDate = this.rentalForm.get('start_date')?.value;
    const endDate = this.rentalForm.get('end_date')?.value;

    if (this.selectedProducts.length === 0 || !startDate || !endDate) {
      return;
    }

    const products = this.selectedProducts.map(p => p.product);

    this.inventoryService.getrecalculateAvailabilityProducts(
      startDate,
      endDate,
      products
    ).subscribe({
      next: (response) => {
        response.products.forEach(updatedProduct => {
          const item = this.selectedProducts.find(sp => sp.product.id === updatedProduct.id);
          if (item) {
            item.product.available_quantity = updatedProduct.available_quantity;
          }
        });

        // Actualizar validadores y estado del formulario
        this.updateValidators();
      },
      error: (error) => {
        console.error('Error al recalcular disponibilidad:', error);
      }
    });
  }

  updateValidators() {
    this.productsFormArray.controls.forEach((control) => {
      const product = this.selectedProducts.find(sp => sp.index === this.productsFormArray.controls.indexOf(control))?.product;
      if (product) {
        const currentQuantity = product.rental_product?.quantity_rented || 0;
        const validator = this.maxStockValidator(product.available_quantity, currentQuantity);

        control.get('quantity_rented')?.setValidators([
          Validators.required,
          Validators.min(1),
          validator
        ]);
        control.get('quantity_rented')?.updateValueAndValidity({ emitEvent: false });
      }
    });

    // Actualizar el estado del formulario
    this.rentalForm.get('products')?.updateValueAndValidity();
  }
}