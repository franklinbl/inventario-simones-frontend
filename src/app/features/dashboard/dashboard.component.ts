import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from './services/dashboard.service';
import { DashboardAttributes } from './models/dashboard.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  private dashboardService = inject(DashboardService);
  infoDashboard: DashboardAttributes = {
    pendingRentals: 0,
    monthlyEvents: 0,
    lowStockProducts: 0
  };

  ngOnInit(): void {
    this.dashboardService.getInfoDashboard().subscribe((data) => {
      this.infoDashboard = data;
    });
  }
}