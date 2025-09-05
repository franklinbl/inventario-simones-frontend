import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from './services/dashboard.service';
import { DashboardAttributes } from './models/dashboard.model';
import { AlertService } from '../../shared/services/alert.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  private dashboardService = inject(DashboardService);
  private alertService = inject(AlertService);
  infoDashboard: DashboardAttributes = {
    pendingRentals: 0,
    monthlyEvents: 0
  };

  ngOnInit(): void {
    this.dashboardService.getInfoDashboard()
    .subscribe({
      next: (response) => {
        this.infoDashboard = response;
      },
      error: (error) => {
        console.error('Error loading dashboard:', error);
        this.alertService.error(error.message);
      }
    });
  }
}