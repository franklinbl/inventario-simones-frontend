import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { MatIcon, MatIconRegistry } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer } from '@angular/platform-browser';
import { TableColumn } from './models/table.model';
import { StatusRentalsPipe } from '../../../features/rentals/pipes/status-rentals.pipe';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-table',
  imports: [CommonModule, MatIcon, MatTooltipModule, StatusRentalsPipe],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss'
})
export class TableComponent implements OnInit {
  matIconRegistry = inject(MatIconRegistry);
  domSanitizer = inject(DomSanitizer);
  authService = inject(AuthService);

  isAdmin = false;

  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input({ required: true }) isLoading: boolean = false;

  // Evento para cuando se haga click en acción
  @Output() action = new EventEmitter<any>();

  arraySkeleton = Array(8).fill(0);

  ngOnInit() {
    const iconFolder = '/assets/icons/';
    const icons = ['square-pen', 'eye', 'download', 'calendar-check'];

    icons.forEach(icon => {
      this.matIconRegistry.addSvgIcon(
        icon,
        this.domSanitizer.bypassSecurityTrustResourceUrl(iconFolder + icon + '.svg')
      );
    });

    const user = this.authService.getCurrentUser();
    this.isAdmin = user?.role.name === 'Administrador';
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

  statusClasses: Record<string, string> = {
    pending_return: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
    completed: 'bg-green-100 text-green-800 border border-green-300',
    with_issues: 'bg-orange-100 text-orange-800 border border-orange-300'
  };

  getStatusClasses(status: string): string {
    return this.statusClasses[status] || 'bg-blue-100 text-blue-800 border border-blue-300';
  }

  get visibleColumns(): TableColumn[] {
    return this.isAdmin
      ? this.columns
      : this.columns.filter(c => c.type !== 'action');
  }


}
