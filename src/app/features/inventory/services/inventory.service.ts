import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ProductAttributes } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getProducts(): Observable<ProductAttributes[]> {
    return this.http.get<ProductAttributes[]>(`${this.apiUrl}/inventory/products`);
  }
}