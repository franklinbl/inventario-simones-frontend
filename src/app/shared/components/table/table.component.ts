import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { MatIcon, MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { TableColumn } from './models/table.model';

@Component({
  selector: 'app-table',
  imports: [CommonModule, MatIcon],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss'
})
export class TableComponent implements OnInit {
  matIconRegistry = inject(MatIconRegistry);
  domSanitizer = inject(DomSanitizer);

  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];

  // Evento para cuando se haga click en acción
  @Output() action = new EventEmitter<any>();

  ngOnInit() {
    const iconFolder = '/assets/icons/';
    const icons = ['square-pen'];

    icons.forEach(icon => {
      this.matIconRegistry.addSvgIcon(
        icon,
        this.domSanitizer.bypassSecurityTrustResourceUrl(iconFolder + icon + '.svg')
      );
    });
  }
}
