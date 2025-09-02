import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { finalize } from 'rxjs';
import { AlertService } from '../../shared/services/alert.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private alertService = inject(AlertService);

  loginForm: FormGroup;
  isLoading = false;
  confirmPasswordRequire = false;

  constructor() {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      confirmPassword: [null],
    },
    { validators: null });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;

    this.authService.login(this.loginForm.value)
      .pipe(
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: () => {
          const returnUrl = this.router.parseUrl(this.router.url).queryParams['returnUrl'] || '/';
          this.router.navigateByUrl(returnUrl);
        },
        error: (error) => {
          this.alertService.error(error.message);
        }
      });
  }

  getErrorMessage(controlName: string): string {
    const control = this.loginForm.get(controlName);
    if (control?.hasError('required')) {
      return 'Este campo es requerido';
    } else if (this.loginForm.hasError('passwordMismatch') && controlName === 'confirmPassword') {
      return 'Las contraseñas no coinciden.'
    }
    return '';
  }

  loginOrRecoverPassword() {
    this.confirmPasswordRequire = !this.confirmPasswordRequire;
    this.loginForm.reset();

    if (this.confirmPasswordRequire) {
      this.loginForm.controls['confirmPassword'].setValidators([
        Validators.required
      ]);
      this.loginForm.setValidators(this.passwordMatchValidator('password', 'confirmPassword'));
    } else {
      this.loginForm.controls['confirmPassword'].clearValidators();
      this.loginForm.controls['confirmPassword'].setValue(null);
      this.loginForm.setValidators(null);
    }

    this.loginForm.controls['confirmPassword'].updateValueAndValidity();
  }

  passwordMatchValidator(passwordKey: string, confirmPasswordKey: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const password = control.get(passwordKey);
      const confirmPassword = control.get(confirmPasswordKey);

      if (!password || !confirmPassword) {
        return null;
      }

      if (password.value !== confirmPassword.value) {
        confirmPassword.setErrors({ passwordMismatch: true });
        return { passwordMismatch: true };
      } else {
        if (confirmPassword.hasError('passwordMismatch')) {
          confirmPassword.setErrors(null);
        }
        return null;
      }
    };
  }
}