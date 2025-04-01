import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RentalAttributes } from '../models/rental.model';

@Injectable({
  providedIn: 'root'
})
export class RentalService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/rentals`;

  getRentals(): Observable<RentalAttributes[]> {
    return this.http.get<RentalAttributes[]>(this.apiUrl);
  }

  createRental(rental: Omit<RentalAttributes, 'id'>): Observable<RentalAttributes> {
    return this.http.post<RentalAttributes>(this.apiUrl, rental);
  }

  updateRental(id: number, rentalData: Partial<RentalAttributes>): Observable<RentalAttributes> {
    return this.http.put<RentalAttributes>(`${this.apiUrl}/${id}`, rentalData);
  }

  completedRental(id: number): Observable<RentalAttributes> {
    return this.http.put<RentalAttributes>(`${this.apiUrl}/${id}/complete`, {});
  }

  downloadInvoice(rentalId: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiUrl}/${rentalId}/invoice`, {
      responseType: 'blob',
      observe: 'response'
    });
  }
}