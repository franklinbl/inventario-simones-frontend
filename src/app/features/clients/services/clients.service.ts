import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Client {
  id: number;
  name: string;
  dni: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientDto {
  name: string;
  dni: string;
  phone: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClientsService {
  private readonly API_URL = `${environment.apiUrl}/client`;

  constructor(private http: HttpClient) {}

  getClients(): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.API_URL}`);
  }

  getClientByDni(dni: string): Observable<Client> {
    return this.http.get<Client>(`${this.API_URL}/${dni}/dni`);
  }

  createClient(clientData: CreateClientDto): Observable<Client> {
    return this.http.post<Client>(`${this.API_URL}`, clientData);
  }
}