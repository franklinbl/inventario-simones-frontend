import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { UserAttributes } from '../../models/users.model';
import { UserService } from '../../services/user.service';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { InputFieldComponent } from '../../../../shared/components/input-field/input-field.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { AlertService } from '../../../../shared/services/alert.service';

@Component({
  selector: 'app-edit-client',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatIconModule,
    InputFieldComponent,
    ButtonComponent
  ],
  templateUrl: './create-update-user.component.html',
  styleUrls: ['./create-update-user.component.scss']
})
export class CreateUpdateUserComponent implements OnInit {
  readonly dialogRef = inject(MatDialogRef<CreateUpdateUserComponent>);
  private user: UserAttributes = inject(MAT_DIALOG_DATA).user;
  modalTitle = inject(MAT_DIALOG_DATA).title;
  modalSubTitle = inject(MAT_DIALOG_DATA).subTitle;
  readonly userService = inject(UserService);
  alertService = inject(AlertService);
  matIconRegistry = inject(MatIconRegistry);
  domSanitizer = inject(DomSanitizer);
  selectOption = [
    {label: 'Selecciona un rol', value: '0'},
    {label: 'Administrador', value: '1'},
    {label: 'Empleado', value: '2'},
  ];

  userForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.userForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      role_id: [null, [Validators.required, this.roleValidator(['1', '2'])]]
    });
  }

  ngOnInit(): void {
    const iconFolder = '/assets/icons/';
    const icons = ['user'];

    icons.forEach(icon => {
      this.matIconRegistry.addSvgIcon(
        icon,
        this.domSanitizer.bypassSecurityTrustResourceUrl(iconFolder + icon + '.svg')
      );
    });

    this.userForm.patchValue({
      name: this.user?.name || '',
      username: this.user?.username || '',
      role_id: (this.user?.role.id).toString() || ''
    });
  }

  onSubmit() {
    if (this.userForm.valid) {
      this.userService.createUser(this.userForm.value).subscribe({
        next: (response) => {
          this.userForm.reset();
          this.alertService.success(response.message);
          this.closeModal(response.user);
        },
        error: (error) => {
          this.alertService.error(error.message);
          console.error('Error al crear renta:', error);
        }
      })
    }
  }

  closeModal(data?: UserAttributes) {
    this.dialogRef.close(data);
  }

  getErrorMessage(controlName: string): string {
    const control = this.userForm.get(controlName);
    if (control?.hasError('required')) {
      return 'Este campo es requerido';
    }
    if (control?.hasError('minlength')) {
      return `Mínimo ${control.errors?.['minlength'].requiredLength} caracteres`;
    }
    if (control?.hasError('email')) {
      return 'Ingrese un email válido';
    }
    if (control?.hasError('pattern')) {
      return 'Ingrese un número de teléfono válido';
    }
    if (control?.hasError('min')) {
      return 'El valor debe ser mayor o igual a 0';
    }
    if (control?.hasError('maxStock')) {
      const error = control.errors?.['maxStock'];
      return `La cantidad no puede ser mayor al stock disponible (${error.max})`;
    }
    return '';
  }

  roleValidator(allowedRoles: string[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value === null || control.value === undefined) return null;
      return allowedRoles.includes(control.value)
        ? null
        : { invalidRole: true };
    };
  }
}