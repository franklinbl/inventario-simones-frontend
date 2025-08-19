import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Pagination, PaginationParams } from '../shared/interfaces/Pagination.interface';

export interface User {
  id: number;
  name: string;
  username: string;
  role: {
    id: number;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  name: string;
  username: string;
  password: string;
  role_id: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_URL = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  getUsers(pagination?: PaginationParams): Observable<{message: string, users: User[], pagination: Pagination}> {
    const params: any = {};

    if (pagination) {
      if (pagination.page) params.page = pagination.page;
      if (pagination.limit) params.limit = pagination.limit;
    }

    return this.http.get<{message: string, users: User[], pagination: Pagination}>(`${this.API_URL}/users`, { params });
  }

  createUser(userData: CreateUserDto): Observable<User> {
    return this.http.post<User>(`${this.API_URL}/register`, userData);
  }
}