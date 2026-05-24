export type EntryType = 'income' | 'expense';

export interface ExpenseDto {
  expenseId?: number;
  title: string;
  amount: number;
  category: string;
  expenseDate: string; // YYYY-MM-DD
  userId: number;
  profit?: number;
}

export interface FinancialRecord {
  expenseId?: number;
  title: string;
  amount: number;
  category: string;
  expenseDate: string;
  userId: number;
  type?: EntryType;
  profit?: number;
}

export const INCOME_SOURCES = ['Salary', 'Freelance', 'Business', 'Rental', 'Other'];

export const EXPENSE_CATEGORIES = [
  'Food', 'Transport', 'Utilities', 'Entertainment',
  'Healthcare', 'EMI', 'Education', 'Shopping', 'Other'
];
