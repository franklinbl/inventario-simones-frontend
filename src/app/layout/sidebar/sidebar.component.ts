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
      name: 'Rentas',
      icon: '🎉',
      route: '/rentals',
      permissions: ['Administrador', 'Empleado']
    },
    {
      name: 'Inventario',
      icon: '📦',
      route: '/inventory',
      permissions: ['Administrador', 'Empleado']
    },
    // {
    //   name: 'Reportes',
    //   icon: '📈',
    //   route: '/reports',
    //   permissions: ['Administrador']
    // },
    {
      name: 'Clientes',
      icon: '👥',
      route: '/clients',
      permissions: ['Administrador']
    },
    {
      name: 'Usuarios',
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