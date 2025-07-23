import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpResponse } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RentalService } from './services/rental.service';
import { RentalAttributes } from './models/rental.model';
import { ProductAttributes } from '../inventory/models/product.model';
import { AuthService } from '../../services/auth.service';

import { AddUpdateRentalComponent } from './components/add-update-rental/add-update-rental.component';
import { MatDialog, MatDialogConfig, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-rentals',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule
  ],
  templateUrl: './rentals.component.html',
  styleUrls: ['./rentals.component.scss']
})
export class RentalsComponent implements OnInit {
  private rentalService = inject(RentalService);
  private authService = inject(AuthService);
  readonly dialog = inject(MatDialog);

  rentals: (RentalAttributes & { expanded?: boolean })[] = [];
  products: ProductAttributes[] = [];
  selectedProducts: { product: ProductAttributes; index: number }[] = [];
  isAdmin = false;

  customInputValue: string = '';

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

  createEditRental (rental?: RentalAttributes | null) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.enterAnimationDuration = 0;

    const title = (!rental ? 'Nueva renta' : 'Actualizar renta')

    dialogConfig.data = {
      rental: rental || null,
      title
    };

    const dialogRef =  this.dialog.open(AddUpdateRentalComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      if (!rental) {
        this.rentals.unshift(result);
      } else {
        const index = this.rentals.findIndex(rental => rental.id === result.id);
        if (index !== -1) {
          this.rentals[index] = result;
        }
      }
    });
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
}