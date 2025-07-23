import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ClientAttributes } from '../Models/client.model';

@Injectable({
  providedIn: 'root'
})
export class ClientsService {
  private readonly API_URL = `${environment.apiUrl}/client`;

  constructor(private http: HttpClient) {}

  getClients(): Observable<ClientAttributes[]> {
    return this.http.get<ClientAttributes[]>(`${this.API_URL}`);
  }

  getClientByDni(dni: string): Observable<ClientAttributes> {
    return this.http.get<ClientAttributes>(`${this.API_URL}/${dni}/dni`);
  }

  createClient(clientData: ClientAttributes): Observable<ClientAttributes> {
    return this.http.post<ClientAttributes>(`${this.API_URL}`, clientData);
  }
}