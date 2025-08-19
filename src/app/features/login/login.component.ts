import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { finalize } from 'rxjs';

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

  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor() {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value)
      .pipe(
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (success) => {
          if (success) {
            const returnUrl = this.router.parseUrl(this.router.url).queryParams['returnUrl'] || '/';
            this.router.navigateByUrl(returnUrl);
          } else {
            this.errorMessage = 'Usuario o contraseña incorrectos';
          }
        },
        error: () => {
          this.errorMessage = 'Ocurrió un error al intentar iniciar sesión';
        }
      });
  }

  getErrorMessage(controlName: string): string {
    console.log(controlName);
    const control = this.loginForm.get(controlName);
    if (control?.hasError('required')) {
      return 'Este campo es requerido';
    }
    return '';
  }
}