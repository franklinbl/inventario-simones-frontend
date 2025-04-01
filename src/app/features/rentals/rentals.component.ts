import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RentalService } from './services/rental.service';
import { RentalAttributes } from './models/rental.model';

@Component({
  selector: 'app-rentals',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './rentals.component.html',
  styleUrls: ['./rentals.component.scss']
})
export class RentalsComponent implements OnInit {
  private rentalService = inject(RentalService);
  rentals: (RentalAttributes & { expanded?: boolean })[] = [];
  isModalOpen = false;

  ngOnInit(): void {
    this.loadRentals();
  }

  private loadRentals(): void {
    this.rentalService.getRentals().subscribe({
      next: (data) => {
        this.rentals = data.map(rental => ({ ...rental, expanded: false }));
      },
      error: (error) => {
        console.error('Error al cargar rentas:', error);
      }
    });
  }

  toggleDetails(rental: RentalAttributes & { expanded?: boolean }): void {
    rental.expanded = !rental.expanded;
  }

  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'active':
        return 'status-active';
      case 'returned':
        return 'status-returned';
      case 'overdue':
        return 'status-overdue';
      default:
        return '';
    }
  }
}