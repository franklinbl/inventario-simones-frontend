import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../services/user.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  isCollapsed = false;
  user: User | null = null;
  menuItems = [
    {
      name: 'Dashboard',
      icon: '📊',
      route: '/dashboard',
      permissions: ['Administrador', 'Empleado']
    },
    {
      name: 'Rentals',
      icon: '🎉',
      route: '/rentals',
      permissions: ['Administrador', 'Empleado']
    },
    {
      name: 'Inventory',
      icon: '📦',
      route: '/inventory',
      permissions: ['Administrador', 'Empleado']
    },
    {
      name: 'Reports',
      icon: '📈',
      route: '/reports',
      permissions: ['Administrador']
    },
    {
      name: 'Users',
      icon: '👨🏽‍🔧',
      route: '/users',
      permissions: ['Administrador']
    }
  ];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  logout() {
    this.authService.logout();
  }
}