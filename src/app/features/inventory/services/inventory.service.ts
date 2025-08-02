import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ProductAttributes } from '../models/product.model';

export interface PaginationResponse {
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  products: ProductAttributes[];
}

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/inventory/products`;

  getProducts(page: number = 1, limit?: number): Observable<PaginationResponse> {
    let params = new HttpParams().set('page', page.toString());

    if (limit) {
      params = params.set('limit', limit.toString());
    }

    return this.http.get<PaginationResponse>(this.apiUrl, { params });
  }

  createProduct(product: Omit<ProductAttributes, 'id'>): Observable<{message: string, product: ProductAttributes}> {
    return this.http.post<{message: string, product: ProductAttributes}>(this.apiUrl, product);
  }

  updateProduct(id: number, product: Omit<ProductAttributes, 'id'>): Observable<{message: string, product: ProductAttributes}> {
    return this.http.put<{message: string, product: ProductAttributes}>(`${this.apiUrl}/${id}`, product);
  }
}