import { Component, inject, OnInit } from '@angular/core';
import { ClientsService } from './services/clients.service';
import { CommonModule } from '@angular/common';
import { ClientAttributes } from './Models/client.model';
import { DialogConfig } from '@angular/cdk/dialog';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { EditClientComponent } from './components/edit-client/edit-client.component';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.scss']
})
export class ClientsComponent implements OnInit {
  private clientsService = inject(ClientsService);
  readonly dialog = inject(MatDialog);

  clients: ClientAttributes[] = [];

  ngOnInit(): void {
    this.clientsService.getClients().subscribe((clients: ClientAttributes[]) => {
      this.clients = clients;
    });
  }

  updateClient(client: any) {
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