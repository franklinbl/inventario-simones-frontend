import { Component, inject, OnInit } from '@angular/core';
import { Alert, AlertService } from '../../services/alert.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alert',
  imports: [CommonModule],
  templateUrl: './alert.component.html',
  styles: [`
    @keyframes slide-in {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    .animate-slide-in {
      animation: slide-in 0.3s ease-out;
    }
  `]
})
export class AlertComponent implements OnInit {
  alertService = inject(AlertService);
  alerts: Alert[] = [];

  constructor() {}

  ngOnInit(): void {
    this.alertService.alerts$.subscribe(alert => {
      this.alerts.push(alert);

      // auto-remove después de duración
      setTimeout(() => this.close(alert), alert.duration || 3000);
    });
  }

  close(alert: Alert) {
    this.alerts = this.alerts.filter(a => a !== alert);
  }

  getTitle(type: Alert['type'] | undefined): string {
    switch (type) {
      case 'success': return 'Operación exitosa';
      case 'error': return 'Ocurrió un error';
      case 'warning': return 'Advertencia';
      default: return 'Información';
    }
  }
}
