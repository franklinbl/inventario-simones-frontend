import { Component, inject, OnInit } from '@angular/core';
import { ClientsService } from './services/clients.service';
import { CommonModule } from '@angular/common';
import { ClientAttributes } from './Models/client.model';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { EditClientComponent } from './components/edit-client/edit-client.component';
import { TableColumn } from '../../shared/components/table/models/table.model';
import { TableComponent } from '../../shared/components/table/table.component';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, TableComponent],
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.scss']
})
export class ClientsComponent implements OnInit {
  private clientsService = inject(ClientsService);
  readonly dialog = inject(MatDialog);

  clients: ClientAttributes[] = [];
  isLoading = false;
  errorMessage = '';
  columns: TableColumn[] = [
    { key: 'name', label: 'Nombre', type: 'text' },
    { key: 'dni', label: 'Cédula', type: 'text' },
    { key: 'phone', label: 'Teléfono', type: 'text' },
    { key: 'rentalCount', label: 'Total de rentas', type: 'text' },
    {
      key: 'actions',
      label: 'Acciones',
      type: 'action',
      actions: [
        {
          icon: 'square-pen',
          tooltip: 'Editar',
          onClick: (row) => this.updateClient(row.id)
        }
      ]
    }
  ];

  ngOnInit(): void {
    this.clientsService.getClients()
      .pipe(
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (clients) => {
          this.clients = clients.clients;
        },
        error: (error) => {
          console.error('Error loading users:', error);
          this.errorMessage = 'Error al cargar los Clientes';
        }
      });
  }

  updateClient(client: ClientAttributes) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.enterAnimationDuration = 0;

    const title = 'Editar cliente'

    dialogConfig.data = {
      client,
      title
    };

    const dialogRef =  this.dialog.open(EditClientComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      const index = this.clients.findIndex(client => client.id === result.id);
      if (index !== -1) {
        this.clients[index] = { ...this.clients[index], ...result };
      }
    });
  }
}