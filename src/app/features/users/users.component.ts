import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { TableComponent } from '../../shared/components/table/table.component';
import { TableColumn } from '../../shared/components/table/models/table.model';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { Pagination } from '../../shared/interfaces/Pagination.interface';
import { UserAttributes } from './models/users.model';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { CreateUpdateUserComponent } from './components/create-update-user/create-update-user.component';
import { UserService } from './services/user.service';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

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
  readonly dialog = inject(MatDialog);
  readonly matIconRegistry = inject(MatIconRegistry);
  readonly domSanitizer = inject(DomSanitizer);
  users: UserAttributes[] = [];
  isLoadingData = false;
  errorMessage = '';
  modalTitle = 'Nuevo Usuario';
  userForm: FormGroup;
  pagination!: Pagination;

  columns: TableColumn[] = [
    { key: 'name', label: 'Nombre', type: 'text' },
    { key: 'username', label: 'Usuario', type: 'text' },
    { key: 'role.name', label: 'Rol', type: 'text' },
    { key: 'createdAt', label: 'Fecha de Creación', type: 'date' },
    { key: 'updatedAt', label: 'Última Actualización', type: 'date' },
    {
      key: 'actions',
      label: 'Acciones',
      type: 'action',
      actions: [
        {
          icon: 'square-pen',
          tooltip: 'Editar',
          onClick: (row) => this.createUpdateUser(row)
        },
        {
          icon: 'rotate-ccw-key',
          tooltip: 'Restablecer contraseña'
        }
      ]
    }
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

    const iconFolder = '/assets/icons/';
    const icons = ['square-pen', 'rotate-ccw-key'];

    icons.forEach(icon => {
      this.matIconRegistry.addSvgIcon(
        icon,
        this.domSanitizer.bypassSecurityTrustResourceUrl(iconFolder + icon + '.svg')
      );
    });
  }

  loadUsers(page: number = 1): void {
    this.isLoadingData = true;
    this.errorMessage = '';

    this.userService.getUsers({page})
      .pipe(
        finalize(() => this.isLoadingData = false)
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

  createUpdateUser(user: UserAttributes | null): void {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.enterAnimationDuration = 0;
    dialogConfig.width = '450px';

    let title = user ? 'Editar usuario' : 'Nuevo usuario';
    let subTitle = user ? 'Registra un nuevo usuario en la base de datos.' : 'Actualiza un usuario de la base de datos.';

    dialogConfig.data = {
      user,
      title,
      subTitle
    };

    const dialogRef =  this.dialog.open(CreateUpdateUserComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      if (!user) {
        this.users.unshift(result);
      } else {
        const index = this.users.findIndex(u => u.id === result.id);
        if (index !== -1) {
          this.users[index] = result;
        }
      }
    });
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.userService.createUser(this.userForm.value)
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