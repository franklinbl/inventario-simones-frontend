import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CreateUserDto, UserAttributes } from '../models/users.model';
import { Pagination, PaginationParams } from '../../../shared/interfaces/Pagination.interface';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_URL = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  getUsers(pagination?: PaginationParams): Observable<{message: string, users: UserAttributes[], pagination: Pagination}> {
    const params: any = {};

    if (pagination) {
      if (pagination.page) params.page = pagination.page;
      if (pagination.limit) params.limit = pagination.limit;
    }

    return this.http.get<{message: string, users: UserAttributes[], pagination: Pagination}>(`${this.API_URL}/users`, { params });
  }

  createUser(userData: CreateUserDto): Observable<{message: string, user: UserAttributes}> {
    return this.http.post<{message: string, user: UserAttributes}>(`${this.API_URL}/register`, userData);
  }
}