import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, ExpenseDto } from '../../api.service';
import { NotificationService } from '../../core/notification.service';
import { NgChartsModule } from 'ng2-charts';
import { Chart, registerables, ChartConfiguration, ChartData, ChartType } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

interface CategoryShare {
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

@Component({
  selector: 'app-expense-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  templateUrl: './expense-manager.component.html',
  styleUrls: ['./expense-manager.component.css']
})
export class ExpenseManagerComponent implements OnInit {
  expenses: ExpenseDto[] = [];
  allExpenses: ExpenseDto[] = [];
  filterMonth = '';
  selectedSort = 'typeCredit';
  cashBalance = 0;
  isLoading = true;
  errorMessage: string | null = null;

  // New Expense form model
  newExpense: ExpenseDto = {
    title: '',
    amount: 0,
    category: 'Food',
    transactionType: 'DEBIT',
    expenseDate: new Date().toISOString().substring(0, 10)
  };

  categories = ['Food', 'Travel', 'Shopping', 'Bills', 'Entertainment', 'Medical', 'Others'];
  categoryShares: CategoryShare[] = [];

  // --- CHART CONFIGURATION ---
  public doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#94a3b8',
          font: {
            family: 'Plus Jakarta Sans',
            size: 11
          }
        }
      },
      tooltip: {
        backgroundColor: '#131a2e',
        titleFont: { family: 'Plus Jakarta Sans' },
        bodyFont: { family: 'Plus Jakarta Sans' }
      }
    },
    cutout: '65%'
  };

  public doughnutChartLabels: string[] = [];
  public doughnutChartData: ChartData<'doughnut'> = {
    labels: this.doughnutChartLabels,
    datasets: [
      {
        data: [],
        backgroundColor: [
          '#f43f5e', // Food - Rose
          '#8b5cf6', // Travel - Violet
          '#f59e0b', // Shopping - Amber
          '#06b6d4', // Bills - Cyan
          '#10b981', // Entertainment - Emerald
          '#ec4899', // Medical - Pink
          '#64748b'  // Others - Muted Slate
        ],
        borderWidth: 0
      }
    ]
  };
  public doughnutChartType: 'doughnut' = 'doughnut';

  constructor(
    private apiService: ApiService,
    private notifService: NotificationService
  ) {}

  ngOnInit() {
    this.loadExpensesData();
  }

  loadExpensesData() {
    this.isLoading = true;
    this.errorMessage = null;

    this.apiService.getExpenses().subscribe({
      next: (data) => {
        this.allExpenses = data.sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime());
        this.applyMonthFilter();
        
        this.apiService.getCashBalance().subscribe({
          next: (bal) => {
            this.cashBalance = bal;
            this.isLoading = false;
          },
          error: (err) => {
            console.error('Error fetching balance', err);
            this.isLoading = false;
          }
        });
      },
      error: (err) => {
        console.error('Error loading expenses ledger', err);
        this.errorMessage = 'Could not load expenses list.';
        this.isLoading = false;
        this.notifService.error(this.errorMessage!);
      }
    });
  }

  applyMonthFilter() {
    if (this.filterMonth) {
      this.expenses = this.allExpenses.filter(e => {
        if (!e.expenseDate) return false;
        return e.expenseDate.startsWith(this.filterMonth);
      });
    } else {
      this.expenses = [...this.allExpenses];
    }
    this.sortExpenses();
    this.updateChartData();
  }

  sortExpenses() {
    const sortFn = (a: ExpenseDto, b: ExpenseDto) => {
      switch (this.selectedSort) {
        case 'dateNewest':
          return new Date(b.expenseDate || '').getTime() - new Date(a.expenseDate || '').getTime();
        case 'dateOldest':
          return new Date(a.expenseDate || '').getTime() - new Date(b.expenseDate || '').getTime();
        case 'amountHigh':
          return b.amount - a.amount;
        case 'amountLow':
          return a.amount - b.amount;
        case 'typeCredit':
          if (a.transactionType === b.transactionType) return 0;
          return a.transactionType === 'CREDIT' ? -1 : 1;
        case 'typeDebit':
          if (a.transactionType === b.transactionType) return 0;
          return a.transactionType === 'DEBIT' ? -1 : 1;
        default:
          return 0;
      }
    };
    this.expenses.sort(sortFn);
  }

  onSubmit() {
    if (!this.newExpense.title || this.newExpense.amount <= 0) {
      this.notifService.error('Please enter a valid description title and positive transaction amount');
      return;
    }

    this.isLoading = true;
    this.apiService.addExpense(this.newExpense).subscribe({
      next: (created) => {
        this.notifService.success('Transaction recorded successfully');
        // Reset form except date and type
        this.newExpense.title = '';
        this.newExpense.amount = 0;
        this.loadExpensesData();
      },
      error: (err) => {
        console.error('Error adding transaction', err);
        this.notifService.error(err.error?.error || err.error?.message || 'Transaction failed. Check wallet balance if you are logging a debit.');
        this.isLoading = false;
      }
    });
  }

  onDelete(expenseId?: number) {
    if (!expenseId) return;
    if (!confirm('Are you sure you want to delete this transaction record? This will revert the cash wallet impact.')) return;

    this.isLoading = true;
    this.apiService.deleteExpense(expenseId).subscribe({
      next: () => {
        this.notifService.success('Transaction deleted successfully');
        this.loadExpensesData();
      },
      error: (err) => {
        console.error('Error deleting transaction', err);
        this.notifService.error(err.error?.error || err.error?.message || 'Failed to delete transaction. Please try again.');
        this.isLoading = false;
      }
    });
  }

  private updateChartData() {
    // Only compile debits (expenses) for category breakdown
    const debits = this.expenses.filter(e => e.transactionType === 'DEBIT');
    
    // Group totals by category
    const categoryTotals: { [key: string]: number } = {};
    this.categories.forEach(cat => categoryTotals[cat] = 0);
    
    let totalDebit = 0;
    debits.forEach(d => {
      const matchedCat = this.categories.find(c => c.toLowerCase() === d.category.toLowerCase());
      if (matchedCat) {
        categoryTotals[matchedCat] += d.amount;
        totalDebit += d.amount;
      } else {
        categoryTotals['Others'] = (categoryTotals['Others'] || 0) + d.amount;
        totalDebit += d.amount;
      }
    });

    const labels: string[] = [];
    const values: number[] = [];
    this.categoryShares = [];

    this.categories.forEach(cat => {
      const amt = categoryTotals[cat];
      if (amt > 0) {
        labels.push(cat);
        values.push(amt);
        const percentage = totalDebit > 0 ? (amt / totalDebit) * 100 : 0;
        this.categoryShares.push({
          name: cat,
          amount: amt,
          percentage: Math.round(percentage * 10.0) / 10.0,
          color: this.getColorForCategory(cat)
        });
      }
    });

    // Sort categoryShares by highest amount
    this.categoryShares.sort((a, b) => b.amount - a.amount);

    this.doughnutChartLabels = labels;
    this.doughnutChartData = {
      labels: labels,
      datasets: [
        {
          data: values,
          backgroundColor: labels.map(l => this.getColorForCategory(l)),
          borderWidth: 0
        }
      ]
    };
  }

  private getColorForCategory(cat: string): string {
    switch (cat) {
      case 'Food': return '#f43f5e';
      case 'Travel': return '#8b5cf6';
      case 'Shopping': return '#f59e0b';
      case 'Bills': return '#06b6d4';
      case 'Entertainment': return '#10b981';
      case 'Medical': return '#ec4899';
      default: return '#64748b';
    }
  }
}
