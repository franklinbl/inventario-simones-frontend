import { Component, inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
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
import { MatDialog, MatDialogConfig, MatDialogModule } from '@angular/material/dialog';
import { CreateUpdateUserComponent } from './components/create-update-user/create-update-user.component';
import { UserService } from './services/user.service';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { AlertService } from '../../shared/services/alert.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    ButtonComponent,
    TableComponent,
    PaginationComponent,
    MatDialogModule
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  readonly dialog = inject(MatDialog);
  readonly alertService = inject(AlertService);
  readonly matIconRegistry = inject(MatIconRegistry);
  readonly domSanitizer = inject(DomSanitizer);

  users: UserAttributes[] = [];
  isLoadingData = false;
  modalTitle = 'Nuevo Usuario';
  userForm: FormGroup;
  pagination!: Pagination;
  selectedUser!: UserAttributes;

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
          tooltip: 'Restablecer contraseña',
          onClick: (row) => this.openConfirmResetPasswordDialog(row)
        }
      ]
    }
  ];

  @ViewChild('confirmResetPasswordDialog') confirmResetPasswordDialog!: TemplateRef<any>;

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
          this.alertService.error(error.message);
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

  onPageChange(page: number) {
    this.loadUsers(page);
  }

  resetPassword(user: UserAttributes): void {
    this.userService.resetPassword(user).subscribe({
      next: (response) => {
        this.alertService.success(response.message);
      },
      error: (error) => {
        this.alertService.error(error.message);
        console.error('Error al crear renta:', error);
      }
    })
  }

  openConfirmResetPasswordDialog(user: UserAttributes) {
    this.selectedUser = user;

    const dialogRef = this.dialog.open(this.confirmResetPasswordDialog, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'yes') {
        this.resetPassword(this.selectedUser);
      }
    });
  }
}