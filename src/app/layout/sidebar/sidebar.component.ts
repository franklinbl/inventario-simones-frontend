import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { UserAttributes } from '../../features/users/models/users.model';
import { MatIcon, MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIcon],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  private matIconRegistry = inject(MatIconRegistry);
  private domSanitizer = inject(DomSanitizer);
  private authService = inject(AuthService);

  isCollapsed = false;
  user: UserAttributes | null = null;

  menuItems = [
    {
      name: 'Dashboard',
      icon: 'chart-column',
      route: '/dashboard',
      permissions: ['Administrador', 'Empleado']
    },
    {
      name: 'Rentas',
      icon: 'calendar',
      route: '/rentals',
      permissions: ['Administrador', 'Empleado']
    },
    {
      name: 'Inventario',
      icon: 'package',
      route: '/inventory',
      permissions: ['Administrador', 'Empleado']
    },
    // {
    //   name: 'Reportes',
    //   icon: 'chart-spline',
    //   route: '/reports',
    //   permissions: ['Administrador']
    // },
    {
      name: 'Clientes',
      icon: 'users',
      route: '/clients',
      permissions: ['Administrador', 'Empleado']
    },
    {
      name: 'Usuarios',
      icon: 'shield-user',
      route: '/users',
      permissions: ['Administrador']
    }
  ];

  constructor() {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    console.log(this.user);

    const iconFolder = '/assets/icons/';
    const icons = ['chart-column', 'calendar', 'package', 'users', 'shield-user', 'sparkles', 'panel-right-open', 'panel-right-close', 'log-out'];

    icons.forEach(icon => {
      this.matIconRegistry.addSvgIcon(
        icon,
        this.domSanitizer.bypassSecurityTrustResourceUrl(iconFolder + icon + '.svg')
      );
    });
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }

  logout() {
    this.authService.logout();
  }

  get visibleMenuItems() {
    if (!this.user) return [];
    const userRole = this.user.role.name;

    return this.menuItems.filter(item =>
      item.permissions.includes(userRole)
    );
  }

}