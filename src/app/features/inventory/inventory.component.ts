import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from './services/inventory.service';
import { ProductAttributes } from './models/product.model';
import { AuthService } from '../../services/auth.service';
import { AddUpdateProductComponent } from './components/add-update-inventary/add-update-inventory.component';
import { MatDialog, MatDialogConfig, MatDialogModule } from '@angular/material/dialog';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { TableColumn } from '../../shared/components/table/models/table.model';
import { TableComponent } from '../../shared/components/table/table.component';
import { finalize } from 'rxjs';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { Pagination } from '../../shared/interfaces/Pagination.interface';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    FormsModule,
    ButtonComponent,
    TableComponent,
    PaginationComponent
  ],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss']
})
export class InventoryComponent implements OnInit {
  private inventoryService = inject(InventoryService);
  readonly dialog = inject(MatDialog);
  private authService = inject(AuthService);
  products: ProductAttributes[] = [];
  editingProductId: number | null = null;
  pagination!: Pagination;
  isAdmin = false;
  isModalOpen = false;
  hasNextPage = false;
  hasPreviousPage = false;
  isLoading = false;
  searchQuery = '';
  errorMessage = '';

  columns: TableColumn[] = [
    { key: 'code', label: 'Código', type: 'text' },
    { key: 'name', label: 'Nombre', type: 'text' },
    { key: 'description', label: 'Descripción', type: 'text' },
    { key: 'price', label: 'Precio', type: 'currency' },
    { key: 'available_quantity', label: 'Cantidad Disponible', type: 'text' },
    { key: 'total_quantity', label: 'Cantidad Total', type: 'text' },
    {
      key: 'actions',
      label: 'Acciones',
      type: 'action',
      actions: [
        {
          icon: 'square-pen',
          tooltip: 'Editar',
          onClick: (row) => this.createEditProduct(row)
        }
      ]
    }
  ];

  constructor() {

  }

  ngOnInit(): void {
    this.loadProducts();
    const user = this.authService.getCurrentUser();
    this.isAdmin = user?.role.name === 'Administrador';
  }

  private loadProducts(page: number = 1): void {
    const currentlyDate = new Date().toISOString().split('T')[0];
    this.inventoryService.getAvailableProducts(currentlyDate, currentlyDate, this.searchQuery, { page, limit: 30 })
    .pipe(
      finalize
      (() => this.isLoading = false)
    )
    .subscribe({
      next: (response) => {
        this.products = response.products;
        this.pagination = response.pagination;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.errorMessage = 'Error al cargar los productos';
      }
    });
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

  onPageChange(page: number) {
    this.loadProducts(page);
  }

  searchProduct() {
    this.loadProducts();
  }
}