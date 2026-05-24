import { Component, EventEmitter, inject, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';

const ROUTE_TITLES: Record<string, string> = {
  '/app/dashboard':        'Dashboard',
  '/app/expenses':         'Expenses & add entry',
  '/app/records':          'Financial records',
  '/app/stocks':           'Stock investments',
  '/app/gold':             'Gold investments',
  '/app/portfolio':        'Investment portfolio',
  '/app/wellness':         'Wellness score',
  '/app/risk':             'Risk profile',
  '/app/goals':            'Financial goals',
  '/app/profile':          'My profile',
  '/app/admin/rules':      'Rules & thresholds',
  '/app/admin/monitoring': 'System monitoring',
  '/app/admin/security':   'Data security',
};

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss']
})
export class TopbarComponent {
  @Output() menuClick = new EventEmitter<void>();
  private router = inject(Router);
  private auth   = inject(AuthService);

  pageTitle$ = this.router.events.pipe(
    filter(e => e instanceof NavigationEnd),
    startWith(null),
    map(() => ROUTE_TITLES[this.router.url] ?? 'FinApp')
  );

  get initials(): string {
    const name = this.auth.getCurrentUser()?.name ?? '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  }

  logout(): void { this.auth.logout(); }
}
