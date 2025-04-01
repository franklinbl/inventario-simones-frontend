import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
}