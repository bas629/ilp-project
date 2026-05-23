import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ExpenseDto {
  expenseId?: number;
  title: string;
  amount: number;
  category: string;
  transactionType: string;
  expenseDate: string;
  userId?: number;
}

export interface StockDto {
  stockId: number;
  companyName: string;
  currentPrice: number;
  previousPrice: number;
  riskPercent: number;
  expectedReturn: number;
  marketCap: number;
  sector: string;
  volatility: string;
  stockStatus: string;
  lastUpdated: string;
  priceHistory: number[];
  changeClass?: string;
}

export interface StockHoldingDto {
  stockId: number;
  companyName: string;
  sector: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  totalCost: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
  riskPercent: number;
}

export interface PortfolioDto {
  cashBalance: number;
  stockHoldingsValue: number;
  goldHoldingsValue: number;
  netWorth: number;
  portfolioRisk: number;
  diversificationScore: number;
  stockHoldings: StockHoldingDto[];
  goldGrams: number;
  goldProfitLoss: number;
}

export interface FinancialProfileDto {
  financialScore: number;
  riskPercentage: number;
  savings: number;
  currentStatus: string;
  recommendations: string[];
}

export interface GoalDto {
  goalId?: number;
  goalName: string;
  targetAmount: number;
  currentAmount?: number;
  deadline: string;
  status?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  // --- EXPENSE LEGER ENDPOINTS ---
  getExpenses(): Observable<ExpenseDto[]> {
    return this.http.get<ExpenseDto[]>(`${this.baseUrl}/expenses`);
  }

  getCashBalance(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/expenses/balance`);
  }

  addExpense(dto: ExpenseDto): Observable<ExpenseDto> {
    return this.http.post<ExpenseDto>(`${this.baseUrl}/expenses`, dto);
  }

  updateExpense(id: number, dto: ExpenseDto): Observable<ExpenseDto> {
    return this.http.put<ExpenseDto>(`${this.baseUrl}/expenses/${id}`, dto);
  }

  deleteExpense(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/expenses/${id}`);
  }

  // --- STOCKS ENDPOINTS ---
  getStocks(): Observable<StockDto[]> {
    return this.http.get<StockDto[]>(`${this.baseUrl}/stocks`);
  }

  tradeStock(stockId: number, quantity: number, action: 'BUY' | 'SELL'): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/stocks/trade`, { stockId, quantity, action });
  }

  // --- DIGITAL GOLD ENDPOINTS ---
  getGoldPrice(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/gold/price`);
  }

  tradeGold(amount: number, action: 'BUY' | 'SELL'): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/gold/trade`, { amount, action });
  }

  // --- SAVINGS GOALS ENDPOINTS ---
  getGoals(): Observable<GoalDto[]> {
    return this.http.get<GoalDto[]>(`${this.baseUrl}/goals`);
  }

  addGoal(dto: GoalDto): Observable<GoalDto> {
    return this.http.post<GoalDto>(`${this.baseUrl}/goals`, dto);
  }

  updateGoal(id: number, dto: GoalDto): Observable<GoalDto> {
    return this.http.put<GoalDto>(`${this.baseUrl}/goals/${id}`, dto);
  }

  depositToGoal(id: number, amount: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/goals/${id}/deposit`, { amount });
  }

  deleteGoal(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/goals/${id}`);
  }

  // --- PORTFOLIO & SCORE ENDPOINTS ---
  getPortfolio(): Observable<PortfolioDto> {
    return this.http.get<PortfolioDto>(`${this.baseUrl}/portfolio`);
  }

  getWellnessProfile(): Observable<FinancialProfileDto> {
    return this.http.get<FinancialProfileDto>(`${this.baseUrl}/portfolio/wellness`);
  }

  changePassword(body: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/change-password`, body);
  }
}
