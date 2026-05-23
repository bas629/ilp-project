import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/landing-page/landing-page.component').then(m => m.LandingPageComponent),
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: '',
    loadComponent: () => import('./components/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./components/summary/summary.component').then(m => m.SummaryComponent)
      },
      {
        path: 'expenses',
        loadComponent: () => import('./components/expense-manager/expense-manager.component').then(m => m.ExpenseManagerComponent)
      },
      {
        path: 'stocks',
        loadComponent: () => import('./components/stock-market/stock-market.component').then(m => m.StockMarketComponent)
      },
      {
        path: 'gold',
        loadComponent: () => import('./components/gold-investment/gold-investment.component').then(m => m.GoldInvestmentComponent)
      },
      {
        path: 'goals',
        loadComponent: () => import('./components/goal-tracker/goal-tracker.component').then(m => m.GoalTrackerComponent)
      },
      {
        path: 'portfolio',
        loadComponent: () => import('./components/portfolio/portfolio.component').then(m => m.PortfolioComponent)
      },
      {
        path: 'change-password',
        loadComponent: () => import('./components/change-password/change-password.component').then(m => m.ChangePasswordComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
