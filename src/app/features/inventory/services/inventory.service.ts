import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ProductAttributes } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/inventory/products`;

  getProducts(): Observable<ProductAttributes[]> {
    return this.http.get<ProductAttributes[]>(this.apiUrl);
  }

  createProduct(product: Omit<ProductAttributes, 'id'>): Observable<ProductAttributes> {
    return this.http.post<ProductAttributes>(this.apiUrl, product);
  }
}