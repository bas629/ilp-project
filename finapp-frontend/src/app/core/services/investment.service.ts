import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InvestmentDto, BuyMoreDto, SellStockDto } from '../models/investment.model';
import { ExpenseDto } from '../models/expense.model';

const BASE = 'http://localhost:8080';

@Injectable({ providedIn: 'root' })
export class InvestmentService {
  private http = inject(HttpClient);

  createInvestment(dto: InvestmentDto): Observable<InvestmentDto> {
    return this.http.post<InvestmentDto>(`${BASE}/investment`, dto);
  }

  getInvestmentsByUser(userId: number): Observable<InvestmentDto[]> {
    return this.http.get<InvestmentDto[]>(`${BASE}/investment/${userId}`);
  }

  getAllStocks(): Observable<ExpenseDto[]> {
    return this.http.get<ExpenseDto[]>(`${BASE}/Stock`);
  }

  deleteInvestment(id: number): Observable<string> {
    return this.http.delete(`${BASE}/investment/${id}`, { responseType: 'text' });
  }

  buyMoreStock(dto: BuyMoreDto): Observable<InvestmentDto> {
    return this.http.post<InvestmentDto>(`${BASE}/investment/buy-more`, dto);
  }

  sellStock(dto: SellStockDto): Observable<InvestmentDto> {
    return this.http.post<InvestmentDto>(`${BASE}/investment/sell`, dto);
  }

  getRiskProfile(userId: number): Observable<any> {
    return this.http.get<any>(`${BASE}/risk/${userId}`);
  }
}
