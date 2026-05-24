import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ExpenseService } from '../../core/services/expense.service';
import { AuthService } from '../../core/services/auth.service';
import { InrFormatPipe } from '../../shared/pipes/inr-format.pipe';
import { INCOME_SOURCES, EXPENSE_CATEGORIES } from '../../core/models/expense.model';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InrFormatPipe],
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.scss']
})
export class ExpensesComponent implements OnInit {
  private fb             = inject(FormBuilder);
  private expenseService = inject(ExpenseService);
  private auth           = inject(AuthService);

  isIncome  = signal(true);
  saving    = signal(false);
  success   = signal('');
  error     = signal('');

  incomeSources     = INCOME_SOURCES;
  expenseCategories = EXPENSE_CATEGORIES;

  totalIncome   = signal(0);
  totalExpenses = signal(0);
  monthlyChart  = signal<{ label: string; amount: number; heightPct: number }[]>([]);

  form = this.fb.group({
    category: ['', Validators.required],
    amount:   [null as number | null, [Validators.required, Validators.min(1)]],
    date:     ['', Validators.required],
    account:  ['Savings', Validators.required],
    notes:    ['']
  });

  setType(income: boolean): void {
    this.isIncome.set(income);
    this.form.reset({ account: 'Savings' });
  }

  get categoryLabel(): string { return this.isIncome() ? 'Source' : 'Category'; }
  get categoryOptions(): string[] { return this.isIncome() ? this.incomeSources : this.expenseCategories; }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const userId = this.auth.getCurrentUserId();
    const val    = this.form.value;

    const dto = {
      title:       `${val.category} (${val.account})`,
      amount:      val.amount!,
      category:    val.category!,
      expenseDate: val.date!,
      userId
    };

    this.saving.set(true);
    this.expenseService.createExpense(dto).subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set('Entry saved successfully!');
        this.form.reset({ account: 'Savings' });
        setTimeout(() => this.success.set(''), 3000);
        this.loadSummary();
      },
      error: () => {
        this.saving.set(false);
        this.error.set('Failed to save entry. Please try again.');
        setTimeout(() => this.error.set(''), 4000);
      }
    });
  }

  loadSummary(): void {
    const userId = this.auth.getCurrentUserId();
    const INCOME_CATS = ['Salary', 'Freelance', 'Business', 'Rental', 'Other', 'Stock_Sale'];
    const INVESTMENT_CATS_LOWER = ['stock', 'invest', 'gold', 'etf', 'sgb', 'mutualfund'];

    this.expenseService.getExpensesByUser(userId).subscribe({
      next: (data) => {
        const records = data ?? [];
        this.totalIncome.set(
          records
            .filter(e => INCOME_CATS.includes(e.category ?? ''))
            .reduce((s, e) => s + (e.profit != null ? e.profit : e.amount), 0)
        );
        this.totalExpenses.set(
          records
            .filter(e => !INCOME_CATS.includes(e.category ?? '') && !INVESTMENT_CATS_LOWER.some(ic => (e.category ?? '').toLowerCase().includes(ic)))
            .reduce((s, e) => s + e.amount, 0)
        );

        const months = [];
        for (let i = 5; i >= 0; i--) {
          const d  = new Date();
          d.setMonth(d.getMonth() - i);
          const label = d.toLocaleString('default', { month: 'short' });
          const yr = d.getFullYear(), mo = d.getMonth() + 1;
          const amount = records
            .filter(e => !INCOME_CATS.includes(e.category ?? '') && !INVESTMENT_CATS_LOWER.some(ic => (e.category ?? '').toLowerCase().includes(ic)))
            .filter(e => { const [ey,em] = e.expenseDate.split('-').map(Number); return ey===yr && em===mo; })
            .reduce((s,e) => s + e.amount, 0);
          months.push({ label, amount });
        }
        const max = Math.max(...months.map(m => m.amount), 1);
        this.monthlyChart.set(months.map(m => ({ ...m, heightPct: Math.round((m.amount/max)*100) })));
      }
    });
  }

  ngOnInit(): void { this.loadSummary(); }
}
