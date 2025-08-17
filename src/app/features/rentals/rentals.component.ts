import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpResponse } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RentalService } from './services/rental.service';
import { RentalAttributes } from './models/rental.model';
import { ProductAttributes } from '../inventory/models/product.model';
import { AuthService } from '../../services/auth.service';
import { MatDialog, MatDialogConfig, MatDialogModule } from '@angular/material/dialog';
import { CompletedRentalComponent } from './components/completed-rental/completed-rental.component';
import { StatusRentalsPipe } from './pipes/status-rentals.pipe';
import { Router, RouterModule } from '@angular/router';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { TableColumn } from '../../shared/components/table/models/table.model';
import { TableComponent } from '../../shared/components/table/table.component';

@Component({
  selector: 'app-rentals',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    TableComponent,
    RouterModule,
    ButtonComponent
  ],
  templateUrl: './rentals.component.html',
  styleUrls: ['./rentals.component.scss']
})
export class RentalsComponent implements OnInit {
  private rentalService = inject(RentalService);
  private authService = inject(AuthService);
  readonly dialog = inject(MatDialog);
  readonly router = inject(Router);

  rentals: (RentalAttributes & { expanded?: boolean })[] = [];
  products: ProductAttributes[] = [];
  selectedProducts: { product: ProductAttributes; index: number }[] = [];
  isAdmin = false;
  isLoading = false;

  customInputValue: string = '';

  columns: TableColumn[] = [
    { key: 'client.name', label: 'Cliente', type: 'text' },
    { key: 'client.phone', label: 'Teléfono', type: 'text' },
    { key: 'start_date', label: 'fecha de renta', type: 'date' },
    { key: 'end_date', label: 'Fecha de devolución', type: 'date' },
    { key: 'delivery_price', label: 'Flete', type: 'currency' },
    { key: 'status', label: 'Estado', type: 'rentalStatus' },
    { key: 'creator.name', label: 'Creado por', type: 'text' },
    {
      key: 'actions',
      label: 'Acciones',
      type: 'action',
      actions: [
        {
          icon: 'eye',
          tooltip: 'Ver detalle',
          onClick: (row) => this.editRental(row.id)
        },
        {
          icon: 'download',
          tooltip: 'Descargar factura',
          onClick: (row) => this.downloadInvoice(row)
        }
      ]
    }
  ];

  constructor() {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.isAdmin = user?.role.name === 'Administrador';
    this.loadRentals();
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

  toggleDetails(rental: RentalAttributes & { expanded?: boolean }): void {
    rental.expanded = !rental.expanded;
  }

  editRental (rentalId?: number | null) {
    this.router.navigate(['/rentals', rentalId]);
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

  rentalCompleted(rental: RentalAttributes) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.enterAnimationDuration = 0;

    const title = 'Completar renta'

    dialogConfig.data = {
      rental,
      title
    };

    const dialogRef =  this.dialog.open(CompletedRentalComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      const index = this.rentals.findIndex(r => r.id === result.id);
      if (index !== -1) {
        this.rentals[index].status = result.status,
        this.rentals[index].date_returned = result.date_returned,
        this.rentals[index].return_notes = result.return_notes,
        this.rentals[index].products = result.products
      }
    });
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
      const quantity = product.rental_product?.quantity_rented || 0;
      const price = product.price || 0;
      return total + (quantity * price);
    }, 0);

    if (rental.discount > 0) {
      return (totalPriceItems - (totalPriceItems * (rental.discount / 100)) + (Number(rental.delivery_price) || 0));
    }

    return totalPriceItems + (Number(rental.delivery_price) || 0);
  }
}