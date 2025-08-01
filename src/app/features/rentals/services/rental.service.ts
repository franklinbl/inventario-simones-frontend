import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RentalAttributes } from '../models/rental.model';
import { ClientAttributes } from '../../clients/Models/client.model';

@Injectable({
  providedIn: 'root'
})
export class RentalService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/rental`;

  getRentals(): Observable<RentalAttributes[]> {
    return this.http.get<RentalAttributes[]>(this.apiUrl);
  }

  createRental(rental: Omit<RentalAttributes, 'id'>, client: ClientAttributes): Observable<{message: string, rental: RentalAttributes}> {
    return this.http.post<{message: string,rental: RentalAttributes}>(this.apiUrl, {rental, client});
  }

  updateRental(id: number, rental: Partial<RentalAttributes>, client: ClientAttributes): Observable<{message: string, rental: RentalAttributes}> {
    return this.http.put<{message: string, rental: RentalAttributes}>(`${this.apiUrl}/${id}`, {rental, client});
  }

  completedRental(rental: RentalAttributes): Observable<{message: string, rental: RentalAttributes}> {
    return this.http.post<{message: string, rental: RentalAttributes}>(`${this.apiUrl}/complete-rental`, rental);
  }

  downloadInvoice(rentalId: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiUrl}/${rentalId}/invoice`, {
      responseType: 'blob',
      observe: 'response'
    });
  }
}