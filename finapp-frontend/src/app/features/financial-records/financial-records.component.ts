import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpenseService } from '../../core/services/expense.service';
import { AuthService } from '../../core/services/auth.service';
import { ExpenseDto } from '../../core/models/expense.model';
import { InrFormatPipe } from '../../shared/pipes/inr-format.pipe';

type TabType = 'all' | 'income' | 'expense' | 'investment';

@Component({
  selector: 'app-financial-records',
  standalone: true,
  imports: [CommonModule, FormsModule, InrFormatPipe],
  templateUrl: './financial-records.component.html',
  styleUrls: ['./financial-records.component.scss']
})
export class FinancialRecordsComponent implements OnInit {
  private expenseService = inject(ExpenseService);
  private auth           = inject(AuthService);

  loading         = signal(true);
  error           = signal('');
  activeTab       = signal<TabType>('all');
  searchTerm      = '';
  confirmDeleteId = signal<number | null>(null);
  deleteSuccess   = signal('');

  allRecords: ExpenseDto[] = [];

  readonly INCOME_CATS     = ['Salary', 'Freelance', 'Business', 'Rental', 'Other', 'Stock_Sale'];
  readonly INVESTMENT_KEYS = ['stock', 'invest', 'gold', 'etf', 'sgb', 'mutualfund',
                              'stock_buy', 'stock_sale', 'stock_credited'];

  isIncome(e: ExpenseDto): boolean {
    return this.INCOME_CATS.includes(e.category ?? '');
  }

  isInvestment(e: ExpenseDto): boolean {
    const cat   = (e.category ?? '').toLowerCase();
    const title = (e.title ?? '').toLowerCase();
    return this.INVESTMENT_KEYS.some(k => cat.includes(k) || title.includes(k));
  }

  get filteredRecords(): ExpenseDto[] {
    let list = [...this.allRecords];

    if (this.activeTab() === 'income')     list = list.filter(e => this.isIncome(e));
    if (this.activeTab() === 'expense')    list = list.filter(e => !this.isIncome(e) && !this.isInvestment(e));
    if (this.activeTab() === 'investment') list = list.filter(e => this.isInvestment(e));

    if (this.searchTerm) {
      const s = this.searchTerm.toLowerCase();
      list = list.filter(e =>
        (e.title ?? '').toLowerCase().includes(s) ||
        (e.category ?? '').toLowerCase().includes(s)
      );
    }

    return list.sort((a, b) =>
      new Date(b.expenseDate ?? '').getTime() - new Date(a.expenseDate ?? '').getTime()
    );
  }

  get totalIncome(): number {
    return this.allRecords.filter(e => this.isIncome(e)).reduce((s, e) => s + (e.profit != null ? e.profit : (e.amount ?? 0)), 0);
  }
  get totalExpenses(): number {
    return this.allRecords
      .filter(e => !this.isIncome(e) && !this.isInvestment(e))
      .reduce((s, e) => s + (e.amount ?? 0), 0);
  }

  setTab(tab: TabType): void { this.activeTab.set(tab); }

  askDelete(id: number | undefined): void {
    if (id != null) this.confirmDeleteId.set(id);
  }

  cancelDelete(): void { this.confirmDeleteId.set(null); }

  confirmDeleteRecord(): void {
    const id = this.confirmDeleteId();
    if (id == null) return;

    this.expenseService.deleteExpense(id).subscribe({
      next: () => {
        this.confirmDeleteId.set(null);
        this.deleteSuccess.set('Record deleted successfully.');
        setTimeout(() => this.deleteSuccess.set(''), 3000);
        this.loadData();
      },
      error: () => {
        this.confirmDeleteId.set(null);
        this.error.set('Failed to delete record.');
        setTimeout(() => this.error.set(''), 3000);
      }
    });
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set('');
    const userId = this.auth.getCurrentUserId();

    this.expenseService.getExpensesByUser(userId).subscribe({
      next: (data) => {
        this.allRecords = data ?? [];
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load records.');
        this.loading.set(false);
      }
    });
  }

  ngOnInit(): void {
    this.loadData();
  }
}
