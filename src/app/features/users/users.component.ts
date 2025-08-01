import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService, User } from '../../services/user.service';
import { finalize } from 'rxjs';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
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

  loadUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.userService.getUsers()
      .pipe(
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (users) => {
          this.users = users;
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
}