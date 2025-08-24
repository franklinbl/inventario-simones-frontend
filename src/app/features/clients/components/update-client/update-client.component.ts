import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ClientAttributes } from '../../Models/client.model';
import { ClientsService } from '../../services/clients.service';

@Component({
  selector: 'app-update-client',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule],
  templateUrl: './update-client.component.html',
  styleUrls: ['./update-client.component.scss']
})
export class UpdateClientComponent implements OnInit {
  @Output() save = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();
  private clientsService = inject(ClientsService);
  readonly dialogRef = inject(MatDialogRef<UpdateClientComponent>);
  private client: ClientAttributes = inject(MAT_DIALOG_DATA).client;
  modalTitle = inject(MAT_DIALOG_DATA).title;

  clientForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.clientForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      dni: ['', [Validators.required, Validators.minLength(7)]],
      phone: ['', [Validators.required, Validators.minLength(7)]]
    });
  }

  ngOnInit(): void {
    this.clientForm.patchValue({
      name: this.client.name || '',
      dni: this.client.dni || '',
      phone: this.client.phone || ''
    });
  }

  onSubmit() {
    if (this.clientForm.valid) {
      this.clientsService.updateClient(this.client.id, this.clientForm.value).subscribe({
        next: (response) => {
          this.clientForm.reset();
          this.closeModal(response.client);
        },
        error: (error) => {
          console.error('Error al crear renta:', error);
        }
      })
    }
  }

  closeModal(data?: ClientAttributes) {
    this.dialogRef.close(data);
  }

  getErrorMessage(controlName: string): string {
    const control = this.clientForm.get(controlName);
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
}