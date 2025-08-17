import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { MatIcon, MatIconRegistry } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer } from '@angular/platform-browser';
import { TableColumn } from './models/table.model';
import { StatusRentalsPipe } from '../../../features/rentals/pipes/status-rentals.pipe';

@Component({
  selector: 'app-table',
  imports: [CommonModule, MatIcon, MatTooltipModule, StatusRentalsPipe],
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
    const icons = ['square-pen', 'eye', 'download'];

    icons.forEach(icon => {
      this.matIconRegistry.addSvgIcon(
        icon,
        this.domSanitizer.bypassSecurityTrustResourceUrl(iconFolder + icon + '.svg')
      );
    });
  }

  onActionClick(action: any, row: any) {
    if (action.onClick) {
      action.onClick(row);
    } else {
      this.action.emit({ action: action.icon, row });
    }
  }

  getNestedValue(row: any, key: string): any {
    return key.split('.').reduce((acc, part) => acc && acc[part], row);
  }
}
