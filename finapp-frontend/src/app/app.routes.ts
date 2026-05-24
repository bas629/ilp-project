import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { AdminGuard } from './core/guards/admin.guard';
import { ShellComponent } from './features/shell/shell.component';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent) },

  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'register/success', loadComponent: () => import('./features/auth/acknowledgement/acknowledgement.component').then(m => m.AcknowledgementComponent) },

  {
    path: 'app',
    component: ShellComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '',          redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'expenses',  loadComponent: () => import('./features/expenses/expenses.component').then(m => m.ExpensesComponent) },
      { path: 'records',   loadComponent: () => import('./features/financial-records/financial-records.component').then(m => m.FinancialRecordsComponent) },
      { path: 'stocks',    loadComponent: () => import('./features/stocks/stocks.component').then(m => m.StocksComponent) },
      { path: 'gold',      loadComponent: () => import('./features/gold/gold.component').then(m => m.GoldComponent) },
      { path: 'portfolio', loadComponent: () => import('./features/portfolio/portfolio.component').then(m => m.PortfolioComponent) },
      { path: 'wellness',  loadComponent: () => import('./features/wellness/wellness.component').then(m => m.WellnessComponent) },
      { path: 'risk',      loadComponent: () => import('./features/risk-profile/risk-profile.component').then(m => m.RiskProfileComponent) },
      { path: 'goals',     loadComponent: () => import('./features/goals/goals.component').then(m => m.GoalsComponent) },
      { path: 'profile',   loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent) },
      { path: 'admin/rules',      loadComponent: () => import('./features/admin/rules/rules.component').then(m => m.RulesComponent),           canActivate: [AdminGuard] },
      { path: 'admin/monitoring', loadComponent: () => import('./features/admin/monitoring/monitoring.component').then(m => m.MonitoringComponent), canActivate: [AdminGuard] },
      { path: 'admin/security',   loadComponent: () => import('./features/admin/security/security.component').then(m => m.SecurityComponent),     canActivate: [AdminGuard] },
    ]
  },

  { path: '**', redirectTo: 'login' }
];
