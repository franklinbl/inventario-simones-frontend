import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ClientAttributes } from '../Models/client.model';
import { Pagination, PaginationParams } from '../../../shared/interfaces/Pagination.interface';

@Injectable({
  providedIn: 'root'
})
export class ClientsService {
  private readonly API_URL = `${environment.apiUrl}/client`;

  constructor(private http: HttpClient) {}

  getClients(pagination?: PaginationParams): Observable<{message: string, clients: ClientAttributes[], pagination: Pagination}> {
    const params: any = {};

    if (pagination) {
      if (pagination.page) params.page = pagination.page;
      if (pagination.limit) params.limit = pagination.limit;
    }

    return this.http.get<{message: string, clients: ClientAttributes[], pagination: Pagination}>(`${this.API_URL}`, { params });
  }

  getClientByDni(dni: string): Observable<ClientAttributes> {
    return this.http.get<ClientAttributes>(`${this.API_URL}/${dni}/dni`);
  }

  createClient(clientData: ClientAttributes): Observable<ClientAttributes> {
    return this.http.post<ClientAttributes>(`${this.API_URL}`, clientData);
  }

  updateClient(id: number, client: Partial<ClientAttributes>): Observable<{message: string, client: ClientAttributes}> {
    return this.http.put<{message: string, client: ClientAttributes}>(`${this.API_URL}/${id}`, client);
  }
}