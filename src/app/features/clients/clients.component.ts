import { Component, inject, OnInit } from '@angular/core';
import { ClientsService } from './services/clients.service';
import { CommonModule } from '@angular/common';
import { ClientAttributes } from './Models/client.model';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { UpdateClientComponent } from './components/update-client/update-client.component';
import { TableColumn } from '../../shared/components/table/models/table.model';
import { TableComponent } from '../../shared/components/table/table.component';
import { finalize } from 'rxjs';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { Pagination } from '../../shared/interfaces/Pagination.interface';
import { AlertService } from '../../shared/services/alert.service';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, TableComponent, PaginationComponent],
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.scss']
})
export class ClientsComponent implements OnInit {
  private clientsService = inject(ClientsService);
  readonly dialog = inject(MatDialog);
  readonly alertService = inject(AlertService);

  clients: ClientAttributes[] = [];
  isLoadingData = false;
  pagination!: Pagination;
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
    this.loadClients();
  }

  loadClients(page: number = 1) {
    this.isLoadingData = true
    this.clientsService.getClients({page})
      .pipe(
        finalize(() => this.isLoadingData = false)
      )
      .subscribe({
        next: (response) => {
          this.clients = response.clients;
          this.pagination = response.pagination;
        },
        error: (error) => {
          console.error('Error loading users:', error);
          this.alertService.error(error.message);
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

    const dialogRef =  this.dialog.open(UpdateClientComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      const index = this.clients.findIndex(client => client.id === result.id);
      if (index !== -1) {
        this.clients[index] = { ...this.clients[index], ...result };
      }
    });
  }

  onPageChange(page: number) {
    this.loadClients(page);
  }
}