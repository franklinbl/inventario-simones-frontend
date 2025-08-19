import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService, User } from '../../services/user.service';
import { finalize } from 'rxjs';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { TableComponent } from '../../shared/components/table/table.component';
import { TableColumn } from '../../shared/components/table/models/table.model';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { Pagination } from '../../shared/interfaces/Pagination.interface';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    ButtonComponent,
    TableComponent,
    PaginationComponent
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  isLoading = false;
  errorMessage = '';
  isModalOpen = false;
  modalTitle = 'Nuevo Usuario';
  userForm: FormGroup;
  pagination!: Pagination;

  columns: TableColumn[] = [
    { key: 'name', label: 'Nombre', type: 'text' },
    { key: 'username', label: 'Usuario', type: 'text' },
    { key: 'role.name', label: 'Rol', type: 'text' },
    { key: 'createdAt', label: 'Fecha de Creación', type: 'date' },
    { key: 'updatedAt', label: 'Última Actualización', type: 'date' },
    // {
    //   key: 'actions',
    //   label: 'Acciones',
    //   type: 'action',
    //   actions: [
    //     {
    //       icon: 'square-pen',
    //       tooltip: 'Editar',
    //       onClick: (row) => this.openModal()
    //     }
    //   ]
    // }
  ];

  constructor(
    private userService: UserService,
    private fb: FormBuilder
  ) {
    this.userForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role_id: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(page: number = 1): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.userService.getUsers({page})
      .pipe(
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          this.users = response.users;
          this.pagination = response.pagination;
        },
        error: (error) => {
          console.error('Error loading users:', error);
          this.errorMessage = 'Error al cargar los usuarios';
        }
      });
  }

  openModal(): void {
    this.isModalOpen = true;
    this.userForm.reset({ role_id: 1 });
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.userForm.reset();
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.isLoading = true;
      this.userService.createUser(this.userForm.value)
        .pipe(
          finalize(() => {
            this.isLoading = false;
            this.closeModal();
          })
        )
        .subscribe({
          next: () => {
            this.loadUsers();
          },
          error: (error) => {
            console.error('Error creating user:', error);
            this.errorMessage = 'Error al crear el usuario';
          }
        });
    }
  }

  getErrorMessage(controlName: string): string {
    const control = this.userForm.get(controlName);
    if (control?.hasError('required')) {
      return 'Este campo es requerido';
    }
    if (control?.hasError('minlength')) {
      return `Mínimo ${control.getError('minlength').requiredLength} caracteres`;
    }
    return '';
  }

  onPageChange(page: number) {
    this.loadUsers(page);
  }
}