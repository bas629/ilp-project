import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ExpenseService } from '../../core/services/expense.service';
import { InvestmentService } from '../../core/services/investment.service';
import { GoldService } from '../../core/services/gold.service';
import { AuthService } from '../../core/services/auth.service';
import { ExpenseDto } from '../../core/models/expense.model';
import { InvestmentDto } from '../../core/models/investment.model';
import { InrFormatPipe } from '../../shared/pipes/inr-format.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, InrFormatPipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private expenseService    = inject(ExpenseService);
  private investmentService = inject(InvestmentService);
  private goldSvc           = inject(GoldService);
  private auth              = inject(AuthService);

  loading = signal(true);
  error   = signal('');

  expenses:    ExpenseDto[]    = [];
  investments: InvestmentDto[] = [];
  wellnessData = signal<any | null>(null);
  showAlerts   = signal(false);
  private alertTimerId: any = null;

  get totalIncome():    number { return this.wellnessData()?.totalIncome ?? this.expenses.filter(e => this.isIncome(e)).reduce((s, e) => s + (e.profit != null ? e.profit : (e.amount ?? 0)), 0); }
  get totalExpenses():  number { return this.wellnessData()?.totalExpenses ?? this.expenses.filter(e => !this.isIncome(e)).reduce((s, e) => s + (e.amount ?? 0), 0); }
  get totalInvested():  number { return this.wellnessData()?.totalInvested ?? this.investments.reduce((s, i) => s + (i.investedAmount ?? 0), 0); }
  get totalBalance():   number { return this.wellnessData()?.walletBalance ?? (this.totalIncome - this.totalExpenses - this.totalInvested); }
  get netPosition():    number { return this.totalIncome - this.totalExpenses; }
  get expenseRatio():   number { return this.totalIncome > 0 ? Math.round((this.totalExpenses / this.totalIncome) * 100) : 0; }
  get isOverSpending(): boolean { return this.expenseRatio > 75; }

  get activeAlerts(): { title: string; desc: string; type: 'danger' | 'warn' | 'info'; icon: string }[] {
    if (!this.showAlerts()) return [];
    const alerts: { title: string; desc: string; type: 'danger' | 'warn' | 'info'; icon: string }[] = [];

    const user = this.auth.getCurrentUser();
    const isNewUser = user?.isNewUser || (this.expenses.length === 0 && this.investments.length === 0);
    
    let rules: any[] = [];
    const saved = localStorage.getItem('admin_rules');
    if (saved) {
      try {
        rules = JSON.parse(saved);
      } catch (e) {
        rules = [];
      }
    } else {
      // Default fallback if not initialized
      rules = [
        { id: 1, name: 'High expense alert',      threshold: 75,   unit: '% of income', enabled: true },
        { id: 2, name: 'Large transaction alert', threshold: 10000, unit: '₹',          enabled: true },
        { id: 3, name: 'Low balance warning',     threshold: 5000,  unit: '₹',          enabled: true },
        { id: 4, name: 'Investment target',       threshold: 20,    unit: '% of income', enabled: false },
        { id: 5, name: 'Wellness score alert',    threshold: 50,    unit: 'score',       enabled: true }
      ];
    }
    
    const rHighExpense    = rules.find(r => r.id === 1);
    const rLargeTx        = rules.find(r => r.id === 2);
    const rLowBalance     = rules.find(r => r.id === 3);
    const rInvestTarget   = rules.find(r => r.id === 4);
    const rWellnessScore  = rules.find(r => r.id === 5);

    // 1. High Expense Alert
    if (rHighExpense && rHighExpense.enabled) {
      if (this.expenseRatio > rHighExpense.threshold) {
        alerts.push({
          title: 'High Expense Ratio Alert',
          desc: `Monthly expenses are at ${this.expenseRatio}% of income (exceeding admin limit of ${rHighExpense.threshold}%).`,
          type: 'danger',
          icon: 'ti-alert-triangle'
        });
      }
    }

    // 2. Large Transaction Alert
    if (rLargeTx && rLargeTx.enabled) {
      const largeTx = this.expenses
        .filter(e => !this.isIncome(e) && e.amount > rLargeTx.threshold)
        .sort((a, b) => b.amount - a.amount);
      if (largeTx.length > 0) {
        alerts.push({
          title: 'Large Transaction Alert',
          desc: `Detected ${largeTx.length} single transaction(s) exceeding admin threshold of ₹${rLargeTx.threshold} (e.g. "${largeTx[0].title}" - ₹${largeTx[0].amount}).`,
          type: 'warn',
          icon: 'ti-receipt'
        });
      }
    }

    // 3. Low Balance Warning
    if (rLowBalance && rLowBalance.enabled && !isNewUser) {
      if (this.totalBalance < rLowBalance.threshold) {
        alerts.push({
          title: 'Low Balance Warning',
          desc: `Your current wallet balance (₹${this.totalBalance}) is below the admin warning line of ₹${rLowBalance.threshold}.`,
          type: 'warn',
          icon: 'ti-wallet'
        });
      }
    }

    // 4. Investment Target Reminder
    if (rInvestTarget && rInvestTarget.enabled) {
      const currentInvestPct = this.totalIncome > 0 ? (this.totalInvested / this.totalIncome) * 100 : 0;
      if (currentInvestPct < rInvestTarget.threshold) {
        alerts.push({
          title: 'Investment Target Alert',
          desc: `Your total investments are ${Math.round(currentInvestPct)}% of your income. Admin targets at least ${rInvestTarget.threshold}%.`,
          type: 'info',
          icon: 'ti-target'
        });
      }
    }

    // 5. Wellness Score Alert
    if (rWellnessScore && rWellnessScore.enabled && !isNewUser) {
      if (this.wellnessScore > 0 && this.wellnessScore < rWellnessScore.threshold) {
        alerts.push({
          title: 'Low Wellness Score Alert',
          desc: `Your financial wellness score is ${this.wellnessScore}/100, which is below the admin warning line of ${rWellnessScore.threshold}.`,
          type: 'danger',
          icon: 'ti-heart'
        });
      }
    }

    return alerts;
  }

  get wellnessScore(): number {
    return this.wellnessData()?.score ?? 0;
  }

  get wellnessCategory(): string {
    return this.wellnessData()?.level ?? 'Poor';
  }

  get wellnessBadgeClass(): string {
    const cat = this.wellnessCategory;
    if (cat === 'Excellent' || cat === 'Good') return 'badge-green';
    if (cat === 'Fair' || cat === 'Average') return 'badge-amber';
    return 'badge-red';
  }

  get riskLevel(): string {
    const avgRisk = this.investments.length > 0
      ? this.investments.reduce((s, i) => s + (i.riskPercent ?? 0), 0) / this.investments.length
      : 0;
    if (avgRisk < 3)  return 'Low';
    if (avgRisk < 7) return 'Medium';
    return 'High';
  }

  get riskBadgeClass(): string {
    if (this.riskLevel === 'Low')    return 'badge-green';
    if (this.riskLevel === 'Medium') return 'badge-amber';
    return 'badge-red';
  }

  get monthlyChartData(): { label: string; amount: number; heightPct: number }[] {
    const months: { label: string; amount: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleString('default', { month: 'short' });
      const yr    = d.getFullYear();
      const mo    = d.getMonth() + 1;
      const amount = this.expenses
        .filter(e => !this.isIncome(e))
        .filter(e => {
          const [ey, em] = (e.expenseDate ?? '').split('-').map(Number);
          return ey === yr && em === mo;
        })
        .reduce((s, e) => s + (e.amount ?? 0), 0);
      months.push({ label, amount });
    }
    const max = Math.max(...months.map(m => m.amount), 1);
    return months.map(m => ({ ...m, heightPct: Math.round((m.amount / max) * 100) }));
  }

  get recentTransactions(): ExpenseDto[] {
    return [...this.expenses]
      .sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime())
      .slice(0, 5);
  }

  isIncome(e: ExpenseDto): boolean {
    const INCOME_CATS = ['Salary', 'Freelance', 'Business', 'Rental', 'Other', 'Stock_Sale'];
    return INCOME_CATS.includes(e.category ?? '');
  }

  startAlertTimer(): void {
    if (this.alertTimerId) {
      clearTimeout(this.alertTimerId);
    }
    this.showAlerts.set(true);
    this.alertTimerId = setTimeout(() => {
      this.showAlerts.set(false);
      this.alertTimerId = null;
    }, 10000); // Keep alerts visible for exactly 10 seconds
    this.auth.clearNewUserFlag();
  }

  ngOnInit(): void {
    this.loading.set(true);
    this.error.set('');
    this.showAlerts.set(false); // Hide initially until data is loaded

    const userId = this.auth.getCurrentUserId();

    if (!userId) {
      this.error.set('Session expired. Please log in again.');
      this.loading.set(false);
      return;
    }

    this.expenseService.getExpensesByUser(userId).subscribe({
      next: (data) => {
        this.expenses = data ?? [];
        this.investmentService.getInvestmentsByUser(userId).subscribe({
          next: (inv) => {
            this.investments = inv ?? [];
            this.goldSvc.getWellnessScore(userId).subscribe({
              next: (well) => {
                this.wellnessData.set(well);
                this.loading.set(false);
                this.startAlertTimer();
              },
              error: () => {
                this.loading.set(false);
                this.startAlertTimer();
              }
            });
          },
          error: () => {
            this.investments = [];
            this.loading.set(false);
            this.startAlertTimer();
          }
        });
      },
      error: () => {
        this.expenses    = [];
        this.investments = [];
        this.error.set('Could not load latest data. Showing empty state.');
        this.loading.set(false);
        this.startAlertTimer();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.alertTimerId) {
      clearTimeout(this.alertTimerId);
      this.alertTimerId = null;
    }
    this.loading.set(true);
    this.error.set('');
    this.expenses    = [];
    this.investments = [];
  }
}
