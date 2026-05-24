import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ExpenseDto } from '../models/expense.model';

const BASE = 'http://localhost:8080';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private http = inject(HttpClient);

  createExpense(dto: ExpenseDto): Observable<ExpenseDto> {
    return this.http.post<ExpenseDto>(`${BASE}/Expanse`, dto);
  }

  getExpensesByUser(userId: number): Observable<ExpenseDto[]> {
    return this.http.get<ExpenseDto[]>(`${BASE}/Expanse/${userId}`);
  }

  deleteExpense(id: number): Observable<string> {
    return this.http.delete(`${BASE}/Expanse/${id}`, { responseType: 'text' });
  }
}
