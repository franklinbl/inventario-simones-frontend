import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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

interface Pagination {
  currentPage: number,
  hasNextPage: boolean,
  hasPreviousPage: boolean,
  limit: number,
  total: number,
  totalPages: number
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_URL = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<{message: string, users: User[], pagination: Pagination}> {
    return this.http.get<{message: string, users: User[], pagination: Pagination}>(`${this.API_URL}/users`);
  }

  createUser(userData: CreateUserDto): Observable<User> {
    return this.http.post<User>(`${this.API_URL}/register`, userData);
  }
}