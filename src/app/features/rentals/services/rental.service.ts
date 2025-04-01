import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RentalAttributes } from '../models/rental.model';

@Injectable({
  providedIn: 'root'
})
export class RentalService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getRentals(): Observable<RentalAttributes[]> {
    return this.http.get<RentalAttributes[]>(`${this.apiUrl}/rentals`);
  }
}