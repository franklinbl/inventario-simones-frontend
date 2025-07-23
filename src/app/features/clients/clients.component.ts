import { Component, inject, OnInit } from '@angular/core';
import { ClientsService } from './services/clients.service';
import { CommonModule } from '@angular/common';
import { ClientAttributes } from './Models/client.model';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.scss']
})
export class ClientsComponent implements OnInit {
  private clientsService = inject(ClientsService);

  clients: ClientAttributes[] = [];

  ngOnInit(): void {
    this.clientsService.getClients().subscribe((clients: ClientAttributes[]) => {
      this.clients = clients;
    });
  }
}